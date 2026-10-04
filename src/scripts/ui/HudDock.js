import { LayoutGrid, SlidersHorizontal, Palette, SwatchBook, Shuffle, Bookmark, createElement } from 'lucide';

/**
 * Bottom dock. Panel buttons toggle a panel; action buttons fire an event.
 * Each item: [panel|action, kind, icon, i18n key suffix, fallback label]
 */
const ITEMS = [
    { kind: 'panel', id: 'gallery', icon: LayoutGrid, key: 'backgrounds', label: 'Backgrounds' },
    { kind: 'panel', id: 'settings', icon: SlidersHorizontal, key: 'settings', label: 'Tweak' },
    { kind: 'panel', id: 'colors', icon: Palette, key: 'colors', label: 'Colors' },
    { kind: 'panel', id: 'presets', icon: SwatchBook, key: 'presets', label: 'Palettes' },
    { kind: 'action', id: 'random', icon: Shuffle, key: 'random', label: 'Shuffle' },
    { kind: 'panel', id: 'saved', icon: Bookmark, key: 'saved', label: 'Saved' },
];

export class HudDock extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.i18n = null;
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
    }

    setI18nManager(i18nManager) {
        this.i18n = i18nManager;
        this.applyTranslations();
    }

    t(key, fallback) {
        return this.i18n?.t ? this.i18n.t(key) : fallback;
    }

    applyTranslations() {
        if (!this.shadowRoot) return;
        this.shadowRoot.querySelectorAll('.dock-item').forEach((btn) => {
            const item = ITEMS.find((i) => i.id === (btn.dataset.panel || btn.dataset.action));
            if (!item) return;
            btn.setAttribute('aria-label', this.t(`aria.${item.key}`, item.label));
            const labelEl = btn.querySelector('.dock-label');
            if (labelEl) labelEl.textContent = this.t(`dock.${item.key}`, item.label);
        });
    }

    render() {
        const style = `
            * { box-sizing: border-box; }

            :host {
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
            }

            .glass-container {
                position: relative;
                overflow: hidden;
                border-radius: 9999px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                --bg-color: rgba(0, 0, 0, 0.4);
                --highlight: rgba(255, 255, 255, 0.16);
            }

            /* Frosted layer. (A decorative SVG displacement filter used to live here; it never
               affected the backdrop and its animation cost a requestAnimationFrame loop.) */
            .glass-effect {
                position: absolute;
                inset: 0;
                z-index: 10;
                backdrop-filter: blur(14px) saturate(120%);
                -webkit-backdrop-filter: blur(14px) saturate(120%);
                border-radius: inherit;
                pointer-events: none;
            }

            .glass-tint {
                position: absolute;
                inset: 0;
                z-index: 20;
                background: var(--bg-color);
                border-radius: inherit;
                pointer-events: none;
            }

            .glass-highlight {
                position: absolute;
                inset: 0;
                z-index: 30;
                box-shadow: inset 1px 1px 1px var(--highlight);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: inherit;
                pointer-events: none;
            }

            .dock-content {
                position: relative;
                z-index: 40;
                display: flex;
                gap: 0.25rem;
                padding: 0.5rem;
            }

            .dock-item {
                position: relative;
                padding: 0.5rem 0.9rem;
                min-height: 44px;
                border-radius: 9999px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: rgba(255, 255, 255, 0.72);
                transition: background-color 0.2s ease, color 0.2s ease;
                background: transparent;
                border: none;
                font-family: 'Space Grotesk', sans-serif;
                font-size: 0.875rem;
                font-weight: 500;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                -webkit-tap-highlight-color: transparent;
            }

            .dock-item:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            .dock-item:focus-visible {
                outline: 2px solid var(--accent, #ccff00);
                outline-offset: -2px;
            }

            .dock-item.active {
                background: rgba(255, 255, 255, 0.12);
                color: var(--accent, #ccff00);
            }

            .icon {
                width: 1.25rem;
                height: 1.25rem;
                stroke-width: 2;
                flex: none;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
            }

            @media (max-width: 1100px) and (min-width: 769px) {
                .dock-label { display: none; }
                .dock-item { padding: 0.5rem 0.75rem; }
            }

            @media (max-width: 768px) {
                :host {
                    bottom: max(1rem, env(safe-area-inset-bottom));
                    width: calc(100% - 1.5rem);
                    max-width: 420px;
                    z-index: 210; /* above the bottom sheet: the dock doubles as its tab bar */
                }

                .glass-container { width: 100%; }

                .dock-content {
                    gap: 0;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0.375rem;
                }

                .dock-item {
                    padding: 0.5rem;
                    flex: 1;
                    justify-content: center;
                    min-width: 44px;
                }

                .dock-label { display: none; }

                .icon { width: 1.5rem; height: 1.5rem; }
            }

            @media (prefers-reduced-motion: reduce) {
                .dock-item { transition: none; }
            }
        `;

        const items = ITEMS.map((item) => {
            const attr = item.kind === 'panel' ? `data-panel="${item.id}" aria-haspopup="dialog" aria-expanded="false"` : `data-action="${item.id}"`;
            return `
                <button type="button" class="dock-item" ${attr} aria-label="${this.t(`aria.${item.key}`, item.label)}">
                    ${createElement(item.icon, { class: 'icon', 'aria-hidden': 'true' }).outerHTML}
                    <span class="dock-label">${this.t(`dock.${item.key}`, item.label)}</span>
                </button>`;
        }).join('');

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <nav class="glass-container" aria-label="Background tools">
                <div class="glass-effect"></div>
                <div class="glass-tint"></div>
                <div class="glass-highlight"></div>
                <div class="dock-content">${items}</div>
            </nav>
        `;

        this.applyTranslations();
    }

    setupEvents() {
        this.shadowRoot.querySelectorAll('.dock-item').forEach((item) => {
            item.addEventListener('click', () => {
                const { panel, action } = item.dataset;
                if (panel) {
                    this.togglePanel(panel, item);
                } else if (action) {
                    this.dispatchEvent(new CustomEvent('action', {
                        detail: { action },
                        bubbles: true,
                        composed: true,
                    }));
                }
            });
        });
    }

    /** Deactivates every dock item. */
    reset() {
        this.shadowRoot.querySelectorAll('.dock-item').forEach((i) => {
            i.classList.remove('active');
            if (i.dataset.panel) i.setAttribute('aria-expanded', 'false');
        });
    }

    /** Opens a panel programmatically, keeping the active state in sync. */
    openPanel(panelId) {
        const item = this.shadowRoot.querySelector(`[data-panel="${panelId}"]`);
        if (item && !item.classList.contains('active')) this.togglePanel(panelId, item);
    }

    togglePanel(panelId, clickedItem) {
        const wasActive = clickedItem.classList.contains('active');
        this.reset();

        if (wasActive) {
            this.dispatchEvent(new CustomEvent('panel-close', { bubbles: true, composed: true }));
            return;
        }

        clickedItem.classList.add('active');
        clickedItem.setAttribute('aria-expanded', 'true');
        this.dispatchEvent(new CustomEvent('panel-open', {
            detail: { panel: panelId },
            bubbles: true,
            composed: true,
        }));
    }
}

customElements.define('hud-dock', HudDock);
