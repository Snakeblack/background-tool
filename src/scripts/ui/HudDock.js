import { Settings, Palette, Sparkles, Shuffle, Package, createElement } from 'lucide';

export class HudDock extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.frames = 0;
        this.animationId = null;
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
        this.startAnimation();
    }

    disconnectedCallback() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    startAnimation() {
        const animate = () => {
            this.frames += 0.05;
            // Oscilación sutil de la frecuencia
            const freq = 0.008 + Math.sin(this.frames * 0.05) * 0.002;
            
            const turb = this.shadowRoot.getElementById('turb-control');
            if (turb) {
                turb.setAttribute('baseFrequency', `${freq} ${freq}`);
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    render() {
        const style = `
            * {
                box-sizing: border-box;
            }

            :host {
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
            }

            .dock-wrapper {
                transform: translateZ(0); /* GPU Optimization */
                transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
            }

            .dock-wrapper:hover {
                transform: translateZ(0) scale(1.01);
            }

            .glass-container {
                position: relative;
                overflow: hidden;
                border-radius: 9999px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                /* Variables del ejemplo original */
                --bg-color: rgba(0, 0, 0, 0.25);
                --highlight: rgba(255, 255, 255, 0.15);
            }

            /* 2. CAPA DE EFECTO (Aplica el filtro) */
            .glass-effect {
                position: absolute;
                inset: 0;
                z-index: 10;
                backdrop-filter: blur(12px); /* backdrop-blur-md */
                filter: url(#glass-distortion) saturate(120%) brightness(1.15);
                border-radius: inherit;
                pointer-events: none;
            }

            /* 3. CAPAS DE ACABADO (Tinte y especular) */
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
                border-radius: inherit;
                background: none;
                pointer-events: none;
                border: 1px solid rgba(255, 255, 255, 0.05); /* Borde sutil extra para definición */
            }

            /* 4. CONTENIDO */
            .dock-content {
                position: relative;
                z-index: 40;
                display: flex;
                gap: 1rem;
                padding: 0.5rem;
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
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
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
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
            }

            @media (max-width: 768px) {
                :host {
                    bottom: 1.5rem;
                    width: 90%;
                    max-width: 400px;
                }

                .dock-wrapper, .glass-container {
                    width: 100%;
                }

                .dock-content {
                    gap: 0.25rem;
                    justify-content: space-between;
                    width: 100%;
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
            
            <div class="dock-wrapper">
                <div class="glass-container">
                    <!-- 1. DEFINICIÓN DEL FILTRO -->
                    <svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;">
                        <filter id="glass-distortion">
                            <feTurbulence id="turb-control" type="turbulence" baseFrequency="0.008" numOctaves="2" result="noise"></feTurbulence>
                            <feGaussianBlur in="noise" stdDeviation="1.5" result="smoothNoise"/>
                            <feDisplacementMap in="SourceGraphic" in2="smoothNoise" scale="77"></feDisplacementMap>
                        </filter>
                    </svg>

                    <!-- 2. CAPA DE EFECTO -->
                    <div class="glass-effect"></div>
                    
                    <!-- 3. CAPAS DE ACABADO -->
                    <div class="glass-tint"></div>
                    <div class="glass-highlight"></div>
                    
                    <!-- 4. CONTENIDO -->
                    <div class="dock-content">
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
                    </div>
                </div>
            </div>
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
