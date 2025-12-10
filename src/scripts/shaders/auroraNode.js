import { Vector2, Color } from 'three';
import { 
    float, vec2, vec3, 
    sin, cos, dot, fract, floor, mix, abs, smoothstep, mod,
    uv, Fn, Loop
} from 'three/tsl';
import {
    u_time, u_resolution, u_color1, u_color2, u_color3, u_color4,
    u_speed, u_intensity, u_scale, u_brightness, u_contrast, u_noise
} from './commonUniforms.js';

export {
    u_time, u_resolution, u_color1, u_color2, u_color3, u_color4,
    u_speed, u_intensity, u_scale, u_brightness, u_contrast, u_noise
};

/**
 * Crea una matriz de rotación 2D.
 * 
 * @param {TSLNode} a - Ángulo de rotación en radianes
 * @returns {Function} Función que aplica la rotación a un punto 2D
 */
const rot = (a) => {
    const s = sin(a);
    const c = cos(a);
    return (p) => {
        return vec2(
            p.x.mul(c).sub(p.y.mul(s)),
            p.x.mul(s).add(p.y.mul(c))
        );
    };
};

/**
 * Genera un valor pseudo-aleatorio basado en una posición 2D.
 * 
 * @param {TSLNode} p - Posición de entrada (vec2)
 * @returns {TSLNode} Valor aleatorio entre 0 y 1
 */
const hash = Fn(([p]) => {
    return fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453123));
});

/**
 * Genera ruido de Perlin 2D suavizado mediante interpolación bilineal.
 * 
 * @param {TSLNode} p - Posición de muestreo (vec2)
 * @returns {TSLNode} Valor de ruido entre 0 y 1
 */
const noise = Fn(([p]) => {
    const i = floor(p);
    const f = fract(p);
    const u = f.mul(f).mul(float(3.0).sub(float(2.0).mul(f)));
    
    const a = hash(i.add(vec2(0.0, 0.0)));
    const b = hash(i.add(vec2(1.0, 0.0)));
    const c = hash(i.add(vec2(0.0, 1.0)));
    const d = hash(i.add(vec2(1.0, 1.0)));
    
    return mix(
        mix(a, b, u.x),
        mix(c, d, u.x),
        u.y
    );
});

/**
 * Fractional Brownian Motion - Combina múltiples octavas de ruido para crear
 * patrones naturales complejos con detalles a diferentes escalas.
 * 
 * @param {TSLNode} p - Posición de muestreo (vec2)
 * @returns {TSLNode} Valor FBM acumulado
 */
const fbm = Fn(([p]) => {
    const v = float(0.0).toVar();
    const a = float(0.5).toVar();
    const pVar = vec2(p).toVar();
    
    const rotate = rot(1.0);
    
    v.addAssign(a.mul(noise(pVar)));
    pVar.assign(rotate(pVar).mul(2.0));
    a.mulAssign(0.5);
    
    v.addAssign(a.mul(noise(pVar)));
    pVar.assign(rotate(pVar).mul(2.0));
    a.mulAssign(0.5);
    
    v.addAssign(a.mul(noise(pVar)));
    pVar.assign(rotate(pVar).mul(2.0));
    a.mulAssign(0.5);
    
    v.addAssign(a.mul(noise(pVar)));
    pVar.assign(rotate(pVar).mul(2.0));
    a.mulAssign(0.5);
    
    return v;
});
/**
 * Shader principal de Aurora Boreal en TSL.
 * Genera múltiples capas ondulantes de luz con colores dinámicos que simulan
 * una aurora boreal, incluyendo distorsión, gradientes verticales y efectos de profundidad.
 * 
 * @returns {TSLNode} Color final RGB del efecto de aurora
 */
export const auroraTSL = Fn(() => {
    const vUv = uv();
    const p = vec2(vUv).toVar();
    
    p.x.mulAssign(u_resolution.x.div(u_resolution.y));
    
    const t = u_time.mul(u_speed).mul(0.1);
    const finalColor = vec3(0.0).toVar();
    
    const bg = mix(
        u_color1.mul(0.05), 
        u_color2.mul(0.1), 
        p.y.mul(0.5).add(0.5)
    );
    finalColor.assign(bg);
    
    Loop({ start: 0.0, end: 4.0, type: 'float', condition: '<' }, ({ i }) => {
        const z = float(1.0).add(i.mul(0.2));
        const q = p.mul(u_scale.mul(0.8)).toVar();
        
        q.x.addAssign(i.mul(0.5));
        q.y.mulAssign(0.3);
        
        const distortion = noise(q.mul(2.0).add(vec2(0.0, t.mul(0.5))));
        const curve = sin(q.x.mul(2.0).add(distortion.mul(3.0)).add(t));
        const d = abs(q.y.sub(curve.mul(0.2)).sub(0.5));
        
        const intensity = float(0.02).div(d.add(0.01)).toVar();
        
        intensity.mulAssign(
            smoothstep(0.0, 0.2, vUv.y).mul(smoothstep(1.0, 0.6, vUv.y))
        );
        
        intensity.mulAssign(
            float(0.5).add(float(0.5).mul(fbm(q.mul(5.0).add(vec2(0.0, t.mul(2.0))))))
        );
        
        const col = mix(
            u_color3, 
            u_color4, 
            sin(i.add(t)).mul(0.5).add(0.5)
        ).toVar();
        
        const modI = mod(i, 2.0);
        const isEven = modI.lessThan(0.1); 
        const mixedCol = mix(u_color2, col, 0.5);
        col.assign(mix(col, mixedCol, isEven));
        
        finalColor.addAssign(col.mul(intensity).mul(u_intensity).mul(float(1.0).div(z)));
    });
    
    finalColor.assign(finalColor.sub(0.5).mul(u_contrast).add(0.5));
    finalColor.addAssign(u_brightness);
    finalColor.addAssign(
        noise(vUv.mul(100.0).add(t)).sub(0.5).mul(u_noise)
    );
    
    return vec3(finalColor);
});
