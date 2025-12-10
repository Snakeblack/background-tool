import { 
    float, vec2, vec3, vec4,
    sin, cos, dot, fract, floor, mix, smoothstep, length, atan2, exp, pow,
    uv, Fn, Loop, If
} from 'three/tsl';
import {
    u_time, u_resolution, u_color1, u_color2, u_color3,
    u_speed, u_spiral_density, u_star_density, u_core_size,
    u_brightness, u_contrast, u_noise
} from './commonUniforms.js';

/**
 * Matriz de rotación 2D para efectos espirales.
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

const hash = Fn(([p]) => {
    return fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453));
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
 * Shader de Galaxia Espiral con estrellas titilantes, brazos espirales y núcleo brillante.
 * Simula una galaxia con rotación, profundidad y efectos de nebulosa.
 * 
 * @returns {TSLNode} Color final RGB de la galaxia
 */
export const galaxyTSL = Fn(() => {
    const vUv = uv();
    const p = vec2(vUv).sub(0.5).toVar();
    p.x.mulAssign(u_resolution.x.div(u_resolution.y));
    
    const t = u_time.mul(u_speed).mul(0.2);
    const stars = float(0.0).toVar();
    
    const starHash = hash(p.mul(150.0));
    const starThreshold = float(1.0).sub(u_star_density.mul(0.0008));
    
    If(starHash.greaterThan(starThreshold), () => {
        const twinkle = sin(t.mul(15.0).add(hash(p).mul(100.0))).mul(0.5).add(0.5);
        stars.addAssign(twinkle.mul(0.6));
    });

    const starHash2 = hash(p.mul(50.0).add(12.34));
    const starThreshold2 = float(1.0).sub(u_star_density.mul(0.0002));

    If(starHash2.greaterThan(starThreshold2), () => {
        const twinkle = sin(t.mul(5.0).add(hash(p.add(1.0)).mul(50.0))).mul(0.5).add(0.5);
        stars.addAssign(twinkle.mul(1.0));
    });
    
    const rotate = rot(t.mul(0.5));
    const gv = rotate(p).toVar();
    const r = length(gv);
    const a = atan2(gv.y, gv.x);
    const angleOffset = r.mul(u_spiral_density);
    const spiral = sin(a.mul(2.0).add(angleOffset).sub(t.mul(2.0))).toVar();
    
    const n = fbm(gv.mul(5.0).add(vec2(t, t.negate())));
    spiral.addAssign(n.mul(0.5));
    
    const armMask = smoothstep(-0.2, 0.5, spiral).mul(smoothstep(1.0, 0.2, spiral)).toVar();
    armMask.mulAssign(smoothstep(0.1, 0.3, r).mul(smoothstep(1.2, 0.5, r)));
    
    const core = exp(r.mul(-4.0).div(u_core_size));
    const coreGlow = exp(r.mul(-1.5).div(u_core_size)).mul(0.5);
    
    const col = u_color1.mul(0.05).toVar();
    col.addAssign(vec3(stars).mul(float(1.0).sub(core)));
    
    const armColor = mix(u_color2, u_color3, n.add(0.2));
    col.addAssign(armColor.mul(armMask));
    
    col.addAssign(u_color3.mul(core).mul(2.5));
    col.addAssign(u_color2.mul(coreGlow).mul(0.8));
    
    const dust = fbm(gv.mul(8.0).add(vec2(t.mul(0.5))));
    col.mulAssign(float(1.0).sub(dust.mul(armMask).mul(0.6)));
    
    const finalCol = pow(col, vec3(1.2)).toVar();
    finalCol.assign(finalCol.sub(0.5).mul(u_contrast).add(0.5));
    finalCol.addAssign(u_brightness);
    
    const noiseVal = hash(p.add(t)).sub(0.5).mul(u_noise);
    finalCol.addAssign(noiseVal);
    
    return finalCol;
});
