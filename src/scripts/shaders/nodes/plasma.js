import { Fn, vec2, sin, cos, length, abs, fract } from 'three/tsl';
import { u_time, u_scale, u_distortion, u_density } from '../commonUniforms.js';
import { coords, gradient4, finish } from '../tslLib.js';

// Plasma: the demoscene classic. Overlapping sine fields (plus a warped, orbiting
// radial one) ripple the palette into smooth, endlessly shifting bands.
export const main = Fn(() => {
    const t = u_time.mul(0.45);
    const p = coords().mul(u_scale.mul(3.2)).toVar();

    p.addAssign(vec2(sin(p.y.add(t)), cos(p.x.sub(t.mul(0.8)))).mul(u_distortion.mul(0.35)));

    const center = vec2(sin(t.mul(0.5)), cos(t.mul(0.4))).mul(1.4);
    const v = sin(p.x.add(t))
        .add(sin(p.y.mul(1.3).add(t.mul(0.7))))
        .add(sin(p.x.add(p.y).mul(0.8).add(t.mul(0.5))))
        .add(sin(length(p.sub(center)).mul(1.6).sub(t)))
        .mul(0.125).add(0.5);

    const bands = u_density.mul(2.0).add(1.0);
    const tri = abs(fract(v.mul(bands).add(t.mul(0.05))).mul(2.0).sub(1.0));
    return finish(gradient4(tri));
});
