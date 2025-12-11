/**
 * Export Modal Component - Genera código para implementar en proyectos
 */
import { Package, Rocket, Atom, Layers, Hexagon, Zap, Lightbulb, AlertTriangle, Clipboard, Check, AlertCircle, BarChart, X, createElement } from 'lucide';

export class ExportModal extends HTMLElement {
    /**
     * Constructor del componente ExportModal
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.codeBlocks = new Map();
    }

    /**
     * Callback ejecutado cuando el componente se conecta al DOM
     */
    connectedCallback() {
        this.render();
    }

    /**
     * Renderiza el modal con su estructura HTML y estilos
     */
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(12px);
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                :host(.open) {
                    display: flex;
                    opacity: 1;
                }
                .modal-container {
                    background: rgba(15, 15, 20, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 24px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                }
                .modal-header {
                    padding: 1.5rem 2rem;
                    background: transparent;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .modal-title {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: white;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                }
                .close-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: rgba(255, 255, 255, 0.05);
                    color: #a0a0a0;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    transform: rotate(90deg);
                }
                .modal-body {
                    padding: 2rem;
                    overflow-y: auto;
                    flex: 1;
                    font-family: 'Inter', sans-serif;
                }
                .tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 1rem;
                }
                .tab {
                    padding: 0.5rem 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 9999px;
                    color: #a0a0a0;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;
                    font-size: 0.875rem;
                }
                .tab:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.1);
                }
                .tab.active {
                    color: #ccff00;
                    background: rgba(204, 255, 0, 0.1);
                    border-color: #ccff00;
                    font-weight: 600;
                }
                .tab-content {
                    display: none;
                }
                .tab-content.active {
                    display: block;
                }
                .code-block {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    padding: 1rem;
                    margin: 1rem 0;
                    position: relative;
                }
                .code-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .code-title {
                    color: #60a5fa;
                    font-size: 0.875rem;
                    font-weight: 600;
                }
                .copy-btn {
                    padding: 0.5rem 1rem;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    color: #60a5fa;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                }
                .copy-btn:hover {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: rgba(59, 130, 246, 0.5);
                }
                .copy-btn.copied {
                    background: rgba(34, 197, 94, 0.1);
                    border-color: rgba(34, 197, 94, 0.3);
                    color: #4ade80;
                }
                .copy-btn.copy-error {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.3);
                    color: #f87171;
                }
                pre {
                    margin: 0;
                    padding: 0;
                    overflow-x: auto;
                }
                code {
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    font-size: 0.875rem;
                    line-height: 1.6;
                    color: #e5e7eb;
                }
                .info-box {
                    background: rgba(59, 130, 246, 0.1);
                    border-left: 3px solid #3b82f6;
                    padding: 1rem;
                    border-radius: 4px;
                    margin: 1rem 0;
                }
                .info-box p {
                    margin: 0.5rem 0;
                    color: #e5e7eb;
                    font-size: 0.875rem;
                }
                .warning-box {
                    background: rgba(245, 158, 11, 0.1);
                    border-left: 3px solid #f59e0b;
                    padding: 1rem;
                    border-radius: 4px;
                    margin: 1rem 0;
                }
                .warning-box p {
                    margin: 0.5rem 0;
                    color: #e5e7eb;
                    font-size: 0.875rem;
                }

                /* Custom Scrollbar */
                ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                .step {
                    margin-bottom: 1.5rem;
                }
                .step-number {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    background: #3b82f6;
                    color: white;
                    border-radius: 50%;
                    font-weight: 600;
                    font-size: 0.875rem;
                    margin-right: 0.5rem;
                }

                @media (max-width: 768px) {
                    .modal-container {
                        width: 95%;
                        max-height: 95vh;
                        border-radius: 12px;
                    }
                    .modal-header {
                        padding: 1.25rem 1.5rem;
                    }
                    .modal-title {
                        font-size: 1.25rem;
                    }
                    .modal-body {
                        padding: 1.5rem;
                    }
                    .tabs {
                        gap: 0.375rem;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    .tab {
                        font-size: 0.8125rem;
                        padding: 0.625rem 1rem;
                        white-space: nowrap;
                        flex-shrink: 0;
                    }
                    .section-title {
                        font-size: 1rem;
                    }
                    .code-block {
                        font-size: 0.8125rem;
                    }
                }

                @media (max-width: 640px) {
                    .modal-container {
                        width: 100%;
                        height: 100%;
                        max-height: 100dvh;
                        border-radius: 0;
                    }
                    .modal-header {
                        padding: 1rem 1.25rem;
                        padding-top: calc(1rem + env(safe-area-inset-top));
                    }
                    .modal-title {
                        font-size: 1.125rem;
                    }
                    .close-btn {
                        width: 28px;
                        height: 28px;
                        font-size: 1.125rem;
                    }
                    .modal-body {
                        padding: 1.25rem;
                    }
                    .tabs {
                        gap: 0.25rem;
                        padding-bottom: 0.5rem;
                    }
                    .tab {
                        font-size: 0.75rem;
                        padding: 0.5rem 0.75rem;
                        border-radius: 6px;
                    }
                    .section-title {
                        font-size: 0.9375rem;
                    }
                    .section-description {
                        font-size: 0.8125rem;
                    }
                    .code-block {
                        font-size: 0.75rem;
                        border-radius: 6px;
                    }
                    .code-header {
                        padding: 0.625rem 0.875rem;
                        font-size: 0.6875rem;
                    }
                    .copy-btn {
                        padding: 0.375rem 0.625rem;
                        font-size: 0.6875rem;
                    }
                    pre {
                        padding: 0.875rem;
                    }
                    .step {
                        margin-bottom: 1.25rem;
                    }
                    .step-number {
                        width: 24px;
                        height: 24px;
                        font-size: 0.75rem;
                    }
                    .info-box, .warning-box {
                        padding: 0.75rem;
                        font-size: 0.8125rem;
                        margin: 0.75rem 0;
                    }
                    .info-box p, .warning-box p {
                        font-size: 0.8125rem;
                    }
                }

                @media (max-width: 480px) {
                    .modal-header {
                        padding: 0.875rem 1rem;
                    }
                    .modal-title {
                        font-size: 1rem;
                    }
                    .close-btn {
                        width: 24px;
                        height: 24px;
                        font-size: 1rem;
                    }
                    .modal-body {
                        padding: 1rem;
                    }
                    .tabs {
                        gap: 0.25rem;
                    }
                    .tab {
                        font-size: 0.6875rem;
                        padding: 0.5rem 0.625rem;
                    }
                    .section-title {
                        font-size: 0.875rem;
                        margin-bottom: 0.75rem;
                    }
                    .section-description {
                        font-size: 0.75rem;
                        margin-bottom: 0.875rem;
                    }
                    .code-block {
                        font-size: 0.6875rem;
                    }
                    .code-header {
                        padding: 0.5rem 0.75rem;
                        font-size: 0.625rem;
                    }
                    .copy-btn {
                        padding: 0.25rem 0.5rem;
                        font-size: 0.625rem;
                    }
                    pre {
                        padding: 0.75rem;
                        font-size: 0.6875rem;
                    }
                    .step {
                        margin-bottom: 1rem;
                    }
                    .step-number {
                        width: 22px;
                        height: 22px;
                        font-size: 0.6875rem;
                        margin-right: 0.375rem;
                    }
                    .info-box, .warning-box {
                        padding: 0.625rem;
                        margin: 0.625rem 0;
                    }
                    .info-box p, .warning-box p {
                        font-size: 0.75rem;
                        margin: 0.375rem 0;
                    }
                }

                @media (max-height: 600px) and (orientation: landscape) {
                    .modal-container {
                        max-height: 98vh;
                    }
                    .modal-header {
                        padding: 0.75rem 1rem;
                    }
                    .modal-body {
                        padding: 1rem;
                    }
                    .section {
                        margin-bottom: 1.5rem;
                    }
                }
                
                .icon {
                    width: 1.25rem;
                    height: 1.25rem;
                    stroke-width: 2;
                }
                
                .icon-lg {
                    width: 1.5rem;
                    height: 1.5rem;
                    stroke-width: 2;
                }
                
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
            </style>
            
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title">${createElement(Package, {class: "icon-lg"}).outerHTML} Exportar a tu Proyecto</h2>
                    <button class="close-btn" id="close-btn">${createElement(X, {class: "icon"}).outerHTML}</button>
                </div>
                <div class="modal-body">
                    <div class="tabs">
                        <button class="tab active" data-tab="vanilla">HTML/JS</button>
                        <button class="tab" data-tab="react">React</button>
                        <button class="tab" data-tab="vue">Vue 3</button>
                        <button class="tab" data-tab="angular">Angular</button>
                        <button class="tab" data-tab="optimizations">Optimizaciones</button>
                    </div>
                    
                    <div class="tab-content active" id="vanilla-content"></div>
                    <div class="tab-content" id="react-content"></div>
                    <div class="tab-content" id="vue-content"></div>
                    <div class="tab-content" id="angular-content"></div>
                    <div class="tab-content" id="optimizations-content"></div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Configura todos los event listeners del modal
     */
    setupEventListeners() {
        const closeBtn = this.shadowRoot.getElementById('close-btn');
        closeBtn.addEventListener('click', () => this.close());

        const modalContainer = this.shadowRoot.querySelector('.modal-container');
        
        this.addEventListener('click', (e) => {
            if (e.target === this) {
                this.close();
            }
        });

        modalContainer.addEventListener('click', (e) => {
            let target = e.target;
            if (target && typeof target.closest !== 'function' && target.parentElement) {
                target = target.parentElement;
            }

            const copyBtn = typeof target?.closest === 'function'
                ? target.closest('.copy-btn')
                : null;
            if (copyBtn) {
                this.copyCode(copyBtn);
                e.stopPropagation();
                return;
            }

            e.stopPropagation();
        });

        const tabs = this.shadowRoot.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabId = tab.dataset.tab;
                this.shadowRoot.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                this.shadowRoot.getElementById(`${tabId}-content`).classList.add('active');
            });
        });
    }

    /**
     * Abre el modal con la configuración proporcionada
     * @param {Object} config - Configuración del gradiente a exportar
     */
    open(config) {
        this.config = config;
        this.codeBlocks = new Map();
        this.generateContent();
        this.classList.add('open');
    }

    /**
     * Cierra el modal
     */
    close() {
        this.classList.remove('open');
    }

    /**
     * Genera el contenido de todas las pestañas del modal
     */
    generateContent() {
        this.generateVanillaContent();
        this.generateReactContent();
        this.generateVueContent();
        this.generateAngularContent();
        this.generateOptimizationsContent();
    }

    /**
     * Procesa el código fuente TSL para asegurar que exporte 'main'
     * @param {string} tslSource - Código fuente original
     * @returns {string} Código fuente procesado
     */
    processTSLSource(tslSource) {
        if (!tslSource) return '// TSL Source not available';
        
        // Case 1: export const somethingTSL = main; -> export { main };
        if (/export const \w+TSL = main;/.test(tslSource)) {
            return tslSource.replace(/export const \w+TSL = main;/, 'export { main };');
        }
        
        // Case 2: export const somethingTSL = Fn(...) -> export const main = Fn(...)
        return tslSource.replace(/export const \w+TSL =/, 'export const main =');
    }

    generateVanillaContent() {
        const container = this.shadowRoot.getElementById('vanilla-content');
        const tslSource = this.processTSLSource(this.config.tslSource);

        const commonUniformsCode = this.getCommonUniformsCode();

        container.innerHTML = `
            <div class="section">
                <h3 class="section-title">${createElement(Rocket, {class: "icon"}).outerHTML} Implementación HTML/JS (WebGPU)</h3>
                <p class="section-description">
                    Implementación moderna usando Three.js WebGPURenderer y TSL.
                </p>
                
                <div class="step">
                    <span class="step-number">1</span>
                    <strong>Instalar dependencias</strong>
                </div>
                <p class="info-box">Ejecuta el siguiente comando para instalar Three.js y las utilidades de color:</p>
                ${this.createCodeBlock('bash', 'npm install three culori', 'Terminal')}
                
                <div class="step">
                    <span class="step-number">2</span>
                    <strong>Common Uniforms</strong>
                </div>
                <p class="info-box">Crea este archivo para compartir variables entre shaders.</p>
                ${this.createCodeBlock('javascript', commonUniformsCode, 'commonUniforms.js')}

                <div class="step">
                    <span class="step-number">3</span>
                    <strong>Shader Node (TSL)</strong>
                </div>
                <p class="info-box">Copia este código que contiene la lógica del shader.</p>
                ${this.createCodeBlock('javascript', tslSource, 'shaderNode.js')}

                <div class="step">
                    <span class="step-number">4</span>
                    <strong>HTML Structure</strong>
                </div>
                
                ${this.createCodeBlock('html', this.generateHTMLCode(), 'index.html')}
                
                <div class="step">
                    <span class="step-number">5</span>
                    <strong>JavaScript Implementation</strong>
                </div>
                
                ${this.createCodeBlock('javascript', this.generateVanillaJS(), 'main.js')}
            </div>
        `;
    }

    getCommonUniformsCode() {
        return `import { Vector2, Color } from 'three';
import { uniform } from 'three/tsl';

// Common Uniforms shared across TSL shaders
export const u_time = uniform(0);
export const u_resolution = uniform(new Vector2(1, 1));
export const u_mouse = uniform(new Vector2(0.5, 0.5));

// Colors
export const u_color1 = uniform(new Color(0xff0000));
export const u_color2 = uniform(new Color(0x00ff00));
export const u_color3 = uniform(new Color(0x0000ff));
export const u_color4 = uniform(new Color(0xffff00));

// Common Parameters
export const u_speed = uniform(1.0);
export const u_intensity = uniform(1.0);
export const u_scale = uniform(1.0);
export const u_brightness = uniform(0.0);
export const u_contrast = uniform(1.0);
export const u_noise = uniform(0.0);

// Specific Parameters
export const u_wave_amplitude = uniform(0.4);
export const u_wave_frequency = uniform(2.5);
export const u_zoom = uniform(3.0);
export const u_stripe_width = uniform(8.0);
export const u_stripe_speed = uniform(0.8);
export const u_noise_scale = uniform(2.0);
export const u_octaves = uniform(4.0);
export const u_persistence = uniform(0.5);
export const u_lacunarity = uniform(2.0);
export const u_rotation = uniform(0.0);
export const u_distortion = uniform(0.6);
export const u_grid_size = uniform(3.0);
export const u_glow = uniform(1.0);
export const u_offset_x = uniform(0.0);
export const u_offset_y = uniform(0.0);
export const u_sun_size = uniform(0.25);
export const u_core_size = uniform(1.0);
export const u_spiral_density = uniform(3.0);
export const u_star_density = uniform(50.0);
export const u_cell_density = uniform(8.0);
export const u_border_width = uniform(0.1);`;
    }

    generateWebGPUContent() {
        // Deprecated
    }

    generateWebGPUJS() {
        // Deprecated
    }

    generateReactContent() {
        const container = this.shadowRoot.getElementById('react-content');
        const tslSource = this.processTSLSource(this.config.tslSource);
        const commonUniformsCode = this.getCommonUniformsCode();

        container.innerHTML = `
            <div class="section">
                <h3 class="section-title">${createElement(Atom, {class: "icon"}).outerHTML} Implementación React (WebGPU)</h3>
                <p class="section-description">
                    Hook personalizado para integrar el gradiente en componentes React usando WebGPU.
                </p>
                
                <div class="step">
                    <span class="step-number">1</span>
                    <strong>Instalar dependencias</strong>
                </div>
                <p class="info-box">Ejecuta el siguiente comando para instalar Three.js y las utilidades de color:</p>
                ${this.createCodeBlock('bash', 'npm install three culori', 'Terminal')}

                <div class="step">
                    <span class="step-number">2</span>
                    <strong>Common Uniforms</strong>
                </div>
                <p class="info-box">Crea este archivo para compartir variables entre shaders.</p>
                ${this.createCodeBlock('javascript', commonUniformsCode, 'commonUniforms.js')}

                <div class="step">
                    <span class="step-number">3</span>
                    <strong>Shader Node (TSL)</strong>
                </div>
                <p class="info-box">Copia este código que contiene la lógica del shader.</p>
                ${this.createCodeBlock('javascript', tslSource, 'shaderNode.js')}
                
                <div class="step">
                    <span class="step-number">4</span>
                    <strong>Custom Hook</strong>
                </div>
                
                ${this.createCodeBlock('javascript', this.generateReactHook(), 'useGradientBackground.js')}
                
                <div class="step">
                    <span class="step-number">5</span>
                    <strong>Uso en Componente</strong>
                </div>
                
                ${this.createCodeBlock('jsx', this.generateReactUsage(), 'App.jsx')}
                
                <div class="warning-box">
                    <p><strong>${createElement(AlertTriangle, {class: "icon"}).outerHTML} Importante:</strong> Asegúrate de limpiar los recursos en el cleanup de useEffect</p>
                </div>
            </div>
        `;
    }

    generateVueContent() {
        const container = this.shadowRoot.getElementById('vue-content');
        const tslSource = this.processTSLSource(this.config.tslSource);
        const commonUniformsCode = this.getCommonUniformsCode();

        container.innerHTML = `
            <div class="section">
                <h3 class="section-title">${createElement(Layers, {class: "icon"}).outerHTML} Implementación Vue 3 (WebGPU)</h3>
                <p class="section-description">
                    Composable para Vue 3 con Composition API usando WebGPU.
                </p>
                
                <div class="step">
                    <span class="step-number">1</span>
                    <strong>Instalar dependencias</strong>
                </div>
                <p class="info-box">Ejecuta el siguiente comando para instalar Three.js y las utilidades de color:</p>
                ${this.createCodeBlock('bash', 'npm install three culori', 'Terminal')}

                <div class="step">
                    <span class="step-number">2</span>
                    <strong>Common Uniforms</strong>
                </div>
                <p class="info-box">Crea este archivo para compartir variables entre shaders.</p>
                ${this.createCodeBlock('javascript', commonUniformsCode, 'commonUniforms.js')}

                <div class="step">
                    <span class="step-number">3</span>
                    <strong>Shader Node (TSL)</strong>
                </div>
                <p class="info-box">Copia este código que contiene la lógica del shader.</p>
                ${this.createCodeBlock('javascript', tslSource, 'shaderNode.js')}
                
                <div class="step">
                    <span class="step-number">4</span>
                    <strong>Composable</strong>
                </div>
                
                ${this.createCodeBlock('javascript', this.generateVueComposable(), 'useGradientBackground.js')}
                
                <div class="step">
                    <span class="step-number">5</span>
                    <strong>Uso en Componente</strong>
                </div>
                
                ${this.createCodeBlock('vue', this.generateVueUsage(), 'App.vue')}
            </div>
        `;
    }

    generateAngularContent() {
        const container = this.shadowRoot.getElementById('angular-content');
        const tslSource = this.processTSLSource(this.config.tslSource);
        const commonUniformsCode = this.getCommonUniformsCode();

        container.innerHTML = `
            <div class="section">
                <h3 class="section-title">${createElement(Hexagon, {class: "icon"}).outerHTML} Implementación Angular (WebGPU)</h3>
                <p class="section-description">
                    Servicio y directiva para integrar el gradiente en Angular usando WebGPU.
                </p>
                
                <div class="step">
                    <span class="step-number">1</span>
                    <strong>Instalar dependencias</strong>
                </div>
                <p class="info-box">Ejecuta el siguiente comando para instalar Three.js y las utilidades de color:</p>
                ${this.createCodeBlock('bash', 'npm install three culori\nnpm install --save-dev @types/three', 'Terminal')}

                <div class="step">
                    <span class="step-number">2</span>
                    <strong>Common Uniforms</strong>
                </div>
                <p class="info-box">Crea este archivo para compartir variables entre shaders.</p>
                ${this.createCodeBlock('javascript', commonUniformsCode, 'commonUniforms.js')}

                <div class="step">
                    <span class="step-number">3</span>
                    <strong>Shader Node (TSL)</strong>
                </div>
                <p class="info-box">Copia este código que contiene la lógica del shader.</p>
                ${this.createCodeBlock('javascript', tslSource, 'shaderNode.js')}
                
                <div class="step">
                    <span class="step-number">4</span>
                    <strong>Servicio de Gradiente</strong>
                </div>
                
                ${this.createCodeBlock('typescript', this.generateAngularService(), 'gradient-background.service.ts')}
                
                <div class="step">
                    <span class="step-number">5</span>
                    <strong>Directiva</strong>
                </div>
                
                ${this.createCodeBlock('typescript', this.generateAngularDirective(), 'gradient-background.directive.ts')}
                
                <div class="step">
                    <span class="step-number">6</span>
                    <strong>Uso en Componente</strong>
                </div>
                
                ${this.createCodeBlock('typescript', this.generateAngularUsage(), 'app.component.ts')}
                
                <div class="info-box">
                    <p><strong>${createElement(Lightbulb, {class: "icon"}).outerHTML} Nota:</strong> Este código usa Angular 19+ con Signals y standalone components.</p>
                </div>
            </div>
        `;
    }

    generateOptimizationsContent() {
        const container = this.shadowRoot.getElementById('optimizations-content');
        container.innerHTML = `
            <div class="section">
                <h3 class="section-title">${createElement(Zap, {class: "icon"}).outerHTML} Optimizaciones de Rendimiento</h3>
                
                <div class="step">
                    <span class="step-number">1</span>
                    <strong>Lazy Loading del Shader</strong>
                </div>
                
                ${this.createCodeBlock('javascript', this.generateLazyLoading(), 'lazyGradient.js')}
                
                <div class="step">
                    <span class="step-number">2</span>
                    <strong>Reducir Cálculos en Móviles</strong>
                </div>
                
                ${this.createCodeBlock('javascript', this.generateMobileOptimization(), 'mobileOptimization.js')}
                
                <div class="step">
                    <span class="step-number">3</span>
                    <strong>Pausar en Pestaña Inactiva</strong>
                </div>
                
                ${this.createCodeBlock('javascript', this.generateVisibilityAPI(), 'visibilityOptimization.js')}
                
                <div class="info-box">
                    <p><strong>${createElement(BarChart, {class: "icon"}).outerHTML} Métricas de Rendimiento:</strong></p>
                    <p>• FPS Target: 60fps</p>
                    <p>• GPU Usage: ~5-10% (según complejidad del shader)</p>
                    <p>• Memory: ~10-20MB</p>
                </div>
            </div>
        `;
    }

    /**
     * Crea un bloque de código con botón de copiar
     * @param {string} language - Lenguaje del código
     * @param {string} code - Código a mostrar
     * @param {string} title - Título del bloque
     * @returns {string} HTML del bloque de código
     */
    createCodeBlock(language, code, title) {
        const blockId = `code-${Math.random().toString(36).substr(2, 9)}`;
        
        if (!this.codeBlocks) {
            this.codeBlocks = new Map();
        }
        this.codeBlocks.set(blockId, code);
        
        return `
            <div class="code-block">
                <div class="code-header">
                    <span class="code-title">${title}</span>
                    <button class="copy-btn" data-block-id="${blockId}">
                        ${createElement(Clipboard, {class: "icon"}).outerHTML} Copiar
                    </button>
                </div>
                <pre><code>${this.escapeHtml(code)}</code></pre>
            </div>
        `;
    }

    /**
     * Copia el código al portapapeles usando múltiples métodos de fallback
     * @param {HTMLButtonElement} button - Botón que desencadenó la acción
     */
    async copyCode(button) {
        const blockId = button.getAttribute('data-block-id');
        const code = this.codeBlocks.get(blockId);
        
        if (!code) {
            console.error('No se encontró el código para copiar');
            this.showCopyError(button);
            return;
        }

        let success = false;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(code);
                success = true;
            } catch (err) {
                console.error('Clipboard API error:', err);
            }
        }

        if (!success) {
            success = this.copyUsingCopyEvent(code);
        }

        if (!success) {
            success = this.copyUsingTextarea(code);
        }

        if (success) {
            this.showCopySuccess(button);
        } else {
            this.showCopyError(button);
        }
    }
    
    copyUsingCopyEvent(text) {
        if (typeof document === 'undefined') {
            return false;
        }

        const handleCopy = (event) => {
            if (!event.clipboardData) {
                return;
            }
            event.preventDefault();
            event.clipboardData.setData('text/plain', text);
        };

        document.addEventListener('copy', handleCopy, { once: true });

        let successful = false;
        try {
            successful = document.execCommand('copy');
        } catch (err) {
            console.error('execCommand copy error:', err);
            successful = false;
        }

        if (!successful) {
            document.removeEventListener('copy', handleCopy);
        }

        return successful;
    }

    /**
     * Método de fallback para copiar usando textarea temporal
     * @param {string} text - Texto a copiar
     * @returns {boolean} True si tuvo éxito
     */
    copyUsingTextarea(text) {
        if (typeof document === 'undefined' || !document.body) {
            return false;
        }

        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';

        document.body.appendChild(textArea);

        try {
            if (typeof textArea.focus === 'function') {
                try {
                    textArea.focus({ preventScroll: true });
                } catch (_) {
                    textArea.focus();
                }
            }
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (err) {
            console.error('Textarea copy error:', err);
            document.body.removeChild(textArea);
            return false;
        }
    }
    
    /**
     * Muestra feedback visual de copiado exitoso
     * @param {HTMLButtonElement} button - Botón a actualizar
     */
    showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = `${createElement(Check, {class: "icon"}).outerHTML} Copiado!`;
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    }

    /**
     * Muestra feedback visual de error al copiar
     * @param {HTMLButtonElement} button - Botón a actualizar
     */
    showCopyError(button) {
        const originalText = button.innerHTML;
        button.innerHTML = `${createElement(AlertCircle, {class: "icon"}).outerHTML} Error`;
        button.classList.add('copy-error');

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copy-error');
        }, 2500);
    }

    /**
     * Escapa caracteres HTML para mostrar código de forma segura
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Normaliza el array de colores asegurando valores válidos
     * @param {Array} colors - Array de colores a normalizar
     * @returns {Array} Array de colores normalizados
     */
    normalizeColors(colors = []) {
        const defaults = [
            { l: 0.7, c: 0.25, h: 330 },
            { l: 0.6, c: 0.3, h: 280 },
            { l: 0.8, c: 0.2, h: 150 },
            { l: 0.65, c: 0.28, h: 60 },
        ];

        const parseChannel = (value, fallbackValue) => {
            const numeric = Number.parseFloat(value);
            return Number.isFinite(numeric) ? numeric : fallbackValue;
        };

        return defaults.map((fallback, index) => {
            const entry = colors[index];
            const oklch = entry?.oklch ?? entry;
            if (!oklch) {
                return { ...fallback };
            }

            return {
                l: parseChannel(oklch.l, fallback.l),
                c: parseChannel(oklch.c, fallback.c),
                h: parseChannel(oklch.h, fallback.h),
            };
        });
    }

    /**
     * Formatea un color OKLCH para exportar como código
     * @param {Object} color - Color en formato OKLCH
     * @returns {string} Color formateado como código JavaScript
     */
    formatColorForExport(color) {
        return `{ l: ${color.l.toFixed(3)}, c: ${color.c.toFixed(3)}, h: ${color.h.toFixed(1)} }`;
    }

    /**
     * Formatea un valor de uniform para exportar como código
     * @param {*} value - Valor a formatear
     * @returns {string|number} Valor formateado
     */
    formatUniformValue(value) {
        if (typeof value === 'number') {
            return Number.isInteger(value) ? value : Number(value);
        }

        const numeric = Number(value);
        if (Number.isFinite(numeric)) {
            return Number.isInteger(numeric) ? numeric : numeric;
        }

        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }

        if (Array.isArray(value)) {
            return `[${value.map(item => this.formatUniformValue(item)).join(', ')}]`;
        }

        return JSON.stringify(value);
    }

    // Code generators
    generateHTMLCode() {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Animated Gradient Background</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100%;
            height: 100%;
        }
        #gradient-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }
    </style>
</head>
<body>
    <canvas id="gradient-canvas"></canvas>
    <script type="module" src="main.js"></script>
</body>
</html>`;
    }

    /**
     * Genera código JavaScript vanilla para el gradiente
     * @returns {string} Código JavaScript completo
     */
    generateVanillaJS() {
        const { colors, speed, parameters } = this.config;
        const normalizedColors = this.normalizeColors(colors);
        const colorStrings = normalizedColors.map(color => this.formatColorForExport(color));

        return `import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import * as culori from 'culori';
import { main } from './shaderNode.js';
import { 
    u_time, u_resolution, u_speed, 
    u_color1, u_color2, u_color3, u_color4,
    ${Object.keys(parameters || {}).map(k => 'u_' + k).join(', ')} 
} from './commonUniforms.js';

class WebGPUGradient {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.init();
        this.animate();
    }

    async init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
        this.camera.position.z = 1;

        // WebGPU Renderer
        this.renderer = new WebGPURenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        await this.renderer.init();

        // Setup Uniforms
        u_speed.value = ${this.formatUniformValue(speed ?? 0.5)};
        u_color1.value = this.oklchToThree(${colorStrings[0]});
        u_color2.value = this.oklchToThree(${colorStrings[1]});
        u_color3.value = this.oklchToThree(${colorStrings[2]});
        u_color4.value = this.oklchToThree(${colorStrings[3]});
        
        ${Object.entries(parameters || {}).map(([key, value]) => `u_${key}.value = ${this.formatUniformValue(value)};`).join('\n        ')}

        // Material
        const material = new MeshBasicNodeMaterial();
        material.colorNode = main();

        const geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        this.clock = new THREE.Clock();
        window.addEventListener('resize', this.onResize.bind(this));
    }

    oklchToThree(oklch) {
        const rgb = culori.rgb({ mode: 'oklch', ...oklch });
        return new THREE.Color(rgb.r, rgb.g, rgb.b);
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const pixelRatio = this.renderer.getPixelRatio();
        u_resolution.value.set(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        u_time.value = this.clock.getElapsedTime();
        this.renderer.render(this.scene, this.camera);
    }
}

new WebGPUGradient('gradient-canvas');`;
    }

    generateReactHook() {
        const { colors, speed, parameters } = this.config;
        const normalizedColors = this.normalizeColors(colors);
        const colorStrings = normalizedColors.map(color => this.formatColorForExport(color));

        return `import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import * as culori from 'culori';
import { main } from './shaderNode.js';
import { 
    u_time, u_resolution, u_speed, 
    u_color1, u_color2, u_color3, u_color4,
    ${Object.keys(parameters || {}).map(k => 'u_' + k).join(', ')} 
} from './commonUniforms.js';

export function useGradientBackground() {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        let isMounted = true;
        let animationId;
        let resizeHandler;

        const init = async () => {
            // Scene & Camera
            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
            camera.position.z = 1;

            // Renderer
            const renderer = new WebGPURenderer({
                canvas: canvasRef.current,
                antialias: true,
                alpha: false
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            try {
                await renderer.init();
            } catch (error) {
                console.error('Failed to initialize WebGPURenderer:', error);
                return;
            }

            if (!isMounted) {
                renderer.dispose();
                return;
            }
            
            rendererRef.current = renderer;

            // Helper function
            const oklchToThree = (oklch) => {
                const rgb = culori.rgb({ mode: 'oklch', ...oklch });
                return new THREE.Color(rgb.r, rgb.g, rgb.b);
            };

            // Setup Uniforms
            u_speed.value = ${this.formatUniformValue(speed ?? 0.5)};
            u_color1.value = oklchToThree(${colorStrings[0]});
            u_color2.value = oklchToThree(${colorStrings[1]});
            u_color3.value = oklchToThree(${colorStrings[2]});
            u_color4.value = oklchToThree(${colorStrings[3]});
            
            ${Object.entries(parameters || {}).map(([key, value]) => `u_${key}.value = ${this.formatUniformValue(value)};`).join('\n            ')}

            // Material
            const material = new MeshBasicNodeMaterial();
            material.colorNode = main();

            // Mesh
            const geometry = new THREE.PlaneGeometry(2, 2);
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            // Animation
            const clock = new THREE.Clock();
            const animate = () => {
                if (!isMounted) return;
                animationId = requestAnimationFrame(animate);
                u_time.value = clock.getElapsedTime();
                renderer.render(scene, camera);
            };
            animate();

            // Resize Handler
            resizeHandler = () => {
                if (!isMounted || !renderer) return;
                renderer.setSize(window.innerWidth, window.innerHeight);
                const pixelRatio = renderer.getPixelRatio();
                u_resolution.value.set(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
            };
            window.addEventListener('resize', resizeHandler);
        };

        init();

        // Cleanup
        return () => {
            isMounted = false;
            if (animationId) cancelAnimationFrame(animationId);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
        };
    }, []);

    return canvasRef;
}`;
    }

    generateReactUsage() {
        return `import { useGradientBackground } from './useGradientBackground';

function App() {
    const canvasRef = useGradientBackground();

    return (
        <div className="App" style={{ width: '100vw', height: '100vh'}}>
            <canvas ref={canvasRef} style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1
            }} />
            
            <main style={{ position: 'relative', zIndex: 1, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
                <h1>Mi Aplicación React</h1>
            </main>
        </div>
    );
}

export default App;`;
    }

    generateVueComposable() {
        const { colors, speed, parameters } = this.config;
        const normalizedColors = this.normalizeColors(colors);
        const colorStrings = normalizedColors.map(color => this.formatColorForExport(color));

        return `import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import * as culori from 'culori';
import { main } from './shaderNode.js';
import { 
    u_time, u_resolution, u_speed, 
    u_color1, u_color2, u_color3, u_color4,
    ${Object.keys(parameters || {}).map(k => 'u_' + k).join(', ')} 
} from './commonUniforms.js';

export function useGradientBackground() {
    const canvasRef = ref(null);
    let renderer, scene, camera, material, mesh, clock, animationId;

    const oklchToThree = (oklch) => {
        const rgb = culori.rgb({ mode: 'oklch', ...oklch });
        return new THREE.Color(rgb.r, rgb.g, rgb.b);
    };

    const init = async () => {
        if (!canvasRef.value) return;

        // Scene
        scene = new THREE.Scene();
        
        // Camera
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
        camera.position.z = 1;

        // Renderer
        renderer = new WebGPURenderer({
            canvas: canvasRef.value,
            antialias: true,
            alpha: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        await renderer.init();

        // Setup Uniforms
        u_speed.value = ${this.formatUniformValue(speed ?? 0.5)};
        u_color1.value = oklchToThree(${colorStrings[0]});
        u_color2.value = oklchToThree(${colorStrings[1]});
        u_color3.value = oklchToThree(${colorStrings[2]});
        u_color4.value = oklchToThree(${colorStrings[3]});
        
        ${Object.entries(parameters || {}).map(([key, value]) => `u_${key}.value = ${this.formatUniformValue(value)};`).join('\n        ')}

        // Material
        material = new MeshBasicNodeMaterial();
        material.colorNode = main();

        // Mesh
        const geometry = new THREE.PlaneGeometry(2, 2);
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Animation
        clock = new THREE.Clock();
        animate();

        window.addEventListener('resize', onResize);
    };

    const animate = () => {
        animationId = requestAnimationFrame(animate);
        u_time.value = clock.getElapsedTime();
        renderer.render(scene, camera);
    };

    const onResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        const pixelRatio = renderer.getPixelRatio();
        u_resolution.value.set(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
    };

    const cleanup = () => {
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onResize);
        
        if (renderer) renderer.dispose();
    };

    onMounted(() => {
        init();
    });

    onUnmounted(() => {
        cleanup();
    });

    return { canvasRef };
}`;
    }

    generateVueUsage() {
        return `<template>
    <div class="app">
        <canvas ref="canvasRef" class="gradient-bg" />
        <div class="content">
            <h1>Mi App Vue</h1>
        </div>
    </div>
</template>

<script setup>
import { useGradientBackground } from './useGradientBackground';

const { canvasRef } = useGradientBackground();
</script>

<style scoped>
.gradient-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
}
.content {
    position: relative;
    z-index: 1;
    color: white;
}
</style>`;
    }

    generateAngularService() {
        const { colors, speed, parameters } = this.config;
        const normalizedColors = this.normalizeColors(colors);
        const colorStrings = normalizedColors.map(color => this.formatColorForExport(color));

        return `import { Injectable, signal, effect } from '@angular/core';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import * as culori from 'culori';
import { main } from './shaderNode.js';
import { 
    u_time, u_resolution, u_speed, 
    u_color1, u_color2, u_color3, u_color4,
    ${Object.keys(parameters || {}).map(k => 'u_' + k).join(', ')} 
} from './commonUniforms.js';

export interface GradientConfig {
    shader: string;
    speed: number;
    colors: any[];
}

@Injectable({
    providedIn: 'root'
})
export class GradientBackgroundService {
    private scene?: THREE.Scene;
    private camera?: THREE.OrthographicCamera;
    private renderer?: WebGPURenderer;
    private mesh?: THREE.Mesh;
    private clock = new THREE.Clock();
    private animationId?: number;
    
    // Signal para controlar estado
    isRunning = signal(false);

    async init(canvas: HTMLCanvasElement) {
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
        this.camera.position.z = 1;
        
        // Renderer
        this.renderer = new WebGPURenderer({
            canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        await this.renderer.init();
        
        // Setup Uniforms
        u_speed.value = ${this.formatUniformValue(speed ?? 0.5)};
        u_color1.value = this.oklchToThree(${colorStrings[0]});
        u_color2.value = this.oklchToThree(${colorStrings[1]});
        u_color3.value = this.oklchToThree(${colorStrings[2]});
        u_color4.value = this.oklchToThree(${colorStrings[3]});
        
        ${Object.entries(parameters || {}).map(([key, value]) => `u_${key}.value = ${this.formatUniformValue(value)};`).join('\n        ')}

        // Material
        const material = new MeshBasicNodeMaterial();
        material.colorNode = main();
        
        // Geometry
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
        
        this.isRunning.set(true);
        this.animate();
    }

    private oklchToThree(oklch: any): THREE.Color {
        const rgb = culori.rgb({ mode: 'oklch', ...oklch });
        return new THREE.Color(rgb.r, rgb.g, rgb.b);
    }

    private animate = () => {
        if (!this.isRunning()) return;
        
        this.animationId = requestAnimationFrame(this.animate);
        
        u_time.value = this.clock.getElapsedTime();
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    };

    onResize() {
        if (!this.camera || !this.renderer || !this.mesh) return;
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const pixelRatio = this.renderer.getPixelRatio();
        u_resolution.value.set(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
    }

    dispose() {
        this.isRunning.set(false);
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.mesh?.geometry.dispose();
        this.renderer?.dispose();
    }
}`;
    }

    generateAngularDirective() {
        return `import { Directive, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
import { GradientBackgroundService } from './gradient-background.service';

@Directive({
    selector: '[appGradientBackground]',
    standalone: true
})
export class GradientBackgroundDirective implements OnInit, OnDestroy {
    private el = inject(ElementRef);
    private gradientService = inject(GradientBackgroundService);
    private resizeHandler = () => this.gradientService.onResize();

    ngOnInit() {
        const canvas = this.el.nativeElement as HTMLCanvasElement;
        
        if (canvas.tagName === 'CANVAS') {
            this.gradientService.init(canvas);
            window.addEventListener('resize', this.resizeHandler, { passive: true });
        } else {
            console.error('GradientBackgroundDirective must be used on a canvas element');
        }
    }

    ngOnDestroy() {
        window.removeEventListener('resize', this.resizeHandler);
        this.gradientService.dispose();
    }
}`;
    }

    generateAngularUsage() {
        return `import { Component } from '@angular/core';
import { GradientBackgroundDirective } from './gradient-background.directive';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [GradientBackgroundDirective],
    template: \`
        <div class="app-container">
            <canvas 
                appGradientBackground 
                class="gradient-canvas">
            </canvas>
            
            <div class="content">
                <h1>Mi Aplicación</h1>
            </div>
        </div>
    \`,
    styles: [\`
        .gradient-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }
        
        .content {
            position: relative;
            z-index: 1;
        }
    \`]
})
export class AppComponent {
    title = 'gradient-app';
}

// En tu app.config.ts, asegúrate de proporcionar el servicio:
import { ApplicationConfig } from '@angular/core';
import { GradientBackgroundService } from './gradient-background.service';

export const appConfig: ApplicationConfig = {
    providers: [
        GradientBackgroundService
    ]
};`;
    }

    generateLazyLoading() {
        return `// Use dynamic import to load the gradient only when visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            import('./main.js'); // This will execute the code and start the gradient
            observer.disconnect();
        }
    });
}, { threshold: 0.1 });

observer.observe(document.getElementById('gradient-canvas'));`;
    }

    generateMobileOptimization() {
        return `import { u_resolution } from './commonUniforms.js';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);

renderer.setPixelRatio(pixelRatio);
u_resolution.value.set(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);`;
    }

    generateVisibilityAPI() {
        return `// Add this check inside your animate() loop
animate() {
    if (document.hidden) return; // Stop rendering when tab is not visible
    
    requestAnimationFrame(() => this.animate());
    // ... rest of your animation code
}`;
    }

}

customElements.define('export-modal', ExportModal);
