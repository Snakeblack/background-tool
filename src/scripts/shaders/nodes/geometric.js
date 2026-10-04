import { Fn, vec2, vec3, float, sin, dot, abs, max, mod, mix, smoothstep, select, length, floor } from 'three/tsl';
import { u_time, u_scale, u_thickness, u_rotation } from '../commonUniforms.js';
import { coords, rot, hash12, gradient4, finish } from '../tslLib.js';

// Hex grid: every cell has its own tone and breathes in a travelling wave;
// the edges glow in the highlight color.
export const main = Fn(() => {
    const t = u_time.mul(0.6);
    const p = rot(coords(), u_rotation).mul(u_scale).toVar();

    // Nearest hex center (two interleaved lattices).
    const r = vec2(1.0, 1.7320508);
    const h = r.mul(0.5);
    const a = mod(p, r).sub(h);
    const b = mod(p.sub(h), r).sub(h);
    const gv = select(dot(a, a).lessThan(dot(b, b)), a, b);
    // Quantized so float error in `p - gv` can never flip the per-cell hash.
    const id = floor(p.sub(gv).mul(64.0).add(0.5)).div(64.0);

    // Distance to the hex edge: 0 at the center, 0.5 on the border.
    const q = abs(gv);
    const d = max(dot(q, vec2(0.5, 0.8660254)), q.x);

    const rnd = hash12(id.mul(7.0));
    const wave = sin(t.add(length(id).mul(0.55)).add(rnd.mul(6.2831))).mul(0.5).add(0.5);

    const cell = gradient4(rnd.mul(0.55).add(0.1).add(wave.mul(0.2)));
    const body = vec3(cell.x.mul(wave.mul(0.35).add(0.75)), cell.y, cell.z);

    const width = u_thickness.mul(0.045);
    const edge = smoothstep(float(0.5).sub(width.mul(2.0)), float(0.5).sub(width), d);
    const glowEdge = mix(body, gradient4(float(1.0)), edge.mul(wave.mul(0.5).add(0.5)));

    return finish(glowEdge);
});
