/**
 * UI Controller - Gestiona toda la interacción con la interfaz
 */

export class UIController {
    /**
     * Constructor del controlador de UI
     * @param {ShaderManager} shaderManager - Instancia del gestor de shaders
     * @param {ColorManager} colorManager - Instancia del gestor de colores
     */
    constructor(shaderManager, colorManager) {
        this.shaderManager = shaderManager;
        this.colorManager = colorManager;
        this.currentShaderControls = null;
        
        this.setupPanels();
        this.setupCollapsible();
        this.setupShaderSelector();
        this.setupColorControls();
        this.setupPresets();
        this.setupExportButton();
    }

    /**
     * Configura los paneles laterales y el comportamiento de acordeón en móvil
     */
    setupPanels() {
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        const toggleBtn = document.getElementById('toggle-panels-btn');
        const mobileAccordion = document.getElementById('mobile-accordion');
        const accordionTabs = document.querySelectorAll('.accordion-tab');
        const accordionContent = document.getElementById('accordion-content');

        let panelsVisible = true;

        const togglePanels = () => {
            panelsVisible = !panelsVisible;
            if (panelsVisible) {
                leftPanel?.classList.remove('hidden');
                rightPanel?.classList.remove('hidden');
                toggleBtn?.classList.remove('visible');
            } else {
                leftPanel?.classList.add('hidden');
                rightPanel?.classList.add('hidden');
                toggleBtn?.classList.add('visible');
            }
        };

        let currentActivePanelId = null;

        const switchAccordionTab = (panelId) => {
            if (currentActivePanelId && accordionContent) {
                const currentPanel = document.getElementById(`${currentActivePanelId}-panel`);
                if (currentPanel) {
                    const currentChildren = Array.from(accordionContent.children);
                    currentChildren.forEach(child => {
                        currentPanel.appendChild(child);
                    });
                }
            }

            accordionTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.panel === panelId);
            });

            if (accordionContent) {
                accordionContent.innerHTML = '';
            }

            const panel = document.getElementById(`${panelId}-panel`);
            if (panel && accordionContent) {
                const children = Array.from(panel.children);
                children.forEach(child => {
                    accordionContent.appendChild(child);
                });
            }

            currentActivePanelId = panelId;
        };

        accordionTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchAccordionTab(tab.dataset.panel);
            });
        });

        if (window.innerWidth <= 768) {
            switchAccordionTab('left');
        }

        toggleBtn?.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                mobileAccordion?.classList.toggle('hidden');
            } else {
                togglePanels();
            }
        });

        leftPanel?.addEventListener('panel-close', () => {
            if (window.innerWidth > 768) {
                togglePanels();
            }
        });

        rightPanel?.addEventListener('panel-close', () => {
            if (window.innerWidth > 768) {
                togglePanels();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                switchAccordionTab(accordionTabs[0]?.dataset.panel || 'left');
            }
        });
    }

    /**
     * Configura el comportamiento de los headers colapsables
     */
    setupCollapsible() {
        const headers = document.querySelectorAll('.collapsible-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                if (content?.classList.contains('collapsible-content')) {
                    header.classList.toggle('collapsed');
                    content.classList.toggle('collapsed');
                }
            });
        });
    }

    /**
     * Configura el selector de shaders y carga el inicial
     */
    setupShaderSelector() {
        const selector = document.getElementById('shader-type');
        const shaders = this.shaderManager.getAvailableShaders();
        
        selector.innerHTML = '';
        shaders.forEach(shaderName => {
            const config = this.shaderManager.getCurrentShaderConfig();
            const option = document.createElement('option');
            option.value = shaderName;
            option.textContent = shaderName.charAt(0).toUpperCase() + shaderName.slice(1);
            selector.appendChild(option);
        });

        selector.addEventListener('change', (e) => {
            const shaderConfig = this.shaderManager.loadShader(e.target.value);
            this.updateShaderControls(shaderConfig);
        });

        if (shaders.length > 0) {
            const initialConfig = this.shaderManager.loadShader(shaders[0]);
            this.updateShaderControls(initialConfig);
        }
    }

    /**
     * Actualiza los controles del shader actual en la UI
     * @param {Object} shaderConfig - Configuración del shader con sus controles
     */
    updateShaderControls(shaderConfig) {
        const container = document.getElementById('shader-controls-content');
        container.innerHTML = '';

        if (!shaderConfig?.controls) return;

        shaderConfig.controls.forEach(control => {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'control-item';

            const label = document.createElement('label');
            label.className = 'text-sm font-medium text-gray-300';
            label.innerHTML = `${control.label}: <span id="${control.id}-value">${control.value}</span>`;

            const input = document.createElement('input');
            input.type = 'range';
            input.id = control.id;
            input.min = control.min;
            input.max = control.max;
            input.step = control.step;
            input.value = control.value;
            input.className = 'w-full';

            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById(`${control.id}-value`).textContent = value.toFixed(2);
                this.shaderManager.updateUniform(control.uniform, value);
            });

            controlDiv.appendChild(label);
            controlDiv.appendChild(input);
            container.appendChild(controlDiv);
        });
    }

    /**
     * Configura los controles de color y eventos de los componentes
     */
    setupColorControls() {
        document.addEventListener('color-change', (e) => {
            const { colorIndex, channel, value } = e.detail;
            this.handleColorChange(colorIndex, channel, value);
        });

        document.addEventListener('request-preview-update', (e) => {
            const { colorIndex } = e.detail;
            this.initializeColorComponent(colorIndex);
        });

        document.getElementById('speed')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.shaderManager.updateUniform('u_speed', value);
            document.getElementById('speed-value').textContent = value.toFixed(1);
        });

        setTimeout(() => {
            for (let i = 1; i <= 4; i++) {
                this.initializeColorComponent(i);
            }
        }, 100);
    }

    /**
     * Maneja el cambio de un canal de color
     * @param {number} colorIndex - Índice del color (1-4)
     * @param {string} channel - Canal modificado ('l', 'c', o 'h')
     * @param {number} value - Nuevo valor del canal
     */
    handleColorChange(colorIndex, channel, value) {
        const color = this.colorManager.getColor(colorIndex);
        color[channel] = value;
        const hex = this.colorManager.updateColor(colorIndex, color.l, color.c, color.h);
        
        const component = document.querySelector(`color-control[color-index="${colorIndex}"]`);
        if (component) {
            component.updatePreview(hex);
        }
    }

    /**
     * Inicializa el preview de un componente de color
     * @param {number} colorIndex - Índice del color (1-4)
     */
    initializeColorComponent(colorIndex) {
        const color = this.colorManager.getColor(colorIndex);
        if (color) {
            const hex = this.colorManager.updateColor(colorIndex, color.l, color.c, color.h);
            const component = document.querySelector(`color-control[color-index="${colorIndex}"]`);
            if (component) {
                component.updatePreview(hex);
            }
        }
    }

    /**
     * Configura los botones de presets de colores
     */
    setupPresets() {
        const presetBtns = document.querySelectorAll('[data-preset]');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                if (this.colorManager.setPreset(preset)) {
                    for (let i = 1; i <= 4; i++) {
                        const color = this.colorManager.getColor(i);
                        if (color) {
                            const component = document.querySelector(`color-control[color-index="${i}"]`);
                            if (component) {
                                component.setAttribute('l-value', color.l);
                                component.setAttribute('c-value', color.c);
                                component.setAttribute('h-value', color.h);
                                
                                const hex = this.colorManager.oklchToHex(color);
                                component.updatePreview(hex);
                            }
                        }
                    }
                }
            });
        });
    }

    /**
     * Configura el botón de exportación
     */
    setupExportButton() {
        const exportBtn = document.getElementById('export-btn');
        const exportModal = document.getElementById('export-modal');

        if (!exportBtn || !exportModal) {
            console.warn('Export button or modal not found');
            return;
        }

        exportBtn.addEventListener('click', () => {
            const config = this.getCurrentConfiguration();
            exportModal.open(config);
        });
    }

    /**
     * Obtiene la configuración actual completa para exportación
     * @returns {Object} Objeto con la configuración completa del gradiente
     */
    getCurrentConfiguration() {
        const shaderName = this.shaderManager.currentShader;
        const speedUniform = this.shaderManager?.uniforms?.u_speed;
        const speed = typeof speedUniform?.value === 'number' ? speedUniform.value : 0.5;
        
        const colors = [];
        for (let i = 1; i <= 4; i++) {
            const color = this.colorManager.getColor(i);
            if (color) {
                colors.push({
                    id: i,
                    oklch: { ...color }
                });
            }
        }

        const parameters = this.shaderManager.getShaderParameters(shaderName);
        const shaderCode = this.shaderManager.getShaderCode(shaderName);
        const vertexCode = this.shaderManager.getVertexShaderCode();

        return {
            shader: shaderName,
            speed: speed,
            colors: colors,
            parameters: parameters,
            shaderCode: shaderCode,
            vertexCode: vertexCode
        };
    }

    /**
     * Muestra una notificación al usuario (actualmente solo en consola)
     * @param {string} message - Mensaje a mostrar
     * @param {string} [type='info'] - Tipo de notificación (info, error, warning, success)
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}
