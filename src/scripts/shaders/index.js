/**
 * Shader Index - Configuración y metadata de todos los shaders disponibles
 */

import vertexShader from '../../shaders/vertex.glsl?raw';
import liquidShader from '../../shaders/liquid.glsl?raw';
import stripesShader from '../../shaders/stripes.glsl?raw';
import wavesShader from '../../shaders/waves.glsl?raw';
import meshShader from '../../shaders/mesh.glsl?raw';
import particlesShader from '../../shaders/particles.glsl?raw';
import auroraShader from '../../shaders/aurora.glsl?raw';
import geometricShader from '../../shaders/geometric.glsl?raw';

export const SHADERS = {
    waves: {
        name: 'Ondas',
        description: 'Ondas sinusoidales superpuestas con movimiento fluido',
        vertex: vertexShader,
        fragment: wavesShader,
        controls: [
            {
                id: 'wave-amplitude',
                label: 'Amplitud',
                uniform: 'u_wave_amplitude',
                min: 0.05,
                max: 0.8,
                step: 0.05,
                value: 0.25
            },
            {
                id: 'wave-frequency',
                label: 'Frecuencia',
                uniform: 'u_wave_frequency',
                min: 0.5,
                max: 8.0,
                step: 0.5,
                value: 2.5
            }
        ]
    },
    
    stripes: {
        name: 'Rayas',
        description: 'Patrones de rayas usando funciones seno y coseno',
        vertex: vertexShader,
        fragment: stripesShader,
        controls: [
            {
                id: 'stripe-width',
                label: 'Frecuencia',
                uniform: 'u_stripe_width',
                min: 2.0,
                max: 30.0,
                step: 1.0,
                value: 8.0
            },
            {
                id: 'stripe-speed',
                label: 'Velocidad Relativa',
                uniform: 'u_stripe_speed',
                min: 0.0,
                max: 2.0,
                step: 0.1,
                value: 0.8
            }
        ]
    },
    
    
    liquid: {
        name: 'Líquido',
        description: 'Efecto líquido con ruido FBM (Fractional Brownian Motion)',
        vertex: vertexShader,
        fragment: liquidShader,
        controls: [
            {
                id: 'zoom',
                label: 'Complejidad',
                uniform: 'u_zoom',
                min: 0.5,
                max: 8.0,
                step: 0.1,
                value: 3.0
            }
        ]
    },
    
    mesh: {
        name: 'Mesh Gradient',
        description: 'Gradiente tipo malla con distorsión procedural',
        vertex: vertexShader,
        fragment: meshShader,
        controls: [
            {
                id: 'mesh-scale',
                label: 'Densidad',
                uniform: 'u_scale',
                min: 0.5,
                max: 4.0,
                step: 0.1,
                value: 1.5
            },
            {
                id: 'mesh-distortion',
                label: 'Distorsión',
                uniform: 'u_distortion',
                min: 0.0,
                max: 0.8,
                step: 0.05,
                value: 0.3
            }
        ]
    },
    
    particles: {
        name: 'Partículas',
        description: 'Sistema de partículas animadas con movimiento ondulatorio',
        vertex: vertexShader,
        fragment: particlesShader,
        controls: [
            {
                id: 'particle-intensity',
                label: 'Brillo',
                uniform: 'u_intensity',
                min: 0.3,
                max: 2.5,
                step: 0.1,
                value: 1.2
            }
        ]
    },
    
    aurora: {
        name: 'Aurora',
        description: 'Efecto de aurora boreal con capas de ruido',
        vertex: vertexShader,
        fragment: auroraShader,
        controls: [
            {
                id: 'aurora-scale',
                label: 'Escala',
                uniform: 'u_scale',
                min: 0.3,
                max: 2.5,
                step: 0.1,
                value: 1.2
            },
            {
                id: 'aurora-intensity',
                label: 'Intensidad',
                uniform: 'u_intensity',
                min: 0.3,
                max: 2.5,
                step: 0.1,
                value: 1.5
            }
        ]
    },
    
    geometric: {
        name: 'Geométrico',
        description: 'Patrones geométricos (hexágonos, cuadrados, triángulos)',
        vertex: vertexShader,
        fragment: geometricShader,
        controls: [
            {
                id: 'geo-scale',
                label: 'Tamaño',
                uniform: 'u_scale',
                min: 2.0,
                max: 8.0,
                step: 0.5,
                value: 4.0
            },
            {
                id: 'geo-rotation',
                label: 'Rotación Base',
                uniform: 'u_rotation',
                min: 0.0,
                max: 6.28,
                step: 0.1,
                value: 0.0
            }
        ]
    }
};
