/**
 * Color Manager — OKLCH state, conversions and palette application.
 *
 * Colors live as OKLCH in the UI and reach the GPU as OKLab, which is what
 * the shaders blend in.
 */

import * as culori from 'culori';
import { PRESETS, randomPalette } from './palettes.js';

/** @typedef {{ l: number, c: number, h: number }} Oklch */

const DEFAULT_COLORS = {
    1: { l: 0.62, c: 0.2, h: 285 },
    2: { l: 0.74, c: 0.18, h: 350 },
    3: { l: 0.82, c: 0.15, h: 60 },
    4: { l: 0.7, c: 0.14, h: 230 },
};

/**
 * OKLCH -> OKLab triple (what the shaders consume).
 * @param {Oklch} color
 * @returns {[number, number, number]}
 */
export function oklchToOklab({ l, c, h }) {
    const rad = (h * Math.PI) / 180;
    return [l, c * Math.cos(rad), c * Math.sin(rad)];
}

export class ColorManager {
    /**
     * @param {import('./ShaderManager.js').ShaderManager} shaderManager
     */
    constructor(shaderManager) {
        this.shaderManager = shaderManager;
        this.colors = structuredClone(DEFAULT_COLORS);
    }

    /**
     * Sets the current colors from an OKLCH map (no JSON parsing involved).
     * @param {{[key: string]: Oklch}|{[key: number]: Oklch}} colorsByIndex
     */
    setColors(colorsByIndex) {
        if (!colorsByIndex || typeof colorsByIndex !== 'object') return;

        for (let i = 1; i <= 4; i++) {
            const src = colorsByIndex[i] || colorsByIndex[String(i)];
            if (!src) continue;
            const { l, c, h } = src;
            if (![l, c, h].every((v) => typeof v === 'number' && Number.isFinite(v))) continue;
            this.updateColor(i, l, c, h);
        }
    }

    /**
     * Applies a 4-color OKLCH palette.
     * @param {Oklch[]} palette
     */
    setPalette(palette) {
        palette.slice(0, 4).forEach((color, index) => {
            this.updateColor(index + 1, color.l, color.c, color.h);
        });
    }

    /** @param {string} id Preset id @returns {boolean} */
    setPreset(id) {
        const preset = PRESETS.find((p) => p.id === id);
        if (!preset) return false;
        this.setPalette(preset.colors);
        return true;
    }

    /** Applies a freshly generated harmonic palette. */
    randomize() {
        this.setPalette(randomPalette());
    }

    /**
     * Updates one color and pushes it to the shader.
     * @returns {string} Hex preview
     */
    updateColor(colorIndex, l, c, h) {
        this.colors[colorIndex] = { l, c, h };
        this.shaderManager.setColorOklab(colorIndex, oklchToOklab({ l, c, h }));
        return this.oklchToHex({ l, c, h });
    }

    /** @param {Oklch} oklch @returns {string} */
    oklchToHex({ l, c, h }) {
        return culori.formatHex({ mode: 'oklch', l, c, h });
    }

    /** @param {number} colorIndex 1..4 @returns {Oklch} */
    getColor(colorIndex) {
        return this.colors[colorIndex];
    }
}
