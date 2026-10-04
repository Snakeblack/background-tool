import { Fn, vec2, sin, cos, exp, dot, smoothstep, screenCoordinate } from 'three/tsl';
import { u_time, u_intensity } from '../commonUniforms.js';
import { coords, hash12, gradient4, finish } from '../tslLib.js';

// Grain gradient: big soft shapes whose transitions dissolve into stippled
// noise, the printed risograph look. The grain moves the gradient coordinate
// itself, so it stays crisp at any contrast.
export const main = Fn(() => {
    const p = coords();
    const t = u_time.mul(0.15);

    const field = sin(p.x.mul(2.2).add(t)).mul(0.14)
        .add(sin(p.x.mul(5.0).sub(t.mul(1.4))).mul(0.05))
        .add(p.y.mul(0.9));

    const glowCenter = vec2(sin(t.mul(0.7)).mul(0.5), cos(t.mul(0.5)).mul(0.25));
    const delta = p.sub(glowCenter);
    const glow = exp(dot(delta, delta).mul(2.5).negate());

    const stipple = hash12(screenCoordinate).sub(0.5).mul(u_intensity).mul(0.55);
    const f = field.mul(1.2).add(0.5).add(glow.mul(0.35)).add(stipple);

    return finish(gradient4(smoothstep(0.12, 0.88, f)));
});
