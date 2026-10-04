import { Fn, vec2, vec3, float, sin, cos, length, pow, abs, mix, clamp, smoothstep, uv } from 'three/tsl';
import { u_time, u_color1, u_color2, u_color3, u_color4, u_scale, u_intensity } from '../commonUniforms.js';
import { coords, finish } from '../tslLib.js';

// Water caustics: the light net you see on a pool floor, from the classic
// iterated sine/cosine feedback, over a depth gradient.
export const main = Fn(() => {
    const st = uv();
    const t = u_time.mul(0.4);
    // The algorithm expects coordinates far from the origin (-250 in the original).
    const p = coords().mul(u_scale.mul(5.0)).sub(250.0);

    const sample = p.toVar();
    const accumulated = float(1.0).toVar();
    const inten = 0.005;
    for (let n = 0; n < 4; n++) {
        const tt = t.mul(1.0 - 3.5 / (n + 1));
        sample.assign(p.add(vec2(
            cos(tt.sub(sample.x)).add(sin(tt.add(sample.y))),
            sin(tt.sub(sample.y)).add(cos(tt.add(sample.x))),
        )));
        const denom = vec2(
            p.x.div(sin(sample.x.add(tt)).div(inten)),
            p.y.div(cos(sample.y.add(tt)).div(inten)),
        );
        accumulated.addAssign(float(1.0).div(length(denom)));
    }

    const c = accumulated.div(4.0);
    const net = pow(abs(float(1.17).sub(pow(c, 1.4))), 8.0);

    // Depth: deep color 1 at the bottom, lighter color 2 near the surface.
    const water = mix(u_color1, u_color2, smoothstep(0.0, 1.0, st.y).mul(0.8));
    const light = mix(u_color3, u_color4, clamp(net, 0.0, 1.0));
    return finish(vec3(mix(water, light, clamp(net.mul(u_intensity).mul(0.9), 0.0, 1.0))));
});
