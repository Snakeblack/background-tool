import { Fn, vec2, vec3, float, fract, abs, floor, mix, step, smoothstep, fwidth, max } from 'three/tsl';
import { u_time, u_color4, u_scale, u_density, u_thickness } from '../commonUniforms.js';
import { coords, fbm, gradient4, finish } from '../tslLib.js';

// Topographic map: contour lines of a drifting noise terrain. Every fifth line is
// an "index contour" (bolder), and the fill is hill-shaded by elevation.
export const main = Fn(() => {
    const t = u_time.mul(0.04);
    const p = coords().mul(u_scale.mul(2.2));

    const height = fbm(p.add(vec2(t, t.mul(-0.7))), 4);
    const levels = u_density.mul(22.0).add(8.0);
    const x = height.mul(levels).toVar();

    // Distance to the nearest contour, anti-aliased with the screen-space derivative.
    const dist = abs(fract(x.add(0.5)).sub(0.5));
    const px = max(fwidth(x), 1e-4);
    const major = float(1.0).sub(step(0.2, fract(floor(x.add(0.5)).div(5.0))));
    const width = u_thickness.mul(0.75).mul(major.mul(0.9).add(1.0));
    const line = float(1.0).sub(smoothstep(px.mul(width).sub(px), px.mul(width).add(px), dist));

    const fill = gradient4(height.mul(0.85).add(0.05));
    const lit = vec3(fill.x.add(height.sub(0.5).mul(0.12)), fill.y, fill.z);
    return finish(mix(lit, u_color4, line.mul(major.mul(0.35).add(0.55))));
});
