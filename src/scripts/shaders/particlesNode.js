import {
    Fn,
    float,
    vec2,
    vec3,
    vec4,
    uv,
    sin,
    cos,
    dot,
    fract,
    floor,
    length,
    mix,
    smoothstep,
    If,
    int,
    pow,
    max,
    abs,
    min,
    exp
} from 'three/tsl';
import {
    u_resolution,
    u_time,
    u_color1,
    u_color2,
    u_color3,
    u_color4,
    u_speed,
    u_intensity,
    u_brightness,
    u_contrast,
    u_noise
} from './commonUniforms.js';

const hash = Fn(([p]) => {
    return fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453123));
});

const hash2 = Fn(([p]) => {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))).mul(43758.5453));
});

/**
 * Dibuja una capa de partículas con movimiento, titilación y resplandor.
 * Verifica celdas vecinas para evitar artefactos en los bordes.
 */
const particleLayer = Fn(([uvInput, scale, speed, layerIdx]) => {
    const id = floor(uvInput.mul(scale));
    const gv = fract(uvInput.mul(scale)).sub(0.5);
    
    const layerColor = vec3(0.0).toVar();
    
    // Check 3x3 neighbors
    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            const neighbor = vec2(float(x), float(y));
            const nid = id.add(neighbor);
            
            // Random offset for position
            const rand = hash2(nid.add(layerIdx.mul(100.0)));
            
            // Movement
            const t = u_time.mul(u_speed).mul(speed);
            const offset = vec2(
                sin(t.add(rand.x.mul(6.28))),
                cos(t.mul(0.8).add(rand.y.mul(6.28)))
            ).mul(0.4);
            
            // Position relative to current cell center
            const pos = neighbor.add(offset).sub(gv);
            const d = length(pos);
            
            // Twinkle effect
            const twinkle = sin(t.mul(2.0).add(rand.x.mul(10.0))).mul(0.5).add(0.5);
            
            // Particle size and glow
            const size = rand.y.mul(0.05).add(0.05).mul(u_intensity);
            
            // Soft glow: 0.01 / (d * d + 0.001) * size * twinkle
            const glow = float(0.01).div(d.mul(d).add(0.001)).mul(size).mul(twinkle);
            
            // Hard core: smoothstep(size, size * 0.5, d) * twinkle
            const core = smoothstep(size, size.mul(0.5), d).mul(twinkle);
            
            // Color selection
            const pColor = vec3(0.0).toVar();
            const colorMix = rand.x;
            
            If(colorMix.lessThan(0.25), () => {
                pColor.assign(u_color1);
            }).ElseIf(colorMix.lessThan(0.5), () => {
                pColor.assign(u_color2);
            }).ElseIf(colorMix.lessThan(0.75), () => {
                pColor.assign(u_color3);
            }).Else(() => {
                pColor.assign(u_color4);
            });
            
            layerColor.addAssign(pColor.mul(core.add(glow.mul(0.5))));
        }
    }
    
    return layerColor;
});

/**
 * Shader de Partículas con múltiples capas de profundidad y parallax.
 * Genera un campo de partículas brillantes con colores variados, tamaños dinámicos
 * y efectos de titilación. Las capas crean sensación de profundidad.
 * 
 * @returns {TSLNode} Color final RGBA del efecto de partículas
 */
const main = Fn(() => {
    const uvCoords = uv();
    const adjustedUV = vec2(
        uvCoords.x.mul(u_resolution.x.div(u_resolution.y)),
        uvCoords.y
    );
    
    const dist = length(adjustedUV.sub(0.5));
    const bg = mix(u_color1.mul(0.1), u_color4.mul(0.1), dist);
    const color = vec3(bg).toVar();
    
    color.addAssign(particleLayer(adjustedUV, float(8.0), float(0.2), float(1.0)).mul(0.5));
    color.addAssign(particleLayer(adjustedUV.add(vec2(0.1)), float(5.0), float(0.5), float(2.0)));
    color.addAssign(particleLayer(adjustedUV.add(vec2(0.2)), float(3.0), float(0.8), float(3.0)).mul(1.2));
    
    color.assign(color.sub(0.5).mul(u_contrast).add(0.5));
    color.addAssign(u_brightness);
    
    const noiseVal = hash(adjustedUV.mul(u_time)).sub(0.5).mul(u_noise);
    color.addAssign(noiseVal);
    
    return vec4(color, 1.0);
});

export const particlesTSL = main;
