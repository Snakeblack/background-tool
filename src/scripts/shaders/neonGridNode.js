import { 
    float, vec2, vec3, vec4,
    sin, cos, dot, fract, floor, mix, smoothstep, length, abs, pow, exp, max, clamp,
    uv, Fn, Loop, If
} from 'three/tsl';
import {
    u_time, u_resolution, u_color1, u_color2, u_color3,
    u_speed, u_grid_size, u_glow, u_offset_x, u_offset_y, u_sun_size,
    u_brightness, u_contrast, u_noise
} from './commonUniforms.js';

const hash = Fn(([p]) => {
    const pVar = vec2(p).toVar();
    pVar.assign(fract(pVar.mul(vec2(123.34, 456.21))));
    pVar.addAssign(dot(pVar, pVar.add(45.32)));
    return fract(pVar.x.mul(pVar.y));
});

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

const fbm = Fn(([p]) => {
    const v = float(0.0).toVar();
    const a = float(0.5).toVar();
    const pVar = vec2(p).toVar();
    
    Loop({ start: 0, end: 4 }, () => {
        v.addAssign(a.mul(noise(pVar)));
        pVar.mulAssign(2.0);
        a.mulAssign(0.5);
    });
    
    return v;
});
/**
 * Shader de Cuadrícula Neón Retro estilo Synthwave/Vaporwave.
 * Simula una cuadrícula de perspectiva con sol al horizonte, montañas, estrellas
 * y efectos de resplandor neón. Inspirado en la estética de los años 80.
 * 
 * @returns {TSLNode} Color final RGB del efecto de cuadrícula neón
 */
export const neonGridTSL = Fn(() => {
    const vUv = uv();
    const p = vec2(vUv).sub(0.5).toVar();
    p.x.mulAssign(u_resolution.x.div(u_resolution.y));
    
    p.x.subAssign(u_offset_x);
    p.y.subAssign(u_offset_y);
    
    const col = vec3(0.0).toVar();
    const t = u_time.mul(u_speed);
    const horizon = float(0.05);
    const curve = p.y.sub(horizon).sub(pow(abs(p.x), 2.5).mul(0.15)).toVar();
    
    If(curve.greaterThan(0.0), () => {
        const skyTop = u_color1.mul(0.4);
        const skyBot = mix(u_color1, vec3(0.8, 0.2, 0.5), 0.5);
        col.assign(mix(skyBot, skyTop, pow(curve.mul(1.5), 0.7)));
        
        const stars = pow(hash(p.mul(20.0)), 30.0).mul(0.8);
        col.addAssign(vec3(stars));
        
        const sunPos = vec2(0.0, horizon.add(0.25));
        const sunDist = length(p.sub(sunPos));
        const sunRadius = u_sun_size.mul(0.6);
        
        If(sunDist.lessThan(sunRadius), () => {
            const sunGrad = p.y.sub(sunPos.y).add(sunRadius).div(sunRadius.mul(2.0));
            const sunCol = mix(vec3(1.0, 0.0, 0.2), vec3(1.0, 0.9, 0.0), sunGrad);
            const stripes = sin(p.y.sub(sunPos.y).mul(80.0));
            const stripeMask = smoothstep(0.0, 0.1, stripes).toVar();
            const stripeFade = smoothstep(0.6, 0.9, sunGrad);
            stripeMask.assign(mix(stripeMask, 1.0, stripeFade));
            col.assign(mix(col, sunCol.mul(u_color3).mul(2.5), stripeMask));
            col.addAssign(sunCol.mul(u_glow).mul(0.5).mul(exp(sunDist.mul(-5.0))));
        });
        
        col.addAssign(u_color3.mul(u_glow).mul(0.4).mul(exp(sunDist.mul(-2.0))));
        
        const mScale = float(4.0);
        const mScroll = t.mul(0.1);
        const mountainHeight = fbm(vec2(p.x.mul(mScale).add(mScroll), 1.0)).mul(0.25);
        const mountainHeight2 = fbm(vec2(p.x.mul(mScale).mul(1.5).add(mScroll.mul(0.5)).add(10.0), 2.0)).mul(0.2);
        
        If(curve.lessThan(mountainHeight2), () => {
            col.assign(mix(col, u_color1.mul(0.3), 0.9));
        });
        
        If(curve.lessThan(mountainHeight), () => {
            col.assign(vec3(0.02, 0.0, 0.05));
            const rim = smoothstep(0.0, 0.01, mountainHeight.sub(curve));
            col.addAssign(u_color2.mul(rim).mul(0.8));
        });
        
    }).Else(() => {
        const z = float(1.0).div(abs(curve));
        const x = p.x.mul(z);
        const speedZ = t.mul(4.0);
        const gridUV = vec2(x, z.add(speedZ)).mul(u_grid_size);
        
        const lineWidth = float(0.05).mul(z).mul(0.5).toVar();
        lineWidth.assign(clamp(lineWidth, 0.0, 0.5));
        
        const gridLineX = smoothstep(float(0.5).sub(lineWidth), 0.5, abs(fract(gridUV.x).sub(0.5)));
        const gridLineY = smoothstep(float(0.5).sub(lineWidth), 0.5, abs(fract(gridUV.y).sub(0.5)));
        const gridMask = max(gridLineX, gridLineY);
        const fog = exp(z.mul(-0.08));
        const gridCol = u_color2.mul(2.5);
        const floorCol = vec3(0.05, 0.0, 0.1).toVar();
        
        const sunReflect = exp(pow(p.x.mul(3.0), 2.0).negate()).mul(exp(abs(curve).mul(-3.0)));
        floorCol.addAssign(u_color3.mul(sunReflect).mul(0.6).mul(u_glow));
        col.assign(mix(floorCol, gridCol, gridMask.mul(fog)));
        col.addAssign(u_color2.mul(0.6).mul(exp(abs(curve).mul(-15.0))).mul(fog));
    });
    
    col.mulAssign(float(1.0).sub(smoothstep(0.5, 1.5, length(p))));
    col.mulAssign(float(0.9).add(float(0.1).mul(sin(p.y.mul(1000.0).add(t.mul(10.0))))));
    col.assign(col.sub(0.5).mul(u_contrast).add(0.5));
    col.addAssign(u_brightness);
    col.addAssign(hash(p.add(t)).sub(0.5).mul(u_noise));
    
    return col;
});
