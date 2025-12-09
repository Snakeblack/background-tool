import { createElement } from 'lucide';

export class FloatingPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.frames = 0;
        this.animationId = null;
    }

    connectedCallback() {
        this.render();
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
            
            const turb = this.shadowRoot.getElementById('turb-control-panel');
            if (turb) {
                turb.setAttribute('baseFrequency', `${freq} ${freq}`);
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    render() {
        const style = `
            :host {
                display: flex;
                flex-direction: column;
                position: fixed;
                z-index: 110;
                width: 320px;
                /* Ensure it fits in viewport above dock */
                max-height: calc(100vh - 160px);
                /* Default bottom position if not set by controller */
                bottom: 110px;
                left: 50%;
                transform: translateX(-50%);
            }

            .panel-wrapper {
                transform: translateZ(0);
                transition: transform 0.3s ease;
                display: flex;
                flex-direction: column;
                min-height: 0;
                max-height: 100%;
            }

            .glass-container {
                position: relative;
                overflow: hidden;
                border-radius: 24px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                --bg-color: rgba(0, 0, 0, 0.6);
                --highlight: rgba(255, 255, 255, 0.15);
                padding: 1.5rem;
                padding-right: calc(1.5rem - 12px);
                display: flex;
                flex-direction: column;
                min-height: 0;
                max-height: 100%;
            }

            .glass-effect {
                position: absolute;
                inset: 0;
                z-index: 10;
                backdrop-filter: blur(12px);
                filter: url(#glass-distortion-panel) saturate(120%) brightness(1.15);
                border-radius: inherit;
                pointer-events: none;
            }

            .glass-dark-layer {
                position: absolute;
                inset: 0;
                z-index: 15;
                background: rgba(0, 0, 0, 0.3);
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
                background: none;
                pointer-events: none;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }

            .panel-content {
                position: relative;
                z-index: 40;
                color: #fff;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                overflow-y: auto;
                min-height: 0;
                padding-right: 4px;
                
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
                scrollbar-gutter: stable;
            }

            .panel-content::-webkit-scrollbar {
                width: 4px;
            }

            .panel-content::-webkit-scrollbar-track {
                background: transparent;
            }

            .panel-content::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.3);
                border-radius: 4px;
            }
            
            .panel-content::-webkit-scrollbar-thumb:hover {
                background-color: rgba(255, 255, 255, 0.5);
            }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            
            <div class="panel-wrapper">
                <div class="glass-container">
                    <!-- SVG Filter Definition -->
                    <svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;">
                        <filter id="glass-distortion-panel">
                            <feTurbulence id="turb-control-panel" type="turbulence" baseFrequency="0.008" numOctaves="2" result="noise"></feTurbulence>
                            <feGaussianBlur in="noise" stdDeviation="1.5" result="smoothNoise"/>
                            <feDisplacementMap in="SourceGraphic" in2="smoothNoise" scale="77"></feDisplacementMap>
                        </filter>
                    </svg>

                    <div class="glass-effect"></div>
                    <div class="glass-dark-layer"></div>
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
