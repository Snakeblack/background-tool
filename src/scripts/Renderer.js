/**
 * Core Renderer — owns the three.js WebGPURenderer and the fullscreen quad.
 *
 * Always uses WebGPURenderer: three picks the WebGPU backend when available
 * and transparently falls back to its WebGL2 backend otherwise, so the
 * preview runs the exact same TSL code that gets exported.
 */

import {
    Scene, OrthographicCamera, PlaneGeometry, Mesh, Vector2,
    WebGPURenderer, LinearSRGBColorSpace,
} from 'three/webgpu';

/**
 * Synthetic mid-tier profile used when no tier is provided.
 * @type {import('./GpuDetector.js').TierProfile}
 */
const MID_TIER_PROFILE = Object.freeze({
    dprCeiling: 1.5,
    dprFloor: 0.75,
    qualityScaleFloor: 0.75,
    powerPreference: 'default',
    antialias: false,
    maxFps: 60,
});

/** Lowest resolution multiplier we ever render at. */
const MIN_PIXEL_RATIO = 0.35;

export class Renderer {
    /**
     * @param {string} canvasId - ID del elemento canvas en el DOM
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;

        /** @type {'webgpu' | 'webgl2' | null} */
        this.backend = null;

        this._pixelRatio = 1;
        this._qualityScale = 1;
        this._renderScale = 1;
        this._frameTimeEwmaMs = 16.7;
        this._qualitySampleFrames = 0;
        this._slowSamples = 0;
        this._fpsCap = 60;
        this._resolution = new Vector2(1, 1);
        this._resolutionDirty = true;

        /** @type {import('./GpuDetector.js').TierProfile} */
        this._tierProfile = MID_TIER_PROFILE;

        this._isPageVisible = !document.hidden;
        this._onVisibilityChange = () => {
            this._isPageVisible = !document.hidden;
        };
        this._onResize = () => this._applyPixelRatioAndSize();
    }

    /**
     * Inicializa la escena, cámara, renderer y geometría.
     * @param {import('./GpuDetector.js').TierProfile} [tierProfile]
     */
    async init(tierProfile) {
        this._tierProfile = tierProfile ?? MID_TIER_PROFILE;
        this._fpsCap = this._tierProfile.maxFps ?? 60;

        this.scene = new Scene();

        // Fixed orthographic camera covering NDC space.
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
        this.camera.position.z = 1;

        // ?renderer=webgl forces the WebGL2 backend (debugging / support).
        let forceWebGL = false;
        try {
            forceWebGL = new URLSearchParams(location.search).get('renderer') === 'webgl';
        } catch {
            // ignore
        }

        this.renderer = new WebGPURenderer({
            canvas: this.canvas,
            // A single fullscreen quad has no edges to smooth: MSAA would only burn memory/bandwidth.
            antialias: false,
            alpha: false,
            forceWebGL,
        });
        // Shaders output display-ready sRGB (see tslLib.finish), so no extra encoding.
        this.renderer.outputColorSpace = LinearSRGBColorSpace;

        // Resolves the adapter/device (or the WebGL2 fallback) before the first render.
        await this.renderer.init();
        this.backend = this.renderer.backend?.isWebGPUBackend ? 'webgpu' : 'webgl2';
        console.debug(`[Renderer] backend: ${this.backend}`);

        this._applyPixelRatioAndSize();

        this.mesh = new Mesh(new PlaneGeometry(2, 2));
        this.mesh.frustumCulled = false;
        this.scene.add(this.mesh);

        window.addEventListener('resize', this._onResize, { passive: true });
        document.addEventListener('visibilitychange', this._onVisibilityChange);
    }

    dispose() {
        window.removeEventListener('resize', this._onResize);
        document.removeEventListener('visibilitychange', this._onVisibilityChange);
        this.renderer?.dispose();
    }

    /**
     * Soft backgrounds (gradients, fog…) don't need native resolution: rendering
     * them at a fraction of it cuts GPU work by 1/scale² and the browser's
     * bilinear upscale is invisible on smooth content.
     * @param {number} scale 0.35..1
     */
    setRenderScale(scale) {
        const next = Math.min(1, Math.max(MIN_PIXEL_RATIO, scale || 1));
        if (next === this._renderScale) return;
        this._renderScale = next;
        this._applyPixelRatioAndSize();
    }

    /** Effective pixel ratio: device DPR capped by tier, scaled by adaptive quality + background scale. */
    _computeEffectivePixelRatio() {
        const base = Math.min(window.devicePixelRatio || 1, this._tierProfile.dprCeiling);
        const target = base * this._qualityScale * this._renderScale;
        const lower = Math.min(base, this._tierProfile.dprFloor) * this._renderScale;
        return Math.max(target, lower, MIN_PIXEL_RATIO);
    }

    _applyPixelRatioAndSize() {
        const next = this._computeEffectivePixelRatio();
        if (next !== this._pixelRatio) {
            this._pixelRatio = next;
            this.renderer.setPixelRatio(next);
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight, false);
        this._resolution.set(
            Math.round(window.innerWidth * this._pixelRatio),
            Math.round(window.innerHeight * this._pixelRatio),
        );
        this._resolutionDirty = true;
    }

    /**
     * Adaptive quality (EWMA over *rendered* frame intervals). The thresholds
     * are relative to the active fps cap so a 30 fps cap isn't mistaken for lag.
     * @param {number} frameDeltaMs
     */
    updateQuality(frameDeltaMs) {
        if (!Number.isFinite(frameDeltaMs) || frameDeltaMs <= 0) return;

        const alpha = 0.06;
        this._frameTimeEwmaMs = (1 - alpha) * this._frameTimeEwmaMs + alpha * frameDeltaMs;

        this._qualitySampleFrames++;
        if (this._qualitySampleFrames < 20) return;
        this._qualitySampleFrames = 0;

        const budget = 1000 / this._fpsCap;
        const floor = this._tierProfile.qualityScaleFloor;
        const prev = this._qualityScale;

        if (this._frameTimeEwmaMs > budget * 1.5) {
            if (this._qualityScale > floor) {
                this._qualityScale = Math.max(floor, this._qualityScale - 0.1);
                this._slowSamples = 0;
            } else if (++this._slowSamples >= 3 && this._fpsCap > 30) {
                // Resolution is already at its floor and we still can't keep up: drop to 30 fps.
                this._fpsCap = 30;
                this._slowSamples = 0;
                this._frameTimeEwmaMs = 33;
            }
        } else if (this._frameTimeEwmaMs < budget * 1.08 && this._qualityScale < 1) {
            this._qualityScale = Math.min(1, this._qualityScale + 0.05);
            this._slowSamples = 0;
        }

        if (this._qualityScale !== prev) this._applyPixelRatioAndSize();
    }

    /** Minimum ms between rendered frames for the current fps cap. */
    get minFrameIntervalMs() {
        return 1000 / this._fpsCap;
    }

    consumeResolutionChanged() {
        if (!this._resolutionDirty) return false;
        this._resolutionDirty = false;
        return true;
    }

    setMaterial(material) {
        this.mesh.material = material;
    }

    get isPageVisible() {
        return this._isPageVisible;
    }

    /** @returns {number} Observed FPS (EWMA), 0 when there is no data. */
    getObservedFps() {
        if (!this._frameTimeEwmaMs || this._frameTimeEwmaMs <= 0) return 0;
        return Math.round(1000 / this._frameTimeEwmaMs);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /** @returns {Vector2} Drawing buffer size in physical pixels. */
    getResolution() {
        return this._resolution;
    }
}
