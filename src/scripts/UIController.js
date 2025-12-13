/**
 * UI Controller - Gestiona toda la interacción con la interfaz (HUD & Mobile)
 */

export class UIController {
    constructor(shaderManager, colorManager, persistenceManager = null, backgroundLibraryManager = null, i18nManager = null) {
        this.shaderManager = shaderManager;
        this.colorManager = colorManager;
        this.persistence = persistenceManager;
        this.library = backgroundLibraryManager;
        this.i18n = i18nManager;
        
        // Cache DOM elements
        this.dock = document.querySelector('hud-dock');
        this.bottomSheet = document.querySelector('bottom-sheet');
        this.desktopPanel = document.getElementById('desktop-panel-container');
        this.templates = document.getElementById('templates');
        
        // State
        this.activePanelId = null;
        this.isMobile = window.innerWidth <= 768;
        this.tooltipElement = null;

        this._renderSavedBackgrounds = null;
        this._globalSpeedTooltipBound = false;
        this._languageSelectBound = false;

        this.init();
    }

    t(key, params = null, fallback = null) {
        if (!this.i18n?.t) return fallback ?? key;
        const value = this.i18n.t(key, params);
        return value ?? fallback ?? key;
    }

    getCurrentShaderName() {
        return this.shaderManager?.currentShader || null;
    }

    applyPersistedForShader(shaderName, shaderConfig) {
        if (!this.persistence || !shaderName || !shaderConfig) return;

        const persisted = this.persistence.getShaderState(shaderName);
        if (!persisted) return;

        // Apply persisted uniform values (numbers) to both shader runtime + UI config
        if (persisted.uniforms && shaderConfig.controls) {
            shaderConfig.controls.forEach(control => {
                const uniformName = control.uniform;
                const savedValue = persisted.uniforms[uniformName];
                if (typeof savedValue === 'number' && Number.isFinite(savedValue)) {
                    control.value = savedValue;
                    this.shaderManager.updateUniform(uniformName, savedValue);
                }
            });
        }

        // Apply persisted colors if present
        if (persisted.colors) {
            this.colorManager.setColors(persisted.colors);
            for (let i = 1; i <= 4; i++) {
                const color = this.colorManager.getColor(i);
                if (!color) continue;
                const component = document.querySelector(`color-control[color-index="${i}"]`);
                if (component) {
                    component.setAttribute('l-value', color.l);
                    component.setAttribute('c-value', color.c);
                    component.setAttribute('h-value', color.h);
                }
                this.initializeColorComponent(i);
            }
        }

        // Sync speed UI if present (u_speed can be persisted per shader)
        const speedInput = document.getElementById('speed');
        const speedVal = document.getElementById('speed-value');
        const savedSpeed = persisted.uniforms?.u_speed;
        if (speedInput && typeof savedSpeed === 'number' && Number.isFinite(savedSpeed)) {
            speedInput.value = String(savedSpeed);
            if (speedVal) speedVal.textContent = Math.round(savedSpeed * 100);
            this.shaderManager.updateUniform('u_speed', savedSpeed);
        }
    }

    init() {
        this.createGlobalTooltip();
        this.setupResizeListener();
        this.setupHudListeners();
        this.setupI18n();
        this.setupShaderSelector();
        this.setupColorControls();
        this.setupPresets();
        this.setupExportButton();
        this.setupSavedBackgrounds();
        
        // Initial setup
        this.updateLayoutMode();
    }

    setupI18n() {
        if (!this.i18n) return;

        this.applyI18nToDocument();

        if (this.dock?.setI18nManager) {
            this.dock.setI18nManager(this.i18n);
        }

        if (this.bottomSheet?.setI18nManager) {
            this.bottomSheet.setI18nManager(this.i18n);
        }

        this.setupGlobalSpeedTooltip();

        const refreshLanguageSelect = () => {
            const langSelect = document.getElementById('language-select');
            if (!langSelect || typeof langSelect.clearOptions !== 'function' || typeof langSelect.addOption !== 'function') return;

            const pref = this.i18n.getPreference?.() ?? 'auto';

            langSelect.clearOptions();
            langSelect.addOption('auto', this.t('language.auto', null, 'Auto'));
            langSelect.addOption('en', this.t('language.en', null, 'English'));
            langSelect.addOption('es', this.t('language.es', null, 'Español'));

            langSelect.value = pref;
            if (langSelect.updateDisplay) langSelect.updateDisplay();

            if (!this._languageSelectBound) {
                langSelect.addEventListener('change', (e) => {
                    const next = e?.detail?.value;
                    this.i18n.setPreference?.(next);
                });
                this._languageSelectBound = true;
            }
        };

        refreshLanguageSelect();

        document.addEventListener('i18n:change', () => {
            this.applyI18nToDocument();
            refreshLanguageSelect();
            this.refreshShaderSelectorOptions();

            if (this.dock?.applyTranslations) {
                this.dock.applyTranslations();
            }

            if (this.bottomSheet?.applyTranslations) {
                this.bottomSheet.applyTranslations();
            }

            this.setupGlobalSpeedTooltip();

            if (typeof this._renderSavedBackgrounds === 'function') {
                this._renderSavedBackgrounds();
            }

            // Rebuild controls so labels/tooltips update, but keep current slider values.
            const shaderConfig = this.shaderManager?.getCurrentShaderConfig?.();
            if (shaderConfig?.controls) {
                shaderConfig.controls.forEach(c => {
                    const input = document.getElementById(c.id);
                    if (!input) return;
                    const v = parseFloat(input.value);
                    if (Number.isFinite(v)) c.value = v;
                });
                this.updateShaderControls(shaderConfig);
            }
        });
    }

    setupGlobalSpeedTooltip() {
        if (this._globalSpeedTooltipBound) return;
        const infoIcon = document.getElementById('global-speed-info');
        if (!infoIcon) return;

        const show = () => {
            if (!this.tooltipElement) return;
            const rect = infoIcon.getBoundingClientRect();
            this.tooltipElement.textContent = this.t('settings.globalSpeed.tooltip', null, 'Controls the overall animation speed.');
            this.tooltipElement.classList.add('visible');

            const tooltipRect = this.tooltipElement.getBoundingClientRect();
            const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            const top = rect.top - tooltipRect.height - 8;

            this.tooltipElement.style.left = `${left}px`;
            this.tooltipElement.style.top = `${top}px`;
        };

        const hide = () => {
            if (this.tooltipElement) {
                this.tooltipElement.classList.remove('visible');
            }
        };

        infoIcon.addEventListener('mouseenter', show);
        infoIcon.addEventListener('mouseleave', hide);
        infoIcon.addEventListener('focus', show);
        infoIcon.addEventListener('blur', hide);

        this._globalSpeedTooltipBound = true;
    }

    applyI18nToDocument() {
        // textContent
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            el.textContent = this.t(key, null, el.textContent);
        });

        // placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (!key) return;
            el.setAttribute('placeholder', this.t(key, null, el.getAttribute('placeholder') || ''));
        });

        // aria-label
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (!key) return;
            el.setAttribute('aria-label', this.t(key, null, el.getAttribute('aria-label') || ''));
        });
    }

    getShaderDisplayName(shaderName) {
        const prettyNames = {
            'neon_grid': 'Synthwave Grid',
            'aurora': 'Northern Lights',
            'voronoi': 'Organic Cells',
            'flow': 'Vanta Flow',
            'clouds': 'Dream Flight',
            'liquid': 'Liquid Metal',
            'geometric': 'Geometric Patterns',
            'galaxy': 'Cosmic Galaxy',
            'stripes': 'Retro Stripes',
            'mesh': 'Wireframe Mesh',
            'particles': 'Starfield',
            'waves': 'Waves'
        };

        const base = this.shaderManager?.getShaderConfig?.(shaderName) || {};
        const localized = this.i18n?.localizeShader ? this.i18n.localizeShader(shaderName, base) : base;

        if (localized?.name) return localized.name;

        let label = prettyNames[shaderName];
        if (!label) {
            label = shaderName.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        return label;
    }

    refreshShaderSelectorOptions() {
        const selector = document.getElementById('shader-type');
        if (!selector) return;

        const shaders = this.shaderManager.getAvailableShaders();
        const current = selector.value;

        if (selector.clearOptions) selector.clearOptions();
        shaders.forEach(shaderName => {
            selector.addOption(shaderName, this.getShaderDisplayName(shaderName));
        });

        if (current && shaders.includes(current)) {
            selector.value = current;
            if (selector.updateDisplay) selector.updateDisplay();
        }
    }

    getBackgroundSnapshot() {
        const shader = this.getCurrentShaderName();
        if (!shader) return null;

        const config = this.shaderManager.getCurrentShaderConfig();
        const uniforms = {};

        // Only save numeric uniforms relevant to the shader controls (small + stable)
        if (config?.controls) {
            config.controls.forEach(control => {
                const uniformName = control.uniform;
                const u = this.shaderManager.uniforms?.[uniformName];
                const value = u?.value;
                if (typeof value === 'number' && Number.isFinite(value)) {
                    uniforms[uniformName] = value;
                }
            });
        }

        // Also include global speed
        const speed = this.shaderManager.uniforms?.u_speed?.value;
        if (typeof speed === 'number' && Number.isFinite(speed)) {
            uniforms.u_speed = speed;
        }

        // OKLCH colors (deep copy)
        const colors = {};
        for (let i = 1; i <= 4; i++) {
            const c = this.colorManager.getColor(i);
            if (c) colors[String(i)] = { l: c.l, c: c.c, h: c.h };
        }

        return { shader, uniforms, colors };
    }

    applyBackgroundSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') return;
        if (!snapshot.shader || typeof snapshot.shader !== 'string') return;

        const shaderName = snapshot.shader;

        // Update selector visually (no event)
        const selector = document.getElementById('shader-type');
        const available = this.shaderManager.getAvailableShaders();
        if (!available.includes(shaderName)) return;
        if (selector) {
            selector.value = shaderName;
            if (selector.updateDisplay) selector.updateDisplay();
        }

        if (this.persistence) this.persistence.setLastShader(shaderName);

        const shaderConfig = this.shaderManager.loadShader(shaderName);
        if (!shaderConfig) return;

        // Apply uniforms (numbers)
        const uniforms = snapshot.uniforms && typeof snapshot.uniforms === 'object' ? snapshot.uniforms : {};
        Object.entries(uniforms).forEach(([uniformName, value]) => {
            if (typeof value !== 'number' || !Number.isFinite(value)) return;
            this.shaderManager.updateUniform(uniformName, value);
            if (this.persistence) this.persistence.setShaderUniform(shaderName, uniformName, value);

            if (shaderConfig.controls) {
                const control = shaderConfig.controls.find(c => c.uniform === uniformName);
                if (control) control.value = value;
            }
        });

        // Apply colors
        if (snapshot.colors) {
            this.colorManager.setColors(snapshot.colors);
            for (let i = 1; i <= 4; i++) {
                const color = this.colorManager.getColor(i);
                if (!color) continue;
                const component = document.querySelector(`color-control[color-index="${i}"]`);
                if (component) {
                    component.setAttribute('l-value', color.l);
                    component.setAttribute('c-value', color.c);
                    component.setAttribute('h-value', color.h);
                }
                this.initializeColorComponent(i);
            }

            if (this.persistence) this.persistence.setShaderColors(shaderName, this.colorManager.colors);
        }

        // Sync speed UI
        const speedInput = document.getElementById('speed');
        const speedVal = document.getElementById('speed-value');
        const speed = uniforms.u_speed;
        if (speedInput && typeof speed === 'number' && Number.isFinite(speed)) {
            speedInput.value = String(speed);
            if (speedVal) speedVal.textContent = Math.round(speed * 100);
        }

        this.updateShaderControls(shaderConfig);
    }

    setupSavedBackgrounds() {
        const nameInput = document.getElementById('bg-save-name');
        const saveBtn = document.getElementById('bg-save-btn');
        const exportBtn = document.getElementById('bg-export-btn');
        const listEl = document.getElementById('bg-saved-list');

        if (!nameInput || !saveBtn || !listEl || !this.library) return;

        const render = () => {
            const items = this.library.list();
            listEl.innerHTML = '';

            if (!items.length) {
                const empty = document.createElement('div');
                empty.className = 'saved-bg-empty';
                empty.textContent = this.t('saved.empty', null, 'No saved backgrounds yet.');
                listEl.appendChild(empty);
                return;
            }

            const frag = document.createDocumentFragment();
            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'saved-bg-item-row';

                const loadBtn = document.createElement('button');
                loadBtn.type = 'button';
                loadBtn.className = 'saved-bg-item';
                loadBtn.dataset.bgId = item.id;
                loadBtn.dataset.bgAction = 'load';

                const title = document.createElement('div');
                title.className = 'saved-bg-title';
                title.textContent = item.name;

                const meta = document.createElement('div');
                meta.className = 'saved-bg-meta';
                meta.textContent = `v${item.version} • ${item.shader}`;

                loadBtn.appendChild(title);
                loadBtn.appendChild(meta);

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'saved-bg-save-btn saved-bg-icon-btn saved-bg-delete-btn';
                delBtn.textContent = '×';
                delBtn.setAttribute('aria-label', this.t('saved.deleteAria', null, 'Delete'));
                delBtn.title = this.t('saved.deleteTitle', null, 'Delete');
                delBtn.dataset.bgId = item.id;
                delBtn.dataset.bgAction = 'delete';

                row.appendChild(loadBtn);
                row.appendChild(delBtn);
                frag.appendChild(row);
            });

            listEl.appendChild(frag);
        };

        this._renderSavedBackgrounds = render;

        saveBtn.addEventListener('click', () => {
            const name = (nameInput.value || '').trim();
            if (!name) return;
            const snapshot = this.getBackgroundSnapshot();
            if (!snapshot) return;
            this.library.saveNewVersion(name, snapshot);
            render();
        });

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const exportModal = document.getElementById('export-modal');
                if (!exportModal) return;

                if (this.persistence && typeof exportModal.setPersistenceManager === 'function') {
                    exportModal.setPersistenceManager(this.persistence);
                } else if (this.persistence) {
                    exportModal.persistence = this.persistence;
                }

                if (this.i18n?.getLanguage && typeof exportModal.setLanguage === 'function') {
                    exportModal.setLanguage(this.i18n.getLanguage(), { persist: false });
                }

                const config = this.getCurrentConfiguration();
                exportModal.open(config);
            });
        }

        listEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-bg-action]');
            if (!btn) return;

            const id = btn.dataset.bgId;
            const action = btn.dataset.bgAction;

            if (action === 'delete') {
                const item = this.library.get(id);
                if (!item) return;
                const ok = confirm(this.t('saved.deleteConfirm', { name: item.name }, `Delete saved background "${item.name}"?`));
                if (!ok) return;
                this.library.remove(id);
                render();
                return;
            }

            if (action === 'load') {
                const item = this.library.get(id);
                if (!item) return;
                this.applyBackgroundSnapshot({
                    shader: item.shader,
                    uniforms: item.uniforms,
                    colors: item.colors
                });
            }
        });

        render();
    }

    createGlobalTooltip() {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'global-tooltip';
        document.body.appendChild(this.tooltipElement);
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
                    this.dock.togglePanel(this.activePanelId, this.dock.shadowRoot.querySelector('.dock-item.active'));
                }
            }
        });
    }

    openPanel(panelId) {
        // Prevent reopening same panel
        if (this.activePanelId === panelId) return;

        // If another panel is open, move its content back to templates first
        if (this.activePanelId) {
            const currentContent = this.isMobile ? this.bottomSheet.firstElementChild : this.desktopPanel.firstElementChild;
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
            this.desktopPanel.style.bottom = '110px'; // Increased to clear the dock
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
        const content = this.isMobile ? this.bottomSheet.firstElementChild : this.desktopPanel.firstElementChild;
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
                component.updatePreview(this.colorManager.oklchToHex({l, c, h}));
            }
        }

        const shaderName = this.getCurrentShaderName();
        if (this.persistence && shaderName) {
            this.persistence.setShaderColors(shaderName, this.colorManager.colors);
        }
    }

    setupShaderSelector() {
        const selector = document.getElementById('shader-type');
        if (!selector) return;

        const shaders = this.shaderManager.getAvailableShaders();

        this.refreshShaderSelectorOptions();

        selector.addEventListener('change', (e) => {
            const nextShader = e.detail.value;
            if (this.persistence) this.persistence.setLastShader(nextShader);

            const shaderConfig = this.shaderManager.loadShader(nextShader);

            const persisted = this.persistence ? this.persistence.getShaderState(nextShader) : null;
            const hasPersistedColors = !!persisted?.colors;

            // Sync ColorManager with new defaults if they exist (only if no persisted colors)
            if (!hasPersistedColors && shaderConfig?.defaults) {
                const { u_color1, u_color2, u_color3, u_color4 } = shaderConfig.defaults;
                if (u_color1 && u_color2 && u_color3 && u_color4) {
                    this.colorManager.setColorsFromThreeColors(u_color1, u_color2, u_color3, u_color4);
                    // Update UI components
                    for (let i = 1; i <= 4; i++) {
                        this.initializeColorComponent(i);
                    }
                }
            }

            // Apply persisted uniforms/colors after loadShader (overrides defaults)
            this.applyPersistedForShader(nextShader, shaderConfig);

            const localized = this.i18n?.localizeShader ? this.i18n.localizeShader(nextShader, shaderConfig) : shaderConfig;
            this.updateShaderControls(localized);
        });

        if (shaders.length > 0) {
            // Select first option without triggering event initially if needed, 
            // or just load shader. CustomSelect.select triggers event.
            // Let's just load the shader manually and set the value visually.
            const persistedShader = this.persistence ? this.persistence.getLastShader() : null;
            const initialShader = (persistedShader && shaders.includes(persistedShader)) ? persistedShader : shaders[0];
            selector.value = initialShader;
            selector.updateDisplay();
            
            const initialConfig = this.shaderManager.loadShader(initialShader);

            if (this.persistence) this.persistence.setLastShader(initialShader);

            const persisted = this.persistence ? this.persistence.getShaderState(initialShader) : null;
            const hasPersistedColors = !!persisted?.colors;
            
            // Sync ColorManager with initial defaults
            if (!hasPersistedColors && initialConfig?.defaults) {
                const { u_color1, u_color2, u_color3, u_color4 } = initialConfig.defaults;
                if (u_color1 && u_color2 && u_color3 && u_color4) {
                    this.colorManager.setColorsFromThreeColors(u_color1, u_color2, u_color3, u_color4);
                    // Update UI components
                    for (let i = 1; i <= 4; i++) {
                        this.initializeColorComponent(i);
                    }
                }
            }

            this.applyPersistedForShader(initialShader, initialConfig);

            const localized = this.i18n?.localizeShader ? this.i18n.localizeShader(initialShader, initialConfig) : initialConfig;
            this.updateShaderControls(localized);
        }
    }

    getVisualValue(value, min, max) {
        return Math.round(((value - min) / (max - min)) * 100);
    }

    updateShaderControls(shaderConfig) {
        const shaderName = this.getCurrentShaderName();
        const localizedConfig = this.i18n?.localizeShader
            ? this.i18n.localizeShader(shaderName, shaderConfig)
            : shaderConfig;

        this.updateColorLabels(localizedConfig);

        const container = document.getElementById('shader-controls-content');
        if (!container) return;
        
        container.innerHTML = '';

        if (!localizedConfig?.controls) return;

        localizedConfig.controls.forEach(control => {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'control-group';

            const visualValue = this.getVisualValue(control.value, control.min, control.max);
            
            // Header container for label and info icon
            const headerDiv = document.createElement('div');
            headerDiv.className = 'control-header';
            headerDiv.style.display = 'flex';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.marginBottom = '8px';

            const labelContainer = document.createElement('div');
            labelContainer.style.display = 'flex';
            labelContainer.style.alignItems = 'center';
            labelContainer.style.gap = '6px';

            const label = document.createElement('label');
            label.className = 'control-label';
            label.htmlFor = control.id;
            label.style.marginBottom = '0'; // Override default
            label.textContent = control.label;

            labelContainer.appendChild(label);

            if (control.tooltip) {
                const infoIcon = document.createElement('div');
                infoIcon.className = 'info-icon';
                infoIcon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                `;
                
                // Event listeners for global tooltip
                infoIcon.addEventListener('mouseenter', (e) => {
                    if (!this.tooltipElement) return;
                    
                    const rect = infoIcon.getBoundingClientRect();
                    this.tooltipElement.textContent = control.tooltip;
                    this.tooltipElement.classList.add('visible');
                    
                    // Calculate position (centered above the icon)
                    const tooltipRect = this.tooltipElement.getBoundingClientRect();
                    const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    const top = rect.top - tooltipRect.height - 8; // 8px gap
                    
                    this.tooltipElement.style.left = `${left}px`;
                    this.tooltipElement.style.top = `${top}px`;
                });

                infoIcon.addEventListener('mouseleave', () => {
                    if (this.tooltipElement) {
                        this.tooltipElement.classList.remove('visible');
                    }
                });

                labelContainer.appendChild(infoIcon);
            }

            const valueDisplay = document.createElement('span');
            valueDisplay.id = `${control.id}-value`;
            valueDisplay.textContent = visualValue;
            valueDisplay.style.fontSize = '0.85rem';
            valueDisplay.style.opacity = '0.7';

            headerDiv.appendChild(labelContainer);
            headerDiv.appendChild(valueDisplay);

            const input = document.createElement('input');
            input.type = 'range';
            input.id = control.id;
            input.min = control.min;
            input.max = control.max;
            // Force high precision step for fluidity
            input.step = '0.001';
            input.value = control.value;

            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const valueSpan = document.getElementById(`${control.id}-value`);
                if (valueSpan) {
                    valueSpan.textContent = this.getVisualValue(value, control.min, control.max);
                }
                control.value = value;
                this.shaderManager.updateUniform(control.uniform, value);

                const shaderName = this.getCurrentShaderName();
                if (this.persistence && shaderName) {
                    this.persistence.setShaderUniform(shaderName, control.uniform, value);
                }
            });

            controlDiv.appendChild(headerDiv);
            controlDiv.appendChild(input);
            container.appendChild(controlDiv);
        });
    }

    updateColorLabels(shaderConfig) {
        if (!shaderConfig?.colorLabels) return;
        
        shaderConfig.colorLabels.forEach((label, index) => {
            const colorIndex = index + 1;
            const component = document.querySelector(`color-control[color-index="${colorIndex}"]`);
            if (component) {
                component.setAttribute('label', label);
            }
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
                if (speedVal) {
                    // Speed is 0.0 to 1.0
                    speedVal.textContent = Math.round(value * 100);
                }

                const shaderName = this.getCurrentShaderName();
                if (this.persistence && shaderName) {
                    this.persistence.setShaderUniform(shaderName, 'u_speed', value);
                }
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

        const shaderName = this.getCurrentShaderName();
        if (this.persistence && shaderName) {
            this.persistence.setShaderColors(shaderName, this.colorManager.colors);
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

                const shaderName = this.getCurrentShaderName();
                if (this.persistence && shaderName) {
                    this.persistence.setShaderColors(shaderName, this.colorManager.colors);
                }
            }
        });
    }

    setupExportButton() {
        const exportBtn = document.getElementById('export-btn');
        const exportModal = document.getElementById('export-modal');

        if (!exportBtn || !exportModal) return;

        if (this.persistence && typeof exportModal.setPersistenceManager === 'function') {
            exportModal.setPersistenceManager(this.persistence);
        } else if (this.persistence) {
            exportModal.persistence = this.persistence;
        }

        exportBtn.addEventListener('click', () => {
            const config = this.getCurrentConfiguration();

            if (this.i18n?.getLanguage && typeof exportModal.setLanguage === 'function') {
                exportModal.setLanguage(this.i18n.getLanguage(), { persist: false });
            }

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
                    oklch: { ...color }
                });
            }
        }

        const parameters = this.shaderManager.getShaderParameters(shaderName);
        const shaderCode = this.shaderManager.getShaderCode(shaderName);
        const vertexCode = this.shaderManager.getVertexShaderCode();
        const shaderConfig = this.shaderManager.getCurrentShaderConfig();

        return {
            shader: shaderName,
            speed: speed,
            colors: colors,
            parameters: parameters,
            shaderCode: shaderCode,
            vertexCode: vertexCode,
            tslSource: shaderConfig.tslSource
        };
    }
}
