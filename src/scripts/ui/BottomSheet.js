export class BottomSheet extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.startY = 0;
        this.currentY = 0;
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
            
            const turb = this.shadowRoot.getElementById('turb-control-sheet');
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
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 80vh;
                transform: translateY(100%);
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 200;
                display: block;
                pointer-events: none; /* Allow clicks through when closed/transparent parts */
            }

            :host(.open) {
                transform: translateY(0);
                pointer-events: auto;
            }

            .glass-container {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
                border-radius: 24px 24px 0 0;
                box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
                --bg-color: rgba(0, 0, 0, 0.45); /* Slightly darker for mobile readability */
                --highlight: rgba(255, 255, 255, 0.15);
                display: flex;
                flex-direction: column;
                pointer-events: auto;
            }

            .glass-distortion-wrapper {
                position: absolute;
                inset: 0;
                z-index: 10;
                filter: url(#glass-distortion-sheet) saturate(120%) brightness(1.15);
                border-radius: inherit;
                pointer-events: none;
            }

            .glass-blur {
                position: absolute;
                inset: 0;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-radius: inherit;
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
                box-shadow: inset 0 1px 0 var(--highlight);
                border-radius: inherit;
                background: none;
                pointer-events: none;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .content-wrapper {
                position: relative;
                z-index: 40;
                display: flex;
                flex-direction: column;
                height: 100%;
                color: #fff;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }

            .handle-area {
                width: 100%;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: grab;
                flex-shrink: 0;
                padding-top: 10px;
            }

            .handle-bar {
                width: 40px;
                height: 4px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }

            .content {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                opacity: 0;
                transition: opacity 0.3s ease;
                
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
                scrollbar-gutter: stable;
            }

            .content::-webkit-scrollbar {
                width: 4px;
            }

            .content::-webkit-scrollbar-track {
                background: transparent;
            }

            .content::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.3);
                border-radius: 4px;
            }
            
            .content::-webkit-scrollbar-thumb:hover {
                background-color: rgba(255, 255, 255, 0.5);
            }

            :host(.open) .content {
                opacity: 1;
            }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            
            <div class="glass-container">
                <!-- SVG Filter Definition -->
                <svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;">
                    <filter id="glass-distortion-sheet">
                        <feTurbulence id="turb-control-sheet" type="turbulence" baseFrequency="0.008" numOctaves="2" result="noise"></feTurbulence>
                        <feGaussianBlur in="noise" stdDeviation="1.5" result="smoothNoise"/>
                        <feDisplacementMap in="SourceGraphic" in2="smoothNoise" scale="70"></feDisplacementMap>
                    </filter>
                </svg>

                <div class="glass-distortion-wrapper">
                    <div class="glass-blur"></div>
                </div>
                <div class="glass-tint"></div>
                <div class="glass-highlight"></div>

                <div class="content-wrapper">
                    <div class="handle-area" role="button" aria-label="Alternar panel" tabindex="0">
                        <div class="handle-bar"></div>
                    </div>
                    <div class="content">
                        <slot></slot>
                    </div>
                </div>
            </div>
        `;
    }

    setupEvents() {
        const handle = this.shadowRoot.querySelector('.handle-area');

        handle.addEventListener('click', () => this.toggle());

        // Touch gestures
        this.addEventListener('touchstart', (e) => {
            this.startY = e.touches[0].clientY;
            this.style.transition = 'none';
        }, { passive: true });

        this.addEventListener('touchmove', (e) => {
            this.currentY = e.touches[0].clientY;
            const delta = this.currentY - this.startY;
            
            // Simple logic: if dragging up and closed, or dragging down and open
            if (!this.isOpen && delta < 0) {
                // Dragging up
                // this.style.transform = ... (could add complex physics here, keeping it simple for now)
            }
        }, { passive: true });

        this.addEventListener('touchend', (e) => {
            this.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            const delta = this.currentY - this.startY;
            
            if (Math.abs(delta) > 50) {
                if (delta < 0 && !this.isOpen) this.open();
                if (delta > 0 && this.isOpen) this.close();
            }
            
            this.startY = 0;
            this.currentY = 0;
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.classList.add('open');
        this.dispatchEvent(new CustomEvent('open', { bubbles: true }));
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.classList.remove('open');
        this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
    }
}

customElements.define('bottom-sheet', BottomSheet);
