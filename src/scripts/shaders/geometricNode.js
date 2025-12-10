import { 
    float, vec2, vec3, vec4,
    sin, cos, dot, fract, floor, mix, smoothstep, length, abs, min, max, clamp, sign, sqrt, exp,
    uv, Fn, If
} from 'three/tsl';
import {
    u_time, u_resolution, u_color1, u_color2, u_color3, u_color4,
    u_speed, u_scale, u_rotation, u_brightness, u_contrast, u_noise
} from './commonUniforms.js';

const PI = 3.14159265359;

/**
 * Crea una función de rotación 2D.
 */
const rotate2d = (angle) => {
    const s = sin(angle);
    const c = cos(angle);
    return (p) => {
        return vec2(
            p.x.mul(c).sub(p.y.mul(s)),
            p.x.mul(s).add(p.y.mul(c))
        );
    };
};

/**
 * SDF (Signed Distance Function) de un hexágono regular.
 */
const hexagon = Fn(([p, r]) => {
    const k = vec3(-0.866025404, 0.5, 0.577350269);
    const pAbs = abs(p).toVar();
    pAbs.subAssign(min(dot(k.xy, pAbs), 0.0).mul(2.0).mul(k.xy));
    pAbs.subAssign(vec2(clamp(pAbs.x, k.z.negate().mul(r), k.z.mul(r)), r));
    return length(pAbs).mul(sign(pAbs.y));
});

/**
 * SDF de una caja rectangular.
 */
const box = Fn(([p, b]) => {
    const d = abs(p).sub(b);
    return length(max(d, 0.0)).add(min(max(d.x, d.y), 0.0));
});

/**
 * SDF de un círculo.
 */
const circle = Fn(([p, r]) => {
    return length(p).sub(r);
});

/**
 * SDF de una cruz.
 */
const cross = Fn(([p, b, r]) => {
    const d = abs(p).sub(b);
    const q = abs(p.yx).sub(b);
    const d1 = length(max(d, 0.0)).add(min(max(d.x, d.y), 0.0));
    const d2 = length(max(q, 0.0)).add(min(max(q.x, q.y), 0.0));
    return min(d1, d2).sub(r);
});
/**
 * Shader de Formas Geométricas con simetría de caleidoscopio y rotación dinámica.
 * Distribuye formas geométricas (hexágonos, cajas, círculos, cruces) en una cuadrícula
 * con efectos de resplandor, gradientes y pulsos animados.
 * 
 * @returns {TSLNode} Color final RGB del efecto geométrico
 */
export const geometricTSL = Fn(() => {
    const vUv = uv();
    const center = vUv.sub(0.5).mul(2.0).toVar();
    center.x.mulAssign(u_resolution.x.div(u_resolution.y));
    
    const time = u_time.mul(u_speed).mul(0.1);
    const p = rotate2d(time.add(u_rotation))(center).toVar();
    p.mulAssign(u_scale);
    
    const id = floor(p);
    const gv = fract(p).sub(0.5);
    const symId = abs(id);
    
    const h = fract(sin(dot(symId, vec2(12.9898, 78.233))).mul(43758.5453));
    const localAngle = time.mul(sign(h.sub(0.5))).add(h.mul(6.28));
    const rotatedGv = rotate2d(localAngle)(gv);
    
    const d = float(0.0).toVar();
    
    If(h.lessThan(0.25), () => {
        d.assign(hexagon(rotatedGv, 0.3));
    }).ElseIf(h.lessThan(0.5), () => {
        d.assign(box(rotatedGv, vec2(0.25)));
    }).ElseIf(h.lessThan(0.75), () => {
        d.assign(circle(rotatedGv, 0.3));
    }).Else(() => {
        d.assign(cross(rotatedGv, vec2(0.3, 0.1), 0.0));
    });
    
    const pulse = sin(time.mul(2.0).add(h.mul(6.28))).mul(0.5).add(0.5);
    d.subAssign(pulse.mul(0.05));
    const aa = float(0.02);
    const mask = smoothstep(aa, aa.negate(), d);
    const innerGlow = smoothstep(0.0, -0.4, d).mul(0.6);
    const outerGlow = exp(d.mul(-3.0).max(-8.0)).mul(0.4);
    
    const palette = vec3(0.0).toVar();
    If(h.lessThan(0.25), () => { palette.assign(u_color1); })
    .ElseIf(h.lessThan(0.5), () => { palette.assign(u_color2); })
    .ElseIf(h.lessThan(0.75), () => { palette.assign(u_color3); })
    .Else(() => { palette.assign(u_color4); });
    
    const shapeGradient = dot(rotatedGv, vec2(0.707)).mul(0.5).add(0.5); 
    const shapeColor = mix(palette, palette.mul(1.5), shapeGradient);
    
    const distFromCenter = length(center);
    const bgGradient = mix(u_color1.mul(0.1), u_color4.mul(0.2), distFromCenter.mul(0.8));
    
    const gridLine = smoothstep(0.48, 0.5, max(abs(gv.x), abs(gv.y)));
    const gridColor = u_color3.mul(0.1).mul(gridLine);
    
    const finalColor = vec3(bgGradient).toVar();
    finalColor.addAssign(gridColor);
    
    const shapeWithGlow = shapeColor.add(innerGlow.mul(0.3));
    finalColor.assign(mix(finalColor, shapeWithGlow, mask));
    finalColor.addAssign(outerGlow.mul(palette).mul(0.8));
    
    const edgeHighlight = smoothstep(0.02, 0.0, abs(d.add(0.02)));
    finalColor.addAssign(edgeHighlight.mul(0.4));

    const vignette = float(1.0).sub(distFromCenter.mul(0.5));
    finalColor.mulAssign(clamp(vignette, 0.0, 1.0));
    
    finalColor.assign(finalColor.sub(0.5).mul(u_contrast).add(0.5));
    finalColor.addAssign(u_brightness);
    
    const noiseVal = fract(sin(dot(vUv, vec2(12.9898, 78.233))).mul(43758.5453));
    finalColor.addAssign(noiseVal.sub(0.5).mul(u_noise));

    return finalColor;
});
