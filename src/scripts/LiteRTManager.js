import { loadLiteRt, loadAndCompile, isWebGPUSupported } from '@litertjs/core';

/**
 * Administrador de LiteRT que gestiona el runtime y la ejecución de modelos de ML.
 * Proporciona una interfaz para inicializar el runtime, cargar modelos TensorFlow Lite
 * y ejecutar inferencias con aceleración WebGPU o WASM.
 */
export class LiteRTManager {
    /**
     * Crea una nueva instancia del administrador de LiteRT.
     */
    constructor() {
        this.isReady = false;
        this.runtime = null;
        this.models = new Map();
    }

    /**
     * Inicializa el runtime de LiteRT con los archivos WASM necesarios.
     * Detecta automáticamente el soporte de WebGPU y configura el runtime apropiadamente.
     * 
     * @param {string} [wasmPath='/wasm/'] - Ruta al directorio que contiene los archivos WASM
     * @returns {Promise<boolean>} `true` si la inicialización fue exitosa, `false` en caso de error
     */
    async init(wasmPath = '/wasm/') {
        try {
            console.log('Initializing LiteRT...');
            
            const webGPUSupported = isWebGPUSupported();
            console.log(`WebGPU Support: ${webGPUSupported ? 'Yes' : 'No'}`);

            this.runtime = await loadLiteRt(wasmPath);
            this.isReady = true;
            console.log('LiteRT Initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize LiteRT:', error);
            return false;
        }
    }

    /**
     * Carga y compila un modelo TensorFlow Lite para su ejecución.
     * Selecciona automáticamente el acelerador óptimo (WebGPU si está disponible, WASM en caso contrario).
     * 
     * @param {string} name - Identificador único para el modelo
     * @param {string} modelUrl - URL del archivo .tflite del modelo
     * @param {Object} [options={}] - Opciones de compilación para el modelo
     * @param {string} [options.accelerator] - Acelerador a utilizar ('webgpu' o 'wasm')
     * @returns {Promise<Object>} El modelo compilado listo para ejecutar
     * @throws {Error} Si el runtime no está inicializado o si falla la carga del modelo
     */
    async loadModel(name, modelUrl, options = {}) {
        if (!this.isReady) {
            throw new Error('LiteRT is not initialized. Call init() first.');
        }

        try {
            console.log(`Loading model "${name}" from ${modelUrl}...`);
            
            const defaultOptions = {
                accelerator: isWebGPUSupported() ? 'webgpu' : 'wasm'
            };

            const compileOptions = { ...defaultOptions, ...options };
            const model = await loadAndCompile(modelUrl, compileOptions);
            
            this.models.set(name, model);
            console.log(`Model "${name}" loaded successfully on ${compileOptions.accelerator}`);
            
            return model;
        } catch (error) {
            console.error(`Failed to load model "${name}":`, error);
            throw error;
        }
    }

    /**
     * Ejecuta inferencia en un modelo previamente cargado.
     * 
     * @param {string} name - Nombre del modelo a ejecutar
     * @param {Object|Array} inputs - Tensores de entrada para el modelo
     * @returns {Object|Array} Resultados de la inferencia del modelo
     * @throws {Error} Si el modelo especificado no existe
     */
    run(name, inputs) {
        const model = this.models.get(name);
        if (!model) {
            throw new Error(`Model "${name}" not found`);
        }
        return model.run(inputs);
    }

    /**
     * Libera todos los recursos asociados con los modelos cargados.
     * Elimina todos los modelos de la memoria y limpia el almacenamiento interno.
     */
    dispose() {
        this.models.forEach(model => model.delete());
        this.models.clear();
    }
}
