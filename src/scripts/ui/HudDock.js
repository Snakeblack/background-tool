import { Settings, Palette, Sparkles, Shuffle, Package, createElement } from 'lucide';

export class HudDock extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
    }

    render() {
        const style = `
            :host {
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
                display: flex;
                gap: 1rem;
                padding: 0.5rem;
                background: rgba(10, 10, 10, 0.4);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 9999px;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .dock-item {
                position: relative;
                padding: 0.5rem 1rem;
                border-radius: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #a0a0a0;
                transition: all 0.2s ease;
                background: transparent;
                border: none;
                font-family: 'Space Grotesk', sans-serif;
                font-size: 0.875rem;
                font-weight: 500;
            }

            .dock-item:hover, .dock-item.active {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }

            .dock-item.active {
                color: #ccff00; /* Neon Lime */
            }

            .icon {
                width: 1.25rem;
                height: 1.25rem;
                stroke-width: 2;
            }

            @media (max-width: 768px) {
                :host {
                    bottom: 1.5rem;
                    width: 90%;
                    max-width: 400px;
                    padding: 0.5rem;
                    gap: 0.25rem;
                    justify-content: space-between;
                }

                .dock-item {
                    padding: 0.75rem;
                    flex: 1;
                    justify-content: center;
                }

                .dock-item span:last-child {
                    display: none;
                }
                
                .icon {
                    width: 1.5rem;
                    height: 1.5rem;
                    margin: 0;
                }
            }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <button class="dock-item" data-panel="settings" aria-label="Configuración">
                ${createElement(Settings, { class: "icon" }).outerHTML}
                <span>Config</span>
            </button>
            <button class="dock-item" data-panel="colors" aria-label="Colores">
                ${createElement(Palette, { class: "icon" }).outerHTML}
                <span>Colors</span>
            </button>
            <button class="dock-item" data-panel="presets" aria-label="Presets">
                ${createElement(Sparkles, { class: "icon" }).outerHTML}
                <span>Presets</span>
            </button>
            <button class="dock-item" data-action="random" aria-label="Generar Aleatorio">
                ${createElement(Shuffle, { class: "icon" }).outerHTML}
                <span>Random</span>
            </button>
            <button class="dock-item" data-action="export" aria-label="Exportar Código">
                ${createElement(Package, { class: "icon" }).outerHTML}
                <span>Export</span>
            </button>
        `;
    }

    setupEvents() {
        this.shadowRoot.querySelectorAll('.dock-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const panel = item.dataset.panel;
                const action = item.dataset.action;

                if (panel) {
                    this.togglePanel(panel, item);
                } else if (action) {
                    this.dispatchEvent(new CustomEvent('action', { 
                        detail: { action },
                        bubbles: true,
                        composed: true
                    }));
                }
            });
        });
    }

    reset() {
        this.shadowRoot.querySelectorAll('.dock-item').forEach(i => i.classList.remove('active'));
    }

    togglePanel(panelId, clickedItem) {
        // Toggle active state locally
        const isActive = clickedItem.classList.contains('active');
        
        // Reset all
        this.shadowRoot.querySelectorAll('.dock-item').forEach(i => i.classList.remove('active'));

        if (!isActive) {
            clickedItem.classList.add('active');
            this.dispatchEvent(new CustomEvent('panel-open', { 
                detail: { panel: panelId },
                bubbles: true,
                composed: true
            }));
        } else {
            this.dispatchEvent(new CustomEvent('panel-close', { 
                bubbles: true,
                composed: true
            }));
        }
    }
}

customElements.define('hud-dock', HudDock);
