import { Fn, If, vec2, vec3, float, abs, fract, length, exp, mix, smoothstep, fwidth, max } from 'three/tsl';
import { u_time, u_resolution, u_color1, u_color2, u_color3, u_color4, u_size, u_density, u_glow } from '../commonUniforms.js';
import { coords, noise, finish } from '../tslLib.js';

// Synth horizon: a striped sun, silhouetted mountains and an endless neon grid
// rushing towards the viewer in true perspective.
// Sky and ground are evaluated in separate branches (the split is screen-coherent,
// so each pixel pays for only one of them); screen derivatives stay outside the branch.
export const main = Fn(() => {
    const p = coords();
    const t = u_time.mul(0.5);
    const horizon = float(-0.06);
    const aa = float(1.5).div(u_resolution.y);

    // Perspective coordinates (derivatives must be taken in uniform control flow).
    const below = horizon.sub(p.y);
    const depth = float(1.0).div(max(below, 0.0008));
    const gx = p.x.mul(depth).mul(u_density.mul(1.6).add(0.5));
    const gz = depth.mul(u_density.mul(0.8).add(0.3)).add(t.mul(2.2));
    const pxX = max(fwidth(gx), 1e-4);
    const pxZ = max(fwidth(gz), 1e-4);
    const lineOf = (v, px) => float(1.0).sub(smoothstep(px.mul(0.6), px.mul(1.7), abs(fract(v.add(0.5)).sub(0.5))));

    const result = vec3(0.0).toVar();

    If(below.lessThanEqual(0.0), () => {
        // Sky: deep color 1 above, hazy color 2 at the horizon.
        const sky = mix(u_color2, u_color1, smoothstep(horizon, 0.55, p.y)).toVar();

        // Sun with horizontal slits in its lower half.
        const sunCenter = vec2(0.0, horizon.add(0.2));
        const radius = u_size.mul(0.2).add(0.0001);
        const toSun = p.sub(sunCenter);
        const sunDist = length(toSun);
        const y01 = toSun.y.div(radius).mul(0.5).add(0.5);
        const slit = smoothstep(y01.mul(0.7), y01.mul(0.7).add(0.07), fract(y01.mul(9.0)));
        const slitMask = mix(float(1.0), slit, smoothstep(0.62, 0.4, y01));
        const sunBody = smoothstep(radius.add(aa), radius.sub(aa), sunDist).mul(slitMask);
        const sunColor = mix(u_color2.mul(vec3(1.25, 1.1, 1.0)), u_color4, smoothstep(0.1, 0.9, y01));
        sky.assign(mix(sky, u_color4, exp(sunDist.mul(-3.2)).mul(0.35).mul(u_glow)));
        sky.assign(mix(sky, sunColor, sunBody));

        // Mountains: two noise ridges at the sides, dark with a rim light.
        const ridge = noise(vec2(p.x.mul(5.5), 1.7)).mul(0.11).add(noise(vec2(p.x.mul(13.0), 4.2)).mul(0.035))
            .mul(smoothstep(0.08, 0.55, abs(p.x))).add(horizon);
        const mountain = smoothstep(aa.mul(2.0).negate(), aa.mul(2.0), ridge.sub(p.y));
        const rim = exp(abs(ridge.sub(p.y)).mul(-160.0));
        const dark = vec3(u_color1.x.mul(0.55), u_color1.y, u_color1.z);
        sky.assign(mix(sky, dark, mountain.mul(0.96)));
        sky.assign(mix(sky, u_color3, rim.mul(0.5).mul(u_glow)));
        result.assign(sky);
    }).Else(() => {
        // Ground: perspective grid.
        const grid = max(lineOf(gx, pxX), lineOf(gz, pxZ));
        const fade = smoothstep(0.0, 0.16, below);

        const ground = mix(u_color2, u_color1.mul(vec3(0.45, 1.0, 1.0)), smoothstep(0.0, 0.5, below)).toVar();
        ground.assign(mix(ground, u_color3, grid.mul(fade).mul(u_glow.mul(0.6).add(0.4))));
        // Reflection of the sun on the floor.
        ground.assign(mix(ground, u_color4, exp(abs(p.x).mul(-9.0)).mul(exp(below.mul(-5.0))).mul(0.18).mul(u_glow)));
        result.assign(ground);
    });

    return finish(result);
});
