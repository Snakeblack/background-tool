import {
    Fn,
    float,
    vec2,
    vec3,
    uv,
    sin,
    cos,
    dot,
    fract,
    mix
} from 'three/tsl';
import {
    u_resolution,
    u_time,
    u_color1,
    u_color2,
    u_color3,
    u_speed,
    u_stripe_width,
    u_stripe_speed,
    u_brightness,
    u_contrast,
    u_noise
} from './commonUniforms.js';

const random = Fn(([p]) => {
    return fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453));
});

/**
 * Shader de Franjas Animadas con ondas sinusoidales entrecruzadas.
 * Crea patrones de franjas verticales y horizontales que se mezclan suavemente.
 * 
 * @returns {TSLNode} Color final RGB del efecto de franjas
 */
const main = Fn(() => {
    const uvCoords = uv();
    const adjustedUV = vec2(
        uvCoords.x.mul(u_resolution.x.div(u_resolution.y)),
        uvCoords.y
    );
    
    const time = u_time.mul(u_speed).mul(0.1);
    const n1 = sin(adjustedUV.x.add(time.mul(u_stripe_speed)).mul(u_stripe_width)).add(1.0).div(2.0);
    const n2 = cos(adjustedUV.y.sub(time.mul(u_stripe_speed).mul(0.5)).mul(u_stripe_width).mul(0.5)).add(1.0).div(2.0);

    const mix1 = mix(u_color1, u_color2, n1);
    const finalColor = vec3(mix(mix1, u_color3, n2)).toVar();
    
    finalColor.assign(finalColor.sub(0.5).mul(u_contrast).add(0.5));
    finalColor.addAssign(u_brightness);
    
    const noiseVal = random(uvCoords.add(u_time)).sub(0.5).mul(u_noise);
    finalColor.addAssign(noiseVal);

    return finalColor;
});

export const stripesTSL = main;
