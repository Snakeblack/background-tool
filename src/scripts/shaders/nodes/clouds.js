import { Fn, vec2, vec3, exp, length, normalize, mix, clamp, smoothstep, uv } from 'three/tsl';
import { u_time, u_color1, u_color2, u_color3, u_color4, u_scale, u_intensity } from '../commonUniforms.js';
import { coords, fbm, finish } from '../tslLib.js';

// Dream flight: a soft sky with a low sun, and fractal clouds lit from the sun's
// side (a second density sample towards the sun gives the soft self-shadowing).
export const main = Fn(() => {
    const st = uv();
    const p = coords();
    const t = u_time.mul(0.03);

    // Sky: color 1 at the zenith, color 2 at the horizon.
    const sky = mix(u_color2, u_color1, smoothstep(0.0, 1.0, st.y)).toVar();

    const sunPos = vec2(0.42, -0.12);
    const sunGlow = exp(length(p.sub(sunPos)).mul(-2.3));
    sky.assign(mix(sky, u_color4, sunGlow.mul(0.65)));

    // Clouds.
    const q = p.mul(u_scale.mul(2.1)).add(vec2(t, 0.0));
    const density = fbm(q, 4);
    const threshold = mix(0.74, 0.3, u_intensity);
    const alpha = smoothstep(threshold.sub(0.14), threshold.add(0.2), density);

    const toSun = normalize(sunPos.sub(p));
    const towardSun = fbm(q.add(toSun.mul(0.16)), 4);
    const lit = clamp(density.sub(towardSun).mul(4.5).add(0.55), 0.0, 1.0);

    const shadow = mix(u_color1, u_color2, 0.65);
    const cloud = mix(shadow, u_color3, lit);
    const rim = mix(cloud, u_color4, sunGlow.mul(0.4).mul(lit));

    return finish(vec3(mix(sky, rim, alpha.mul(0.96))));
});
