/**
 * Main App - Orquesta todos los módulos de la aplicación
 */

import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-grotesk/600.css';
import './scripts/components/index.js';
import { Renderer } from './scripts/Renderer.js';
import { ShaderManager } from './scripts/ShaderManager.js';
import { ColorManager } from './scripts/ColorManager.js';
import { UIController } from './scripts/UIController.js';

class GradientApp {
    /**
     * Constructor de la aplicación principal
     * Inicializa todos los módulos y servicios
     */
    constructor() {
        this.renderer = new Renderer('bg-canvas');
        this.shaderManager = new ShaderManager(this.renderer);
        this.colorManager = new ColorManager(this.shaderManager);
        this.uiController = new UIController(this.shaderManager, this.colorManager);
        
        this.init();
    }

    /**
     * Inicializa la aplicación cargando colores y comenzando la animación
     */
    init() {
        for (let i = 1; i <= 4; i++) {
            const color = this.colorManager.getColor(i);
            if (color) {
                this.colorManager.updateColor(i, color.l, color.c, color.h);
            }
        }

        this.animate();
    }

    /**
     * Loop de animación principal
     * Actualiza uniformes y renderiza cada frame
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.shaderManager.updateTime();
        this.shaderManager.updateResolution();
        this.renderer.render();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new GradientApp();
    
    if ('ontouchstart' in window) {
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (e.target === document.body) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.classList.add('touch-device');
    }
    
    const handleOrientation = () => {
        const isLandscape = window.matchMedia('(orientation: landscape)').matches;
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
    };
    
    handleOrientation();
    window.addEventListener('orientationchange', handleOrientation);
    window.addEventListener('resize', handleOrientation);
});
