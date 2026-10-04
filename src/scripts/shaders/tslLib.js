import {
    Fn, float, vec2, vec3, uv, screenCoordinate,
    fract, floor, dot, sin, cos, mix, pow, clamp, step, length, max,
    interleavedGradientNoise,
} from 'three/tsl';
import {
    u_resolution, u_time, u_brightness, u_contrast, u_noise,
    u_color1, u_color2, u_color3, u_color4,
} from './commonUniforms.js';

// Shared TSL helpers. Cheap by design: no sin() based hashes (slow and
// imprecise on mobile GPUs), unrolled fixed-octave noise, one color
// conversion per pixel.

/** Viewport aspect ratio (width / height). */
export const aspect = u_resolution.x.div(u_resolution.y);

/** Centered, aspect-corrected coordinates: y in [-0.5, 0.5], x in [-aspect/2, aspect/2]. y points up. */
export const coords = () => uv().sub(0.5).mul(vec2(aspect, 1.0));

/** Rotates a vec2 by `a` radians. */
export const rot = (p, a) => {
    const c = cos(a);
    const s = sin(a);
    return vec2(p.x.mul(c).sub(p.y.mul(s)), p.x.mul(s).add(p.y.mul(c)));
};

/** vec2 -> float hash in [0, 1). Sine-free (Hoskins). */
export const hash12 = Fn(([p]) => {
    const p3 = fract(p.xyx.mul(0.1031)).toVar();
    p3.addAssign(dot(p3, p3.yzx.add(33.33)));
    return fract(p3.x.add(p3.y).mul(p3.z));
});

/** vec2 -> vec2 hash in [0, 1). Sine-free (Hoskins). */
export const hash22 = Fn(([p]) => {
    const p3 = fract(p.xyx.mul(vec3(0.1031, 0.103, 0.0973))).toVar();
    p3.addAssign(dot(p3, p3.yzx.add(33.33)));
    return fract(p3.xx.add(p3.yz).mul(p3.zy));
});

/** Smooth 2D value noise in [0, 1] (quintic interpolation). */
export const noise = Fn(([p]) => {
    const i = floor(p);
    const f = fract(p);
    const u = f.mul(f).mul(f).mul(f.mul(f.mul(6.0).sub(15.0)).add(10.0));
    const a = hash12(i);
    const b = hash12(i.add(vec2(1.0, 0.0)));
    const c = hash12(i.add(vec2(0.0, 1.0)));
    const d = hash12(i.add(vec2(1.0, 1.0)));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
});

/** Fractal noise in [0, 1] with a fixed, unrolled octave count. */
export const fbm = (p, octaves = 4) => {
    let q = p;
    let sum = float(0.0);
    let amp = 0.5;
    let norm = 0.0;
    for (let i = 0; i < octaves; i++) {
        sum = sum.add(noise(q).mul(amp));
        norm += amp;
        q = vec2(q.x.mul(1.6).sub(q.y.mul(1.2)), q.x.mul(1.2).add(q.y.mul(1.6))).add(vec2(17.3, 9.7));
        amp *= 0.5;
    }
    return sum.div(norm);
};

/**
 * Four-stop gradient through the palette (OKLab): t = 0 → color 1, t = 1 → color 4.
 * @param {import('three/tsl').Node} t 0..1
 */
export const gradient4 = (t) => {
    const x = clamp(t, 0.0, 1.0).mul(3.0);
    const ab = mix(u_color1, u_color2, clamp(x, 0.0, 1.0));
    const abc = mix(ab, u_color3, clamp(x.sub(1.0), 0.0, 1.0));
    return mix(abc, u_color4, clamp(x.sub(2.0), 0.0, 1.0));
};

/**
 * Restores chroma lost when blending hues that cancel out (OKLab midpoints between
 * complementary colors fall on the gray axis). Only ever boosts, up to `maxBoost`.
 */
export const keepChroma = (lab, targetChroma, maxBoost = 1.6) => {
    const boost = clamp(targetChroma.div(max(length(lab.yz), 1e-4)), 1.0, maxBoost);
    return vec3(lab.x, lab.y.mul(boost), lab.z.mul(boost));
};

/** Polynomial smooth minimum. */
export const smin = (a, b, k) => {
    const h = clamp(float(0.5).add(b.sub(a).mul(0.5).div(k)), 0.0, 1.0);
    return mix(b, a, h).sub(k.mul(h).mul(float(1.0).sub(h)));
};

/** OKLab -> gamma-encoded sRGB, clamped to the gamut. */
export const oklabToSrgb = Fn(([lab]) => {
    const l_ = lab.x.add(lab.y.mul(0.3963377774)).add(lab.z.mul(0.2158037573));
    const m_ = lab.x.sub(lab.y.mul(0.1055613458)).sub(lab.z.mul(0.0638541728));
    const s_ = lab.x.sub(lab.y.mul(0.0894841775)).sub(lab.z.mul(1.291485548));
    const l = l_.mul(l_).mul(l_);
    const m = m_.mul(m_).mul(m_);
    const s = s_.mul(s_).mul(s_);
    const lin = vec3(
        l.mul(4.0767416621).sub(m.mul(3.3077115913)).add(s.mul(0.2309699292)),
        l.mul(-1.2684380046).add(m.mul(2.6097574011)).sub(s.mul(0.3413193965)),
        l.mul(-0.0041960863).sub(m.mul(0.7034186147)).add(s.mul(1.707614701)),
    );
    const c = clamp(lin, 0.0, 1.0);
    const hi = pow(c, vec3(1.0 / 2.4)).mul(1.055).sub(0.055);
    return mix(c.mul(12.92), hi, step(0.0031308, c));
});

/**
 * Final stage of every background: OKLab -> sRGB, brightness / contrast,
 * invisible dithering (removes 8-bit banding) and optional film grain.
 * The renderer outputs linear values untouched, so what the color picker
 * shows is exactly what lands on screen.
 */
export const finish = Fn(([lab]) => {
    const rgb = oklabToSrgb(lab).toVar();
    rgb.assign(rgb.sub(0.5).mul(u_contrast).add(0.5).add(u_brightness));
    const dither = interleavedGradientNoise(screenCoordinate).sub(0.5).mul(2.0 / 255.0);
    const grain = hash12(screenCoordinate.add(floor(u_time.mul(10.0)).mul(17.0))).sub(0.5).mul(u_noise);
    return clamp(rgb.add(dither).add(grain), 0.0, 1.0);
});
