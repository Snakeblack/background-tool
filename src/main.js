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
import { PersistenceManager } from './scripts/PersistenceManager.js';
import { BackgroundLibraryManager } from './scripts/BackgroundLibraryManager.js';
import { I18nManager } from './scripts/I18nManager.js';
import { GpuDetector } from './scripts/GpuDetector.js';
import { createIcons, Sunset, Waves, Trees, Zap, Flame, Snowflake, Moon, Gem } from 'lucide';

class GradientApp {
    /**
     * Constructor de la aplicación principal
     * Inicializa todos los módulos y servicios
     */
    constructor() {
        this.renderer = new Renderer('bg-canvas');
        this.gpuDetector = new GpuDetector();

        // Defer initialization of dependent managers until renderer is ready
        this.shaderManager = null;
        this.colorManager = null;
        this.uiController = null;

        this._lastFrameTime = 0;

        this._tick = this._tick.bind(this);

        this.init();
    }

    /**
     * Inicializa la aplicación cargando colores y comenzando la animación
     */
    async init() {
        // Splash background is painted by CSS (#bg-canvas { background-color: oklch(...) }).
        // We MUST NOT acquire a 2D context on this canvas here — doing so would
        // permanently bind the canvas to '2d' and prevent later WebGL/WebGPU acquisition
        // (HTML Canvas spec: a canvas's context type is final once acquired).

        // Detect GPU tier before initializing renderer (antialias + powerPreference
        // must be baked in at construction time)
        const tierResult = await this.gpuDetector.detect();

        // Initialize Renderer with the resolved tier profile
        await this.renderer.init(tierResult.profile);

        // Now initialize managers that depend on the renderer
        this.shaderManager = new ShaderManager(this.renderer);
        this.colorManager = new ColorManager(this.shaderManager);
        this.persistenceManager = new PersistenceManager();
        this.i18n = new I18nManager(this.persistenceManager);
        this.backgroundLibraryManager = new BackgroundLibraryManager();
        this.uiController = new UIController(
            this.shaderManager,
            this.colorManager,
            this.persistenceManager,
            this.backgroundLibraryManager,
            this.i18n,
        );

        const GPU_TIER_MAP = { low: 0, mid: 1, high: 2, ultra: 3 };
        this.uiController.setRuntimeContext({
            gpuTier: GPU_TIER_MAP[tierResult.tier] ?? null,
            getObservedFps: () => this.renderer.getObservedFps(),
        });

        createIcons({
            icons: {
                Sunset,
                Waves,
                Trees,
                Zap,
                Flame,
                Snowflake,
                Moon,
                Gem,
            },
        });

        for (let i = 1; i <= 4; i++) {
            const color = this.colorManager.getColor(i);
            if (color) {
                this.colorManager.updateColor(i, color.l, color.c, color.h);
            }
        }

        // Ensure uniforms are correct before the first frame
        this.shaderManager.updateResolution();

        // Task 32: Expose debug hook in dev mode only (stripped by Vite in production)
        if (import.meta.env.DEV) {
            window.__gpuDebug = { detector: this.gpuDetector, renderer: this.renderer, tierResult };
        }

        this._lastFrameTime = performance.now();
        this._tick();
    }

    /**
     * Loop de animación principal
     * Actualiza uniformes y renderiza cada frame
     * @param {number} [now]
     */
    _tick(now = performance.now()) {
        requestAnimationFrame(this._tick);

        // Step 1: Skip everything while page is hidden — keep rAF alive for instant resume
        if (document.hidden || !this.renderer.isPageVisible) {
            return;
        }

        // Step 2: Compute delta
        const deltaMs = this._lastFrameTime ? (now - this._lastFrameTime) : 16.7;
        this._lastFrameTime = now;

        // Step 3: Update quality EWMA
        this.renderer.updateQuality(deltaMs);

        // Step 5: Advance rendered time — only when a frame will actually be drawn
        this.renderer.tickTime(deltaMs);

        // Step 6: Update shader time uniform
        this.shaderManager.updateTime();

        // Step 7: Update resolution if changed
        if (this.renderer.consumeResolutionChanged()) {
            this.shaderManager.updateResolution();
        }

        // Step 8: Render
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
