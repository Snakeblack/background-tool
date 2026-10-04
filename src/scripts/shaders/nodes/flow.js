import { Fn, vec2, vec3, pow, max, dot, normalize, dFdx, dFdy, smoothstep } from 'three/tsl';
import { u_time, u_resolution, u_scale } from '../commonUniforms.js';
import { coords, fbm, gradient4, finish } from '../tslLib.js';

// Ethereal flow: stretched, domain-warped noise forms long silky folds, lit with
// a soft sheen so it reads as satin rather than flat color.
export const main = Fn(() => {
    const q = coords().mul(vec2(1.0, 1.8)).mul(u_scale).toVar();
    const t = u_time.mul(0.12);

    const a = fbm(q.add(vec2(t, t.mul(0.4))), 3);
    const b = fbm(q.add(vec2(a.mul(2.2), a.mul(1.6))).add(vec2(5.2, 1.3)).sub(vec2(t.mul(0.5), 0.0)), 3).toVar();

    const g = vec2(dFdx(b), dFdy(b)).mul(u_resolution.y);
    const n = normalize(vec3(g.x.mul(-0.05), g.y.mul(-0.05), 1.0));
    const sheen = pow(max(dot(n, normalize(vec3(-0.4, 0.7, 0.6))), 0.0), 8.0);

    const base = gradient4(smoothstep(0.2, 0.8, b));
    return finish(vec3(base.x.add(sheen.mul(0.16)), base.y, base.z));
});
