import { 
    float, vec2, vec3, vec4,
    sin, cos, dot, fract, floor, mix, smoothstep, length,
    uv, Fn, Loop
} from 'three/tsl';
import {
    u_time, u_resolution, u_color1, u_color2, u_color3,
    u_speed, u_zoom, u_brightness, u_contrast, u_noise
} from './commonUniforms.js';

/**
 * Genera un vector aleatorio 2D basado en posición.
 */
const random2 = Fn(([p]) => {
    const dot1 = dot(p, vec2(127.1, 311.7));
    const dot2 = dot(p, vec2(269.5, 183.3));
    return fract(sin(vec2(dot1, dot2)).mul(43758.5453));
});

/**
 * Ruido 2D mejorado con interpolación bilineal personalizada.
 */
const noise = Fn(([st]) => {
    const i = floor(st);
    const f = fract(st);
    
    const a = random2(i).x;
    const b = random2(i.add(vec2(1.0, 0.0))).x;
    const c = random2(i.add(vec2(0.0, 1.0))).x;
    const d = random2(i.add(vec2(1.0, 1.0))).x;
    
    const u = f.mul(f).mul(float(3.0).sub(float(2.0).mul(f)));
    const mix1 = mix(a, b, u.x);
    const term2 = c.sub(a).mul(u.y).mul(float(1.0).sub(u.x));
    const term3 = d.sub(b).mul(u.y).mul(u.x);
    
    return mix1.add(term2).add(term3);
});

/**
 * FBM con 6 octavas para patrones líquidos complejos.
 */
const fbm = Fn(([st]) => {
    const value = float(0.0).toVar();
    const amplitude = float(0.5).toVar();
    const stVar = vec2(st).toVar();
    
    Loop({ start: 0, end: 6 }, () => {
        value.addAssign(amplitude.mul(noise(stVar)));
        stVar.mulAssign(2.0);
        amplitude.mulAssign(0.5);
    });
    
    return value;
});
/**
 * Shader de Efecto Líquido con múltiples capas de FBM.
 * Crea patrones fluidos orgánicos mezclando capas de ruido animadas.
 * 
 * @returns {TSLNode} Color final RGB del efecto líquido
 */
export const liquidTSL = Fn(() => {
    const vUv = uv();
    const p = vec2(vUv).toVar();
    
    p.x.mulAssign(u_resolution.x.div(u_resolution.y));
    
    const time = u_time.mul(u_speed).mul(0.1);
    const n1 = fbm(p.mul(u_zoom).add(vec2(time, time)));
    const n2 = fbm(p.mul(u_zoom).mul(0.8).add(vec2(time.mul(1.2), time.mul(0.8))));
    
    const mix1 = mix(u_color1, u_color2, n1);
    const finalColor = mix(mix1, u_color3, n2).toVar();
    
    finalColor.assign(finalColor.sub(0.5).mul(u_contrast).add(0.5));
    finalColor.addAssign(u_brightness);
    
    const noiseVal = random2(p.add(u_time)).x.sub(0.5).mul(u_noise);
    finalColor.addAssign(noiseVal);
    
    return finalColor;
});
