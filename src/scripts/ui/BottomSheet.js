export class BottomSheet extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.startY = 0;
        this.currentY = 0;
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
    }

    render() {
        const style = `
            :host {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 80vh;
                background: rgba(17, 17, 17, 0.85);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px 24px 0 0;
                transform: translateY(100%);
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 200;
                display: flex;
                flex-direction: column;
                box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
            }

            :host(.open) {
                transform: translateY(0);
            }

            .handle-area {
                width: 100%;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: grab;
                flex-shrink: 0;
            }

            .handle-bar {
                width: 40px;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
            }

            .content {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            :host(.open) .content {
                opacity: 1;
            }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="handle-area" role="button" aria-label="Alternar panel" tabindex="0">
                <div class="handle-bar"></div>
            </div>
            <div class="content">
                <slot></slot>
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
        });

        this.addEventListener('touchmove', (e) => {
            this.currentY = e.touches[0].clientY;
            const delta = this.currentY - this.startY;

            // Simple logic: if dragging up and closed, or dragging down and open
            if (!this.isOpen && delta < 0) {
                // Dragging up
                // this.style.transform = ... (could add complex physics here, keeping it simple for now)
            }
        });

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
