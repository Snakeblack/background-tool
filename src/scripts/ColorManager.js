/**
 * Color Manager - Gestiona conversiones OKLCH y actualización de colores
 */

import * as THREE from 'three';
import * as culori from 'culori';

export class ColorManager {
    /**
     * Constructor del gestor de colores
     * @param {ShaderManager} shaderManager - Instancia del gestor de shaders
     */
    constructor(shaderManager) {
        this.shaderManager = shaderManager;
        this.culori = culori;

        this.colors = {
            1: { l: 0.7, c: 0.25, h: 330 },
            2: { l: 0.6, c: 0.3, h: 280 },
            3: { l: 0.8, c: 0.2, h: 150 },
            4: { l: 0.65, c: 0.28, h: 60 },
        };
    }

    /**
     * Convierte un color OKLCH a THREE.Color
     * @param {{ l: number, c: number, h: number }} oklch - Color en formato OKLCH
     * @returns {THREE.Color} Color en formato Three.js
     */
    oklchToThreeColor(oklch) {
        const rgb = this.culori.rgb({
            mode: 'oklch',
            l: oklch.l,
            c: oklch.c,
            h: oklch.h,
        });
        return new THREE.Color(rgb.r, rgb.g, rgb.b);
    }

    /**
     * Convierte un color OKLCH a formato hexadecimal
     * @param {{ l: number, c: number, h: number }} oklch - Color en formato OKLCH
     * @returns {string} Color en formato hexadecimal
     */
    oklchToHex(oklch) {
        return this.culori.formatHex({
            mode: 'oklch',
            l: oklch.l,
            c: oklch.c,
            h: oklch.h,
        });
    }

    /**
     * Actualiza un color y sus uniforms en el shader
     * @param {number} colorIndex - Índice del color (1-4)
     * @param {number} l - Valor de luminosidad (0-1)
     * @param {number} c - Valor de croma (0-0.4)
     * @param {number} h - Valor de tono (0-360)
     * @returns {string} Color actualizado en formato hexadecimal
     */
    updateColor(colorIndex, l, c, h) {
        this.colors[colorIndex] = { l, c, h };

        const threeColor = this.oklchToThreeColor({ l, c, h });
        this.shaderManager.updateUniform(`u_color${colorIndex}`, threeColor);

        return this.oklchToHex({ l, c, h });
    }

    /**
     * Obtiene el color actual por su índice
     * @param {number} colorIndex - Índice del color (1-4)
     * @returns {{ l: number, c: number, h: number }} Color en formato OKLCH
     */
    getColor(colorIndex) {
        return this.colors[colorIndex];
    }

    /**
     * Aplica un preset de colores predefinido
     * @param {string} preset - Nombre del preset (sunset, ocean, forest, purple, neon)
     * @returns {boolean} True si el preset se aplicó correctamente
     */
    setPreset(preset) {
        const presets = {
            sunset: {
                1: { l: 0.7, c: 0.25, h: 30 },
                2: { l: 0.6, c: 0.3, h: 350 },
                3: { l: 0.8, c: 0.2, h: 60 },
                4: { l: 0.65, c: 0.28, h: 20 },
            },
            ocean: {
                1: { l: 0.5, c: 0.2, h: 240 },
                2: { l: 0.6, c: 0.25, h: 200 },
                3: { l: 0.7, c: 0.15, h: 180 },
                4: { l: 0.55, c: 0.22, h: 220 },
            },
            forest: {
                1: { l: 0.5, c: 0.2, h: 140 },
                2: { l: 0.6, c: 0.25, h: 120 },
                3: { l: 0.7, c: 0.15, h: 160 },
                4: { l: 0.55, c: 0.22, h: 100 },
            },
            purple: {
                1: { l: 0.6, c: 0.28, h: 300 },
                2: { l: 0.5, c: 0.3, h: 280 },
                3: { l: 0.7, c: 0.2, h: 320 },
                4: { l: 0.55, c: 0.25, h: 260 },
            },
            neon: {
                1: { l: 0.7, c: 0.35, h: 330 },
                2: { l: 0.6, c: 0.38, h: 180 },
                3: { l: 0.8, c: 0.32, h: 60 },
                4: { l: 0.65, c: 0.36, h: 280 },
            },
            fire: {
                1: { l: 0.65, c: 0.25, h: 30 },
                2: { l: 0.55, c: 0.28, h: 10 },
                3: { l: 0.75, c: 0.22, h: 50 },
                4: { l: 0.5, c: 0.3, h: 0 },
            },
            ice: {
                1: { l: 0.9, c: 0.05, h: 240 },
                2: { l: 0.8, c: 0.1, h: 210 },
                3: { l: 0.85, c: 0.08, h: 190 },
                4: { l: 0.75, c: 0.12, h: 220 },
            },
            midnight: {
                1: { l: 0.2, c: 0.1, h: 280 },
                2: { l: 0.15, c: 0.12, h: 260 },
                3: { l: 0.25, c: 0.08, h: 300 },
                4: { l: 0.1, c: 0.15, h: 240 },
            },
        };

        if (presets[preset]) {
            this.colors = presets[preset];

            for (let i = 1; i <= 4; i++) {
                const color = this.colors[i];
                const threeColor = this.oklchToThreeColor(color);
                this.shaderManager.updateUniform(`u_color${i}`, threeColor);
            }

            return true;
        }
        return false;
    }

    /**
     * Exporta los colores actuales a formato JSON
     * @returns {string} Colores en formato JSON
     */
    exportColors() {
        return JSON.stringify(this.colors);
    }

    /**
     * Importa colores desde un JSON
     * @param {string} json - String JSON con los colores
     * @returns {boolean} True si la importación fue exitosa
     */
    importColors(json) {
        try {
            const imported = JSON.parse(json);
            this.colors = imported;

            for (let i = 1; i <= 4; i++) {
                if (this.colors[i]) {
                    const color = this.colors[i];
                    const threeColor = this.oklchToThreeColor(color);
                    this.shaderManager.updateUniform(`u_color${i}`, threeColor);
                }
            }
            return true;
        } catch (e) {
            console.error('Error importing colors:', e);
            return false;
        }
    }
}
