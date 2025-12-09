/**
 * Color Control Component - Web Component para controles de color OKLCH
 */

import * as culori from 'culori';
import { ChevronDown, createElement } from 'lucide';

export class ColorControl extends HTMLElement {
    /**
     * Constructor del componente ColorControl
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /**
     * Atributos observados del componente
     * @returns {string[]} Lista de atributos a observar
     */
    static get observedAttributes() {
        return ['color-index', 'label', 'l-value', 'c-value', 'h-value'];
    }

    /**
     * Callback ejecutado cuando el componente se conecta al DOM
     */
    connectedCallback() {
        this.render();
        this.updateInitialPreview();
    }

    /**
     * Callback ejecutado cuando cambia un atributo observado
     * @param {string} name - Nombre del atributo
     * @param {string} oldValue - Valor anterior
     * @param {string} newValue - Nuevo valor
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
            if (['l-value', 'c-value', 'h-value'].includes(name)) {
                this.updateInitialPreview();
            }
        }
    }

    /**
     * Renderiza el componente con su estructura HTML y estilos
     */
    render() {
        const colorIndex = this.getAttribute('color-index') || '1';
        const label = this.getAttribute('label') || `Color ${colorIndex}`;
        const lValue = this.getAttribute('l-value') || '0.7';
        const cValue = this.getAttribute('c-value') || '0.25';
        const hValue = this.getAttribute('h-value') || '330';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'Inter', sans-serif;
                }
                .control-section {
                    margin-bottom: 0.75rem;
                }
                .collapsible-header {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    color: #e0e0e0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    text-align: left;
                    font-family: 'Space Grotesk', sans-serif;
                    font-weight: 500;
                    font-size: 0.9375rem;
                }
                .collapsible-header:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                    color: white;
                    transform: translateY(-1px);
                }
                .collapsible-header.active {
                    border-color: rgba(204, 255, 0, 0.3);
                    background: rgba(204, 255, 0, 0.05);
                }
                .collapse-icon {
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    font-size: 0.75rem;
                    color: #a0a0a0;
                    display: flex;
                    align-items: center;
                }
                .collapsible-header.collapsed .collapse-icon {
                    transform: rotate(-90deg);
                }
                .color-preview-inline {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    margin-left: auto;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
                }
                .collapsible-content {
                    max-height: 500px;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    opacity: 1;
                    padding: 1rem;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-top: none;
                    border-radius: 0 0 16px 16px;
                    margin-top: -8px;
                    padding-top: 1.5rem;
                }
                .collapsible-content.collapsed {
                    max-height: 0;
                    opacity: 0;
                    padding: 0 1rem;
                    border-color: transparent;
                }
                .control-item {
                    margin-bottom: 1rem;
                }
                .control-item:last-child {
                    margin-bottom: 0;
                }
                label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: #a0a0a0;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 500;
                }
                label span {
                    color: #ffffff;
                    font-family: 'Space Mono', monospace;
                }
                input[type="range"] {
                    width: 100%;
                    height: 4px;
                    border-radius: 2px;
                    background: rgba(255, 255, 255, 0.1);
                    outline: none;
                    -webkit-appearance: none;
                    appearance: none;
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #ccff00;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(204, 255, 0, 0.5);
                    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    margin-top: -6px; /* Center on track */
                }
                input[type="range"]::-webkit-slider-runnable-track {
                    height: 4px;
                    border-radius: 2px;
                    background: rgba(255, 255, 255, 0.1);
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 0 15px rgba(204, 255, 0, 0.8);
                }
                input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #ccff00;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(204, 255, 0, 0.5);
                    border: none;
                    transition: transform 0.2s;
                }
                input[type="range"]::-moz-range-thumb:hover {
                    transform: scale(1.2);
                }

                @media (max-width: 640px) {
                    .collapsible-header {
                        padding: 0.625rem 0.875rem;
                        font-size: 0.875rem;
                    }
                    .color-preview-inline {
                        width: 18px;
                        height: 18px;
                    }
                    .collapsible-content {
                        padding: 0.875rem;
                        padding-top: 1.25rem;
                    }
                    label {
                        font-size: 0.6875rem;
                    }
                }
                
                .icon-sm {
                    width: 1rem;
                    height: 1rem;
                    stroke-width: 2;
                }
            </style>
            
            <div class="control-section">
                <button class="collapsible-header" id="header">
                    <span class="collapse-icon">${createElement(ChevronDown, {class: "icon-sm"}).outerHTML}</span>
                    <span>${label}</span>
                    <div class="color-preview-inline" id="preview"></div>
                </button>
                <div class="collapsible-content" id="content">
                    <div class="control-item">
                        <label for="l-slider">Lightness <span>${Math.round(lValue * 100)}</span></label>
                        <input type="range" id="l-slider" min="0.0" max="1.0" step="0.001" value="${lValue}" 
                               data-color="${colorIndex}" data-channel="l" class="oklch-slider">
                    </div>
                    <div class="control-item">
                        <label for="c-slider">Chroma <span>${Math.round((cValue / 0.4) * 100)}</span></label>
                        <input type="range" id="c-slider" min="0.0" max="0.4" step="0.001" value="${cValue}"
                               data-color="${colorIndex}" data-channel="c" class="oklch-slider">
                    </div>
                    <div class="control-item">
                        <label for="h-slider">Hue <span>${Math.round(hValue)}</span></label>
                        <input type="range" id="h-slider" min="0" max="360" step="0.1" value="${hValue}"
                               data-color="${colorIndex}" data-channel="h" class="oklch-slider">
                    </div>
                </div>
            </div>
        `;

        const header = this.shadowRoot.getElementById('header');
        const content = this.shadowRoot.getElementById('content');
        
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            header.classList.toggle('active'); // Add active state for border color
            content.classList.toggle('collapsed');
        });

        const sliders = this.shadowRoot.querySelectorAll('.oklch-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const channel = e.target.dataset.channel;
                const value = parseFloat(e.target.value);
                
                // Update label span directly
                const labelSpan = slider.previousElementSibling.querySelector('span');
                if (labelSpan) {
                    if (channel === 'l') {
                        labelSpan.textContent = Math.round(value * 100);
                    } else if (channel === 'c') {
                        labelSpan.textContent = Math.round((value / 0.4) * 100);
                    } else if (channel === 'h') {
                        labelSpan.textContent = Math.round(value);
                    }
                }
                
                this.dispatchEvent(new CustomEvent('color-change', {
                    detail: {
                        colorIndex: parseInt(colorIndex),
                        channel,
                        value
                    },
                    bubbles: true,
                    composed: true
                }));
            });
        });
    }

    /**
     * Actualiza el preview del color con un valor hexadecimal
     * @param {string} hexColor - Color en formato hexadecimal
     */
    updatePreview(hexColor) {
        const preview = this.shadowRoot.getElementById('preview');
        if (preview) {
            preview.style.backgroundColor = hexColor;
        }
    }

    /**
     * Obtiene los valores actuales OKLCH del componente
     * @returns {{ l: number, c: number, h: number }}
     */
    getColorOKLCH() {
        return {
            l: parseFloat(this.getAttribute('l-value') || '0.7'),
            c: parseFloat(this.getAttribute('c-value') || '0.25'),
            h: parseFloat(this.getAttribute('h-value') || '330')
        };
    }

    /**
     * Actualiza el preview inicial del color al montar el componente
     */
    updateInitialPreview() {
        const oklch = this.getColorOKLCH();
        const hex = culori.formatHex({ mode: 'oklch', ...oklch });
        this.updatePreview(hex);
    }
}

customElements.define('color-control', ColorControl);
