/**
 * Background registry — the single source of truth for every background.
 *
 * Adding a background = one TSL file in ./nodes + one entry in ./entries.
 * The same TSL file powers the live preview and the exported code, so
 * what you see is exactly what you ship.
 */

import { t } from './entries/helpers.js';
import { gradients } from './entries/gradients.js';
import { patterns } from './entries/patterns.js';
import { light } from './entries/light.js';
import { space } from './entries/space.js';

/** @typedef {import('./entries/helpers.js').I18nText} I18nText */
/** @typedef {'gradient' | 'pattern' | 'light' | 'space'} Category */
/** @typedef {'light' | 'medium' | 'heavy'} Cost */

/** @type {Array<{ id: Category, label: I18nText }>} */
export const CATEGORIES = [
    { id: 'gradient', label: t('Gradients', 'Degradados') },
    { id: 'pattern', label: t('Patterns', 'Patrones') },
    { id: 'light', label: t('Light', 'Luz') },
    { id: 'space', label: t('Space & Retro', 'Espacio y Retro') },
];

/**
 * @typedef {Object} Background
 * @property {string} id
 * @property {Category} category
 * @property {Cost} cost                 Relative GPU cost (shown in the gallery + used by export tips)
 * @property {number} renderScale        Resolution multiplier (soft backgrounds render below native res)
 * @property {boolean} mouse             Reacts to the pointer
 * @property {number} speed              Default speed, 0..1
 * @property {Array<{l:number,c:number,h:number}>} palette  Default OKLCH palette (4 colors)
 * @property {I18nText} name
 * @property {I18nText} description
 * @property {{ en: string[], es: string[] }} colorLabels
 * @property {Array<Object>} controls
 * @property {Function} main             TSL entry point
 * @property {() => Promise<{ default: string }>} source  Lazy raw source (used by export)
 */

/** @type {Background[]} */
export const BACKGROUNDS = [...gradients, ...patterns, ...light, ...space];

/** @type {Record<string, Background>} */
export const SHADERS = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b]));

export const DEFAULT_BACKGROUND = 'mesh';
