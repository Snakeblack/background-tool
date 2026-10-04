/** Small builders shared by the registry entries. */

/** @typedef {{ en: string, es: string }} I18nText */

/** @type {(en: string, es: string) => I18nText} */
export const t = (en, es) => ({ en, es });

/** OKLCH color literal. */
export const P = (l, c, h) => ({ l, c, h });

/**
 * Slider control.
 * @param {string} id        DOM id + i18n key (must be unique per background)
 * @param {string} uniform   Uniform name in commonUniforms.js
 * @param {[number, number, number, number]} range [min, max, step, default]
 * @param {I18nText} label
 * @param {I18nText} tooltip
 */
export const slider = (id, uniform, [min, max, step, value], label, tooltip) => ({
    id, uniform, min, max, step, value, i18n: { label, tooltip },
});

/** Global finishing controls shared by every background. */
export const globals = ({ noise = 0, contrast = 1, brightness = 0 } = {}) => [
    slider('brightness', 'u_brightness', [-0.5, 0.5, 0.05, brightness],
        t('Brightness', 'Brillo'), t('Adjusts the overall lightness of the scene.', 'Ajusta la luminosidad general de la escena.')),
    slider('contrast', 'u_contrast', [0.5, 2.0, 0.05, contrast],
        t('Contrast', 'Contraste'), t('Controls the difference between light and dark areas.', 'Controla la diferencia entre zonas claras y oscuras.')),
    slider('noise', 'u_noise', [0, 0.5, 0.01, noise],
        t('Grain', 'Grano'), t('Adds film grain for a more organic, printed look.', 'Agrega grano de película para un acabado más orgánico.')),
];
