/**
 * Core Renderer - Gestiona Three.js y la escena WebGL
 */

import { Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, Mesh, Vector2 } from 'three';
import { WebGPURenderer } from 'three/webgpu';

/**
 * Synthetic mid-tier profile used as default when no tier is provided.
 * Matches the mid entry in GpuDetector's profile table.
 * @type {import('./GpuDetector.js').TierProfile}
 */
const MID_TIER_PROFILE = Object.freeze({
    dprCeiling: 1.5,
    dprFloor: 0.75,
    qualityScaleFloor: 0.75,
    powerPreference: 'default',
    antialias: false,
});

export class Renderer {
    /**
     * Constructor del renderizador
     * @param {string} canvasId - ID del elemento canvas en el DOM
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.isWebGPUSupported = false;

        this._pixelRatio = 1;
        this._qualityScale = 1;
        this._frameTimeEwmaMs = 16.7;
        this._qualitySampleFrames = 0;
        this._resolution = new Vector2(1, 1);
        this._resolutionDirty = true;

        /** @type {import('./GpuDetector.js').TierProfile} */
        this._tierProfile = MID_TIER_PROFILE;

        /** @type {number} */
        this._renderedTime = 0;

        /** @type {number} */
        this._lastFrameDeltaMs = 0;

        /** @type {boolean} */
        this._isPageVisible = !document.hidden;

        /** @type {() => void} */
        this.#onVisibilityChange = () => {
            this._isPageVisible = !document.hidden;
        };
    }

    /** @type {() => void} */
    #onVisibilityChange;

    /**
     * Inicializa la escena, cámara, renderer y geometría
     * @param {import('./GpuDetector.js').TierProfile} [tierProfile]
     *   Optional tier profile from GpuDetector. Falls back to synthetic mid-tier
     *   when omitted, preserving backward compatibility.
     */
    async init(tierProfile) {
        this._tierProfile = tierProfile ?? MID_TIER_PROFILE;

        this.scene = new Scene();

        // Cámara ortográfica fija que cubre el espacio NDC (-1 a 1)
        // Aumentamos el far plane a 10 para evitar clipping (z-fighting) en móviles
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
        this.camera.position.z = 1;

        // Check WebGPU support
        if (navigator.gpu) {
            try {
                // WebGPU spec: GPUPowerPreference enum only accepts 'low-power' |
                // 'high-performance'. Omit the property entirely when our profile
                // says 'default' to let the UA pick (equivalent semantics).
                /** @type {GPURequestAdapterOptions} */
                const adapterOptions = {};
                if (this._tierProfile.powerPreference !== 'default') {
                    adapterOptions.powerPreference = this._tierProfile.powerPreference;
                }
                const adapter = await navigator.gpu.requestAdapter(adapterOptions);
                if (adapter) {
                    this.isWebGPUSupported = true;
                    console.debug('[Renderer] WebGPU is supported. Initializing WebGPURenderer...');
                }
            } catch (e) {
                console.debug('[Renderer] WebGPU check failed:', e);
            }
        }

        if (this.isWebGPUSupported) {
            this.renderer = new WebGPURenderer({
                canvas: this.canvas,
                antialias: this._tierProfile.antialias,
                alpha: false,
                precision: 'highp',
            });
            // three 0.184+: WebGPURenderer requires explicit init() before first render().
            // Internally awaits adapter/device acquisition; render() becomes safe to call sync.
            await this.renderer.init();
        } else {
            console.debug('[Renderer] WebGPU not supported. Fallback to WebGLRenderer.');
            this.renderer = new WebGLRenderer({
                canvas: this.canvas,
                antialias: this._tierProfile.antialias,
                alpha: false,
                precision: 'highp',
                powerPreference: this._tierProfile.powerPreference,
            });
        }

        this._applyPixelRatioAndSize();

        // Geometría fija de 2x2 para cubrir todo el viewport
        const geometry = new PlaneGeometry(2, 2);
        this.mesh = new Mesh(geometry);
        this.mesh.frustumCulled = false;
        this.scene.add(this.mesh);

        window.addEventListener('resize', () => this.onWindowResize(), { passive: true });
        document.addEventListener('visibilitychange', this.#onVisibilityChange);
    }

    /**
     * Limpia los event listeners del renderer.
     * Llamar al desmontar para evitar memory leaks en HMR.
     */
    dispose() {
        document.removeEventListener('visibilitychange', this.#onVisibilityChange);
    }

    /**
     * Maneja el evento de resize de la ventana
     * Actualiza dimensiones del renderer
     */
    onWindowResize() {
        this._applyPixelRatioAndSize();
        // No es necesario actualizar cámara ni geometría ya que usamos NDC
    }

    /**
     * Computes the effective pixel ratio clamped to the tier profile bounds.
     * effective = clamp(devicePixelRatio * qualityScale, dprFloor, dprCeiling)
     * @returns {number}
     */
    _computeEffectivePixelRatio() {
        const raw = window.devicePixelRatio * this._qualityScale;
        return Math.min(
            Math.max(raw, this._tierProfile.dprFloor),
            this._tierProfile.dprCeiling,
        );
    }

    _applyPixelRatioAndSize() {
        const nextPixelRatio = this._computeEffectivePixelRatio();
        if (nextPixelRatio !== this._pixelRatio) {
            this._pixelRatio = nextPixelRatio;
            this.renderer.setPixelRatio(this._pixelRatio);
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this._updateResolutionCache();
    }

    /**
     * Ajuste de calidad adaptativo (EWMA): baja ligeramente DPR si el frame time empeora.
     * Runs on every tier. Quality scale is bounded by [tierProfile.qualityScaleFloor, 1.0].
     * @param {number} frameDeltaMs
     */
    updateQuality(frameDeltaMs) {
        if (!Number.isFinite(frameDeltaMs) || frameDeltaMs <= 0) return;

        // EWMA estable para evitar cambios por picos.
        const alpha = 0.06;
        this._frameTimeEwmaMs = (1 - alpha) * this._frameTimeEwmaMs + alpha * frameDeltaMs;

        // Muestrear cada ~20 frames.
        this._qualitySampleFrames++;
        if (this._qualitySampleFrames < 20) return;
        this._qualitySampleFrames = 0;

        const prevScale = this._qualityScale;
        const floor = this._tierProfile.qualityScaleFloor;

        // Si cae por debajo de ~38fps (26ms) bajamos un escalón.
        if (this._frameTimeEwmaMs > 26 && this._qualityScale > floor) {
            this._qualityScale = Math.max(floor, this._qualityScale - 0.1);
        }
        // Si va cómodo por encima de ~55fps (18ms) subimos un poco.
        else if (this._frameTimeEwmaMs < 18 && this._qualityScale < 1) {
            this._qualityScale = Math.min(1, this._qualityScale + 0.05);
        }

        if (this._qualityScale !== prevScale) {
            this._applyPixelRatioAndSize();
        }
    }

    _updateResolutionCache() {
        this._resolution.set(window.innerWidth * this._pixelRatio, window.innerHeight * this._pixelRatio);
        this._resolutionDirty = true;
    }

    /**
     * Devuelve true una sola vez cuando cambió el tamaño/pixelRatio.
     * @returns {boolean}
     */
    consumeResolutionChanged() {
        if (!this._resolutionDirty) return false;
        this._resolutionDirty = false;
        return true;
    }

    /**
     * Asigna un material al mesh principal
     * @param {import('three').ShaderMaterial} material - Material de Three.js
     */
    setMaterial(material) {
        this.mesh.material = material;
    }

    /**
     * Returns the accumulated rendered time in seconds.
     * Advanced only by tickTime() — never by wall clock.
     * @returns {number}
     */
    getRenderedTime() {
        return this._renderedTime;
    }

    /**
     * Advances the rendered time counter by deltaMs.
     * Must be called from the tick loop only when a frame is about to be rendered.
     * @param {number} deltaMs
     */
    tickTime(deltaMs) {
        this._renderedTime += deltaMs / 1000;
        this._lastFrameDeltaMs = deltaMs;
    }

    /**
     * @deprecated Use getRenderedTime() instead.
     * Kept as alias for backward compatibility.
     * @returns {number}
     */
    getElapsedTime() {
        return this._renderedTime;
    }

    /**
     * Last frame delta in milliseconds. Read-only, for diagnostics.
     * @returns {number}
     */
    get lastFrameDeltaMs() {
        return this._lastFrameDeltaMs;
    }

    /**
     * Whether the page is currently visible.
     * @returns {boolean}
     */
    get isPageVisible() {
        return this._isPageVisible;
    }

    /**
     * @returns {number} FPS observado (EWMA), 0 si no hay datos.
     */
    getObservedFps() {
        if (!this._frameTimeEwmaMs || this._frameTimeEwmaMs <= 0) return 0;
        return Math.round(1000 / this._frameTimeEwmaMs);
    }

    /**
     * Renderiza la escena.
     * @returns {boolean} true (always — three handles WebGPU async pipeline internally since 0.184).
     */
    render() {
        this.renderer.render(this.scene, this.camera);
        return true;
    }

    /**
     * Obtiene la resolución actual de la ventana en píxeles físicos
     * @returns {Vector2} Resolución en píxeles (ancho * pixelRatio, alto * pixelRatio)
     */
    getResolution() {
        return this._resolution;
    }
}
