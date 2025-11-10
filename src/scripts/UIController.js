/**
 * UI Controller - Gestiona toda la interacción con la interfaz
 */

export class UIController {
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

    setupPanels() {
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        const toggleBtn = document.getElementById('toggle-panels-btn');
        const mobileAccordion = document.getElementById('mobile-accordion');
        const accordionTabs = document.querySelectorAll('.accordion-tab');
        const accordionContent = document.getElementById('accordion-content');

        let panelsVisible = true;

        // Desktop: Toggle panels behavior
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

        // Mobile: Accordion behavior
        const switchAccordionTab = (panelId) => {
            // Return current accordion content to its original panel first
            if (currentActivePanelId && accordionContent) {
                const currentPanel = document.getElementById(`${currentActivePanelId}-panel`);
                if (currentPanel) {
                    const currentChildren = Array.from(accordionContent.children);
                    currentChildren.forEach(child => {
                        currentPanel.appendChild(child);
                    });
                }
            }

            // Update tabs
            accordionTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.panel === panelId);
            });

            // Clear accordion content
            if (accordionContent) {
                accordionContent.innerHTML = '';
            }

            // Move new panel content to accordion
            const panel = document.getElementById(`${panelId}-panel`);
            if (panel && accordionContent) {
                const children = Array.from(panel.children);
                children.forEach(child => {
                    accordionContent.appendChild(child);
                });
            }

            // Update current active panel
            currentActivePanelId = panelId;
        };

        // Setup accordion tabs
        accordionTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchAccordionTab(tab.dataset.panel);
            });
        });

        // Initialize accordion with left panel content
        if (window.innerWidth <= 768) {
            switchAccordionTab('left');
        }

        // Toggle button
        toggleBtn?.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                mobileAccordion?.classList.toggle('hidden');
            } else {
                togglePanels();
            }
        });

        // Listen to panel close events (desktop only)
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

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                switchAccordionTab(accordionTabs[0]?.dataset.panel || 'left');
            }
        });
    }

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

    setupShaderSelector() {
        const selector = document.getElementById('shader-type');
        const shaders = this.shaderManager.getAvailableShaders();
        
        // Poblar selector
        selector.innerHTML = '';
        shaders.forEach(shaderName => {
            const config = this.shaderManager.getCurrentShaderConfig();
            const option = document.createElement('option');
            option.value = shaderName;
            option.textContent = shaderName.charAt(0).toUpperCase() + shaderName.slice(1);
            selector.appendChild(option);
        });

        // Evento de cambio
        selector.addEventListener('change', (e) => {
            const shaderConfig = this.shaderManager.loadShader(e.target.value);
            this.updateShaderControls(shaderConfig);
        });

        // Cargar shader inicial
        if (shaders.length > 0) {
            const initialConfig = this.shaderManager.loadShader(shaders[0]);
            this.updateShaderControls(initialConfig);
        }
    }

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

    setupColorControls() {
        // Listen to color-change events from Web Components
        document.addEventListener('color-change', (e) => {
            const { colorIndex, channel, value } = e.detail;
            this.handleColorChange(colorIndex, channel, value);
        });

        // Listen to request-preview-update events
        document.addEventListener('request-preview-update', (e) => {
            const { colorIndex } = e.detail;
            this.initializeColorComponent(colorIndex);
        });

        // Velocidad global
        document.getElementById('speed')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.shaderManager.updateUniform('u_speed', value);
            document.getElementById('speed-value').textContent = value.toFixed(1);
        });

        // Inicializar previews cuando los componentes estén listos
        // Usar setTimeout para asegurar que los componentes están montados
        setTimeout(() => {
            for (let i = 1; i <= 4; i++) {
                this.initializeColorComponent(i);
            }
        }, 100);
    }

    handleColorChange(colorIndex, channel, value) {
        // Get current values
        const color = this.colorManager.getColor(colorIndex);
        
        // Update the changed channel
        color[channel] = value;
        
        // Update color in manager
        const hex = this.colorManager.updateColor(colorIndex, color.l, color.c, color.h);
        
        // Update component preview
        const component = document.querySelector(`color-control[color-index="${colorIndex}"]`);
        if (component) {
            component.updatePreview(hex);
        }
    }

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

    setupPresets() {
        const presetBtns = document.querySelectorAll('[data-preset]');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                if (this.colorManager.setPreset(preset)) {
                    // Actualizar Web Components con nuevos valores
                    for (let i = 1; i <= 4; i++) {
                        const color = this.colorManager.getColor(i);
                        if (color) {
                            const component = document.querySelector(`color-control[color-index="${i}"]`);
                            if (component) {
                                // Update component attributes
                                component.setAttribute('l-value', color.l);
                                component.setAttribute('c-value', color.c);
                                component.setAttribute('h-value', color.h);
                                
                                // Update preview
                                const hex = this.colorManager.oklchToHex(color);
                                component.updatePreview(hex);
                            }
                        }
                    }
                }
            });
        });
    }

    setupExportButton() {
        const exportBtn = document.getElementById('export-btn');
        const exportModal = document.getElementById('export-modal');

        if (!exportBtn || !exportModal) {
            console.warn('Export button or modal not found');
            return;
        }

        exportBtn.addEventListener('click', () => {
            // Recopilar configuración actual
            const config = this.getCurrentConfiguration();
            
            // Abrir modal con la configuración
            exportModal.open(config);
        });
    }

    getCurrentConfiguration() {
        const shaderName = this.shaderManager.currentShader;
        const speedUniform = this.shaderManager?.uniforms?.u_speed;
        const speed = typeof speedUniform?.value === 'number' ? speedUniform.value : 0.5;
        
        // Obtener colores actuales
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

        // Obtener parámetros del shader actual
        const parameters = this.shaderManager.getShaderParameters(shaderName);
        
        // Obtener código del shader
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

    showNotification(message, type = 'info') {
        // Implementar notificaciones toast
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}
