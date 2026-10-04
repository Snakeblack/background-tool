import { Fn, vec2, vec3, float, sin, atan, exp, length, mix, clamp } from 'three/tsl';
import { u_time, u_color1, u_color4, u_intensity, u_spread, u_density } from '../commonUniforms.js';
import { coords, gradient4, finish } from '../tslLib.js';

// Light beams: seven soft rays fanning out from a point above the screen, each
// swaying and pulsing on its own, over a haze that thickens near the source.
export const main = Fn(() => {
    const p = coords();
    const t = u_time.mul(0.35);

    const source = vec2(sin(t.mul(0.3)).mul(0.08), 0.78);
    const v = p.sub(source);
    const dist = length(v);
    const angle = atan(v.x, v.y.negate());

    const count = 7;
    let total = float(0.0);
    let tint = vec3(0.0, 0.0, 0.0);
    for (let i = 0; i < count; i++) {
        const center = u_spread.mul((i - 3) * 0.19).add(sin(t.mul(0.6).add(i * 1.9)).mul(0.05));
        const width = u_density.mul(0.05).add(0.025).add(0.008 * (i % 3));
        const delta = angle.sub(center).div(width);
        const pulse = sin(t.mul(0.9).add(i * 2.3)).mul(0.3).add(0.7);
        const beam = exp(delta.mul(delta).negate()).mul(pulse);
        total = total.add(beam);
        tint = tint.add(gradient4(float(0.3 + (0.7 * i) / (count - 1))).mul(beam));
    }

    const strength = clamp(total.mul(exp(dist.mul(-0.9))).mul(u_intensity).mul(0.9), 0.0, 1.0);
    const beamColor = tint.div(total.add(0.0001));

    // Haze thickening around the source.
    const haze = clamp(exp(dist.mul(-2.4)).mul(0.5).mul(u_intensity), 0.0, 0.8);
    return finish(mix(mix(u_color1, u_color4, haze), beamColor, strength));
});
