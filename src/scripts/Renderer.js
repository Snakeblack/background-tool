/**
 * Core Renderer - Gestiona Three.js y la escena WebGL
 */

import { Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, Mesh, Clock, Vector2 } from 'three';

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
        
        this.init();
    }

    /**
     * Inicializa la escena, cámara, renderer y geometría
     */
    init() {
        this.scene = new Scene();

        // Cámara ortográfica fija que cubre el espacio NDC (-1 a 1)
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.camera.position.z = 1;

        this.renderer = new WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true, 
            alpha: false 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Geometría fija de 2x2 para cubrir todo el viewport
        const geometry = new PlaneGeometry(2, 2);
        this.mesh = new Mesh(geometry);
        this.scene.add(this.mesh);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Maneja el evento de resize de la ventana
     * Actualiza dimensiones del renderer
     */
    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // No es necesario actualizar cámara ni geometría ya que usamos NDC
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
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Obtiene la resolución actual de la ventana
     * @returns {Vector2} Resolución en píxeles
     */
    getResolution() {
        return new Vector2(window.innerWidth, window.innerHeight);
    }
}
