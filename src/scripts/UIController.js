/**
 * UI Controller - Gestiona toda la interacción con la interfaz (HUD & Mobile)
 */

import { BACKGROUNDS, CATEGORIES, DEFAULT_BACKGROUND, SHADERS } from './shaders/registry.js';
import { PRESETS } from './palettes.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Maps the registry's relative cost to the vocabulary used by evaluateTips. */
const COMPLEXITY_BY_COST = { light: 'simple', medium: 'medium', heavy: 'complex' };

/** Tooltip auto-hide delay on touch devices (ms). */
const TOUCH_TOOLTIP_MS = 2600;

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
        this.galleryFilter = 'all';

        this._renderSavedBackgrounds = null;
        this._languageSelectBound = false;
        this._tooltipTimer = null;

        /** @type {Array<{target: EventTarget, event: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean}>} */
        this._listeners = [];
        this._runtimeContext = { gpuTier: null, getObservedFps: () => 0 };

        this.init();
    }

    /**
     * Registers an event listener and tracks it for later cleanup via dispose().
     */
    _addListener(target, event, handler, options) {
        target.addEventListener(event, handler, options);
        this._listeners.push({ target, event, handler, options });
    }

    /** Removes all registered event listeners. */
    dispose() {
        for (const { target, event, handler, options } of this._listeners) {
            target.removeEventListener(event, handler, options);
        }
        this._listeners.length = 0;
    }

    /**
     * Provides runtime context (GPU tier, observed FPS getter) used by the export tips.
     * @param {{ gpuTier?: number | null, getObservedFps?: () => number }} ctx
     */
    setRuntimeContext({ gpuTier, getObservedFps } = {}) {
        if (gpuTier !== undefined) this._runtimeContext.gpuTier = gpuTier;
        if (typeof getObservedFps === 'function') this._runtimeContext.getObservedFps = getObservedFps;
    }

    t(key, params = null, fallback = null) {
        if (!this.i18n?.t) return fallback ?? key;
        const value = this.i18n.t(key, params);
        return value ?? fallback ?? key;
    }

    getCurrentShaderName() {
        return this.shaderManager?.currentShader || null;
    }

    /** Localized view of a registry entry. */
    localized(id) {
        const def = SHADERS[id];
        if (!def) return null;
        return this.i18n?.localizeShader ? this.i18n.localizeShader(id, def) : def;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Init
    // ─────────────────────────────────────────────────────────────────────

    init() {
        this.createGlobalTooltip();
        this.setupResizeListener();
        this.setupHudListeners();
        this.setupI18n();
        this.setupGallery();
        this.setupColorControls();
        this.setupPresets();
        this.setupExportButton();
        this.setupSavedBackgrounds();
        this.setupKeyboard();
        this.updateLayoutMode();

        this.selectShader(this.resolveInitialShader());
    }

    resolveInitialShader() {
        let fromUrl = null;
        try {
            fromUrl = new URLSearchParams(location.search).get('bg');
        } catch {
            // ignore
        }
        if (fromUrl && SHADERS[fromUrl]) return fromUrl;

        const persisted = this.persistence?.getLastShader();
        if (persisted && SHADERS[persisted]) return persisted;
        return DEFAULT_BACKGROUND;
    }

    // ─────────────────────────────────────────────────────────────────────
    // i18n
    // ─────────────────────────────────────────────────────────────────────

    setupI18n() {
        if (!this.i18n) return;

        this.applyI18nToDocument();
        this.dock?.setI18nManager?.(this.i18n);
        this.bottomSheet?.setI18nManager?.(this.i18n);

        const refreshLanguageSelect = () => {
            const langSelect = document.getElementById('language-select');
            if (!langSelect || typeof langSelect.clearOptions !== 'function' || typeof langSelect.addOption !== 'function') return;

            const pref = this.i18n.getPreference?.() ?? 'auto';

            langSelect.clearOptions();
            langSelect.addOption('auto', this.t('language.auto', null, 'Auto'));
            langSelect.addOption('en', this.t('language.en', null, 'English'));
            langSelect.addOption('es', this.t('language.es', null, 'Español'));

            langSelect.value = pref;
            langSelect.updateDisplay?.();

            if (!this._languageSelectBound) {
                this._addListener(langSelect, 'change', (e) => {
                    this.i18n.setPreference?.(e?.detail?.value);
                });
                this._languageSelectBound = true;
            }
        };

        refreshLanguageSelect();

        this._addListener(document, 'i18n:change', () => {
            this.applyI18nToDocument();
            refreshLanguageSelect();
            this.dock?.applyTranslations?.();
            this.bottomSheet?.applyTranslations?.();
            this.renderGallery();
            this.renderPresets();
            this._renderSavedBackgrounds?.();
            this.syncColorLabels();
            if (this.getCurrentShaderName()) this.renderSettings();
        });
    }

    applyI18nToDocument() {
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = this.t(key, null, el.textContent);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) el.setAttribute('placeholder', this.t(key, null, el.getAttribute('placeholder') || ''));
        });

        document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
            const key = el.getAttribute('data-i18n-aria');
            if (key) el.setAttribute('aria-label', this.t(key, null, el.getAttribute('aria-label') || ''));
        });

        document.querySelectorAll('[data-i18n-title]').forEach((el) => {
            const key = el.getAttribute('data-i18n-title');
            if (key) el.setAttribute('title', this.t(key, null, el.getAttribute('title') || ''));
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Background selection
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Single entry point to switch backgrounds: gallery, saved backgrounds,
     * keyboard and startup all go through here.
     * @param {string} id
     * @param {{ snapshot?: { uniforms?: Object, colors?: Object } }} [options]
     */
    selectShader(id, { snapshot = null } = {}) {
        const def = this.shaderManager.loadShader(id);
        if (!def) return;

        this.persistence?.setLastShader(id);

        const persisted = this.persistence?.getShaderState(id) ?? null;
        const colors = snapshot?.colors ?? persisted?.colors ?? null;
        const uniforms = { ...(persisted?.uniforms ?? {}), ...(snapshot?.uniforms ?? {}) };

        // Palette: explicit/persisted colors win, otherwise the background's own palette.
        if (colors) this.colorManager.setColors(colors);
        else this.colorManager.setPalette(def.palette);

        // Parameters: persisted values overlay the defaults, clamped to the control range.
        Object.entries(uniforms).forEach(([name, raw]) => {
            if (typeof raw !== 'number' || !Number.isFinite(raw)) return;
            if (name === 'u_speed') {
                this.shaderManager.setParam('u_speed', clamp(raw, 0, 1));
                return;
            }
            const control = def.controls.find((c) => c.uniform === name);
            if (control) this.shaderManager.setParam(name, clamp(raw, control.min, control.max));
        });

        if (snapshot) {
            // Loaded from the library: remember it as the new state of this background
            // (only the parameters this background still has).
            this.persistence?.setShaderColors(id, this.colorManager.colors);
            const known = new Set(['u_speed', ...def.controls.map((c) => c.uniform)]);
            Object.entries(uniforms).forEach(([name, value]) => {
                if (known.has(name) && typeof value === 'number') {
                    this.persistence?.setShaderUniform(id, name, this.shaderManager.getParam(name) ?? value);
                }
            });
        }

        this.syncColorControls();
        this.syncColorLabels();
        this.renderSettings();
        this.updateGallerySelection();
        this.persistColors();
    }

    cycleShader(direction) {
        const ids = BACKGROUNDS.map((b) => b.id);
        const index = ids.indexOf(this.getCurrentShaderName());
        const next = ids[(index + direction + ids.length) % ids.length];
        this.selectShader(next);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Gallery
    // ─────────────────────────────────────────────────────────────────────

    setupGallery() {
        const root = document.getElementById('content-gallery');
        if (!root) return;

        this._addListener(root, 'click', (e) => {
            const chip = e.target.closest('[data-filter]');
            if (chip) {
                this.galleryFilter = chip.dataset.filter;
                this.renderGallery();
                return;
            }

            const card = e.target.closest('[data-bg-id]');
            if (card) this.selectShader(card.dataset.bgId);
        });

        this.renderGallery();
    }

    renderGallery() {
        const root = document.getElementById('content-gallery');
        if (!root) return;

        const lang = this.i18n?.getLanguage?.() ?? 'en';
        const chips = [{ id: 'all', label: this.t('gallery.all', null, 'All') }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.label[lang] }))];

        root.querySelector('.gallery-chips').innerHTML = chips
            .map((c) => `<button type="button" class="chip${c.id === this.galleryFilter ? ' active' : ''}" data-filter="${c.id}" aria-pressed="${c.id === this.galleryFilter}">${c.label}</button>`)
            .join('');

        const visible = this.galleryFilter === 'all' ? BACKGROUNDS : BACKGROUNDS.filter((b) => b.category === this.galleryFilter);
        const current = this.getCurrentShaderName();

        root.querySelector('.gallery-grid').innerHTML = visible
            .map((b) => {
                const name = b.name[lang];
                const cost = this.t(`cost.${b.cost}`);
                const active = b.id === current;
                return `
                    <button type="button" class="bg-card${active ? ' active' : ''}" data-bg-id="${b.id}" aria-pressed="${active}" title="${b.description[lang]}">
                        <span class="bg-card-thumb" style="background-image:${this.paletteGradient(b.palette)}">
                            <img src="/thumbs/${b.id}.jpg" alt="" loading="lazy" decoding="async" width="320" height="200" onerror="this.remove()">
                        </span>
                        <span class="bg-card-meta">
                            <span class="bg-card-name">${name}</span>
                            <span class="cost-badge" data-cost="${b.cost}" title="${this.t('cost.title')}"><i></i><i></i><i></i><span class="visually-hidden">${cost}</span></span>
                        </span>
                    </button>`;
            })
            .join('');
    }

    updateGallerySelection() {
        const current = this.getCurrentShaderName();
        document.querySelectorAll('#content-gallery .bg-card, #desktop-panel-container .bg-card, bottom-sheet .bg-card').forEach((card) => {
            const active = card.dataset.bgId === current;
            card.classList.toggle('active', active);
            card.setAttribute('aria-pressed', String(active));
        });
    }

    /** CSS gradient preview from an OKLCH palette (used as card placeholder / swatch). */
    paletteGradient(palette) {
        const stops = palette.map((c) => this.colorManager.oklchToHex(c)).join(', ');
        return `linear-gradient(135deg, ${stops})`;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Settings panel (current background + sliders)
    // ─────────────────────────────────────────────────────────────────────

    renderSettings() {
        const container = document.getElementById('shader-controls-content');
        const id = this.getCurrentShaderName();
        const def = id ? this.localized(id) : null;
        if (!container || !def) return;

        container.innerHTML = '';

        // Current background header
        const header = document.createElement('div');
        header.className = 'bg-current';
        header.innerHTML = `
            <span class="bg-current-thumb" style="background-image:${this.paletteGradient(SHADERS[id].palette)}"></span>
            <span class="bg-current-info">
                <span class="field-label">${this.t('settings.background')}</span>
                <strong class="bg-current-name"></strong>
            </span>
            <button type="button" class="chip-btn" data-action="open-gallery">${this.t('settings.change')}</button>`;
        header.querySelector('.bg-current-name').textContent = def.name;
        header.querySelector('[data-action="open-gallery"]').addEventListener('click', () => this.openPanelFromDock('gallery'));
        container.appendChild(header);

        // Global speed
        container.appendChild(this.createField({
            id: 'speed',
            label: this.t('settings.globalSpeed'),
            tooltip: this.t('settings.globalSpeed.tooltip'),
            min: 0,
            max: 1,
            step: 0.001,
            value: this.shaderManager.getParam('u_speed') ?? 0.5,
            onInput: (value) => {
                this.shaderManager.setParam('u_speed', value);
                this.persistence?.setShaderUniform(id, 'u_speed', value);
            },
        }));

        def.controls.forEach((control) => {
            container.appendChild(this.createField({
                id: control.id,
                label: control.label,
                tooltip: control.tooltip,
                min: control.min,
                max: control.max,
                step: 0.001,
                value: this.shaderManager.getParam(control.uniform) ?? control.value,
                onInput: (value) => {
                    this.shaderManager.setParam(control.uniform, value);
                    this.persistence?.setShaderUniform(id, control.uniform, value);
                },
            }));
        });
    }

    /**
     * One consistent slider row used by every panel.
     * @param {{ id: string, label: string, tooltip?: string, min: number, max: number, step: number, value: number, onInput: (value: number) => void }} opts
     */
    createField({ id, label, tooltip, min, max, step, value, onInput }) {
        const field = document.createElement('div');
        field.className = 'field';

        const head = document.createElement('div');
        head.className = 'field-head';

        const labelEl = document.createElement('label');
        labelEl.className = 'field-label';
        labelEl.htmlFor = `ctl-${id}`;
        labelEl.textContent = label;
        head.appendChild(labelEl);

        if (tooltip) head.appendChild(this.createInfoIcon(tooltip, label));

        const output = document.createElement('output');
        output.className = 'field-value';
        output.htmlFor = `ctl-${id}`;
        output.textContent = this.getVisualValue(value, min, max);
        head.appendChild(output);

        const input = document.createElement('input');
        input.type = 'range';
        input.id = `ctl-${id}`;
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(value);
        input.style.setProperty('--fill', `${this.getVisualValue(value, min, max)}%`);

        this._addListener(input, 'input', (e) => {
            const next = parseFloat(e.target.value);
            const visual = this.getVisualValue(next, min, max);
            output.textContent = visual;
            input.style.setProperty('--fill', `${visual}%`);
            onInput(next);
        });

        field.appendChild(head);
        field.appendChild(input);
        return field;
    }

    getVisualValue(value, min, max) {
        return Math.round(((value - min) / (max - min)) * 100);
    }

    createInfoIcon(text, label) {
        const icon = document.createElement('span');
        icon.className = 'info-icon';
        icon.tabIndex = 0;
        icon.setAttribute('role', 'button');
        icon.setAttribute('aria-label', `${label}: ${text}`);
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        this.bindTooltip(icon, text);
        return icon;
    }

    createGlobalTooltip() {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'global-tooltip';
        this.tooltipElement.setAttribute('role', 'tooltip');
        document.body.appendChild(this.tooltipElement);
    }

    /** Hover/focus on desktop, tap on touch (auto-hides). */
    bindTooltip(el, text) {
        const show = () => {
            if (!this.tooltipElement) return;
            clearTimeout(this._tooltipTimer);
            const rect = el.getBoundingClientRect();
            this.tooltipElement.textContent = text;
            this.tooltipElement.classList.add('visible');

            const tip = this.tooltipElement.getBoundingClientRect();
            const left = clamp(rect.left + rect.width / 2 - tip.width / 2, 8, window.innerWidth - tip.width - 8);
            const top = rect.top - tip.height - 8 < 8 ? rect.bottom + 8 : rect.top - tip.height - 8;
            this.tooltipElement.style.left = `${left}px`;
            this.tooltipElement.style.top = `${top}px`;
        };
        const hide = () => {
            clearTimeout(this._tooltipTimer);
            this.tooltipElement?.classList.remove('visible');
        };

        this._addListener(el, 'mouseenter', show);
        this._addListener(el, 'mouseleave', hide);
        this._addListener(el, 'focus', show);
        this._addListener(el, 'blur', hide);
        this._addListener(el, 'click', (e) => {
            e.stopPropagation();
            show();
            this._tooltipTimer = setTimeout(hide, TOUCH_TOOLTIP_MS);
        });
        this._addListener(el, 'keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                show();
            } else if (e.key === 'Escape') {
                hide();
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Colors & presets
    // ─────────────────────────────────────────────────────────────────────

    setupColorControls() {
        this._addListener(document, 'color-change', (e) => {
            const { colorIndex, channel, value } = e.detail;
            const color = { ...this.colorManager.getColor(colorIndex), [channel]: value };
            const hex = this.colorManager.updateColor(colorIndex, color.l, color.c, color.h);
            document.querySelector(`color-control[color-index="${colorIndex}"]`)?.updatePreview(hex);
            this.persistColors();
        });

        // Accordion: only one color section open at a time.
        this._addListener(document, 'color-toggle', (e) => {
            if (!e.detail.open) return;
            document.querySelectorAll('color-control').forEach((c) => {
                if (c !== e.target) c.setOpen?.(false);
            });
        });
    }

    syncColorControls() {
        for (let i = 1; i <= 4; i++) {
            const color = this.colorManager.getColor(i);
            const component = document.querySelector(`color-control[color-index="${i}"]`);
            if (!color || !component) continue;
            component.setColor?.(color, this.colorManager.oklchToHex(color));
        }
    }

    syncColorLabels() {
        const id = this.getCurrentShaderName();
        const def = id ? this.localized(id) : null;
        const lang = this.i18n?.getLanguage?.() ?? 'en';
        document.querySelectorAll('color-control').forEach((component) => {
            const index = Number(component.getAttribute('color-index'));
            if (def?.colorLabels?.[index - 1]) component.setAttribute('label', def.colorLabels[index - 1]);
            component.setAttribute('l-label', this.t('color.lightness'));
            component.setAttribute('c-label', this.t('color.chroma'));
            component.setAttribute('h-label', this.t('color.hue'));
            component.setAttribute('lang', lang);
        });
    }

    persistColors() {
        const id = this.getCurrentShaderName();
        if (this.persistence && id) this.persistence.setShaderColors(id, this.colorManager.colors);
    }

    setupPresets() {
        this._addListener(document.body, 'click', (e) => {
            const btn = e.target.closest('[data-preset]');
            if (!btn || !this.colorManager.setPreset(btn.dataset.preset)) return;
            this.syncColorControls();
            this.persistColors();
        });
        this.renderPresets();
    }

    renderPresets() {
        const grid = document.getElementById('preset-grid');
        if (!grid) return;
        const lang = this.i18n?.getLanguage?.() ?? 'en';

        grid.innerHTML = PRESETS.map((preset) => `
            <button type="button" class="preset-btn" data-preset="${preset.id}">
                <span class="preset-swatch" style="background-image:${this.paletteGradient(preset.colors)}"></span>
                <span class="preset-name">${preset.name[lang]}</span>
            </button>`).join('');
    }

    randomize() {
        this.colorManager.randomize();
        this.syncColorControls();
        this.persistColors();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Saved backgrounds
    // ─────────────────────────────────────────────────────────────────────

    getBackgroundSnapshot() {
        const shader = this.getCurrentShaderName();
        if (!shader) return null;

        const def = this.shaderManager.getCurrentShaderConfig();
        const uniforms = {};

        // Only the numeric uniforms exposed by the controls (small + stable).
        def.controls.forEach((control) => {
            const value = this.shaderManager.getParam(control.uniform);
            if (typeof value === 'number' && Number.isFinite(value)) uniforms[control.uniform] = value;
        });
        uniforms.u_speed = this.shaderManager.getParam('u_speed');

        const colors = {};
        for (let i = 1; i <= 4; i++) {
            const c = this.colorManager.getColor(i);
            if (c) colors[String(i)] = { l: c.l, c: c.c, h: c.h };
        }

        return { shader, uniforms, colors };
    }

    setupSavedBackgrounds() {
        const nameInput = document.getElementById('bg-save-name');
        const saveBtn = document.getElementById('bg-save-btn');
        const listEl = document.getElementById('bg-saved-list');

        if (!nameInput || !saveBtn || !listEl || !this.library) return;

        const lang = () => this.i18n?.getLanguage?.() ?? 'en';

        const render = () => {
            const items = this.library.list();
            listEl.innerHTML = '';

            if (!items.length) {
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.textContent = this.t('saved.empty');
                listEl.appendChild(empty);
                return;
            }

            const frag = document.createDocumentFragment();
            items.forEach((item) => {
                const row = document.createElement('div');
                row.className = 'saved-bg-item-row';

                const available = Boolean(SHADERS[item.shader]);
                const loadBtn = document.createElement('button');
                loadBtn.type = 'button';
                loadBtn.className = 'saved-bg-item';
                loadBtn.dataset.bgId = item.id;
                loadBtn.dataset.bgAction = 'load';
                loadBtn.disabled = !available;

                const title = document.createElement('span');
                title.className = 'saved-bg-title';
                title.textContent = item.name;

                const meta = document.createElement('span');
                meta.className = 'saved-bg-meta';
                const shaderName = SHADERS[item.shader]?.name?.[lang()];
                meta.textContent = available ? `v${item.version} • ${shaderName}` : `v${item.version} • ${this.t('saved.unavailable')}`;

                loadBtn.append(title, meta);

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'icon-action danger';
                delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>';
                delBtn.setAttribute('aria-label', this.t('saved.deleteAria'));
                delBtn.title = this.t('saved.deleteTitle');
                delBtn.dataset.bgId = item.id;
                delBtn.dataset.bgAction = 'delete';

                row.append(loadBtn, delBtn);
                frag.appendChild(row);
            });

            listEl.appendChild(frag);
        };

        this._renderSavedBackgrounds = render;

        const save = () => {
            const name = (nameInput.value || '').trim();
            if (!name) {
                nameInput.focus();
                return;
            }
            const snapshot = this.getBackgroundSnapshot();
            if (!snapshot) return;
            this.library.saveNewVersion(name, snapshot);
            nameInput.value = '';
            render();
            this.flashButton(saveBtn, this.t('saved.saved'));
        };

        this._addListener(saveBtn, 'click', save);
        this._addListener(nameInput, 'keydown', (e) => {
            if (e.key === 'Enter') save();
        });

        this._addListener(listEl, 'click', (e) => {
            const btn = e.target.closest('[data-bg-action]');
            if (!btn) return;

            const item = this.library.get(btn.dataset.bgId);
            if (!item) return;

            if (btn.dataset.bgAction === 'delete') {
                if (!confirm(this.t('saved.deleteConfirm', { name: item.name }))) return;
                this.library.remove(item.id);
                render();
                return;
            }

            if (SHADERS[item.shader]) {
                this.selectShader(item.shader, { snapshot: { uniforms: item.uniforms, colors: item.colors } });
            }
        });

        render();
    }

    /** Briefly swaps a button's label to confirm an action. */
    flashButton(button, text, ms = 1400) {
        const original = button.textContent;
        button.textContent = text;
        button.classList.add('flash');
        setTimeout(() => {
            button.textContent = original;
            button.classList.remove('flash');
        }, ms);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Export
    // ─────────────────────────────────────────────────────────────────────

    setupExportButton() {
        const exportBtn = document.getElementById('export-btn');
        if (!exportBtn) return;
        this._addListener(exportBtn, 'click', () => this.openExport());
    }

    async openExport() {
        const id = this.getCurrentShaderName();
        if (!id) return;

        // The export modal (and code generator) is only loaded when first needed.
        await import('./components/ExportModal.js');
        await customElements.whenDefined('export-modal');
        const exportModal = document.getElementById('export-modal');
        if (!exportModal) return;

        if (this.persistence) exportModal.setPersistenceManager?.(this.persistence);
        if (this.i18n?.getLanguage) exportModal.setLanguage?.(this.i18n.getLanguage(), { persist: false });

        const config = await this.getCurrentConfiguration();
        exportModal.open(config, {
            gpuTier: this._runtimeContext.gpuTier,
            observedFps: this._runtimeContext.getObservedFps(),
            prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            isMobile: this.isMobile,
            shaderComplexity: COMPLEXITY_BY_COST[config.cost],
        });
    }

    async getCurrentConfiguration() {
        const id = this.getCurrentShaderName();
        const def = SHADERS[id];

        const colors = [];
        for (let i = 1; i <= 4; i++) {
            const color = this.colorManager.getColor(i);
            if (color) colors.push({ id: i, oklch: { ...color } });
        }

        const source = await def.source();

        return {
            shader: id,
            name: def.name,
            speed: this.shaderManager.getParam('u_speed') ?? 0.5,
            colors,
            parameters: this.shaderManager.getShaderParameters(id),
            tslSource: source.default,
            cost: def.cost,
            renderScale: def.renderScale,
            mouse: def.mouse,
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    // HUD / panels
    // ─────────────────────────────────────────────────────────────────────

    setupResizeListener() {
        this._addListener(window, 'resize', () => {
            const nextIsMobile = window.innerWidth <= 768;
            if (this.isMobile !== nextIsMobile) {
                this.isMobile = nextIsMobile;
                this.updateLayoutMode();
                // Panels live in different containers per layout: close to avoid glitches.
                if (this.activePanelId) {
                    this.closePanel();
                    this.dock?.reset?.();
                }
            }
        });
    }

    updateLayoutMode() {
        document.body.classList.toggle('mobile-mode', this.isMobile);
    }

    setupHudListeners() {
        if (!this.dock) {
            console.error('HudDock element not found');
            return;
        }

        this._addListener(this.dock, 'panel-open', (e) => this.openPanel(e.detail.panel));
        this._addListener(this.dock, 'panel-close', () => this.closePanel());
        this._addListener(this.dock, 'action', (e) => {
            if (e.detail.action === 'random') this.randomize();
        });

        if (this.bottomSheet) {
            this._addListener(this.bottomSheet, 'close', () => {
                if (this.activePanelId) {
                    this.closePanel();
                    this.dock.reset?.();
                }
            });
        }

        // Close the desktop panel when clicking outside it. Uses composedPath() instead of
        // e.target.contains(): panel handlers run first and may re-render or move the clicked
        // element (filter chips, "Change" button), which would detach e.target and make an
        // inside click look like an outside one.
        this._addListener(document, 'click', (e) => {
            if (this.isMobile || !this.activePanelId) return;
            const path = e.composedPath();
            if (path.includes(this.desktopPanel) || path.includes(this.dock)) return;
            this.closePanel();
            this.dock.reset?.();
        });
    }

    /** Opens a panel as if the user clicked its dock button (keeps the dock state in sync). */
    openPanelFromDock(panelId) {
        this.dock?.openPanel?.(panelId);
    }

    openPanel(panelId) {
        if (this.activePanelId === panelId) return;

        // Park the previous panel's content back in the templates container.
        if (this.activePanelId) this.parkActiveContent();

        const content = document.getElementById(`content-${panelId}`);
        if (!content) {
            console.warn(`Content not found for panel: ${panelId}`);
            return;
        }

        if (this.isMobile) {
            this.bottomSheet.innerHTML = '';
            this.bottomSheet.appendChild(content);
            this.bottomSheet.open();
        } else {
            this.desktopPanel.innerHTML = '';
            this.desktopPanel.appendChild(content);
            this.desktopPanel.toggleAttribute('wide', panelId === 'gallery');
            this.desktopPanel.classList.remove('hidden');
            this.desktopPanel.classList.remove('fade-in-up');
            // restart the entrance animation
            void this.desktopPanel.offsetWidth;
            this.desktopPanel.classList.add('fade-in-up');
        }

        this.activePanelId = panelId;
    }

    parkActiveContent() {
        const content = this.isMobile ? this.bottomSheet.firstElementChild : this.desktopPanel.firstElementChild;
        if (content && this.templates) this.templates.appendChild(content);
    }

    closePanel() {
        if (!this.activePanelId) return;

        this.parkActiveContent();

        if (this.isMobile) {
            this.bottomSheet.close();
        } else {
            this.desktopPanel.classList.add('hidden');
            this.desktopPanel.classList.remove('fade-in-up');
        }

        this.activePanelId = null;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Keyboard
    // ─────────────────────────────────────────────────────────────────────

    setupKeyboard() {
        this._addListener(document, 'keydown', (e) => {
            if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;

            const target = e.target;
            const tag = target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
            if (document.getElementById('export-modal')?.classList.contains('open')) return;

            switch (e.key) {
                case 'ArrowRight':
                    this.cycleShader(1);
                    break;
                case 'ArrowLeft':
                    this.cycleShader(-1);
                    break;
                case 'r':
                case 'R':
                    this.randomize();
                    break;
                case 'e':
                case 'E':
                    this.openExport();
                    break;
                case 'Escape':
                    if (this.activePanelId) {
                        this.closePanel();
                        this.dock?.reset?.();
                    }
                    break;
                default:
                    return;
            }
        });
    }
}
