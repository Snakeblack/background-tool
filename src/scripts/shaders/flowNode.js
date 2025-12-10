import { 
    float, vec2, vec3, vec4,
    sin, cos, dot, fract, floor, mix, smoothstep, length,
    uv, Fn, Loop
} from 'three/tsl';
import {
    u_time, u_resolution, u_color1, u_color2, u_color3, u_color4,
    u_speed, u_scale, u_intensity, u_brightness, u_contrast, u_noise
} from './commonUniforms.js';

/**
 * Hash pseudo-aleatorio 2D.
 */
const hash = Fn(([p]) => {
    return fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453123));
});

/**
 * Ruido Perlin 2D con interpolación suavizada.
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
 * FBM con transformación de matriz para crear patrones de flujo orgánicos.
 */
const fbm = Fn(([p]) => {
    const v = float(0.0).toVar();
    const a = float(0.5).toVar();
    const pVar = vec2(p).toVar();
    const m1 = vec2(1.6, 1.2);
    const m2 = vec2(-1.2, 1.6);
    
    Loop({ start: 0, end: 4 }, () => {
        v.addAssign(a.mul(noise(pVar)));
        const px = pVar.x.mul(m1.x).add(pVar.y.mul(m2.x));
        const py = pVar.x.mul(m1.y).add(pVar.y.mul(m2.y));
        pVar.x.assign(px);
        pVar.y.assign(py);
        a.mulAssign(0.5);
    });
    
    return v;
});
/**
 * Shader de Flujo Orgánico con Domain Warping.
 * Utiliza múltiples capas de FBM para deformar el espacio y crear patrones
 * fluidos y orgánicos con mezclas de color complejas.
 * 
 * @returns {TSLNode} Color final RGB del efecto de flujo
 */
export const flowTSL = Fn(() => {
    const vUv = uv();
    const p = vec2(vUv).toVar();
    
    p.x.mulAssign(u_resolution.x.div(u_resolution.y));
    p.mulAssign(u_scale);
    
    const t = u_time.mul(u_speed).mul(0.1);
    
    const q = vec2(0.0).toVar();
    q.x.assign(fbm(p.add(vec2(0.0, t))));
    q.y.assign(fbm(p.add(vec2(5.2, 1.3))));
    
    const r = vec2(0.0).toVar();
    const p_q = p.add(q.mul(4.0));
    r.x.assign(fbm(p_q.add(vec2(t, t.mul(0.5)))));
    r.y.assign(fbm(p_q.add(vec2(t.mul(0.2), t.mul(0.8)))));
    
    const f = fbm(p.add(r.mul(4.0)));
    
    const mixVal = smoothstep(0.0, float(1.5).sub(u_intensity.mul(0.5)), f);
    const color = mix(u_color1, u_color2, mixVal).toVar();
    
    const qLen = length(q);
    color.assign(mix(color, u_color3, qLen.mul(qLen).mul(0.6)));
    
    const rLen = length(r);
    color.assign(mix(color, u_color4, smoothstep(0.0, 1.0, rLen).mul(0.4)));
    color.assign(color.sub(0.5).mul(u_contrast).add(0.5));
    color.addAssign(u_brightness);
    
    const dither = hash(p.add(t)).sub(0.5).mul(u_noise);
    color.addAssign(dither);
    
    return color;
});
