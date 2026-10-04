import { Fn, vec3, float, sin, exp, abs, clamp, mix, smoothstep, uv } from 'three/tsl';
import { u_time, u_resolution, u_color1, u_amplitude, u_frequency } from '../commonUniforms.js';
import { coords, gradient4, finish } from '../tslLib.js';

// Layered waves: five translucent bands stacked back to front, each with two
// harmonics, a darker body and a thin bright crest line.
export const main = Fn(() => {
    const st = uv();
    const p = coords();
    const t = u_time.mul(0.45);
    const aa = float(1.5).div(u_resolution.y);

    // Backdrop: color 1 with a gentle vertical lift.
    const lab = mix(u_color1, vec3(u_color1.x.mul(1.35), u_color1.y, u_color1.z), smoothstep(0.0, 1.0, st.y)).toVar();

    const count = 5;
    for (let i = 0; i < count; i++) {
        const k = i / (count - 1);
        const base = 0.2 - 0.5 * k;
        const amp = u_amplitude.mul(0.045 + 0.02 * i);
        const freq = u_frequency.mul(1.5 + 0.45 * i);
        const y = amp.mul(sin(p.x.mul(freq).add(t.mul(0.6 + 0.18 * i)).add(i * 1.7)))
            .add(amp.mul(0.5).mul(sin(p.x.mul(freq.mul(2.1)).sub(t.mul(0.9)).add(i * 0.7))))
            .add(base);

        const below = y.sub(p.y);
        const body = smoothstep(aa.negate(), aa, below);
        const color = gradient4(float(0.3 + 0.62 * k));
        // Deeper inside a band the color darkens a little.
        const depth = clamp(below.mul(2.2), 0.0, 1.0);
        const shaded = vec3(color.x.mul(float(1.0).sub(depth.mul(0.28))), color.y, color.z);
        const crest = exp(abs(below).mul(-110.0)).mul(0.1);

        lab.assign(mix(lab, shaded, body.mul(0.9)));
        lab.assign(vec3(lab.x.add(crest), lab.y, lab.z));
    }

    return finish(lab);
});
