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

// TSL Source Imports
import liquidNode from './liquidNode.js?raw';
import stripesNode from './stripesNode.js?raw';
import wavesNode from './wavesNode.js?raw';
import meshNode from './meshNode.js?raw';
import particlesNode from './particlesNode.js?raw';
import auroraNode from './auroraNode.js?raw';
import cloudsNode from './cloudsNode.js?raw';
import flowNode from './flowNode.js?raw';
import geometricNode from './geometricNode.js?raw';
import neonGridNode from './neonGridNode.js?raw';
import galaxyNode from './galaxyNode.js?raw';
import voronoiNode from './voronoiNode.js?raw';

const GLOBAL_CONTROLS = [
    {
        id: 'brightness',
        label: 'Brightness',
        tooltip: 'Adjusts the overall lightness of the scene.',
        uniform: 'u_brightness',
        min: -0.5,
        max: 0.5,
        step: 0.05,
        value: 0.0
    },
    {
        id: 'contrast',
        label: 'Contrast',
        tooltip: 'Controls the difference between light and dark areas.',
        uniform: 'u_contrast',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        value: 1.0
    },
    {
        id: 'noise',
        label: 'Noise',
        tooltip: 'Adds grain texture for a more organic look.',
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
        tslSource: wavesNode,
        colorLabels: ['Wave 1', 'Wave 2', 'Wave 3', 'Background'],
        defaults: {
            u_color1: new Color(0.8, 0.0, 0.4),    // Deep Magenta
            u_color2: new Color(0.0, 0.6, 0.8),    // Deep Cyan
            u_color3: new Color(0.5, 0.0, 0.8),    // Deep Violet
            u_color4: new Color(0.05, 0.0, 0.1)    // Very Dark Purple
        },
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'wave-amplitude',
                label: 'Amplitude',
                tooltip: 'Controls the height of the waves.',
                uniform: 'u_wave_amplitude',
                min: 0.05,
                max: 2.5,
                step: 0.05,
                value: 1.2
            },
            {
                id: 'wave-frequency',
                label: 'Frequency',
                tooltip: 'Adjusts the number of waves visible.',
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
        tslSource: stripesNode,
        colorLabels: ['Color 1', 'Color 2', 'Color 3', 'Color 4'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'stripe-width',
                label: 'Density',
                tooltip: 'Controls the number of stripes.',
                uniform: 'u_stripe_width',
                min: 1.0,
                max: 100.0,
                step: 1.0,
                value: 8.0
            },
            {
                id: 'stripe-speed',
                label: 'Relative Speed',
                tooltip: 'Adjusts how fast stripes move relative to each other.',
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
        tslSource: liquidNode,
        colorLabels: ['Color A', 'Color B', 'Color C', 'Background'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'zoom',
                label: 'Complexity',
                tooltip: 'Controls the detail level of the fluid distortion.',
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
        tslSource: meshNode,
        colorLabels: ['Color 1', 'Color 2', 'Color 3', 'Color 4'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'mesh-scale',
                label: 'Density',
                tooltip: 'Adjusts the grid tightness of the mesh.',
                uniform: 'u_scale',
                min: 4.0,
                max: 12.0,
                step: 0.1,
                value: 6.0
            },
            {
                id: 'mesh-distortion',
                label: 'Distortion',
                tooltip: 'Controls the amount of warping applied to the mesh.',
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
        tslSource: particlesNode,
        colorLabels: ['Background', 'Particles 1', 'Particles 2', 'Glow'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'particle-intensity',
                label: 'Intensity',
                tooltip: 'Controls the brightness and visibility of particles.',
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
        tslSource: auroraNode,
        colorLabels: ['Sky', 'Horizon', 'Aurora 1', 'Aurora 2'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'aurora-scale',
                label: 'Scale',
                tooltip: 'Adjusts the size of the aurora curtains.',
                uniform: 'u_scale',
                min: 0.1,
                max: 5.0,
                step: 0.1,
                value: 1.2
            },
            {
                id: 'aurora-intensity',
                label: 'Intensity',
                tooltip: 'Controls the brightness of the aurora effect.',
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
        tslSource: cloudsNode,
        colorLabels: ['Sky', 'Clouds 1', 'Clouds 2', 'Sun'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'cloud-scale',
                label: 'Scale',
                tooltip: 'Adjusts the size and fluffiness of clouds.',
                uniform: 'u_scale',
                min: 1.0,
                max: 10.0,
                step: 0.5,
                value: 3.0
            },
            {
                id: 'cloud-intensity',
                label: 'Coverage',
                tooltip: 'Controls the amount of sky covered by clouds.',
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
        tslSource: flowNode,
        colorLabels: ['Color 1', 'Color 2', 'Color 3', 'Background'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'flow-scale',
                label: 'Scale',
                tooltip: 'Adjusts the size of the flow patterns.',
                uniform: 'u_scale',
                min: 0.5,
                max: 5.0,
                step: 0.1,
                value: 1.5
            },
            {
                id: 'flow-intensity',
                label: 'Density',
                tooltip: 'Controls the compactness of the flow lines.',
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
        tslSource: geometricNode,
        colorLabels: ['Shapes 1', 'Shapes 2', 'Background 1', 'Background 2'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'geo-scale',
                label: 'Scale',
                tooltip: 'Adjusts the size of the geometric shapes.',
                uniform: 'u_scale',
                min: 1.0,
                max: 20.0,
                step: 0.5,
                value: 4.0
            },
            {
                id: 'geo-rotation',
                label: 'Base Rotation',
                tooltip: 'Controls the initial rotation angle of shapes.',
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
        tslSource: neonGridNode,
        colorLabels: ['Sky', 'Grid', 'Sun', 'Glow'],
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
                label: 'Grid Scale',
                tooltip: 'Adjusts the size of the grid squares.',
                uniform: 'u_grid_size',
                min: 0.5,
                max: 20.0,
                step: 0.5,
                value: 3.0
            },
            {
                id: 'grid-glow',
                label: 'Glow Intensity',
                tooltip: 'Controls the brightness of the neon glow.',
                uniform: 'u_glow',
                min: 0.1,
                max: 2.0,
                step: 0.1,
                value: 1.0
            },
            {
                id: 'grid-offset-x',
                label: 'Offset X',
                tooltip: 'Shifts the grid horizontally.',
                uniform: 'u_offset_x',
                min: -1.0,
                max: 1.0,
                step: 0.05,
                value: 0.0
            },
            {
                id: 'grid-offset-y',
                label: 'Offset Y',
                tooltip: 'Shifts the grid vertically.',
                uniform: 'u_offset_y',
                min: -0.5,
                max: 0.5,
                step: 0.05,
                value: 0.0
            },
            {
                id: 'sun-size',
                label: 'Sun Size',
                tooltip: 'Controls the size of the sun on the horizon.',
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
        tslSource: galaxyNode,
        colorLabels: ['Core', 'Arms', 'Nebula', 'Stars'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'spiral-density',
                label: 'Spiral Density',
                tooltip: 'Controls the tightness of the spiral arms.',
                uniform: 'u_spiral_density',
                min: 0.0,
                max: 20.0,
                step: 0.5,
                value: 15.5
            },
            {
                id: 'star-density',
                label: 'Star Density',
                tooltip: 'Adjusts the number of stars in the background.',
                uniform: 'u_star_density',
                min: 0.0,
                max: 100.0,
                step: 1.0,
                value: 24.0
            },
            {
                id: 'core-size',
                label: 'Core Size',
                tooltip: 'Controls the size of the galactic core.',
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
        tslSource: voronoiNode,
        colorLabels: ['Cells 1', 'Cells 2', 'Borders', 'Background'],
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'cell-density',
                label: 'Cell Density',
                tooltip: 'Controls the number of cells in the pattern.',
                uniform: 'u_cell_density',
                min: 1.0,
                max: 50.0,
                step: 1.0,
                value: 8.0
            },
            {
                id: 'border-width',
                label: 'Border Width',
                tooltip: 'Adjusts the thickness of cell borders.',
                uniform: 'u_border_width',
                min: 0.01,
                max: 0.5,
                step: 0.01,
                value: 0.1
            }
        ]
    }
};
