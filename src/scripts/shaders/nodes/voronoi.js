import { Fn, vec2, vec3, float, sin, floor, fract, dot, sqrt, min, normalize, mix, smoothstep, select } from 'three/tsl';
import { u_time, u_color4, u_scale, u_density, u_thickness } from '../commonUniforms.js';
import { coords, hash12, hash22, gradient4, finish } from '../tslLib.js';

// Cells: animated Voronoi. Each cell takes a palette tone and a soft inner glow.
// Borders use the exact distance to the bisector between the two nearest points
// (second pass), so they keep a constant width instead of fanning out at corners.
export const main = Fn(() => {
    const t = u_time.mul(0.5);
    const g = coords().mul(u_density.mul(9.0).add(3.0)).mul(u_scale);
    const cell = floor(g);
    const f = fract(g);

    // Pass 1: nearest feature point.
    const nearestSq = float(8.0).toVar();
    const toNearest = vec2(0.0).toVar();
    const tone = float(0.0).toVar();
    const rs = [];

    for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
            const offset = vec2(i, j);
            const id = cell.add(offset);
            const animated = sin(t.add(hash22(id).mul(6.2831))).mul(0.5).add(0.5);
            const r = offset.add(animated).sub(f).toVar();
            rs.push(r);

            const d = dot(r, r);
            const closer = d.lessThan(nearestSq);
            toNearest.assign(select(closer, r, toNearest));
            tone.assign(select(closer, hash12(id), tone));
            nearestSq.assign(min(nearestSq, d));
        }
    }

    // Pass 2: distance to the closest cell border.
    const border = float(8.0).toVar();
    rs.forEach((r) => {
        const diff = r.sub(toNearest);
        const isSelf = dot(diff, diff).lessThan(0.00001);
        const bisector = dot(toNearest.add(r).mul(0.5), normalize(diff));
        border.assign(min(border, select(isSelf, float(8.0), bisector)));
    });

    const fill = gradient4(tone.mul(0.7).add(0.1));
    const inner = vec3(fill.x.mul(float(1.0).sub(sqrt(nearestSq).mul(0.38))), fill.y, fill.z);

    const width = u_thickness.mul(0.035);
    const line = smoothstep(width.add(0.03), width, border);
    return finish(mix(inner, u_color4, line.mul(0.9)));
});
