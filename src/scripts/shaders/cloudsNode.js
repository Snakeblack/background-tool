import { 
    float, vec2, vec3, vec4,
    sin, cos, dot, fract, floor, mix, smoothstep, exp, normalize, max, clamp,
    uv, Fn, Loop, If, Break
} from 'three/tsl';
import {
    u_time, u_resolution, u_color1, u_color2, u_color3, u_color4,
    u_speed, u_scale, u_intensity, u_brightness, u_contrast, u_noise
} from './commonUniforms.js';

/**
 * Genera un valor hash pseudo-aleatorio a partir de un número.
 * 
 * @param {TSLNode} n - Valor de entrada (float)
 * @returns {TSLNode} Valor hash entre 0 y 1
 */
const hash = Fn(([n]) => {
    return fract(sin(n).mul(753.5453123));
});

/**
 * Genera ruido 3D trilineal para crear patrones volumétricos.
 * Utiliza interpolación suavizada en las tres dimensiones.
 * 
 * @param {TSLNode} x - Posición de muestreo 3D (vec3)
 * @returns {TSLNode} Valor de ruido entre 0 y 1
 */
const noise = Fn(([x]) => {
    const p = floor(x);
    const f = fract(x);
    const f2 = f.mul(f).mul(float(3.0).sub(float(2.0).mul(f)));
    const n = p.x.add(p.y.mul(157.0)).add(p.z.mul(113.0));
    
    return mix(
        mix(
            mix(hash(n.add(0.0)), hash(n.add(1.0)), f2.x),
            mix(hash(n.add(157.0)), hash(n.add(158.0)), f2.x),
            f2.y
        ),
        mix(
            mix(hash(n.add(113.0)), hash(n.add(114.0)), f2.x),
            mix(hash(n.add(270.0)), hash(n.add(271.0)), f2.x),
            f2.y
        ),
        f2.z
    );
});

/**
 * Fractional Brownian Motion 3D para generar densidad de nubes volumétricas.
 * 
 * @param {TSLNode} p - Posición de muestreo 3D (vec3)
 * @returns {TSLNode} Valor FBM acumulado
 */
const fbm = Fn(([p]) => {
    const f = float(0.0).toVar();
    const amp = float(0.5).toVar();
    const pVar = vec3(p).toVar();
    
    Loop({ start: 0, end: 4 }, () => {
        f.addAssign(amp.mul(noise(pVar)));
        pVar.mulAssign(2.0);
        amp.mulAssign(0.5);
    });
    
    return f;
});

/**
 * Mapea una posición 3D a un valor de densidad de nube.
 * Utiliza FBM y un threshold ajustable para definir la forma de las nubes.
 * 
 * @param {TSLNode} p - Posición 3D en el espacio (vec3)
 * @returns {TSLNode} Densidad de nube entre 0 y 1
 */
const map = Fn(([p]) => {
    const q = p.mul(u_scale).mul(0.3);
    const f = fbm(q);
    const threshold = float(0.9).sub(u_intensity.mul(0.6));
    const density = smoothstep(threshold, threshold.add(0.4), f);
    
    return clamp(density, 0.0, 1.0);
});
/**
 * Shader principal de Nubes Volumétricas en TSL.
 * Utiliza raymarching para generar nubes volumétricas realistas con iluminación,
 * sombras y efectos de niebla atmosférica. La cámara se mueve suavemente a través del cielo.
 * 
 * @returns {TSLNode} Color final RGB de las nubes volumétricas
 */
export const cloudsTSL = Fn(() => {
    const vUv = uv();
    const p = vec2(vUv).sub(0.5).toVar();
    p.x.mulAssign(u_resolution.x.div(u_resolution.y));
    
    const time = u_time.mul(u_speed);
    const ro = vec3(0.0, 0.0, time.mul(4.0)).toVar();
    
    ro.x.addAssign(sin(time.mul(0.5)).mul(1.0));
    ro.y.addAssign(cos(time.mul(0.3)).mul(0.5));
    
    const rd = normalize(vec3(p, 1.0));
    const sum = vec4(0.0).toVar();
    const t = float(0.0).toVar();
    t.addAssign(hash(dot(p, vec2(12.9898, 78.233))).mul(0.2));
    
    const sunDir = normalize(vec3(0.5, 0.8, 0.5));
    
    Loop({ start: 0, end: 50 }, () => {
        const pos = ro.add(rd.mul(t));
        const dens = map(pos);
        
        If(dens.greaterThan(0.01), () => {
            const lightSample = map(pos.add(sunDir.mul(0.5)));
            const shadow = exp(lightSample.mul(-5.0));
            const col = mix(u_color3, u_color2, shadow).toVar();
            
            col.assign(mix(col, u_color4, shadow.mul(0.6).mul(float(1.0).sub(dens))));
            
            const alpha = dens.mul(0.4);
            sum.rgb.addAssign(col.mul(alpha).mul(float(1.0).sub(sum.a)));
            sum.a.addAssign(alpha.mul(float(1.0).sub(sum.a)));
        });
        
        If(sum.a.greaterThan(0.99), () => {
            Break();
        });
        
        t.addAssign(0.2);
    });
    
    const sky = mix(u_color1, u_color4.mul(0.8), p.y.mul(0.5).add(0.5));
    const fog = smoothstep(20.0, 5.0, t);
    const finalColor = mix(sky, sum.rgb, sum.a.mul(fog)).toVar();
    
    finalColor.assign(finalColor.sub(0.5).mul(u_contrast).add(0.5));
    finalColor.addAssign(u_brightness);
    
    const noiseVal = hash(dot(p.add(u_time), vec2(12.9898, 78.233))).sub(0.5).mul(u_noise);
    finalColor.addAssign(noiseVal);
    
    return finalColor;
});
