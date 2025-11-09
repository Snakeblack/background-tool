/**
 * Core Renderer - Gestiona Three.js y la escena WebGL
 */

import * as THREE from 'three';

export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.clock = new THREE.Clock();
        
        this.init();
    }

    init() {
        // Escena
        this.scene = new THREE.Scene();

        // Cámara ortográfica
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(
            -aspect, aspect, 1, -1, 0.1, 10
        );
        this.camera.position.z = 1;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true, 
            alpha: false 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Geometría (plano fullscreen - ajustado al aspect ratio)
        const geometry = new THREE.PlaneGeometry(2 * aspect, 2);
        this.mesh = new THREE.Mesh(geometry);
        this.scene.add(this.mesh);

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = -aspect;
        this.camera.right = aspect;
        this.camera.updateProjectionMatrix();
        
        // Actualizar geometría del plano para cubrir toda la pantalla
        if (this.mesh && this.mesh.geometry) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = new THREE.PlaneGeometry(2 * aspect, 2);
        }
    }

    setMaterial(material) {
        this.mesh.material = material;
    }

    getElapsedTime() {
        return this.clock.getElapsedTime();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    getResolution() {
        return new THREE.Vector2(window.innerWidth, window.innerHeight);
    }
}
