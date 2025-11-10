/**
 * Shader Manager - Gestiona los shaders y materiales
 */

import * as THREE from 'three';
import { SHADERS } from './shaders/index.js';

export class ShaderManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.currentShader = null;
        this.material = null;
        this.uniforms = this.createUniforms();
    }

    createUniforms() {
        return {
            u_time: { value: 0.0 },
            u_resolution: { value: this.renderer.getResolution() },
            u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
            
            // Colors
            u_color1: { value: new THREE.Color(1, 0.7, 0.8) },
            u_color2: { value: new THREE.Color(0.5, 0.3, 0.8) },
            u_color3: { value: new THREE.Color(0.2, 0.8, 0.7) },
            u_color4: { value: new THREE.Color(1, 0.9, 0.3) },
            
            // Common parameters
            u_speed: { value: 0.5 },
            u_scale: { value: 1.0 },
            u_intensity: { value: 1.0 },
            
            // Shader-specific parameters
            u_zoom: { value: 3.0 },
            u_stripe_width: { value: 8.0 },
            u_stripe_speed: { value: 0.8 },
            u_wave_amplitude: { value: 0.25 },
            u_wave_frequency: { value: 2.5 },
            u_noise_scale: { value: 2.0 },
            u_octaves: { value: 4.0 },
            u_persistence: { value: 0.5 },
            u_lacunarity: { value: 2.0 },
            u_rotation: { value: 0.0 },
            u_distortion: { value: 0.3 },
        };
    }

    loadShader(shaderName) {
        if (!SHADERS[shaderName]) {
            console.error(`Shader "${shaderName}" no encontrado`);
            return;
        }

        this.currentShader = shaderName;
        const shaderConfig = SHADERS[shaderName];

        // Crear material con el shader
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: shaderConfig.vertex,
            fragmentShader: shaderConfig.fragment,
        });

        this.renderer.setMaterial(this.material);
        
        return shaderConfig;
    }

    updateUniform(name, value) {
        if (this.uniforms[name]) {
            this.uniforms[name].value = value;
        }
    }

    updateTime() {
        this.uniforms.u_time.value = this.renderer.getElapsedTime();
    }

    updateResolution() {
        this.uniforms.u_resolution.value = this.renderer.getResolution();
    }

    getAvailableShaders() {
        return Object.keys(SHADERS);
    }

    getCurrentShaderConfig() {
        return SHADERS[this.currentShader];
    }

    getShaderParameters(shaderName) {
        const shader = SHADERS[shaderName || this.currentShader];
        if (!shader || !shader.controls) {
            return {};
        }

        const parameters = {};
        shader.controls.forEach(control => {
            const configuredUniform = control.uniform;
            const uniformKey = configuredUniform.startsWith('u_')
                ? configuredUniform
                : `u_${configuredUniform}`;
            const uniform = this.uniforms[uniformKey];
            if (!uniform) {
                return;
            }

            const exportKey = configuredUniform.startsWith('u_')
                ? configuredUniform.slice(2)
                : configuredUniform;
            parameters[exportKey] = uniform.value;
        });

        return parameters;
    }

    getShaderCode(shaderName) {
        const shader = SHADERS[shaderName || this.currentShader];
        return shader ? shader.fragment : '';
    }

    getVertexShaderCode() {
        const shader = SHADERS[this.currentShader];
        return shader ? shader.vertex : '';
    }
}
