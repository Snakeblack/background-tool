import { Fn, vec2, vec3, float, atan, cos, exp, floor, fract, length, log, pow, mix, clamp, smoothstep, step } from 'three/tsl';
import { u_time, u_color1, u_color2, u_color3, u_color4, u_size, u_density, u_distortion } from '../commonUniforms.js';
import { coords, rot, fbm, hash12, hash22, finish } from '../tslLib.js';

// Galaxy: a tilted spiral disk (two logarithmic arms, broken up by dust noise),
// a hot core, a faint nebula in the void and two layers of stars.
export const main = Fn(() => {
    const t = u_time.mul(0.04);
    const p = coords();

    // Tilt the disk and rotate it slowly.
    const q = rot(p, t.mul(0.8).add(0.5)).mul(vec2(1.0, 1.55)).div(u_size.mul(0.9).add(0.1)).toVar();
    const r = length(q).add(0.0001);
    const theta = atan(q.y, q.x);

    // Logarithmic spiral arms.
    const arm = cos(theta.mul(2.0).sub(log(r).mul(u_distortion.mul(2.4).add(1.2)).mul(2.0)).add(t.mul(2.0)));
    const armMask = pow(arm.mul(0.5).add(0.5), 2.2);
    const dust = fbm(q.mul(3.2).add(vec2(t, t.negate())), 3);
    const disk = armMask.mul(dust.mul(0.9).add(0.35)).mul(exp(r.mul(-2.1)));
    const core = exp(r.mul(r).mul(-26.0));

    // Void with a faint nebula.
    const nebula = fbm(p.mul(1.6).add(vec2(7.0, t)), 3);
    const lab = mix(u_color1, u_color2, nebula.mul(0.28)).toVar();

    // Galaxy body: arms in color 2/3, core in color 4.
    const armColor = mix(u_color2, u_color3, smoothstep(0.1, 0.9, dust));
    lab.assign(mix(lab, armColor, clamp(disk.mul(1.6), 0.0, 1.0)));
    lab.assign(mix(lab, u_color4, clamp(core.mul(1.15), 0.0, 1.0)));

    // Two star layers (fine + rare bright ones), denser along the arms.
    const stars = (scale, threshold, radius) => {
        const g = p.mul(scale);
        const cell = floor(g);
        const present = step(threshold, hash12(cell));
        const center = hash22(cell.add(3.3)).mul(0.6).add(0.2);
        const d = length(fract(g).sub(center));
        return present.mul(smoothstep(radius, 0.0, d));
    };
    const starDensity = u_density.mul(0.04);
    const fine = stars(60.0, float(0.985).sub(starDensity).sub(disk.mul(0.02)), 0.09);
    const bright = stars(26.0, float(0.992).sub(starDensity.mul(0.5)), 0.14);
    lab.assign(mix(lab, vec3(0.98, 0.0, 0.0), clamp(fine.mul(0.8).add(bright), 0.0, 1.0)));

    return finish(lab);
});
