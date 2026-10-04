import { Fn, float, sin, floor, fract, abs, mix, smoothstep } from 'three/tsl';
import { u_time, u_rotation, u_density, u_softness, u_distortion } from '../commonUniforms.js';
import { coords, rot, gradient4, finish } from '../tslLib.js';

// Soft stripes: slanted bands that slide and sway, each band picking its color by
// walking back and forth through the palette. Softness blends neighbours.
export const main = Fn(() => {
    const t = u_time.mul(0.4);
    const q = rot(coords(), u_rotation).toVar();

    q.x.addAssign(sin(q.y.mul(2.6).add(t)).mul(u_distortion).mul(0.06));

    const phase = q.x.mul(u_density.mul(36.0).add(4.0)).add(t);
    const band = floor(phase);
    const f = fract(phase);

    const colorOf = (index) => gradient4(abs(fract(index.add(t.mul(0.2)).div(6.0)).mul(2.0).sub(1.0)));
    const aa = u_softness.mul(0.48).add(0.02);
    const blend = smoothstep(float(1.0).sub(aa), 1.0, f);

    return finish(mix(colorOf(band), colorOf(band.add(1.0)), blend));
});
