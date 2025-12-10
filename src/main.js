/**
 * Main App - Orquesta todos los módulos de la aplicación
 */

// Space Grotesk (Display)
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

// Inter (Body)
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './scripts/components/index.js';
import './scripts/ui/HudDock.js';
import './scripts/ui/BottomSheet.js';
import { Renderer } from './scripts/Renderer.js';
import { ShaderManager } from './scripts/ShaderManager.js';
import { ColorManager } from './scripts/ColorManager.js';
import { UIController } from './scripts/UIController.js';
import { LiteRTManager } from './scripts/LiteRTManager.js';
import { createIcons, Sunset, Waves, Trees, Zap, Flame, Snowflake, Moon, Gem } from 'lucide';

class GradientApp {
    /**
     * Constructor de la aplicación principal
     * Inicializa todos los módulos y servicios
     */
    constructor() {
        this.renderer = new Renderer('bg-canvas');
        this.liteRTManager = new LiteRTManager();
        
        // Defer initialization of dependent managers until renderer is ready
        this.shaderManager = null;
        this.colorManager = null;
        this.uiController = null;
        
        this.init();
    }

    /**
     * Inicializa la aplicación cargando colores y comenzando la animación
     */
    async init() {
        // Initialize LiteRT first to avoid WASM memory issues
        await this.liteRTManager.init();

        // Initialize Renderer (async)
        await this.renderer.init();

        // Now initialize managers that depend on the renderer
        this.shaderManager = new ShaderManager(this.renderer);
        this.colorManager = new ColorManager(this.shaderManager);
        this.uiController = new UIController(this.shaderManager, this.colorManager);

        createIcons({
            icons: {
                Sunset,
                Waves,
                Trees,
                Zap,
                Flame,
                Snowflake,
                Moon,
                Gem
            }
        });

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
