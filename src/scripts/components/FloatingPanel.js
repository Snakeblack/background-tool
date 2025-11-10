/**
 * Panel Component - Web Component para paneles flotantes
 */

export class FloatingPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['title', 'position'];
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const title = this.getAttribute('title') || 'Panel';
        const position = this.getAttribute('position') || 'left';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: fixed;
                    top: 2rem;
                    ${position}: 2rem;
                    width: 320px;
                    max-height: calc(100vh - 4rem);
                    background: linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%);
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    z-index: 100;
                }
                :host(.hidden) {
                    transform: translateX(${position === 'left' ? '-' : ''}120%);
                    opacity: 0;
                    pointer-events: none;
                }
                :host(.minimized) .panel-content {
                    max-height: 0;
                    padding: 0;
                }
                .panel-header {
                    padding: 1.25rem 1.5rem;
                    background: linear-gradient(135deg, rgba(50, 50, 80, 0.6) 0%, rgba(30, 30, 50, 0.6) 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 1rem;
                    position: relative;
                }
                .panel-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: white;
                    flex: 1;
                }
                .panel-buttons {
                    display: flex;
                    gap: 0.5rem;
                }
                .panel-btn {
                    width: 28px;
                    height: 28px;
                    border: none;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }
                .panel-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }
                .panel-content {
                    padding: 1.5rem;
                    overflow-y: auto;
                    max-height: calc(100vh - 8rem);
                    transition: max-height 0.3s ease, padding 0.3s ease;
                    overscroll-behavior: contain;
                    scrollbar-gutter: stable;
                }
                .panel-content::-webkit-scrollbar {
                    width: 8px;
                }
                .panel-content::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }
                .panel-content::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                .panel-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    :host {
                        top: calc(env(safe-area-inset-top, 0.75rem) + 0.25rem);
                        left: 0.75rem;
                        right: 0.75rem;
                        width: auto;
                        max-height: calc(100vh - 7rem);
                        border-radius: 20px;
                        backdrop-filter: blur(12px);
                    }
                    :host([position="right"]) {
                        top: auto;
                        bottom: calc(env(safe-area-inset-bottom, 0.75rem) + 5rem);
                        max-height: 42vh;
                    }
                    :host([position="right"].hidden) {
                        transform: translateY(120%);
                    }
                    :host([position="left"].hidden) {
                        transform: translateY(-120%);
                    }
                    .panel-header {
                        padding: 1rem 1.25rem;
                        position: sticky;
                        top: 0;
                        z-index: 5;
                        backdrop-filter: blur(18px);
                    }
                    .panel-header::after {
                        content: '';
                        position: absolute;
                        left: 1.25rem;
                        right: 1.25rem;
                        bottom: -0.5rem;
                        height: 1px;
                        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
                    }
                    .panel-title {
                        font-size: 1rem;
                    }
                    .panel-btn {
                        width: 26px;
                        height: 26px;
                    }
                    .panel-content {
                        padding: 1rem 1.25rem 1.25rem;
                        max-height: none;
                        mask-image: linear-gradient(180deg, rgba(0,0,0,1) 92%, rgba(0,0,0,0));
                    }
                }

                @media (max-width: 640px) {
                    :host {
                        left: 0.5rem;
                        right: 0.5rem;
                        border-radius: 18px;
                        max-height: calc(100vh - 6.5rem);
                    }
                    :host([position="right"]) {
                        bottom: calc(env(safe-area-inset-bottom, 0.5rem) + 4.25rem);
                        max-height: 40vh;
                    }
                    .panel-header {
                        padding: 0.875rem 1rem;
                    }
                    .panel-title {
                        font-size: 0.9375rem;
                    }
                    .panel-btn {
                        width: 24px;
                        height: 24px;
                        font-size: 0.875rem;
                    }
                    .panel-content {
                        padding: 0.875rem;
                    }
                }

                @media (max-width: 480px) {
                    :host {
                        max-height: calc(100vh - 5.5rem);
                    }
                    :host([position="right"]) {
                        max-height: 38vh;
                        bottom: calc(env(safe-area-inset-bottom, 0.5rem) + 3.75rem);
                    }
                    .panel-header {
                        padding: 0.75rem 0.875rem;
                    }
                    .panel-title {
                        font-size: 0.875rem;
                    }
                    .panel-btn {
                        width: 22px;
                        height: 22px;
                        font-size: 0.75rem;
                    }
                    .panel-content {
                        padding: 0.75rem;
                    }
                }

                @media (max-height: 600px) and (orientation: landscape) {
                    :host {
                        max-height: calc(88vh - 3rem);
                        top: 0.5rem;
                        left: 0.5rem;
                        right: 0.5rem;
                    }
                    :host([position="right"]) {
                        bottom: calc(env(safe-area-inset-bottom, 0.5rem) + 2.75rem);
                        max-height: calc(65vh - 3rem);
                    }
                }
            </style>
            
            <div class="panel-header">
                <h2 class="panel-title">${title}</h2>
                <div class="panel-buttons">
                    <button class="panel-btn" id="minimize-btn" title="Minimizar">−</button>
                    <button class="panel-btn" id="close-btn" title="Cerrar">✕</button>
                </div>
            </div>
            <div class="panel-content">
                <slot></slot>
            </div>
        `;

        // Event listeners
        const minimizeBtn = this.shadowRoot.getElementById('minimize-btn');
        const closeBtn = this.shadowRoot.getElementById('close-btn');

        minimizeBtn.addEventListener('click', () => {
            const isMinimized = this.classList.contains('minimized');
            
            if (isMinimized) {
                // Opening this panel - close others via accordion
                this.dispatchEvent(new CustomEvent('panel-request-open', {
                    bubbles: true,
                    composed: true
                }));
            }
            
            this.classList.toggle('minimized');
            minimizeBtn.textContent = this.classList.contains('minimized') ? '+' : '−';
        });

        closeBtn.addEventListener('click', () => {
            this.classList.add('hidden');
            this.dispatchEvent(new CustomEvent('panel-close', {
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define('floating-panel', FloatingPanel);
