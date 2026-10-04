export class BottomSheet extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.startY = 0;
        this.currentY = 0;
        this._swipeFromHandle = false;
        this.i18n = null;
    }

    setI18nManager(i18nManager) {
        this.i18n = i18nManager;
        this.applyTranslations();
    }

    t(key, fallback) {
        if (this.i18n?.t) return this.i18n.t(key) ?? fallback;
        return fallback;
    }

    applyTranslations() {
        const handle = this.shadowRoot?.querySelector('.handle-area');
        if (!handle) return;
        handle.setAttribute('aria-label', this.t('bottomSheet.toggleAria', 'Toggle panel'));
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
        this.applyTranslations();
    }

    render() {
        const style = `
            :host {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 72vh;
                height: 72dvh;
                transform: translateY(100%);
                /* Hidden once the slide-out ends: otherwise the closed sheet's shadow
                   bleeds onto the bottom edge of the screen. */
                visibility: hidden;
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s linear 0.4s;
                z-index: 200;
                display: block;
                pointer-events: none;
            }

            :host(.open) {
                transform: translateY(0);
                visibility: visible;
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s;
                pointer-events: auto;
            }

            .glass-container {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
                border-radius: 24px 24px 0 0;
                box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
                --bg-color: rgba(8, 6, 14, 0.66); /* Opaque enough to read on any background; no backdrop blur on mobile (it re-blurs every frame under an animating canvas) */
                --highlight: rgba(255, 255, 255, 0.15);
                display: flex;
                flex-direction: column;
                pointer-events: auto;
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
                overscroll-behavior: contain;
                padding: 0.5rem 1rem calc(6rem + env(safe-area-inset-bottom));
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
                <div class="glass-tint"></div>
                <div class="glass-highlight"></div>

                <div class="content-wrapper">
                    <div class="handle-area" role="button" aria-label="${this.t('bottomSheet.toggleAria', 'Toggle panel')}" tabindex="0">
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

        // Swipe down on the handle closes the sheet. Gestures that start inside the content
        // (scrolling, dragging a slider) must never close it.
        this.addEventListener('touchstart', (e) => {
            this._swipeFromHandle = e.composedPath().some((n) => n.classList?.contains?.('handle-area'));
            this.startY = this._swipeFromHandle ? e.touches[0].clientY : 0;
            this.currentY = this.startY;
        }, { passive: true });

        this.addEventListener('touchmove', (e) => {
            if (this._swipeFromHandle) this.currentY = e.touches[0].clientY;
        }, { passive: true });

        this.addEventListener('touchend', () => {
            if (this._swipeFromHandle && this.isOpen && this.currentY - this.startY > 50) this.close();
            this._swipeFromHandle = false;
            this.startY = 0;
            this.currentY = 0;
        });
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
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
