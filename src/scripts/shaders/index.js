/**
 * Shader Index - Configuración y metadata de todos los shaders disponibles
 */

import { Color } from 'three';
import vertexShader from '../../shaders/vertex.glsl?raw';
import liquidShader from '../../shaders/liquid.glsl?raw';
import stripesShader from '../../shaders/stripes.glsl?raw';
import wavesShader from '../../shaders/waves.glsl?raw';
import meshShader from '../../shaders/mesh.glsl?raw';
import particlesShader from '../../shaders/particles.glsl?raw';
import auroraShader from '../../shaders/aurora.glsl?raw';
import cloudsShader from '../../shaders/clouds.glsl?raw';
import flowShader from '../../shaders/flow.glsl?raw';
import geometricShader from '../../shaders/geometric.glsl?raw';
import neonGridShader from '../../shaders/neon_grid.glsl?raw';
import galaxyShader from '../../shaders/galaxy.glsl?raw';
import voronoiShader from '../../shaders/voronoi.glsl?raw';

const GLOBAL_CONTROLS = [
    {
        id: 'brightness',
        label: 'Brillo',
        uniform: 'u_brightness',
        min: -0.5,
        max: 0.5,
        step: 0.05,
        value: 0.0
    },
    {
        id: 'contrast',
        label: 'Contraste',
        uniform: 'u_contrast',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        value: 1.0
    },
    {
        id: 'noise',
        label: 'Ruido',
        uniform: 'u_noise',
        min: 0.0,
        max: 0.5,
        step: 0.01,
        value: 0.0
    }
];

export const SHADERS = {
    waves: {
        name: 'Ondas',
        description: 'Ondas sinusoidales superpuestas con movimiento fluido',
        vertex: vertexShader,
        fragment: wavesShader,
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'wave-amplitude',
                label: 'Amplitud',
                uniform: 'u_wave_amplitude',
                min: 0.05,
                max: 2.5,
                step: 0.05,
                value: 0.4
            },
            {
                id: 'wave-frequency',
                label: 'Frecuencia',
                uniform: 'u_wave_frequency',
                min: 0.1,
                max: 20.0,
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
            ...GLOBAL_CONTROLS,
            {
                id: 'stripe-width',
                label: 'Frecuencia',
                uniform: 'u_stripe_width',
                min: 1.0,
                max: 100.0,
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
            ...GLOBAL_CONTROLS,
            {
                id: 'zoom',
                label: 'Complejidad',
                uniform: 'u_zoom',
                min: 0.1,
                max: 20.0,
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
            ...GLOBAL_CONTROLS,
            {
                id: 'mesh-scale',
                label: 'Densidad',
                uniform: 'u_scale',
                min: 4.0,
                max: 12.0,
                step: 0.1,
                value: 6.0
            },
            {
                id: 'mesh-distortion',
                label: 'Distorsión',
                uniform: 'u_distortion',
                min: 0.5,
                max: 1.5,
                step: 0.05,
                value: 0.6
            }
        ]
    },
    
    particles: {
        name: 'Partículas',
        description: 'Sistema de partículas animadas con movimiento ondulatorio',
        vertex: vertexShader,
        fragment: particlesShader,
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'particle-intensity',
                label: 'Brillo',
                uniform: 'u_intensity',
                min: 0.1,
                max: 5.0,
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
            ...GLOBAL_CONTROLS,
            {
                id: 'aurora-scale',
                label: 'Escala',
                uniform: 'u_scale',
                min: 0.1,
                max: 5.0,
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

    clouds: {
        name: 'Nubes',
        description: 'Cielo con nubes esponjosas y realistas',
        vertex: vertexShader,
        fragment: cloudsShader,
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'cloud-scale',
                label: 'Escala',
                uniform: 'u_scale',
                min: 1.0,
                max: 10.0,
                step: 0.5,
                value: 3.0
            },
            {
                id: 'cloud-intensity',
                label: 'Cobertura',
                uniform: 'u_intensity',
                min: 0.0,
                max: 1.0,
                step: 0.05,
                value: 0.5
            }
        ]
    },

    flow: {
        name: 'Flujo Etéreo',
        description: 'Efecto fluido y onírico estilo Vanta.js',
        vertex: vertexShader,
        fragment: flowShader,
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'flow-scale',
                label: 'Escala',
                uniform: 'u_scale',
                min: 0.5,
                max: 5.0,
                step: 0.1,
                value: 1.5
            },
            {
                id: 'flow-intensity',
                label: 'Densidad',
                uniform: 'u_intensity',
                min: 0.1,
                max: 2.0,
                step: 0.1,
                value: 1.0
            }
        ]
    },
    
    geometric: {
        name: 'Geométrico',
        description: 'Patrones geométricos (hexágonos, cuadrados, triángulos)',
        vertex: vertexShader,
        fragment: geometricShader,
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'geo-scale',
                label: 'Tamaño',
                uniform: 'u_scale',
                min: 1.0,
                max: 20.0,
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
    },

    neon_grid: {
        name: 'Synth Horizon',
        description: 'Rejilla estilo Synthwave/Cyberpunk con perspectiva 3D',
        vertex: vertexShader,
        fragment: neonGridShader,
        defaults: {
            u_color1: new Color(0.12, 0.02, 0.25), // Deep Purple (Sky)
            u_color2: new Color(0.0, 0.9, 1.0),    // Cyan (Grid)
            u_color3: new Color(1.0, 0.6, 0.0),    // Orange (Sun)
            u_color4: new Color(1.0, 0.0, 0.5)     // Pink
        },
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'grid-size',
                label: 'Escala Rejilla',
                uniform: 'u_grid_size',
                min: 0.5,
                max: 20.0,
                step: 0.5,
                value: 3.0
            },
            {
                id: 'grid-glow',
                label: 'Intensidad Brillo',
                uniform: 'u_glow',
                min: 0.1,
                max: 2.0,
                step: 0.1,
                value: 1.0
            },
            {
                id: 'grid-offset-x',
                label: 'Posición X',
                uniform: 'u_offset_x',
                min: -1.0,
                max: 1.0,
                step: 0.05,
                value: 0.0
            },
            {
                id: 'grid-offset-y',
                label: 'Posición Y',
                uniform: 'u_offset_y',
                min: -0.5,
                max: 0.5,
                step: 0.05,
                value: 0.0
            },
            {
                id: 'sun-size',
                label: 'Tamaño Sol',
                uniform: 'u_sun_size',
                min: 0.0,
                max: 1.0,
                step: 0.05,
                value: 0.25
            }
        ]
    },

    galaxy: {
        name: 'Galaxia',
        description: 'Espiral galáctica con estrellas y nebulosas',
        vertex: vertexShader,
        fragment: galaxyShader,
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'spiral-density',
                label: 'Densidad Espiral',
                uniform: 'u_spiral_density',
                min: 0.0,
                max: 20.0,
                step: 0.5,
                value: 15.5
            },
            {
                id: 'star-density',
                label: 'Densidad Estrellas',
                uniform: 'u_star_density',
                min: 0.0,
                max: 100.0,
                step: 1.0,
                value: 24.0
            },
            {
                id: 'core-size',
                label: 'Tamaño Núcleo',
                uniform: 'u_core_size',
                min: 0.1,
                max: 3.0,
                step: 0.1,
                value: 0.4
            }
        ]
    },

    voronoi: {
        name: 'Células',
        description: 'Patrón celular Voronoi orgánico/tecnológico',
        vertex: vertexShader,
        fragment: voronoiShader,
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'cell-density',
                label: 'Densidad Células',
                uniform: 'u_cell_density',
                min: 1.0,
                max: 50.0,
                step: 1.0,
                value: 8.0
            },
            {
                id: 'border-width',
                label: 'Ancho Borde',
                uniform: 'u_border_width',
                min: 0.01,
                max: 0.5,
                step: 0.01,
                value: 0.1
            }
        ]
    }
};
