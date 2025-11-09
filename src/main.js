/**
 * Main App - Orquesta todos los módulos de la aplicación
 */

import './scripts/components/index.js'; // Registrar Web Components
import { Renderer } from './scripts/Renderer.js';
import { ShaderManager } from './scripts/ShaderManager.js';
import { ColorManager } from './scripts/ColorManager.js';
import { UIController } from './scripts/UIController.js';

class GradientApp {
    constructor() {
        this.renderer = new Renderer('bg-canvas');
        this.shaderManager = new ShaderManager(this.renderer);
        this.colorManager = new ColorManager(this.shaderManager);
        this.uiController = new UIController(this.shaderManager, this.colorManager);
        
        this.init();
    }

    init() {
        // Cargar colores iniciales
        for (let i = 1; i <= 4; i++) {
            const color = this.colorManager.getColor(i);
            if (color) {
                this.colorManager.updateColor(i, color.l, color.c, color.h);
            }
        }

        // Iniciar loop de animación
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Actualizar tiempo y resolución
        this.shaderManager.updateTime();
        this.shaderManager.updateResolution();
        
        // Renderizar
        this.renderer.render();
    }
}

// Inicializar cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    new GradientApp();
    
    // Optimizaciones para dispositivos móviles
    if ('ontouchstart' in window) {
        // Prevenir zoom en double tap
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // Optimizar scrolling en iOS
        document.addEventListener('touchmove', (e) => {
            if (e.target === document.body) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Agregar clase para estilos específicos de touch
        document.body.classList.add('touch-device');
    }
    
    // Detectar orientación y ajustar
    const handleOrientation = () => {
        const isLandscape = window.matchMedia('(orientation: landscape)').matches;
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
    };
    
    handleOrientation();
    window.addEventListener('orientationchange', handleOrientation);
    window.addEventListener('resize', handleOrientation);
});
