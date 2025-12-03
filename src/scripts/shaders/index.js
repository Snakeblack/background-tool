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
        tooltip:
            'Ajusta la luminosidad general de la imagen. Valores negativos oscurecen, valores positivos iluminan.',
        uniform: 'u_brightness',
        min: -0.5,
        max: 0.5,
        step: 0.05,
        value: 0.0,
    },
    {
        id: 'contrast',
        label: 'Contraste',
        tooltip:
            'Controla la diferencia entre colores claros y oscuros. Valores más altos aumentan la intensidad de los colores.',
        uniform: 'u_contrast',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        value: 1.0,
    },
    {
        id: 'noise',
        label: 'Grano de Textura',
        tooltip:
            'Añade un efecto de textura granulada similar a película analógica. Aumenta el realismo visual.',
        uniform: 'u_noise',
        min: 0.0,
        max: 0.5,
        step: 0.01,
        value: 0.0,
    },
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
                label: 'Altura de Ondas',
                tooltip:
                    'Controla qué tan pronunciadas son las ondas. Valores más altos crean ondas más dramáticas y visibles.',
                uniform: 'u_wave_amplitude',
                min: 0.05,
                max: 2.5,
                step: 0.05,
                value: 0.4,
            },
            {
                id: 'wave-frequency',
                label: 'Cantidad de Ondas',
                tooltip:
                    'Define cuántas ondas aparecen en la pantalla. Valores bajos crean ondas amplias, valores altos crean patrones más densos.',
                uniform: 'u_wave_frequency',
                min: 0.1,
                max: 20.0,
                step: 0.5,
                value: 2.5,
            },
        ],
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
                label: 'Densidad de Rayas',
                tooltip:
                    'Determina cuántas rayas aparecen en la pantalla. Valores bajos crean rayas anchas, valores altos crean rayas delgadas y numerosas.',
                uniform: 'u_stripe_width',
                min: 1.0,
                max: 100.0,
                step: 1.0,
                value: 8.0,
            },
            {
                id: 'stripe-speed',
                label: 'Velocidad de Animación',
                tooltip:
                    'Controla qué tan rápido se mueven las rayas independientemente de la velocidad global. 0 las detiene completamente.',
                uniform: 'u_stripe_speed',
                min: 0.0,
                max: 2.0,
                step: 0.1,
                value: 0.8,
            },
        ],
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
                label: 'Nivel de Detalle',
                tooltip:
                    'Ajusta la escala y complejidad del patrón líquido. Valores bajos muestran formas grandes, valores altos revelan más detalles.',
                uniform: 'u_zoom',
                min: 0.1,
                max: 20.0,
                step: 0.1,
                value: 3.0,
            },
        ],
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
                label: 'Densidad de Malla',
                tooltip:
                    'Controla la cantidad de puntos de color en la malla. Valores más altos crean transiciones más frecuentes entre colores.',
                uniform: 'u_scale',
                min: 4.0,
                max: 12.0,
                step: 0.1,
                value: 6.0,
            },
            {
                id: 'mesh-distortion',
                label: 'Deformación Orgánica',
                tooltip:
                    'Añade ondulación y movimiento a los puntos de la malla. Valores más altos crean formas más fluidas e impredecibles.',
                uniform: 'u_distortion',
                min: 0.5,
                max: 1.5,
                step: 0.05,
                value: 0.6,
            },
        ],
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
                label: 'Brillo de Partículas',
                tooltip:
                    'Ajusta la luminosidad e intensidad de las partículas individuales. Valores más altos crean un efecto más brillante y visible.',
                uniform: 'u_intensity',
                min: 0.1,
                max: 5.0,
                step: 0.1,
                value: 1.2,
            },
        ],
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
                label: 'Tamaño de Ondas',
                tooltip:
                    'Define el tamaño de las ondas de luz de la aurora. Valores pequeños crean ondas más amplias y suaves.',
                uniform: 'u_scale',
                min: 0.1,
                max: 5.0,
                step: 0.1,
                value: 1.2,
            },
            {
                id: 'aurora-intensity',
                label: 'Intensidad Lumínica',
                tooltip:
                    'Controla qué tan brillante y visible es la aurora. Valores más altos crean un efecto más vibrante e intenso.',
                uniform: 'u_intensity',
                min: 0.3,
                max: 2.5,
                step: 0.1,
                value: 1.5,
            },
        ],
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
                label: 'Tamaño de Nubes',
                tooltip:
                    'Ajusta el tamaño de las formaciones de nubes. Valores bajos crean nubes grandes, valores altos crean nubes pequeñas y dispersas.',
                uniform: 'u_scale',
                min: 1.0,
                max: 10.0,
                step: 0.5,
                value: 3.0,
            },
            {
                id: 'cloud-intensity',
                label: 'Densidad de Nubes',
                tooltip:
                    'Controla cuánto del cielo está cubierto por nubes. 0 es cielo despejado, 1 es completamente nublado.',
                uniform: 'u_intensity',
                min: 0.0,
                max: 1.0,
                step: 0.05,
                value: 0.5,
            },
        ],
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
                label: 'Tamaño de Flujo',
                tooltip:
                    'Define el tamaño de los patrones de flujo. Valores pequeños crean corrientes amplias, valores grandes crean detalles finos.',
                uniform: 'u_scale',
                min: 0.5,
                max: 5.0,
                step: 0.1,
                value: 1.5,
            },
            {
                id: 'flow-intensity',
                label: 'Profundidad Visual',
                tooltip:
                    'Controla la intensidad del efecto de profundidad. Valores más altos crean capas más definidas y un efecto más tridimensional.',
                uniform: 'u_intensity',
                min: 0.1,
                max: 2.0,
                step: 0.1,
                value: 1.0,
            },
        ],
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
                label: 'Tamaño de Formas',
                tooltip:
                    'Ajusta el tamaño de las formas geométricas. Valores pequeños crean formas grandes, valores grandes crean un mosaico denso.',
                uniform: 'u_scale',
                min: 1.0,
                max: 20.0,
                step: 0.5,
                value: 4.0,
            },
            {
                id: 'geo-rotation',
                label: 'Ángulo de Rotación',
                tooltip:
                    'Rota el patrón geométrico completo. El valor está en radianes (6.28 = 360 grados = vuelta completa).',
                uniform: 'u_rotation',
                min: 0.0,
                max: 6.28,
                step: 0.1,
                value: 0.0,
            },
        ],
    },

    neon_grid: {
        name: 'Synth Horizon',
        description: 'Rejilla estilo Synthwave/Cyberpunk con perspectiva 3D',
        vertex: vertexShader,
        fragment: neonGridShader,
        defaults: {
            u_color1: new Color(0.12, 0.02, 0.25), // Deep Purple (Sky)
            u_color2: new Color(0.0, 0.9, 1.0), // Cyan (Grid)
            u_color3: new Color(1.0, 0.6, 0.0), // Orange (Sun)
            u_color4: new Color(1.0, 0.0, 0.5), // Pink
        },
        controls: [
            ...GLOBAL_CONTROLS,
            {
                id: 'grid-size',
                label: 'Tamaño de Cuadrícula',
                tooltip:
                    'Ajusta el tamaño de las celdas de la rejilla 3D. Valores más altos crean cuadrículas más finas y detalladas.',
                uniform: 'u_grid_size',
                min: 0.5,
                max: 20.0,
                step: 0.5,
                value: 3.0,
            },
            {
                id: 'grid-glow',
                label: 'Brillo Neón',
                tooltip:
                    'Controla la intensidad del efecto de brillo neón en las líneas de la rejilla. Valores más altos crean un aspecto más luminoso.',
                uniform: 'u_glow',
                min: 0.1,
                max: 2.0,
                step: 0.1,
                value: 1.0,
            },
            {
                id: 'grid-offset-x',
                label: 'Desplazamiento Horizontal',
                tooltip:
                    'Mueve la rejilla horizontalmente. Útil para ajustar la composición y centrar el punto de fuga.',
                uniform: 'u_offset_x',
                min: -1.0,
                max: 1.0,
                step: 0.05,
                value: 0.0,
            },
            {
                id: 'grid-offset-y',
                label: 'Altura de Horizonte',
                tooltip:
                    'Ajusta la altura del horizonte en la escena. Valores negativos bajan el horizonte, positivos lo suben.',
                uniform: 'u_offset_y',
                min: -0.5,
                max: 0.5,
                step: 0.05,
                value: 0.0,
            },
            {
                id: 'sun-size',
                label: 'Tamaño del Sol',
                tooltip:
                    'Controla el tamaño del sol en el horizonte. En 0 el sol desaparece completamente.',
                uniform: 'u_sun_size',
                min: 0.0,
                max: 1.0,
                step: 0.05,
                value: 0.25,
            },
        ],
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
                label: 'Brazos Espirales',
                tooltip:
                    'Controla la cantidad y densidad de los brazos espirales de la galaxia. Valores más altos crean espirales más apretadas y definidas.',
                uniform: 'u_spiral_density',
                min: 0.0,
                max: 20.0,
                step: 0.5,
                value: 15.5,
            },
            {
                id: 'star-density',
                label: 'Cantidad de Estrellas',
                tooltip:
                    'Define cuántas estrellas aparecen dispersas por la galaxia. Valores más altos crean un cielo más poblado.',
                uniform: 'u_star_density',
                min: 0.0,
                max: 100.0,
                step: 1.0,
                value: 24.0,
            },
            {
                id: 'core-size',
                label: 'Tamaño del Núcleo',
                tooltip:
                    'Ajusta el tamaño del núcleo brillante en el centro de la galaxia. Valores más grandes crean un centro más luminoso.',
                uniform: 'u_core_size',
                min: 0.1,
                max: 3.0,
                step: 0.1,
                value: 0.4,
            },
        ],
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
                label: 'Cantidad de Células',
                tooltip:
                    'Define cuántas células aparecen en el patrón. Valores bajos crean células grandes, valores altos crean un patrón celular más denso.',
                uniform: 'u_cell_density',
                min: 1.0,
                max: 50.0,
                step: 1.0,
                value: 8.0,
            },
            {
                id: 'border-width',
                label: 'Grosor de Bordes',
                tooltip:
                    'Controla el grosor de las líneas que separan las células. Valores más altos hacen los bordes más visibles y pronunciados.',
                uniform: 'u_border_width',
                min: 0.01,
                max: 0.5,
                step: 0.01,
                value: 0.1,
            },
        ],
    },
};
