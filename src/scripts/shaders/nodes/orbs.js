import { Fn, vec2, vec3, float, sin, floor, fract, length, mix, smoothstep, step, uv } from 'three/tsl';
import { u_time, u_color1, u_size, u_softness, u_density } from '../commonUniforms.js';
import { coords, rot, hash22, gradient4, finish } from '../tslLib.js';

// Glow orbs: three parallax layers of soft bokeh discs drifting upwards over a
// deep vignette. Each layer uses its own rotated grid with random dropout, so no
// lattice shows. One lookup per layer.
export const main = Fn(() => {
    const st = uv();
    const p = coords();
    const t = u_time.mul(0.25);

    const deep = vec3(u_color1.x.mul(0.5), u_color1.y.mul(0.8), u_color1.z.mul(0.8));
    const lab = mix(u_color1, deep, smoothstep(0.2, 1.0, st.y)).toVar();

    const layers = [[2.4, 0.16, 0.8, 0.35], [4.0, 0.28, 0.7, 1.1], [6.8, 0.46, 0.6, 2.0]];
    layers.forEach(([scale, speed, alpha, angle], i) => {
        const q = rot(p, angle).mul(u_density.mul(0.7).add(0.65).mul(scale)).add(vec2(i * 3.1, t.mul(speed)));
        const cell = floor(q);
        const h = hash22(cell.add(i * 11.0));
        const present = step(0.3, hash22(cell.add(40.0 + i)).x);
        const center = h.mul(0.5).add(0.25);
        const d = length(fract(q).sub(center));
        const r = h.x.mul(0.12).add(0.11).mul(u_size);
        const disc = smoothstep(r, r.mul(float(0.95).sub(u_softness.mul(0.85))), d);
        const pulse = sin(t.mul(2.0).add(h.y.mul(6.28))).mul(0.25).add(0.75);
        const color = gradient4(h.y.mul(0.66).add(0.34));
        lab.assign(mix(lab, color, disc.mul(present).mul(pulse).mul(alpha)));
    });

    return finish(lab);
});
