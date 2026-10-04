import { Fn, vec2, vec3, sin, cos, dot, mix, pow, max, normalize, reflect, dFdx, dFdy, smoothstep } from 'three/tsl';
import { u_time, u_resolution, u_scale, u_distortion } from '../commonUniforms.js';
import { coords, gradient4, finish } from '../tslLib.js';

// Liquid chrome: an iterated sine warp gives a molten height field; its slope
// becomes a normal, and the reflection vector indexes a studio-like environment
// gradient. That mapping is what makes the bands read as mirror metal.
export const main = Fn(() => {
    const p = coords().mul(u_scale.mul(2.6)).toVar();
    const t = u_time.mul(0.28);
    const warp = u_distortion.mul(0.6);

    for (let i = 1; i <= 4; i++) {
        p.addAssign(vec2(
            sin(p.y.mul(0.9 * i + 0.4).add(t.mul(0.6 + 0.1 * i)).add(i)),
            cos(p.x.mul(0.8 * i + 0.3).sub(t.mul(0.5)).add(i * 1.7)),
        ).mul(warp.div(i)));
    }

    const h = sin(p.x.mul(1.5).add(p.y.mul(1.1)).add(t))
        .add(sin(p.y.mul(2.3).sub(p.x.mul(0.7)).sub(t.mul(0.7))).mul(0.5))
        .toVar();

    // Slope -> normal (resolution independent).
    const g = vec2(dFdx(h), dFdy(h)).mul(u_resolution.y);
    const n = normalize(vec3(g.x.mul(-0.32), g.y.mul(-0.32), 1.0));

    // Environment lookup by reflection direction: dark floor, bright sky, sharp horizon.
    const r = reflect(vec3(0.0, 0.0, -1.0), n);
    const env = r.y.mul(0.42).add(r.x.mul(0.2)).add(0.42);
    const base = gradient4(smoothstep(0.12, 0.88, env));

    const light = normalize(vec3(-0.4, 0.55, 0.7));
    const spec = pow(max(dot(r, light), 0.0), 48.0);
    const lab = mix(base, vec3(0.99, 0.0, 0.0), smoothstep(0.0, 1.0, spec).mul(0.55));

    return finish(lab);
});
