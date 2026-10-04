import { Fn, vec2, vec3, sin, cos, fract, abs, length, mix, pow, max, dot, normalize, reflect, dFdx, dFdy } from 'three/tsl';
import { u_time, u_resolution, u_scale, u_distortion, u_density } from '../commonUniforms.js';
import { coords, gradient4, finish } from '../tslLib.js';

// Iridescent foil: interfering sine fields cycle the palette back and forth
// (like thin-film interference on an oil slick) with a metallic sheen on top.
export const main = Fn(() => {
    const p = coords().mul(u_scale).toVar();
    const t = u_time.mul(0.2);

    p.addAssign(vec2(sin(p.y.mul(2.0).add(t)), cos(p.x.mul(1.7).sub(t.mul(0.8)))).mul(u_distortion.mul(0.25)));

    const c = vec2(sin(t.mul(0.7)), cos(t.mul(0.5))).mul(0.35);
    const h = sin(p.x.mul(2.1).add(t))
        .add(sin(p.y.mul(2.7).sub(t.mul(0.8))))
        .add(sin(p.x.add(p.y).mul(1.9).add(t.mul(0.6))))
        .add(sin(length(p.sub(c)).mul(5.0).sub(t)))
        .mul(0.25).add(0.5).toVar();

    const bands = u_density.mul(2.0).add(1.0);
    const tri = abs(fract(h.mul(bands).add(t.mul(0.1))).mul(2.0).sub(1.0));
    const base = gradient4(tri);

    const g = vec2(dFdx(h), dFdy(h)).mul(u_resolution.y);
    const n = normalize(vec3(g.x.mul(-0.06), g.y.mul(-0.06), 1.0));
    const spec = pow(max(dot(reflect(normalize(vec3(-0.4, 0.5, 0.75)).negate(), n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0);

    return finish(mix(base, vec3(0.98, 0.0, 0.0), spec.mul(0.35)));
});
