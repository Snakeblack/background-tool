/**
 * Main App - Orquesta todos los módulos de la aplicación
 */

// Space Grotesk (Display)
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

// Inter (Body)
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

const GPU_TIER_MAP = { low: 0, mid: 1, high: 2, ultra: 3 };

class GradientApp {
    constructor() {
        this.renderer = new Renderer('bg-canvas');
        this.gpuDetector = new GpuDetector();

        // Managers that depend on the renderer are created once it is ready.
        this.shaderManager = null;
        this.colorManager = null;
        this.uiController = null;

        this._lastFrameTime = 0;
        this._lastRafTime = 0;
        this._rafMs = 16.7;

        this._tick = this._tick.bind(this);
        this.init();
    }

    async init() {
        // The splash color is painted by CSS (#bg-canvas background). We MUST NOT take a
        // 2D context on this canvas: its context type is final once acquired.

        // Tier detection first: the profile (DPR caps, fps cap) is baked in at renderer creation.
        const tierResult = await this.gpuDetector.detect();
        await this.renderer.init(tierResult.profile);

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

        this.uiController.setRuntimeContext({
            gpuTier: GPU_TIER_MAP[tierResult.tier] ?? null,
            getObservedFps: () => this.renderer.getObservedFps(),
        });

        this.shaderManager.updateResolution();

        window.addEventListener('pointermove', (e) => {
            this.shaderManager.setPointer(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
        }, { passive: true });

        // Dev-only hook (stripped from production by Vite): lets tests/thumbnail tooling drive the app.
        if (import.meta.env.DEV) {
            window.__bg = { app: this, tierResult };
        }

        this._lastFrameTime = performance.now();
        this._tick();
    }

    /**
     * Frame loop. Renders only when something is moving or changed, at most at the
     * tier's fps cap (60 Hz even on 120/144 Hz displays; 30 on low-end devices).
     * @param {number} [now]
     */
    _tick(now = performance.now()) {
        requestAnimationFrame(this._tick);

        // Display refresh interval (EWMA), used to cap fps without aliasing against vsync.
        const rafDelta = now - this._lastRafTime;
        this._lastRafTime = now;
        if (rafDelta > 0 && rafDelta < 100) this._rafMs = this._rafMs * 0.9 + rafDelta * 0.1;

        if (document.hidden || !this.renderer.isPageVisible) {
            this._lastFrameTime = now;
            return;
        }

        const elapsed = now - this._lastFrameTime;
        if (elapsed < this.renderer.minFrameIntervalMs - this._rafMs * 0.5) return;
        this._lastFrameTime = now;

        const sm = this.shaderManager;
        sm.advance(elapsed / 1000);
        if (this.renderer.consumeResolutionChanged()) sm.updateResolution();

        // Idle (speed 0 and nothing touched): the last frame is still on screen, skip the GPU work.
        const dirty = sm.consumeDirty();
        if (!dirty && !sm.isAnimating()) return;

        this.renderer.updateQuality(elapsed);
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
