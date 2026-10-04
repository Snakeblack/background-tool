import { Fn, vec2, sin, floor, fract, length, exp, mix, smoothstep, uv } from 'three/tsl';
import { u_time, u_mouse, u_resolution, u_color1, u_color2, u_density, u_size, u_distortion } from '../commonUniforms.js';
import { coords, aspect, gradient4, finish } from '../tslLib.js';

// Dot grid: a halftone screen whose dot radius follows travelling waves and the
// pointer. The field is sampled once per cell, so every dot stays a perfect circle.
export const main = Fn(() => {
    const st = uv();
    const p = coords();
    const t = u_time.mul(0.5);

    const cells = u_density.mul(48.0).add(14.0);
    const g = p.mul(cells);
    const cell = floor(g);
    const f = fract(g).sub(0.5);
    const center = cell.add(0.5).div(cells);

    const m = u_mouse.sub(0.5).mul(vec2(aspect, 1.0));
    const dm = length(center.sub(m));
    const wave = sin(center.x.mul(3.2).add(t)).mul(0.5)
        .add(sin(length(center).mul(7.0).sub(t.mul(1.4))).mul(0.5))
        .mul(0.4).mul(u_distortion).add(0.45);
    const field = wave.add(exp(dm.mul(dm).mul(-14.0)).mul(0.5)).toVar();

    const radius = field.clamp(0.0, 1.0).mul(0.38).add(0.06).mul(u_size);
    const aa = cells.div(u_resolution.y).mul(1.2);
    const dotMask = smoothstep(radius, radius.sub(aa), length(f));

    const background = mix(u_color1, u_color2, st.y.mul(0.35));
    const ink = gradient4(field.mul(0.7).add(0.3));
    return finish(mix(background, ink, dotMask));
});
