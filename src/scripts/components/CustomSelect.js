import { ChevronDown, createElement } from 'lucide';

/**
 * Custom Select Component - Dropdown personalizado
 */

export class CustomSelect extends HTMLElement {
    static get observedAttributes() {
        return ['placeholder'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.options = [];
        this._value = null;
        this.isOpen = false;
        this._activeIndex = 0;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'placeholder' && oldValue !== newValue) {
            this.updateDisplay();
        }
    }

    getPlaceholder() {
        return this.getAttribute('placeholder') || 'Select...';
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
        this.updateDisplay();
        this.renderOptions();
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
        this.renderOptions();
        this.updateDisplay();
    }

    addOption(value, label) {
        this.options.push({ value, label });
        if (!this._value) {
            this.value = value;
        } else {
            this.renderOptions();
        }
    }

    clearOptions() {
        this.options = [];
        this.renderOptions();
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;
        this._activeIndex = Math.max(0, this.options.findIndex((o) => o.value === this.value));
        this.shadowRoot.querySelector('.select-container').classList.add('open');
        this.shadowRoot.querySelector('.select-header').setAttribute('aria-expanded', 'true');
        this.highlightActive();
    }

    close() {
        this.isOpen = false;
        this.shadowRoot.querySelector('.select-container')?.classList.remove('open');
        this.shadowRoot.querySelector('.select-header')?.setAttribute('aria-expanded', 'false');
    }

    /** Keyboard highlight inside the open list. */
    highlightActive() {
        this.shadowRoot.querySelectorAll('.option-item').forEach((item, index) => {
            item.classList.toggle('active', index === this._activeIndex);
            if (index === this._activeIndex) item.scrollIntoView({ block: 'nearest' });
        });
    }

    onKeydown(event) {
        const { key } = event;
        if (!this.isOpen) {
            if (key === 'Enter' || key === ' ' || key === 'ArrowDown' || key === 'ArrowUp') {
                event.preventDefault();
                this.open();
            }
            return;
        }

        if (key === 'Escape' || key === 'Tab') {
            this.close();
        } else if (key === 'ArrowDown' || key === 'ArrowUp') {
            event.preventDefault();
            const step = key === 'ArrowDown' ? 1 : -1;
            this._activeIndex = (this._activeIndex + step + this.options.length) % this.options.length;
            this.highlightActive();
        } else if (key === 'Enter' || key === ' ') {
            event.preventDefault();
            const option = this.options[this._activeIndex];
            if (option) this.select(option.value);
        }
        if (key === 'Escape') event.stopPropagation();
    }

    select(value) {
        this.value = value;
        this.close();
        this.dispatchEvent(new CustomEvent('change', { 
            detail: { value },
            bubbles: true 
        }));
    }

    updateDisplay() {
        const display = this.shadowRoot.querySelector('.selected-value');
        const option = this.options.find(o => o.value === this.value);
        if (!display) return;
        if (option) {
            display.textContent = option.label;
            return;
        }
        display.textContent = this.getPlaceholder();
    }

    renderOptions() {
        const list = this.shadowRoot.querySelector('.options-list');
        if (!list) return;

        list.innerHTML = '';
        this.options.forEach(opt => {
            const item = document.createElement('div');
            item.className = `option-item ${opt.value === this.value ? 'selected' : ''}`;
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', String(opt.value === this.value));
            item.textContent = opt.label;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.select(opt.value);
            });
            list.appendChild(item);
        });
    }

    setupEvents() {
        const header = this.shadowRoot.querySelector('.select-header');
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        header.addEventListener('keydown', (e) => this.onKeydown(e));

        document.addEventListener('click', () => this.close());
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'Inter', sans-serif;
                    position: relative;
                    z-index: 50;
                    -webkit-tap-highlight-color: transparent;
                }

                :host([compact]) {
                    display: inline-block;
                    width: auto;
                    min-width: 108px;
                }

                .select-container {
                    position: relative;
                    width: 100%;
                }

                .select-header {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s ease;
                    -webkit-tap-highlight-color: transparent;
                    user-select: none;
                    outline: none;
                    overflow: hidden;
                }

                .select-header:focus-visible {
                    outline: 2px solid var(--accent, #ccff00);
                    outline-offset: 2px;
                }

                :host([compact]) .select-header {
                    background: var(--glass-bg, rgba(10, 10, 10, 0.4));
                    backdrop-filter: blur(var(--glass-blur, 20px));
                    border: var(--glass-border, 1px solid rgba(255, 255, 255, 0.05));
                    border-radius: var(--radius-full, 9999px);
                    box-sizing: border-box;
                    height: 48px;
                    padding: 0 0.75rem;
                }

                @media (max-width: 520px) {
                    :host([compact]) { min-width: 96px; }
                    :host([compact]) .select-header { height: 44px; }
                }

                :host([compact]) .selected-value {
                    font-family: var(--font-display, 'Space Grotesk', sans-serif);
                    font-weight: 500;
                    font-size: 0.875rem;
                    letter-spacing: -0.02em;
                    line-height: 1;
                }

                .select-header:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                :host([compact]) .select-header:hover {
                    background: var(--color-surface-hover, rgba(30, 30, 30, 0.8));
                }

                .select-container.open .select-header {
                    border-color: #ccff00;
                    background: rgba(255, 255, 255, 0.1);
                }

                :host([compact]) .select-container.open .select-header {
                    border-color: var(--color-accent-primary, #ccff00);
                }

                .arrow-icon {
                    color: rgba(255, 255, 255, 0.5);
                    transition: transform 0.3s ease, color 0.3s ease;
                    display: flex;
                    align-items: center;
                }

                .select-container.open .arrow-icon {
                    transform: rotate(180deg);
                    color: #ccff00;
                }

                :host([compact]) .select-container.open .arrow-icon {
                    color: var(--color-accent-primary, #ccff00);
                }

                .options-list {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    width: 100%;
                    background: #1a1a24;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    overflow-y: auto;
                    max-height: 0;
                    opacity: 0;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    pointer-events: none;
                    z-index: 100;
                }

                :host([compact]) .options-list {
                    border-radius: var(--radius-md, 16px);
                }

                /* Custom Scrollbar */
                .options-list::-webkit-scrollbar {
                    width: 6px;
                }
                .options-list::-webkit-scrollbar-track {
                    background: transparent;
                }
                .options-list::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
                .options-list::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .select-container.open .options-list {
                    max-height: 240px;
                    opacity: 1;
                    pointer-events: auto;
                }

                .option-item {
                    padding: 0.75rem 1rem;
                    color: #a0a0a0;
                    cursor: pointer;
                    transition: all 0.2s;
                    -webkit-tap-highlight-color: transparent;
                    user-select: none;
                }

                .option-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                }

                .option-item.active {
                    background: rgba(255, 255, 255, 0.08);
                    color: white;
                }

                .option-item.selected {
                    color: #ccff00;
                    background: rgba(204, 255, 0, 0.05);
                }
            </style>

            <div class="select-container">
                <div class="select-header" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="options">
                    <span class="selected-value">${this.getPlaceholder()}</span>
                    <span class="arrow-icon">${createElement(ChevronDown, {width: 16, height: 16}).outerHTML}</span>
                </div>
                <div class="options-list" id="options" role="listbox"></div>
            </div>
        `;
    }
}

customElements.define('custom-select', CustomSelect);
