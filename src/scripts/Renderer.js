/**
 * Core Renderer - Gestiona Three.js y la escena WebGL
 */

import { Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, Mesh, Clock, Vector2 } from 'three';
import { WebGPURenderer } from 'three/webgpu';

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
        this.clock = new Clock();
        this.isWebGPUSupported = false;

        this._pixelRatio = 1;
        this._qualityScale = 1;
        this._isMobileLike = false;
        this._frameTimeEwmaMs = 16.7;
        this._qualitySampleFrames = 0;
        this._resolution = new Vector2(1, 1);
        this._resolutionDirty = true;
        this._isRendering = false;
        
        // Removed this.init() call from constructor to avoid race condition
    }

    /**
     * Inicializa la escena, cámara, renderer y geometría
     */
    async init() {
        this.scene = new Scene();

        // Cámara ortográfica fija que cubre el espacio NDC (-1 a 1)
        // Aumentamos el far plane a 10 para evitar clipping (z-fighting) en móviles
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
        this.camera.position.z = 1;

        // Check WebGPU support
        if (navigator.gpu) {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    this.isWebGPUSupported = true;
                    console.log('WebGPU is supported. Initializing WebGPURenderer...');
                }
            } catch (e) {
                console.warn('WebGPU check failed:', e);
            }
        }

        if (this.isWebGPUSupported) {
            this.renderer = new WebGPURenderer({ 
                canvas: this.canvas, 
                antialias: true, 
                alpha: false,
                precision: 'highp'
            });
        } else {
            console.log('WebGPU not supported. Fallback to WebGLRenderer.');
            this.renderer = new WebGLRenderer({ 
                canvas: this.canvas, 
                antialias: true, 
                alpha: false,
                precision: 'highp',
                powerPreference: 'high-performance'
            });
        }

        this._applyPixelRatioAndSize();

        // Geometría fija de 2x2 para cubrir todo el viewport
        const geometry = new PlaneGeometry(2, 2);
        this.mesh = new Mesh(geometry);
        this.mesh.frustumCulled = false;
        this.scene.add(this.mesh);

        window.addEventListener('resize', () => this.onWindowResize(), { passive: true });
    }

    /**
     * Maneja el evento de resize de la ventana
     * Actualiza dimensiones del renderer
     */
    onWindowResize() {
        this._applyPixelRatioAndSize();
        // No es necesario actualizar cámara ni geometría ya que usamos NDC
    }

    _computeIsMobileLike() {
        // Heurística simple: viewport estrecho o input táctil (pointer coarse).
        // Mantenerlo barato y estable para evitar oscilaciones.
        const byWidth = window.innerWidth <= 768;
        const byPointer = typeof window.matchMedia === 'function'
            ? window.matchMedia('(pointer: coarse)').matches
            : false;
        return byWidth || byPointer;
    }

    _computeEffectivePixelRatio() {
        const dpr = window.devicePixelRatio || 1;
        const maxDpr = this._isMobileLike ? 1.25 : 2;
        // qualityScale reduce la resolución interna de forma controlada.
        const scaled = dpr * this._qualityScale;
        // Mantener un mínimo para no degradar demasiado en móviles.
        const minDpr = this._isMobileLike ? 0.75 : 1;
        return Math.min(Math.max(scaled, minDpr), maxDpr);
    }

    _applyPixelRatioAndSize() {
        const nextIsMobileLike = this._computeIsMobileLike();
        if (nextIsMobileLike !== this._isMobileLike) {
            this._isMobileLike = nextIsMobileLike;
            // Reset suave al entrar/salir de móvil para evitar saltos fuertes.
            this._qualityScale = 1;
            this._frameTimeEwmaMs = 16.7;
            this._qualitySampleFrames = 0;
        }

        const nextPixelRatio = this._computeEffectivePixelRatio();
        if (nextPixelRatio !== this._pixelRatio) {
            this._pixelRatio = nextPixelRatio;
            this.renderer.setPixelRatio(this._pixelRatio);
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this._updateResolutionCache();
    }

    /**
     * Ajuste de calidad adaptativo (solo en móviles): baja ligeramente DPR si el frame time empeora.
     * @param {number} frameDeltaMs
     */
    updateQuality(frameDeltaMs) {
        if (!this._isMobileLike) return;
        if (!Number.isFinite(frameDeltaMs) || frameDeltaMs <= 0) return;

        // EWMA estable para evitar cambios por picos.
        const alpha = 0.06;
        this._frameTimeEwmaMs = (1 - alpha) * this._frameTimeEwmaMs + alpha * frameDeltaMs;

        // Muestrear cada ~20 frames.
        this._qualitySampleFrames++;
        if (this._qualitySampleFrames < 20) return;
        this._qualitySampleFrames = 0;

        const prevScale = this._qualityScale;

        // Si cae por debajo de ~38fps (26ms) bajamos un escalón.
        if (this._frameTimeEwmaMs > 26 && this._qualityScale > 0.75) {
            this._qualityScale = Math.max(0.75, this._qualityScale - 0.1);
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
     */
    consumeResolutionChanged() {
        if (!this._resolutionDirty) return false;
        this._resolutionDirty = false;
        return true;
    }

    /**
     * Asigna un material al mesh principal
     * @param {THREE.ShaderMaterial} material - Material de Three.js
     */
    setMaterial(material) {
        this.mesh.material = material;
    }

    /**
     * Obtiene el tiempo transcurrido desde el inicio
     * @returns {number} Tiempo en segundos
     */
    getElapsedTime() {
        return this.clock.getElapsedTime();
    }

    /**
     * Renderiza la escena
     */
    render() {
        if (this.isWebGPUSupported) {
            if (this._isRendering) return;
            this._isRendering = true;
            this.renderer
                .renderAsync(this.scene, this.camera)
                .catch(() => {})
                .finally(() => {
                    this._isRendering = false;
                });
            return;
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Obtiene la resolución actual de la ventana en píxeles físicos
     * @returns {Vector2} Resolución en píxeles (ancho * pixelRatio, alto * pixelRatio)
     */
    getResolution() {
        return this._resolution;
    }
}
