import { t, P, slider, globals } from './helpers.js';
import { main as spotlight } from '../nodes/spotlight.js';
import { main as beams } from '../nodes/beams.js';
import { main as clouds } from '../nodes/clouds.js';
import { main as caustics } from '../nodes/caustics.js';

/** @type {import('../registry.js').Background[]} */
export const light = [
    {
        id: 'spotlight',
        category: 'light',
        cost: 'light',
        renderScale: 0.6,
        mouse: true,
        speed: 0.5,
        palette: [P(0.12, 0.03, 270), P(0.22, 0.07, 275), P(0.7, 0.12, 250), P(0.97, 0.03, 95)],
        name: t('Spotlight', 'Foco de luz'),
        description: t(
            'A volumetric cone of light with drifting dust, aimed at your pointer.',
            'Un cono de luz volumétrico con polvo en suspensión, que apunta a tu puntero.',
        ),
        colorLabels: { en: ['Darkness', 'Ambient', 'Beam', 'Beam core'], es: ['Oscuridad', 'Ambiente', 'Haz', 'Núcleo del haz'] },
        controls: [
            ...globals({ noise: 0.04 }),
            slider('spot-intensity', 'u_intensity', [0.3, 2.0, 0.05, 1.0],
                t('Intensity', 'Intensidad'), t('Brightness of the beam.', 'Brillo del haz.')),
            slider('spot-cone', 'u_spread', [0.3, 2.0, 0.05, 1.0],
                t('Cone', 'Cono'), t('Width of the light cone.', 'Ancho del cono de luz.')),
            slider('spot-softness', 'u_softness', [0, 1, 0.05, 0.5],
                t('Softness', 'Suavidad'), t('How soft the edges of the cone are.', 'Qué tan suaves son los bordes del cono.')),
        ],
        main: spotlight,
        source: () => import('../nodes/spotlight.js?raw'),
    },
    {
        id: 'beams',
        category: 'light',
        cost: 'medium',
        renderScale: 0.6,
        mouse: false,
        speed: 0.5,
        palette: [P(0.14, 0.05, 270), P(0.5, 0.2, 290), P(0.75, 0.17, 330), P(0.93, 0.1, 80)],
        name: t('Light Beams', 'Rayos de luz'),
        description: t(
            'Seven soft rays fanning out from above, swaying and pulsing through a haze.',
            'Siete rayos suaves que se abren desde arriba, ondulando y pulsando entre la neblina.',
        ),
        colorLabels: { en: ['Darkness', 'Ray 1', 'Ray 2', 'Source glow'], es: ['Oscuridad', 'Rayo 1', 'Rayo 2', 'Brillo de origen'] },
        controls: [
            ...globals({ noise: 0.04 }),
            slider('beams-intensity', 'u_intensity', [0.3, 2.0, 0.05, 1.0],
                t('Intensity', 'Intensidad'), t('Brightness of the rays.', 'Brillo de los rayos.')),
            slider('beams-spread', 'u_spread', [0.4, 2.0, 0.05, 1.0],
                t('Spread', 'Apertura'), t('How wide the rays fan out.', 'Cuánto se abren los rayos.')),
            slider('beams-width', 'u_density', [0, 1, 0.05, 0.5],
                t('Width', 'Grosor'), t('Thickness of each ray.', 'Grosor de cada rayo.')),
        ],
        main: beams,
        source: () => import('../nodes/beams.js?raw'),
    },
    {
        id: 'clouds',
        category: 'light',
        cost: 'heavy',
        renderScale: 0.5,
        mouse: false,
        speed: 0.4,
        palette: [P(0.62, 0.12, 245), P(0.86, 0.06, 235), P(0.98, 0.012, 80), P(0.93, 0.12, 70)],
        name: t('Dream Flight', 'Vuelo entre nubes'),
        description: t(
            'Soft sky with a low sun and fractal clouds lit from the sun side.',
            'Cielo suave con un sol bajo y nubes fractales iluminadas desde el lado del sol.',
        ),
        colorLabels: { en: ['Zenith', 'Horizon', 'Cloud light', 'Sun'], es: ['Cenit', 'Horizonte', 'Luz de nubes', 'Sol'] },
        controls: [
            ...globals({ noise: 0.03 }),
            slider('clouds-scale', 'u_scale', [0.5, 2.5, 0.05, 1.0],
                t('Scale', 'Escala'), t('Size of the clouds.', 'Tamaño de las nubes.')),
            slider('clouds-coverage', 'u_intensity', [0, 1, 0.05, 0.5],
                t('Coverage', 'Cobertura'), t('How much of the sky the clouds cover.', 'Cuánto cielo cubren las nubes.')),
        ],
        main: clouds,
        source: () => import('../nodes/clouds.js?raw'),
    },
    {
        id: 'caustics',
        category: 'light',
        cost: 'light',
        renderScale: 0.7,
        mouse: false,
        speed: 0.5,
        palette: [P(0.2, 0.07, 235), P(0.5, 0.12, 215), P(0.82, 0.1, 195), P(0.98, 0.03, 190)],
        name: t('Water Caustics', 'Cáusticas de agua'),
        description: t(
            'The shimmering net of light on a pool floor.',
            'La red de luz titilante en el fondo de una piscina.',
        ),
        colorLabels: { en: ['Deep water', 'Surface', 'Light', 'Sparkle'], es: ['Agua profunda', 'Superficie', 'Luz', 'Destello'] },
        controls: [
            ...globals({ noise: 0.03 }),
            slider('caustics-scale', 'u_scale', [0.5, 2.5, 0.05, 1.0],
                t('Scale', 'Escala'), t('Size of the light net.', 'Tamaño de la red de luz.')),
            slider('caustics-intensity', 'u_intensity', [0.3, 2.0, 0.05, 1.0],
                t('Intensity', 'Intensidad'), t('Brightness of the caustic lines.', 'Brillo de las líneas cáusticas.')),
        ],
        main: caustics,
        source: () => import('../nodes/caustics.js?raw'),
    },
];
