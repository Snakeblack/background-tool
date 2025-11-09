/**
 * Color Manager - Gestiona conversiones OKLCH y actualización de colores
 */

import * as THREE from 'three';
import * as culori from 'culori';

export class ColorManager {
    constructor(shaderManager) {
        this.shaderManager = shaderManager;
        this.culori = culori;
        
        // Estado de colores (OKLCH)
        this.colors = {
            1: { l: 0.7, c: 0.25, h: 330 },
            2: { l: 0.6, c: 0.3, h: 280 },
            3: { l: 0.8, c: 0.2, h: 150 },
            4: { l: 0.65, c: 0.28, h: 60 },
        };
    }

    oklchToThreeColor(oklch) {
        const rgb = this.culori.rgb({ 
            mode: 'oklch', 
            l: oklch.l, 
            c: oklch.c, 
            h: oklch.h 
        });
        return new THREE.Color(rgb.r, rgb.g, rgb.b);
    }

    oklchToHex(oklch) {
        return this.culori.formatHex({ 
            mode: 'oklch', 
            l: oklch.l, 
            c: oklch.c, 
            h: oklch.h 
        });
    }

    updateColor(colorIndex, l, c, h) {
        this.colors[colorIndex] = { l, c, h };
        
        const threeColor = this.oklchToThreeColor({ l, c, h });
        this.shaderManager.updateUniform(`u_color${colorIndex}`, threeColor);
        
        return this.oklchToHex({ l, c, h });
    }

    getColor(colorIndex) {
        return this.colors[colorIndex];
    }

    setPreset(preset) {
        // Presets predefinidos
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
        };

        if (presets[preset]) {
            this.colors = presets[preset];
            
            // Actualizar todos los colores
            for (let i = 1; i <= 4; i++) {
                const color = this.colors[i];
                const threeColor = this.oklchToThreeColor(color);
                this.shaderManager.updateUniform(`u_color${i}`, threeColor);
            }
            
            return true;
        }
        return false;
    }

    exportColors() {
        return JSON.stringify(this.colors);
    }

    importColors(json) {
        try {
            const imported = JSON.parse(json);
            this.colors = imported;
            
            // Actualizar shaders
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
