/**
 * Shader Manager - Gestiona los shaders y materiales
 */

import { ShaderMaterial, Color, Vector2 } from 'three';
import { SHADERS } from './shaders/index.js';

export class ShaderManager {
    /**
     * Constructor del gestor de shaders
     * @param {Renderer} renderer - Instancia del renderizador
     */
    constructor(renderer) {
        this.renderer = renderer;
        this.currentShader = null;
        this.material = null;
        this.uniforms = this.createUniforms();
    }

    /**
     * Crea el objeto de uniforms con valores por defecto
     * @returns {Object} Objeto con todos los uniforms del shader
     */
    createUniforms() {
        return {
            u_time: { value: 0.0 },
            u_resolution: { value: this.renderer.getResolution() },
            u_mouse: { value: new Vector2(0.5, 0.5) },
            u_color1: { value: new Color(1, 0.7, 0.8) },
            u_color2: { value: new Color(0.5, 0.3, 0.8) },
            u_color3: { value: new Color(0.2, 0.8, 0.7) },
            u_color4: { value: new Color(1, 0.9, 0.3) },
            u_speed: { value: 0.5 },
            u_scale: { value: 1.0 },
            u_intensity: { value: 1.0 },
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

    /**
     * Carga y aplica un shader específico
     * @param {string} shaderName - Nombre del shader a cargar
     * @returns {Object|undefined} Configuración del shader cargado
     */
    loadShader(shaderName) {
        if (!SHADERS[shaderName]) {
            console.error(`Shader "${shaderName}" no encontrado`);
            return;
        }

        this.currentShader = shaderName;
        const shaderConfig = SHADERS[shaderName];

        this.material = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: shaderConfig.vertex,
            fragmentShader: shaderConfig.fragment,
        });

        this.renderer.setMaterial(this.material);
        
        return shaderConfig;
    }

    /**
     * Actualiza el valor de un uniform específico
     * @param {string} name - Nombre del uniform
     * @param {*} value - Nuevo valor del uniform
     */
    updateUniform(name, value) {
        if (this.uniforms[name]) {
            this.uniforms[name].value = value;
        }
    }

    /**
     * Actualiza el uniform de tiempo con el tiempo transcurrido
     */
    updateTime() {
        this.uniforms.u_time.value = this.renderer.getElapsedTime();
    }

    /**
     * Actualiza el uniform de resolución con las dimensiones actuales
     */
    updateResolution() {
        this.uniforms.u_resolution.value = this.renderer.getResolution();
    }

    /**
     * Obtiene la lista de shaders disponibles
     * @returns {string[]} Array con los nombres de los shaders
     */
    getAvailableShaders() {
        return Object.keys(SHADERS);
    }

    /**
     * Obtiene la configuración del shader actual
     * @returns {Object} Configuración del shader actual
     */
    getCurrentShaderConfig() {
        return SHADERS[this.currentShader];
    }

    /**
     * Obtiene los parámetros configurables del shader
     * @param {string} [shaderName] - Nombre del shader (opcional, usa el actual si no se provee)
     * @returns {Object} Objeto con los parámetros del shader
     */
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

    /**
     * Obtiene el código GLSL del fragment shader
     * @param {string} [shaderName] - Nombre del shader (opcional, usa el actual si no se provee)
     * @returns {string} Código GLSL del fragment shader
     */
    getShaderCode(shaderName) {
        const shader = SHADERS[shaderName || this.currentShader];
        return shader ? shader.fragment : '';
    }

    /**
     * Obtiene el código GLSL del vertex shader actual
     * @returns {string} Código GLSL del vertex shader
     */
    getVertexShaderCode() {
        const shader = SHADERS[this.currentShader];
        return shader ? shader.vertex : '';
    }
}
