import { 
    float, vec2, vec3, vec4,
    sin, cos, dot, fract, floor, mix, smoothstep, length,
    uv, Fn
} from 'three/tsl';
import {
    u_time, u_resolution, u_color1, u_color2, u_color3, u_color4,
    u_speed, u_scale, u_distortion, u_brightness, u_contrast, u_noise
} from './commonUniforms.js';

/**
 * Vector aleatorio 2D.
 */
const random2 = Fn(([p]) => {
    const dot1 = dot(p, vec2(127.1, 311.7));
    const dot2 = dot(p, vec2(269.5, 183.3));
    return fract(sin(vec2(dot1, dot2)).mul(43758.5453));
});

/**
 * Ruido de gradiente 2D.
 */
const noise = Fn(([st]) => {
    const i = floor(st);
    const f = fract(st);
    const u = f.mul(f).mul(float(3.0).sub(float(2.0).mul(f)));
    
    const a = dot(random2(i), f);
    const b = dot(random2(i.add(vec2(1.0, 0.0))), f.sub(vec2(1.0, 0.0)));
    const c = dot(random2(i.add(vec2(0.0, 1.0))), f.sub(vec2(0.0, 1.0)));
    const d = dot(random2(i.add(vec2(1.0, 1.0))), f.sub(vec2(1.0, 1.0)));
    
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
});
/**
 * Shader de Malla Distorsionada con celdas de colores y efectos de brillo.
 * Crea un patrón de rejilla distorsionado con mezclas de color basadas en ruido.
 * 
 * @returns {TSLNode} Color final RGB del efecto de malla
 */
export const meshTSL = Fn(() => {
    const vUv = uv();
    const p = vec2(vUv).toVar();
    const time = u_time.mul(u_speed).mul(0.1);
    
    const distorted = vec2(p).toVar();
    distorted.x.addAssign(noise(p.mul(u_scale).add(time)).mul(u_distortion));
    distorted.y.addAssign(noise(p.mul(u_scale).sub(time.mul(0.7))).mul(u_distortion));
    
    const grid = fract(distorted.mul(3.0));
    const cellNoise = noise(floor(distorted.mul(3.0)).add(time.mul(0.2)));
    const dist = length(grid.sub(0.5));
    
    const color1 = mix(u_color1, u_color2, cellNoise);
    const color2 = mix(u_color3, u_color4, float(1.0).sub(cellNoise));
    const finalColor = mix(color1, color2, smoothstep(0.2, 0.5, dist)).toVar();
    
    const edge = smoothstep(0.4, 0.5, dist).sub(smoothstep(0.5, 0.6, dist));
    finalColor.addAssign(edge.mul(0.3));
    
    finalColor.assign(finalColor.sub(0.5).mul(u_contrast).add(0.5));
    finalColor.addAssign(u_brightness);
    
    const noiseVal = random2(p.add(u_time)).x.sub(0.5).mul(u_noise);
    finalColor.addAssign(noiseVal);
    
    return finalColor;
});
