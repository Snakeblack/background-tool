/**
 * Palettes — presets and a harmonic random generator.
 *
 * Slot convention used by every background: color 1 is the base/deepest tone,
 * colors 2-4 climb towards the highlight. That way any palette works on any
 * background.
 */

/** @type {(en: string, es: string) => { en: string, es: string }} */
const t = (en, es) => ({ en, es });
const P = (l, c, h) => ({ l, c, h });

export const PRESETS = [
    { id: 'sunset', name: t('Sunset', 'Atardecer'), colors: [P(0.38, 0.14, 15), P(0.66, 0.21, 25), P(0.76, 0.17, 350), P(0.9, 0.12, 85)] },
    { id: 'ocean', name: t('Ocean', 'Océano'), colors: [P(0.28, 0.07, 245), P(0.55, 0.15, 235), P(0.72, 0.13, 205), P(0.9, 0.08, 190)] },
    { id: 'forest', name: t('Forest', 'Bosque'), colors: [P(0.26, 0.06, 160), P(0.48, 0.13, 150), P(0.7, 0.16, 135), P(0.9, 0.12, 110)] },
    { id: 'purple', name: t('Ultraviolet', 'Ultravioleta'), colors: [P(0.25, 0.1, 295), P(0.5, 0.24, 295), P(0.68, 0.22, 320), P(0.88, 0.12, 340)] },
    { id: 'neon', name: t('Neon', 'Neón'), colors: [P(0.18, 0.08, 285), P(0.7, 0.27, 340), P(0.85, 0.16, 195), P(0.93, 0.19, 120)] },
    { id: 'fire', name: t('Ember', 'Brasas'), colors: [P(0.2, 0.07, 30), P(0.55, 0.22, 30), P(0.72, 0.19, 55), P(0.93, 0.14, 95)] },
    { id: 'ice', name: t('Ice', 'Hielo'), colors: [P(0.94, 0.03, 235), P(0.82, 0.07, 225), P(0.72, 0.1, 240), P(0.98, 0.02, 220)] },
    { id: 'midnight', name: t('Midnight', 'Medianoche'), colors: [P(0.14, 0.04, 265), P(0.28, 0.1, 275), P(0.42, 0.15, 285), P(0.62, 0.17, 300)] },
    { id: 'candy', name: t('Candy', 'Algodón'), colors: [P(0.96, 0.03, 350), P(0.84, 0.1, 350), P(0.86, 0.09, 200), P(0.9, 0.09, 90)] },
    { id: 'mono', name: t('Mono', 'Mono'), colors: [P(0.12, 0, 0), P(0.35, 0, 0), P(0.62, 0, 0), P(0.95, 0, 0)] },
    { id: 'gold', name: t('Gold', 'Oro'), colors: [P(0.15, 0.02, 80), P(0.45, 0.09, 75), P(0.74, 0.14, 85), P(0.92, 0.1, 95)] },
    { id: 'mint', name: t('Mint', 'Menta'), colors: [P(0.95, 0.03, 170), P(0.84, 0.09, 170), P(0.76, 0.12, 190), P(0.88, 0.12, 140)] },
];

const rand = (min, max) => min + Math.random() * (max - min);
const round = (v, d) => Number(v.toFixed(d));

const HARMONIES = [
    [0, 28, 56],       // analogous
    [0, 24, 180],      // complementary
    [0, 120, 240],     // triadic
    [0, 150, 210],     // split complementary
    [0, 45, 190],      // accent
];

/**
 * Random palette that actually looks designed: a harmony of hues and a
 * lightness ramp (dark base → bright highlight), or its light-mode twin.
 * @returns {Array<{ l: number, c: number, h: number }>}
 */
export function randomPalette() {
    const baseHue = rand(0, 360);
    const offsets = HARMONIES[Math.floor(Math.random() * HARMONIES.length)];
    const hue = (i) => (baseHue + offsets[Math.min(i, offsets.length - 1)] + rand(-8, 8) + 360) % 360;
    const dark = Math.random() < 0.65;

    const slots = dark
        ? [
            P(rand(0.16, 0.3), rand(0.04, 0.1), hue(0)),
            P(rand(0.45, 0.58), rand(0.15, 0.25), hue(1)),
            P(rand(0.62, 0.76), rand(0.14, 0.22), hue(2)),
            P(rand(0.82, 0.94), rand(0.07, 0.15), hue(0) + 20),
        ]
        : [
            P(rand(0.93, 0.97), rand(0.015, 0.04), hue(0)),
            P(rand(0.78, 0.88), rand(0.07, 0.13), hue(1)),
            P(rand(0.7, 0.82), rand(0.1, 0.16), hue(2)),
            P(rand(0.6, 0.72), rand(0.12, 0.2), hue(0) + 20),
        ];

    return slots.map(({ l, c, h }) => ({ l: round(l, 3), c: round(c, 3), h: Math.round(h % 360) }));
}
