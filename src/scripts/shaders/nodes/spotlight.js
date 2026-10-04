import { Fn, vec2, vec3, float, acos, dot, exp, length, normalize, mix, smoothstep, clamp, sign, uv } from 'three/tsl';
import { u_time, u_mouse, u_color1, u_color2, u_color3, u_color4, u_intensity, u_spread, u_softness } from '../commonUniforms.js';
import { coords, aspect, noise, finish } from '../tslLib.js';

// Spotlight: a volumetric cone of light hanging from the top edge, aimed at the
// pointer, with drifting dust inside the beam and a pool of light where it lands.
export const main = Fn(() => {
    const st = uv();
    const p = coords();
    const t = u_time.mul(0.2);

    const source = vec2(0.0, 0.62);
    const target = u_mouse.sub(0.5).mul(vec2(aspect, 1.0)).toVar();
    const aim = normalize(target.sub(source));
    const toPixel = p.sub(source);
    const dist = length(toPixel);
    const dir = normalize(toPixel);
    const angle = acos(clamp(dot(dir, aim), -1.0, 1.0));
    // Signed angle so the dust pattern doesn't mirror across the beam axis.
    const side = sign(aim.x.mul(dir.y).sub(aim.y.mul(dir.x)));
    const signedAngle = angle.mul(side);

    const half = u_spread.mul(0.4);
    const edge = u_softness.mul(0.8).add(0.12);
    const cone = smoothstep(half, half.mul(float(1.0).sub(edge)), angle);

    // Dust: slow noise sliding along the beam.
    const dust = noise(vec2(signedAngle.mul(11.0), dist.mul(3.5).sub(t))).mul(0.55).add(0.7);
    const falloff = exp(dist.mul(-0.95));
    const beam = cone.mul(falloff).mul(dust).mul(u_intensity);

    // Pool of light where the beam lands.
    const pool = exp(length(p.sub(target).mul(vec2(0.7, 1.4))).mul(-3.2)).mul(u_intensity).mul(0.55);

    // Ambient: color 1 with a faint wash of color 2 near the top.
    const ambient = mix(u_color1, u_color2, exp(st.y.oneMinus().mul(-3.0)).mul(0.25));
    const tint = mix(u_color3, u_color4, smoothstep(0.0, 0.5, beam));

    const lit = clamp(beam.add(pool), 0.0, 1.0);
    return finish(vec3(mix(ambient, tint, lit)));
});
