import {
    Fn,
    float,
    vec2,
    vec3,
    uv,
    sin,
    dot,
    fract,
    floor,
    length,
    mix,
    pow,
    max,
    min,
    abs,
    smoothstep,
    If,
    int
} from 'three/tsl';
import {
    u_resolution,
    u_time,
    u_color1,
    u_color2,
    u_color3,
    u_color4,
    u_speed,
    u_cell_density,
    u_border_width,
    u_brightness,
    u_contrast,
    u_noise
} from './commonUniforms.js';

/**
 * Mínimo suavizado (smooth minimum) para transiciones orgánicas.
 */
const smin = Fn(([a, b, k]) => {
    const h = max(k.sub(abs(a.sub(b))), 0.0).div(k);
    return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
});

const hash2 = Fn(([p]) => {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))).mul(43758.5453));
});

/**
 * Shader de Diagrama de Voronoi con animación orgánica y resplandor suave.
 * Genera celdas de Voronoi con colores dinámicos, bordes suavizados y efectos
 * de iluminación que crean una apariencia biológica o celular.
 * 
 * @returns {TSLNode} Color final RGB del efecto Voronoi
 */
const main = Fn(() => {
    const uvCoords = uv();
    const adjustedUV = vec2(
        uvCoords.x.mul(u_resolution.x.div(u_resolution.y)),
        uvCoords.y
    );
    
    const t = u_time.mul(u_speed).mul(0.5);
    const st = adjustedUV.mul(u_cell_density);
    const i_st = floor(st);
    const f_st = fract(st);
    
    const m_dist = float(1.0).toVar();
    const s_dist = float(1.0).toVar();
    const m_id = vec2(0.0).toVar();
    
    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            const neighbor = vec2(float(x), float(y));
            const id = i_st.add(neighbor);
            const point = hash2(id).toVar();
            point.assign(sin(t.add(point.mul(6.2831))).mul(0.5).add(0.5));
            
            const diff = neighbor.add(point).sub(f_st);
            const dist = length(diff);
            
            If(dist.lessThan(m_dist), () => {
                m_dist.assign(dist);
                m_id.assign(id);
            });
            
            s_dist.assign(smin(s_dist, dist, 0.25));
        }
    }
    
    const rand = hash2(m_id);
    const col = vec3(0.0).toVar();
    const mixVal = rand.x;
    
    If(mixVal.lessThan(0.33), () => {
        col.assign(u_color1);
    }).ElseIf(mixVal.lessThan(0.66), () => {
        col.assign(u_color2);
    }).Else(() => {
        col.assign(u_color3);
    });
    
    const light = float(1.0).sub(s_dist).toVar();
    
    const tightness = u_border_width.mul(8.0).add(1.0); 
    light.assign(pow(max(0.0, light), tightness));
    
    const highlight = smoothstep(0.05, 0.0, abs(s_dist.sub(0.1)));
    const finalColor = vec3(mix(u_color4, col, light)).toVar();
    finalColor.addAssign(highlight.mul(0.3));
    
    const pulse = sin(t.mul(2.0).add(rand.y.mul(10.0))).mul(0.15).add(0.85);
    finalColor.mulAssign(pulse);
    
    finalColor.assign(finalColor.sub(0.5).mul(u_contrast).add(0.5));
    finalColor.addAssign(u_brightness);
    
    const noise = hash2(uvCoords.add(t)).x.sub(0.5).mul(u_noise);
    finalColor.addAssign(noise);
    
    return finalColor;
});

export const voronoiTSL = main;
