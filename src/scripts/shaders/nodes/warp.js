import { Fn, vec2, vec3, float, atan, pow, floor, fract, abs, length, exp, mix, clamp, smoothstep } from 'three/tsl';
import { u_time, u_mouse, u_resolution, u_color1, u_color2, u_color3, u_color4, u_density, u_spread, u_glow } from '../commonUniforms.js';
import { coords, aspect, hash12, gradient4, finish } from '../tslLib.js';

// Hyperspace: stars streak outwards from the vanishing point. Each layer slices
// the screen into angular wedges, every wedge carries one star travelling from the
// center (accelerating as it nears the viewer) and stretching into a line.
export const main = Fn(() => {
    const t = u_time.mul(0.35);
    const p = coords().sub(u_mouse.sub(0.5).mul(vec2(aspect, 1.0)).mul(0.18));

    const r = length(p).add(0.0001);
    const a = atan(p.y, p.x);
    const aaPx = float(1.4).div(u_resolution.y);

    // Backdrop: color 1 with a halo of color 2 at the center.
    const lab = mix(u_color1, u_color2, exp(r.mul(-3.2)).mul(0.6)).toVar();

    const wedges = [46.0, 80.0, 140.0];
    const speeds = [0.18, 0.28, 0.42];
    wedges.forEach((count, i) => {
        const n = u_density.mul(0.9).add(0.55).mul(count);
        const slice = a.mul(n).div(6.2831853);
        const id = floor(slice);
        const h = hash12(vec2(id, 7.0 * i + 1.0));
        const z = fract(h.add(t.mul(speeds[i])));

        // Head position accelerates; the tail stretches with speed.
        const head = pow(z, 2.3).mul(1.25);
        const tail = z.mul(z).mul(u_spread).mul(0.55).add(0.015);
        const along = smoothstep(head.sub(tail), head, r).mul(smoothstep(head.add(0.012), head, r));

        // Thin line across the wedge (constant pixel width).
        const lateral = abs(fract(slice).sub(0.5)).mul(r).mul(6.2831853).div(n);
        const line = smoothstep(aaPx.mul(1.8), 0.0, lateral);

        const fadeIn = smoothstep(0.02, 0.2, head);
        const brightness = line.mul(along).mul(fadeIn).mul(z.mul(0.7).add(0.3));
        const color = gradient4(h.mul(0.45).add(0.5));
        lab.assign(mix(lab, mix(color, vec3(0.98, 0.0, 0.0), 0.35), clamp(brightness.mul(1.3), 0.0, 1.0)));
    });

    // Bright core at the vanishing point.
    lab.assign(mix(lab, u_color3, exp(r.mul(-9.0)).mul(0.6).mul(u_glow)));
    lab.assign(mix(lab, u_color4, exp(r.mul(-26.0)).mul(0.8).mul(u_glow)));
    return finish(lab);
});
