/**
 * UI Controller - Gestiona toda la interacción con la interfaz (HUD & Mobile)
 */

import { Info, createElement } from 'lucide';

export class UIController {
    constructor(shaderManager, colorManager) {
        this.shaderManager = shaderManager;
        this.colorManager = colorManager;

        // Cache DOM elements
        this.dock = document.querySelector('hud-dock');
        this.bottomSheet = document.querySelector('bottom-sheet');
        this.desktopPanel = document.getElementById('desktop-panel-container');
        this.templates = document.getElementById('templates');

        // State
        this.activePanelId = null;
        this.isMobile = window.innerWidth <= 768;

        this.init();
    }

    init() {
        this.setupResizeListener();
        this.setupHudListeners();
        this.setupShaderSelector();
        this.setupColorControls();
        this.setupPresets();
        this.setupExportButton();

        // Initial setup
        this.updateLayoutMode();
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            const newIsMobile = window.innerWidth <= 768;
            if (this.isMobile !== newIsMobile) {
                this.isMobile = newIsMobile;
                this.updateLayoutMode();
                // If a panel is open, re-open it in the new mode
                if (this.activePanelId) {
                    this.closePanel(); // Close current
                    // Re-opening would require logic to trigger the dock,
                    // for now let's just close it to avoid glitches.
                }
            }
        });
    }

    updateLayoutMode() {
        if (this.isMobile) {
            document.body.classList.add('mobile-mode');
        } else {
            document.body.classList.remove('mobile-mode');
        }
    }

    setupHudListeners() {
        if (!this.dock) {
            console.error('HudDock element not found');
            return;
        }

        // Listen for events from hud-dock
        this.dock.addEventListener('panel-open', (e) => {
            this.openPanel(e.detail.panel);
        });

        this.dock.addEventListener('panel-close', () => {
            this.closePanel();
        });

        this.dock.addEventListener('action', (e) => {
            this.handleAction(e.detail.action);
        });

        // Listen for bottom sheet events
        if (this.bottomSheet) {
            this.bottomSheet.addEventListener('close', () => {
                if (this.activePanelId) {
                    this.closePanel();
                    // Reset dock state
                    if (this.dock.reset) {
                        this.dock.reset();
                    }
                }
            });
        }

        // Close panel when clicking outside (Desktop)
        document.addEventListener('click', (e) => {
            if (!this.isMobile && this.activePanelId) {
                const isClickInsidePanel = this.desktopPanel.contains(e.target);
                const isClickInsideDock = this.dock.contains(e.target);

                if (!isClickInsidePanel && !isClickInsideDock) {
                    this.dock.togglePanel(
                        this.activePanelId,
                        this.dock.shadowRoot.querySelector('.dock-item.active'),
                    );
                }
            }
        });
    }

    openPanel(panelId) {
        // Prevent reopening same panel
        if (this.activePanelId === panelId) return;

        // If another panel is open, move its content back to templates first
        if (this.activePanelId) {
            const currentContent = this.isMobile
                ? this.bottomSheet.firstElementChild
                : this.desktopPanel.firstElementChild;
            if (currentContent && this.templates) {
                this.templates.appendChild(currentContent);
            }
        }

        // 1. Identify content
        const contentId = `content-${panelId === 'settings' ? 'settings' : panelId}`; // mapping 'settings' -> 'content-settings'
        const content = document.getElementById(contentId);

        if (!content) {
            console.warn(`Content not found for panel: ${panelId}`);
            return;
        }

        // 2. Move content to container
        if (this.isMobile) {
            this.bottomSheet.innerHTML = ''; // Clear previous
            this.bottomSheet.appendChild(content);
            this.bottomSheet.open();
        } else {
            this.desktopPanel.innerHTML = '';
            this.desktopPanel.appendChild(content);
            this.desktopPanel.classList.remove('hidden');

            // Position above the active dock item
            // Note: We'd need to get the rect of the active item from the shadow DOM or just center it.
            // For simplicity in this version, we'll center the panel above the dock.
            this.desktopPanel.style.bottom = '100px'; // Approx above dock
            this.desktopPanel.style.left = '50%';
            this.desktopPanel.style.transform = 'translateX(-50%)';

            // Add animation class
            this.desktopPanel.classList.add('fade-in-up');
        }

        this.activePanelId = panelId;
    }

    closePanel() {
        if (!this.activePanelId) return;

        // Move content back to templates to preserve state
        const content = this.isMobile
            ? this.bottomSheet.firstElementChild
            : this.desktopPanel.firstElementChild;
        if (content && this.templates) {
            this.templates.appendChild(content);
        }

        if (this.isMobile) {
            this.bottomSheet.close();
        } else {
            this.desktopPanel.classList.add('hidden');
            this.desktopPanel.classList.remove('fade-in-up');
        }

        this.activePanelId = null;
    }

    handleAction(action) {
        if (action === 'random') {
            this.randomize();
        } else if (action === 'export') {
            const exportModal = document.getElementById('export-modal');
            if (exportModal) {
                const config = this.getCurrentConfiguration();
                exportModal.open(config);
            }
        }
    }

    randomize() {
        // Randomize colors
        for (let i = 1; i <= 4; i++) {
            const l = parseFloat((0.5 + Math.random() * 0.4).toFixed(2));
            const c = parseFloat((0.1 + Math.random() * 0.2).toFixed(3));
            const h = Math.round(Math.random() * 360);
            this.colorManager.updateColor(i, l, c, h);

            // Update UI if visible
            const component = document.querySelector(`color-control[color-index="${i}"]`);
            if (component) {
                component.setAttribute('l-value', l);
                component.setAttribute('c-value', c);
                component.setAttribute('h-value', h);
                component.updatePreview(this.colorManager.oklchToHex({ l, c, h }));
            }
        }
    }

    setupShaderSelector() {
        const selector = document.getElementById('shader-type');
        if (!selector) return;

        const shaders = this.shaderManager.getAvailableShaders();

        // Custom names map for better presentation
        const prettyNames = {
            neon_grid: 'Synthwave Grid',
            aurora: 'Northern Lights',
            voronoi: 'Organic Cells',
            flow: 'Vanta Flow',
            clouds: 'Dream Flight',
            liquid: 'Liquid Metal',
            geometric: 'Geometric Patterns',
            galaxy: 'Cosmic Galaxy',
            stripes: 'Retro Stripes',
            mesh: 'Wireframe Mesh',
            particles: 'Starfield',
        };

        // Clear existing options if any (though custom-select starts empty)
        if (selector.clearOptions) selector.clearOptions();

        shaders.forEach((shaderName) => {
            let label = prettyNames[shaderName];
            if (!label) {
                label = shaderName
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
            selector.addOption(shaderName, label);
        });

        selector.addEventListener('change', (e) => {
            const shaderConfig = this.shaderManager.loadShader(e.detail.value);
            this.updateShaderControls(shaderConfig);
        });

        if (shaders.length > 0) {
            // Select first option without triggering event initially if needed,
            // or just load shader. CustomSelect.select triggers event.
            // Let's just load the shader manually and set the value visually.
            const initialShader = shaders[0];
            selector.value = initialShader;
            selector.updateDisplay();

            const initialConfig = this.shaderManager.loadShader(initialShader);
            this.updateShaderControls(initialConfig);
        }
    }

    updateShaderControls(shaderConfig) {
        const container = document.getElementById('shader-controls-content');
        if (!container) return;

        container.innerHTML = '';

        if (!shaderConfig?.controls) return;

        shaderConfig.controls.forEach((control) => {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'control-group';

            const labelWrapper = document.createElement('div');
            labelWrapper.className = 'control-label-wrapper';

            const label = document.createElement('label');
            label.className = 'control-label';
            label.htmlFor = control.id;
            label.innerHTML = `${control.label}: <span id="${control.id}-value">${control.value}</span>`;

            labelWrapper.appendChild(label);

            // Add info icon with tooltip if tooltip is available
            if (control.tooltip) {
                const infoButton = document.createElement('button');
                infoButton.className = 'info-icon-btn';
                infoButton.type = 'button';
                infoButton.setAttribute('aria-label', 'Más información');
                infoButton.setAttribute('data-tooltip', control.tooltip);

                const infoIcon = createElement(Info, {
                    size: 14,
                    strokeWidth: 2,
                });

                infoButton.appendChild(infoIcon);
                labelWrapper.appendChild(infoButton);
            }

            const input = document.createElement('input');
            input.type = 'range';
            input.id = control.id;
            input.min = control.min;
            input.max = control.max;
            input.step = control.step;
            input.value = control.value;

            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const valueSpan = document.getElementById(`${control.id}-value`);
                if (valueSpan) valueSpan.textContent = value.toFixed(2);
                this.shaderManager.updateUniform(control.uniform, value);
            });

            controlDiv.appendChild(labelWrapper);
            controlDiv.appendChild(input);
            container.appendChild(controlDiv);
        });
    }

    setupColorControls() {
        document.addEventListener('color-change', (e) => {
            const { colorIndex, channel, value } = e.detail;
            this.handleColorChange(colorIndex, channel, value);
        });

        document.addEventListener('request-preview-update', (e) => {
            const { colorIndex } = e.detail;
            this.initializeColorComponent(colorIndex);
        });

        const speedInput = document.getElementById('speed');
        if (speedInput) {
            speedInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.shaderManager.updateUniform('u_speed', value);
                const speedVal = document.getElementById('speed-value');
                if (speedVal) speedVal.textContent = value.toFixed(2);
            });
        }

        setTimeout(() => {
            for (let i = 1; i <= 4; i++) {
                this.initializeColorComponent(i);
            }
        }, 100);
    }

    handleColorChange(colorIndex, channel, value) {
        const color = this.colorManager.getColor(colorIndex);
        color[channel] = value;
        const hex = this.colorManager.updateColor(colorIndex, color.l, color.c, color.h);

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
        // Use event delegation for presets since they might be moved around
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-preset]');
            if (!btn) return;

            const preset = btn.dataset.preset;
            if (this.colorManager.setPreset(preset)) {
                for (let i = 1; i <= 4; i++) {
                    const color = this.colorManager.getColor(i);
                    if (color) {
                        const component = document.querySelector(
                            `color-control[color-index="${i}"]`,
                        );
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
    }

    setupExportButton() {
        const exportBtn = document.getElementById('export-btn');
        const exportModal = document.getElementById('export-modal');

        if (!exportBtn || !exportModal) return;

        exportBtn.addEventListener('click', () => {
            const config = this.getCurrentConfiguration();
            exportModal.open(config);
        });
    }

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
                    oklch: { ...color },
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
            vertexCode: vertexCode,
        };
    }
}
