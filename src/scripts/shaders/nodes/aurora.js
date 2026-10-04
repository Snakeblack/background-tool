import { Fn, vec2, vec3, float, mix, smoothstep, sin, exp, floor, fract, abs, clamp, step, length, uv } from 'three/tsl';
import { u_time, u_color1, u_color2, u_color3, u_color4, u_intensity, u_scale, u_density } from '../commonUniforms.js';
import { coords, noise, hash12, hash22, finish } from '../tslLib.js';

// Aurora borealis: three luminous curtains with a sharp glowing lower edge,
// vertical ray structure and a soft fringe, over a night sky with stars.
export const main = Fn(() => {
    const st = uv();
    const p = coords();
    const t = u_time.mul(0.12);

    // Night sky: color 1 at the horizon, darker towards the zenith.
    const zenith = vec3(u_color1.x.mul(0.45), u_color1.y.mul(0.8), u_color1.z.mul(0.8));
    const lab = mix(u_color1, zenith, smoothstep(0.0, 1.0, st.y)).toVar();

    const curtain = (k, baseColor, fringeColor, base, speed, freq) => {
        const x = p.x.mul(freq).mul(u_scale).add(k * 13.7);
        const wander = noise(vec2(x.mul(0.55), t.mul(speed).add(k * 5.0))).sub(0.5);
        const d = st.y.sub(float(base).add(wander.mul(0.42)));
        // Sharp lower edge, long soft tail upwards.
        const falloff = mix(float(34.0), float(5.0), step(0.0, d));
        const profile = exp(abs(d).mul(falloff).negate());
        const rays = noise(vec2(x.mul(17.0), t.mul(1.6).add(k * 3.0))).mul(0.4).add(0.6);
        const streak = mix(float(1.0), rays, smoothstep(0.0, 0.18, d));
        const strength = clamp(profile.mul(streak).mul(u_intensity).mul(0.95), 0.0, 1.0);
        return { strength, color: mix(baseColor, fringeColor, smoothstep(0.0, 0.5, d)) };
    };

    const a = curtain(0, u_color2, u_color4, 0.45, 1.0, 0.9);
    const b = curtain(1, u_color3, u_color4, 0.56, 0.8, 1.3);
    const c = curtain(2, u_color2, u_color3, 0.37, 1.2, 1.7);
    lab.assign(mix(lab, c.color, c.strength.mul(0.8)));
    lab.assign(mix(lab, b.color, b.strength.mul(0.85)));
    lab.assign(mix(lab, a.color, a.strength));

    // Sparse twinkling stars, hidden behind the light and near the horizon.
    const g = p.mul(70.0);
    const cell = floor(g);
    const h = hash12(cell);
    const dStar = length(fract(g).sub(hash22(cell.add(7.7)).mul(0.6).add(0.2)));
    const twinkle = sin(u_time.mul(2.0).add(h.mul(60.0))).mul(0.3).add(0.7);
    const star = step(float(1.0).sub(u_density.mul(0.03)), h).mul(smoothstep(0.1, 0.0, dStar)).mul(twinkle);
    const covered = clamp(a.strength.add(b.strength).add(c.strength), 0.0, 1.0);
    const visible = smoothstep(0.1, 0.5, st.y).mul(float(1.0).sub(covered));
    lab.assign(mix(lab, vec3(0.98, 0.0, 0.0), star.mul(visible)));

    return finish(lab);
});
