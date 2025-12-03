import { ChevronDown, createElement } from 'lucide';

/**
 * Custom Select Component - Dropdown personalizado
 */

export class CustomSelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.options = [];
        this.value = null;
        this.isOpen = false;
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
        this.renderOptions();
        this.updateDisplay();
    }

    addOption(value, label) {
        this.options.push({ value, label });
        if (!this.value) {
            this.value = value;
            this.updateDisplay();
        }
        this.renderOptions();
    }

    clearOptions() {
        this.options = [];
        this.renderOptions();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const container = this.shadowRoot.querySelector('.select-container');
        if (this.isOpen) {
            container.classList.add('open');
        } else {
            container.classList.remove('open');
        }
    }

    close() {
        this.isOpen = false;
        this.shadowRoot.querySelector('.select-container').classList.remove('open');
    }

    select(value) {
        this.value = value;
        this.updateDisplay();
        this.close();
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value },
                bubbles: true,
            }),
        );
    }

    updateDisplay() {
        const display = this.shadowRoot.querySelector('.selected-value');
        const option = this.options.find((o) => o.value === this.value);
        if (display && option) {
            display.textContent = option.label;
        }
    }

    renderOptions() {
        const list = this.shadowRoot.querySelector('.options-list');
        if (!list) return;

        list.innerHTML = '';
        this.options.forEach((opt) => {
            const item = document.createElement('div');
            item.className = `option-item ${opt.value === this.value ? 'selected' : ''}`;
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
                }

                .select-header:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .select-container.open .select-header {
                    border-color: #ccff00;
                    background: rgba(255, 255, 255, 0.1);
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
                }

                .option-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                }

                .option-item.selected {
                    color: #ccff00;
                    background: rgba(204, 255, 0, 0.05);
                }
            </style>

            <div class="select-container">
                <div class="select-header">
                    <span class="selected-value">Select...</span>
                    <span class="arrow-icon">${createElement(ChevronDown, { width: 16, height: 16 }).outerHTML}</span>
                </div>
                <div class="options-list"></div>
            </div>
        `;
    }
}

customElements.define('custom-select', CustomSelect);
