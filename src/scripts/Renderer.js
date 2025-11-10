/**
 * Core Renderer - Gestiona Three.js y la escena WebGL
 */

import * as THREE from 'three';

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
        this.clock = new THREE.Clock();
        
        this.init();
    }

    /**
     * Inicializa la escena, cámara, renderer y geometría
     */
    init() {
        this.scene = new THREE.Scene();

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(
            -aspect, aspect, 1, -1, 0.1, 10
        );
        this.camera.position.z = 1;

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true, 
            alpha: false 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const geometry = new THREE.PlaneGeometry(2 * aspect, 2);
        this.mesh = new THREE.Mesh(geometry);
        this.scene.add(this.mesh);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Maneja el evento de resize de la ventana
     * Actualiza dimensiones del renderer, cámara y geometría
     */
    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = -aspect;
        this.camera.right = aspect;
        this.camera.updateProjectionMatrix();
        
        if (this.mesh && this.mesh.geometry) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = new THREE.PlaneGeometry(2 * aspect, 2);
        }
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
     * @returns {THREE.Vector2} Resolución en píxeles
     */
    getResolution() {
        return new THREE.Vector2(window.innerWidth, window.innerHeight);
    }
}
