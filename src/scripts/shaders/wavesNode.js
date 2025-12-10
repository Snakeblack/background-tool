import { 
    float, vec2, vec3, 
    sin, dot, fract, mix, smoothstep,
    uv, Fn
} from 'three/tsl';
import {
    u_time, u_resolution, u_color1, u_color2, u_color3, u_color4,
    u_speed, u_wave_amplitude, u_wave_frequency,
    u_brightness, u_contrast, u_noise
} from './commonUniforms.js';

const random = Fn(([p]) => {
    return fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453));
});

/**
 * Shader de Ondas Superpuestas con mezcla gradual de 4 colores.
 * Combina tres ondas sinusoidales con diferentes frecuencias y direcciones.
 * 
 * @returns {TSLNode} Color final RGB del efecto de ondas
 */
export const wavesTSL = Fn(() => {
    const vUv = uv();
    const p = vec2(vUv).toVar();
    
    p.x.mulAssign(u_resolution.x.div(u_resolution.y));
    const time = u_time.mul(u_speed).mul(0.2);
    
    const wave1 = sin(p.x.mul(u_wave_frequency).add(time)).mul(u_wave_amplitude);
    const wave2 = sin(p.y.mul(u_wave_frequency).mul(0.8).sub(time.mul(1.3))).mul(u_wave_amplitude).mul(0.7);
    const wave3 = sin(p.x.add(p.y).mul(u_wave_frequency).mul(0.5).add(time.mul(0.7))).mul(u_wave_amplitude).mul(0.5);
    
    const combined = wave1.add(wave2).add(wave3).add(2.5).div(5.0);
    
    const color1 = mix(u_color1, u_color2, smoothstep(0.0, 0.33, combined));
    const color2 = mix(color1, u_color3, smoothstep(0.33, 0.66, combined));
    const finalColor = mix(color2, u_color4, smoothstep(0.66, 1.0, combined)).toVar();
    
    finalColor.assign(finalColor.sub(0.5).mul(u_contrast).add(0.5));
    finalColor.addAssign(u_brightness);
    
    const noiseVal = random(p.add(u_time)).sub(0.5).mul(u_noise);
    finalColor.addAssign(noiseVal);
    
    return finalColor;
});
