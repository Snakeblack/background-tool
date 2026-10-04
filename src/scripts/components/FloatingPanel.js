export class FloatingPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const style = `
            * { box-sizing: border-box; }

            :host {
                display: block;
                position: fixed;
                z-index: 110;
                width: 320px;
                bottom: 110px;
                left: 50%;
                transform: translateX(-50%);
            }

            /* Wider variant used by the backgrounds gallery. */
            :host([wide]) {
                width: min(480px, calc(100vw - 2rem));
            }

            .panel-wrapper {
                transform: translateZ(0);
                width: 100%;
            }

            .glass-container {
                position: relative;
                overflow: hidden;
                border-radius: 24px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                --bg-color: rgba(0, 0, 0, 0.42);
                --highlight: rgba(255, 255, 255, 0.16);
                padding: 1.25rem 0.5rem 1.25rem 1.25rem;
                display: flex;
                flex-direction: column;
                max-height: calc(100vh - 160px);
            }

            /* A parent with filter/opacity becomes a "backdrop root" and starves backdrop-filter,
               so the blur layer sits directly under the container. */
            .glass-blur {
                position: absolute;
                inset: 0;
                z-index: 10;
                backdrop-filter: blur(18px) saturate(120%);
                -webkit-backdrop-filter: blur(18px) saturate(120%);
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
                border-radius: inherit;
                pointer-events: none;
                border: 1px solid rgba(255, 255, 255, 0.06);
            }

            .panel-content {
                position: relative;
                z-index: 40;
                color: #fff;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                overflow-y: auto;
                flex: 1;
                min-height: 0;
                padding-right: 0.75rem;
                overscroll-behavior: contain;
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
            }

            .panel-content::-webkit-scrollbar { width: 4px; }
            .panel-content::-webkit-scrollbar-track { background: transparent; }
            .panel-content::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.3);
                border-radius: 4px;
            }
            .panel-content::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.5); }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>

            <div class="panel-wrapper">
                <div class="glass-container">

                    <div class="glass-blur"></div>
                    <div class="glass-tint"></div>
                    <div class="glass-highlight"></div>

                    <div class="panel-content">
                        <slot></slot>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('floating-panel', FloatingPanel);
