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

        this._pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(this._pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this._updateResolutionCache();

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
        const nextPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        if (nextPixelRatio !== this._pixelRatio) {
            this._pixelRatio = nextPixelRatio;
            this.renderer.setPixelRatio(this._pixelRatio);
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this._updateResolutionCache();
        // No es necesario actualizar cámara ni geometría ya que usamos NDC
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
