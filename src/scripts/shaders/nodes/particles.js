import { Fn, vec2, vec3, float, sin, floor, fract, length, exp, dot, abs, mix, clamp, smoothstep, step, normalize } from 'three/tsl';
import { u_time, u_color1, u_color2, u_color4, u_intensity, u_density, u_glow } from '../commonUniforms.js';
import { coords, fbm, hash12, hash22, gradient4, finish } from '../tslLib.js';

// Starfield: three parallax layers of twinkling stars drifting sideways, a faint
// nebula behind them and an occasional shooting star.
export const main = Fn(() => {
    const p = coords();
    const t = u_time.mul(0.25);

    // Deep space with a tinted nebula.
    const nebula = fbm(p.mul(1.4).add(vec2(t.mul(0.1), 3.0)), 2);
    const lab = mix(u_color1, u_color2, nebula.mul(0.55).mul(u_glow).mul(0.7)).toVar();

    const layer = (scale, speed, size, seed) => {
        const g = p.mul(scale).add(vec2(t.mul(speed), seed)).toVar();
        const cell = floor(g);
        const h = hash12(cell.add(seed * 13.0));
        const center = hash22(cell.add(seed)).mul(0.7).add(0.15);
        const d = length(fract(g).sub(center));
        const present = step(float(0.9).sub(u_density.mul(0.5)), h);
        const twinkle = sin(t.mul(3.0).add(h.mul(80.0))).mul(0.3).add(0.7);
        const core = smoothstep(size, 0.0, d);
        const halo = exp(d.mul(-16.0)).mul(0.25);
        return { amount: present.mul(core.add(halo)).mul(twinkle), tone: h };
    };

    const far = layer(14.0, 0.03, 0.07, 1.0);
    const mid = layer(8.0, 0.07, 0.1, 2.0);
    const near = layer(4.5, 0.14, 0.14, 3.0);

    [far, mid, near].forEach(({ amount, tone }, i) => {
        const color = gradient4(tone.mul(0.55).add(0.45));
        const strength = clamp(amount.mul(u_intensity).mul(0.55 + 0.25 * i), 0.0, 1.0);
        lab.assign(mix(lab, mix(color, vec3(0.98, 0.0, 0.0), 0.55), strength));
    });

    // Shooting star: one pass every ~9 s, drawn as a fading streak.
    const cycle = fract(t.mul(0.11));
    const dir = normalize(vec2(1.0, -0.55));
    const head = vec2(-0.7, 0.38).add(dir.mul(cycle.mul(1.9)));
    const rel = p.sub(head);
    const along = dot(rel, dir.negate());
    const across = abs(rel.x.mul(dir.y).sub(rel.y.mul(dir.x)));
    const fade = smoothstep(0.0, 0.08, cycle).mul(smoothstep(0.7, 0.45, cycle));
    const streak = exp(across.mul(-420.0)).mul(step(0.0, along)).mul(exp(along.mul(-10.0))).mul(fade);
    lab.assign(mix(lab, u_color4, clamp(streak.mul(1.2), 0.0, 1.0)));

    return finish(lab);
});
