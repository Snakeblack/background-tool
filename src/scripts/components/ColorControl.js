/**
 * Color Control Component - Web Component para controles de color OKLCH
 */

export class ColorControl extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['color-index', 'label', 'l-value', 'c-value', 'h-value'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

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
                }
                .control-section {
                    margin-bottom: 1rem;
                }
                .collapsible-header {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: linear-gradient(135deg, #2a2a3e 0%, #1f1f2e 100%);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    text-align: left;
                }
                .collapsible-header:hover {
                    background: linear-gradient(135deg, #343448 0%, #252535 100%);
                    transform: translateY(-1px);
                }
                .collapse-icon {
                    transition: transform 0.3s ease;
                    font-size: 0.875rem;
                }
                .collapsible-header.collapsed .collapse-icon {
                    transform: rotate(-90deg);
                }
                .color-preview-inline {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    margin-left: auto;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                .collapsible-content {
                    max-height: 500px;
                    overflow: hidden;
                    transition: max-height 0.3s ease, opacity 0.3s ease;
                    opacity: 1;
                    padding: 1rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 0 0 8px 8px;
                    margin-top: -8px;
                }
                .collapsible-content.collapsed {
                    max-height: 0;
                    opacity: 0;
                    padding: 0 1rem;
                }
                .control-item {
                    margin-bottom: 1rem;
                }
                .control-item:last-child {
                    margin-bottom: 0;
                }
                label {
                    display: block;
                    font-size: 0.75rem;
                    color: #9ca3af;
                    margin-bottom: 0.5rem;
                }
                input[type="range"] {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: linear-gradient(to right, #4a5568, #718096);
                    outline: none;
                    -webkit-appearance: none;
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    transition: transform 0.2s;
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
                input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    border: none;
                    transition: transform 0.2s;
                }
                input[type="range"]::-moz-range-thumb:hover {
                    transform: scale(1.2);
                }

                /* Responsive Design */
                @media (max-width: 640px) {
                    .collapsible-header {
                        padding: 0.625rem 0.875rem;
                        font-size: 0.8125rem;
                    }
                    .collapse-icon {
                        font-size: 0.75rem;
                    }
                    .color-preview-inline {
                        width: 20px;
                        height: 20px;
                    }
                    .collapsible-content {
                        padding: 0.875rem;
                    }
                    .control-item {
                        margin-bottom: 0.875rem;
                    }
                    label {
                        font-size: 0.6875rem;
                        margin-bottom: 0.375rem;
                    }
                    input[type="range"] {
                        height: 1.75rem;
                    }
                }

                @media (max-width: 480px) {
                    .collapsible-header {
                        padding: 0.5rem 0.75rem;
                        font-size: 0.75rem;
                    }
                    .collapse-icon {
                        font-size: 0.6875rem;
                    }
                    .color-preview-inline {
                        width: 18px;
                        height: 18px;
                    }
                    .collapsible-content {
                        padding: 0.75rem;
                    }
                    .control-item {
                        margin-bottom: 0.75rem;
                    }
                    label {
                        font-size: 0.625rem;
                        margin-bottom: 0.25rem;
                    }
                    input[type="range"] {
                        height: 1.5rem;
                    }
                }
            </style>
            
            <div class="control-section">
                <button class="collapsible-header" id="header">
                    <span class="collapse-icon">▼</span>
                    <span>${label}</span>
                    <div class="color-preview-inline" id="preview"></div>
                </button>
                <div class="collapsible-content" id="content">
                    <div class="control-item">
                        <label>Luz (L): <span id="l-val">${lValue}</span></label>
                        <input type="range" id="l-slider" min="0.1" max="1.0" step="0.01" value="${lValue}" 
                               data-color="${colorIndex}" data-channel="l" class="oklch-slider">
                    </div>
                    <div class="control-item">
                        <label>Croma (C): <span id="c-val">${cValue}</span></label>
                        <input type="range" id="c-slider" min="0.0" max="0.4" step="0.005" value="${cValue}"
                               data-color="${colorIndex}" data-channel="c" class="oklch-slider">
                    </div>
                    <div class="control-item">
                        <label>Tono (H): <span id="h-val">${hValue}</span></label>
                        <input type="range" id="h-slider" min="0" max="360" step="1" value="${hValue}"
                               data-color="${colorIndex}" data-channel="h" class="oklch-slider">
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        const header = this.shadowRoot.getElementById('header');
        const content = this.shadowRoot.getElementById('content');
        
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });

        // Slider events - dispatch custom events to parent
        const sliders = this.shadowRoot.querySelectorAll('.oklch-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const channel = e.target.dataset.channel;
                const value = parseFloat(e.target.value);
                
                // Update display
                this.shadowRoot.getElementById(`${channel}-val`).textContent = 
                    channel === 'h' ? value : value.toFixed(channel === 'c' ? 3 : 2);
                
                // Dispatch event to parent
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

    // Public method to update preview color
    updatePreview(hexColor) {
        const preview = this.shadowRoot.getElementById('preview');
        if (preview) {
            preview.style.backgroundColor = hexColor;
        }
    }
}

// Register the custom element
customElements.define('color-control', ColorControl);
