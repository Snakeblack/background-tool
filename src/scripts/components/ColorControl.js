/**
 * Color Control Component - Web Component para controles de color OKLCH
 *
 * Rendered once; attribute/API changes update the DOM in place so the
 * collapsed state and an in-progress drag are never lost.
 */

import { ChevronDown, createElement } from 'lucide';

const CHROMA_MAX = 0.4;

export class ColorControl extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._rendered = false;
    }

    static get observedAttributes() {
        return ['label', 'l-label', 'c-label', 'h-label'];
    }

    connectedCallback() {
        if (!this._rendered) this.render();
        this.setColor(this.getColorOKLCH());
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue || !this._rendered) return;
        this.applyLabels();
    }

    get colorIndex() {
        return this.getAttribute('color-index') || '1';
    }

    render() {
        const index = this.colorIndex;
        const open = this.hasAttribute('open');

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; font-family: var(--font-body, 'Inter', sans-serif); }

                .control-section { margin-bottom: 0.5rem; }

                .header {
                    width: 100%;
                    padding: 0.7rem 0.9rem;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.09);
                    border-radius: 14px;
                    color: #eee;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.65rem;
                    text-align: left;
                    font-family: var(--font-display, 'Space Grotesk', sans-serif);
                    font-weight: 500;
                    font-size: 0.9rem;
                    transition: background-color 0.2s ease, border-color 0.2s ease;
                    -webkit-tap-highlight-color: transparent;
                }
                .header:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
                .header:focus-visible { outline: 2px solid var(--accent, #ccff00); outline-offset: 2px; }
                .header[aria-expanded="true"] { border-color: rgba(204, 255, 0, 0.35); }

                .chevron { display: flex; color: #a0a0a0; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
                .header[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
                .chevron svg { width: 1rem; height: 1rem; }

                .swatch {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    margin-left: auto;
                    flex: none;
                }

                .body {
                    display: grid;
                    grid-template-rows: 1fr;
                    transition: grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .body.collapsed { grid-template-rows: 0fr; }
                .body-inner { overflow: hidden; min-height: 0; }
                .fields { padding: 0.9rem 0.25rem 0.25rem; }

                .field { margin-bottom: 0.9rem; }
                .field:last-child { margin-bottom: 0; }

                .field-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 0.4rem;
                }
                label {
                    font-size: 0.72rem;
                    color: #b4b4b4;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    font-weight: 500;
                }
                output {
                    font-size: 0.78rem;
                    color: #fff;
                    font-variant-numeric: tabular-nums;
                    opacity: 0.85;
                }

                input[type="range"] {
                    --fill: 50%;
                    width: 100%;
                    height: 20px;
                    margin: 0;
                    background: transparent;
                    -webkit-appearance: none;
                    appearance: none;
                    cursor: pointer;
                    touch-action: pan-y;
                }
                input[type="range"]::-webkit-slider-runnable-track {
                    height: 4px;
                    border-radius: 2px;
                    background: linear-gradient(to right, var(--accent, #ccff00) var(--fill), rgba(255, 255, 255, 0.14) var(--fill));
                }
                input[type="range"]::-moz-range-track {
                    height: 4px;
                    border-radius: 2px;
                    background: linear-gradient(to right, var(--accent, #ccff00) var(--fill), rgba(255, 255, 255, 0.14) var(--fill));
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    margin-top: -6px;
                    border-radius: 50%;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(204, 255, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.4);
                    transition: transform 0.15s ease;
                }
                input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border: none;
                    border-radius: 50%;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(204, 255, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.4);
                }
                input[type="range"]:hover::-webkit-slider-thumb,
                input[type="range"]:active::-webkit-slider-thumb { transform: scale(1.15); }
                input[type="range"]:focus-visible { outline: 2px solid var(--accent, #ccff00); outline-offset: 4px; border-radius: 4px; }

                @media (prefers-reduced-motion: reduce) {
                    .body, .chevron { transition: none; }
                }
            </style>

            <div class="control-section">
                <button type="button" class="header" id="header" aria-expanded="${open}" aria-controls="body">
                    <span class="chevron">${createElement(ChevronDown, { 'aria-hidden': 'true' }).outerHTML}</span>
                    <span id="title"></span>
                    <span class="swatch" id="preview"></span>
                </button>
                <div class="body${open ? '' : ' collapsed'}" id="body" role="region" aria-labelledby="header">
                    <div class="body-inner">
                        <div class="fields">
                            <div class="field">
                                <div class="field-head"><label for="l-slider" id="l-label"></label><output id="l-out" for="l-slider"></output></div>
                                <input type="range" id="l-slider" min="0" max="1" step="0.001" data-channel="l">
                            </div>
                            <div class="field">
                                <div class="field-head"><label for="c-slider" id="c-label"></label><output id="c-out" for="c-slider"></output></div>
                                <input type="range" id="c-slider" min="0" max="${CHROMA_MAX}" step="0.001" data-channel="c">
                            </div>
                            <div class="field">
                                <div class="field-head"><label for="h-slider" id="h-label"></label><output id="h-out" for="h-slider"></output></div>
                                <input type="range" id="h-slider" min="0" max="360" step="0.1" data-channel="h">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._rendered = true;

        const $ = (id) => this.shadowRoot.getElementById(id);
        this.header = $('header');
        this.body = $('body');
        this.preview = $('preview');
        this.sliders = {
            l: $('l-slider'),
            c: $('c-slider'),
            h: $('h-slider'),
        };
        this.outputs = { l: $('l-out'), c: $('c-out'), h: $('h-out') };

        this.header.addEventListener('click', () => this.setOpen(this.header.getAttribute('aria-expanded') !== 'true'));

        Object.entries(this.sliders).forEach(([channel, slider]) => {
            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                this.updateChannelUI(channel, value);
                this.dispatchEvent(new CustomEvent('color-change', {
                    detail: { colorIndex: parseInt(index, 10), channel, value },
                    bubbles: true,
                    composed: true,
                }));
            });
        });

        this.applyLabels();
    }

    applyLabels() {
        const $ = (id) => this.shadowRoot.getElementById(id);
        $('title').textContent = this.getAttribute('label') || `Color ${this.colorIndex}`;
        $('l-label').textContent = this.getAttribute('l-label') || 'Lightness';
        $('c-label').textContent = this.getAttribute('c-label') || 'Chroma';
        $('h-label').textContent = this.getAttribute('h-label') || 'Hue';
    }

    /** Expands or collapses the section and notifies siblings (accordion). */
    setOpen(open) {
        if (!this._rendered) return;
        this.header.setAttribute('aria-expanded', String(open));
        this.body.classList.toggle('collapsed', !open);
        this.toggleAttribute('open', open);
        this.dispatchEvent(new CustomEvent('color-toggle', { detail: { open }, bubbles: true, composed: true }));
    }

    updateChannelUI(channel, value) {
        const slider = this.sliders[channel];
        const max = parseFloat(slider.max);
        const fraction = (value / max) * 100;
        slider.style.setProperty('--fill', `${fraction}%`);
        this.outputs[channel].textContent = channel === 'c' ? Math.round((value / CHROMA_MAX) * 100) : channel === 'h' ? Math.round(value) : Math.round(value * 100);
    }

    /**
     * Sets the OKLCH values (and optional hex swatch) without re-rendering.
     * @param {{ l: number, c: number, h: number }} color
     * @param {string} [hex]
     */
    setColor({ l, c, h }, hex) {
        if (!this._rendered) return;
        this.sliders.l.value = String(l);
        this.sliders.c.value = String(c);
        this.sliders.h.value = String(h);
        this.updateChannelUI('l', l);
        this.updateChannelUI('c', c);
        this.updateChannelUI('h', h);
        if (hex) this.updatePreview(hex);
    }

    /** @param {string} hexColor */
    updatePreview(hexColor) {
        if (this.preview) this.preview.style.backgroundColor = hexColor;
    }

    /** @returns {{ l: number, c: number, h: number }} */
    getColorOKLCH() {
        return {
            l: parseFloat(this.sliders?.l.value ?? '0.7'),
            c: parseFloat(this.sliders?.c.value ?? '0.2'),
            h: parseFloat(this.sliders?.h.value ?? '0'),
        };
    }
}

customElements.define('color-control', ColorControl);
