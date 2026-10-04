import { Fn, vec2, float, sin, cos, dot, exp, mix, smoothstep, clamp } from 'three/tsl';
import { u_time, u_mouse, u_color1, u_color2, u_size, u_softness } from '../commonUniforms.js';
import { coords, aspect, gradient4, finish } from '../tslLib.js';

// Lava blobs: metaballs on lissajous orbits (one of them chases the pointer),
// rendered as an iso-surface with a palette-driven fill and a soft halo.
export const main = Fn(() => {
    const p = coords();
    const t = u_time.mul(0.3);
    const radius = u_size.mul(0.17);

    // Orbits stay close enough that neighbours keep merging and splitting.
    let field = float(0.0);
    for (let i = 0; i < 5; i++) {
        const c = vec2(
            sin(t.mul(0.5 + 0.13 * i).add(i * 2.3)).mul(0.32).mul(aspect),
            cos(t.mul(0.42 + 0.11 * i).add(i * 1.7)).mul(0.3),
        );
        const d = p.sub(c);
        const r = radius.mul(1.0 - 0.09 * i);
        field = field.add(r.mul(r).div(dot(d, d).add(0.0004)));
    }

    // The sixth blob follows the pointer.
    const m = u_mouse.sub(0.5).mul(vec2(aspect, 1.0));
    const dm = p.sub(m);
    field = field.add(radius.mul(radius).mul(0.7).div(dot(dm, dm).add(0.0004)));

    const edge = u_softness.mul(0.35).add(0.03);
    const body = smoothstep(edge.oneMinus(), edge.add(1.0), field);
    const halo = exp(field.mul(-0.45)).oneMinus();

    const background = mix(u_color1, u_color2, halo.mul(0.5));
    // Inside, the color climbs from the rim to the hot core as the field grows.
    const fill = gradient4(clamp(field.sub(1.0).mul(0.12).add(0.3), 0.0, 1.0));
    return finish(mix(background, fill, body));
});
