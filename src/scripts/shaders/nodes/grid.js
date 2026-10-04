import { Fn, vec2, vec3, sin, fract, abs, min, length, exp, mix, pow, smoothstep, uv } from 'three/tsl';
import { u_time, u_mouse, u_resolution, u_color1, u_color2, u_color3, u_color4, u_density, u_thickness, u_glow } from '../commonUniforms.js';
import { coords, aspect, finish } from '../tslLib.js';

// Glow grid: fine technical lines that fade towards the edges, with rings of light
// travelling outwards and a pool of light under the pointer.
export const main = Fn(() => {
    const st = uv();
    const p = coords();
    const t = u_time.mul(0.6);

    const cells = u_density.mul(36.0).add(8.0);
    const g = p.mul(cells);

    // Distance to the nearest grid line, in cell units.
    const fx = abs(fract(g.x.add(0.5)).sub(0.5));
    const fy = abs(fract(g.y.add(0.5)).sub(0.5));
    const px = cells.div(u_resolution.y);
    const width = u_thickness.mul(px).mul(0.9);
    const line = smoothstep(width.add(px), width, min(fx, fy));

    const r = length(p.mul(vec2(0.75, 1.0)));
    const fade = smoothstep(0.95, 0.1, r);
    const ring = pow(sin(r.mul(7.0).sub(t.mul(1.6))).mul(0.5).add(0.5), 3.0);

    const m = u_mouse.sub(0.5).mul(vec2(aspect, 1.0));
    const dm = length(p.sub(m));
    const pool = exp(dm.mul(dm).mul(-9.0));

    const energy = line.mul(fade).mul(ring.mul(0.7).add(0.25)).add(line.mul(pool).mul(1.2)).mul(u_glow);

    // Background: soft radial glow of color 2 over color 1.
    const background = mix(u_color1, u_color2, exp(r.mul(r).mul(-2.6)).mul(0.5).add(st.y.mul(0.1)));
    const lab = mix(background, mix(u_color3, u_color4, ring), energy.clamp(0.0, 1.0));
    return finish(vec3(lab));
});
