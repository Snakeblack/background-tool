/**
 * Export Modal — step-by-step guide to use the current background on any website.
 * All code comes from export/codegen.js (built from the real source files).
 */
import { AlertCircle, AlertOctagon, AlertTriangle, Check, Clipboard, Download, Info, X, createElement } from 'lucide';
import { evaluateTips } from '../export/evaluateTips.js';
import { EXPORT_I18N } from '../export/i18n.js';
import { buildFiles, buildImportMap, buildTuningSnippets } from '../export/codegen.js';
import { createZip } from '../export/zip.js';

const TABS = ['vanilla', 'react', 'vue', 'angular', 'astro', 'tuning'];
const TAB_KEYS = { vanilla: 'tabVanilla', react: 'tabReact', vue: 'tabVue', angular: 'tabAngular', astro: 'tabAstro', tuning: 'tabTuning' };

const icon = (Icon, cls = 'icon') => createElement(Icon, { class: cls, 'aria-hidden': 'true' }).outerHTML;

const STYLE = `
    :host {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.62);
        backdrop-filter: blur(10px);
        z-index: 1000;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.25s ease;
        font-family: var(--font-body, 'Inter', sans-serif);
    }
    :host(.open) { display: flex; opacity: 1; }

    * { box-sizing: border-box; }

    .modal-container {
        background: rgba(14, 14, 18, 0.97);
        border-radius: 24px;
        max-width: 880px;
        width: 92%;
        max-height: 90vh;
        max-height: 90dvh;
        overflow: hidden;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        color: #fff;
    }

    .modal-header {
        padding: 1.25rem 1.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .modal-title {
        font-family: var(--font-display, 'Space Grotesk', sans-serif);
        font-size: 1.35rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        margin: 0;
    }

    .header-actions { display: flex; align-items: center; gap: 0.75rem; }

    .lang-switch {
        display: inline-flex;
        gap: 0.25rem;
        padding: 0.25rem;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .lang-btn {
        padding: 0.375rem 0.7rem;
        border: none;
        background: transparent;
        color: #b4b4b4;
        cursor: pointer;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.75rem;
        transition: color 0.2s, background-color 0.2s;
    }
    .lang-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
    .lang-btn.active { color: var(--accent, #ccff00); background: rgba(204, 255, 0, 0.12); }

    .close-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: rgba(255, 255, 255, 0.06);
        color: #b4b4b4;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s, color 0.2s, transform 0.2s;
    }
    .close-btn:hover { background: rgba(255, 255, 255, 0.12); color: #fff; transform: rotate(90deg); }

    button:focus-visible { outline: 2px solid var(--accent, #ccff00); outline-offset: 2px; }

    .modal-body { padding: 1.5rem 1.75rem 2rem; overflow-y: auto; flex: 1; overscroll-behavior: contain; }

    .summary {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1rem;
        margin-bottom: 1rem;
    }
    .summary-name { font-family: var(--font-display, 'Space Grotesk', sans-serif); font-weight: 600; font-size: 1.05rem; }
    .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.25rem 0.65rem;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 0.75rem;
        color: #cfcfcf;
    }
    .badge[data-cost='light'] { color: #7dffb0; border-color: rgba(125, 255, 176, 0.35); }
    .badge[data-cost='medium'] { color: #ffd166; border-color: rgba(255, 209, 102, 0.35); }
    .badge[data-cost='heavy'] { color: #ff8a5c; border-color: rgba(255, 138, 92, 0.35); }
    .intro { margin: 0 0 1.25rem; color: #b4b4b4; font-size: 0.9rem; line-height: 1.5; }

    .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        overflow-x: auto;
    }
    .tab {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 9999px;
        color: #b4b4b4;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.875rem;
        white-space: nowrap;
        flex-shrink: 0;
        transition: color 0.2s, background-color 0.2s, border-color 0.2s;
    }
    .tab:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
    .tab[aria-selected='true'] {
        color: var(--accent, #ccff00);
        background: rgba(204, 255, 0, 0.1);
        border-color: var(--accent, #ccff00);
        font-weight: 600;
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .section-title { font-family: var(--font-display, 'Space Grotesk', sans-serif); font-size: 1.1rem; margin: 0; }

    .download-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 1rem;
        background: var(--accent, #ccff00);
        color: var(--accent-ink, #0b0d00);
        border: none;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .download-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(204, 255, 0, 0.3); }

    .step { display: flex; align-items: center; gap: 0.6rem; margin: 1.75rem 0 0.5rem; font-weight: 600; }
    .step:first-of-type { margin-top: 0.5rem; }
    .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        flex: none;
        background: var(--accent, #ccff00);
        color: var(--accent-ink, #0b0d00);
        border-radius: 50%;
        font-weight: 700;
        font-size: 0.8rem;
    }
    .step-info { margin: 0 0 0.5rem 2.1rem; color: #b4b4b4; font-size: 0.85rem; line-height: 1.5; }

    .code-block {
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        margin: 0.75rem 0;
        overflow: hidden;
    }
    .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.55rem 0.75rem 0.55rem 1rem;
        background: rgba(255, 255, 255, 0.04);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .code-title { color: #e8e8e8; font-size: 0.82rem; font-weight: 600; font-family: ui-monospace, 'Cascadia Code', Consolas, monospace; word-break: break-all; }
    .copy-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.8rem;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #e8e8e8;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.78rem;
        line-height: 1;
        flex: none;
        transition: background-color 0.2s, border-color 0.2s, color 0.2s;
    }
    .copy-btn:hover { background: rgba(255, 255, 255, 0.12); }
    .copy-btn.copied { color: #7dffb0; border-color: rgba(125, 255, 176, 0.4); background: rgba(125, 255, 176, 0.08); }
    .copy-btn.copy-error { color: #ff8d8d; border-color: rgba(255, 141, 141, 0.4); background: rgba(255, 141, 141, 0.08); }
    .file-note { padding: 0.6rem 1rem 0; margin: 0; color: #9a9a9a; font-size: 0.78rem; line-height: 1.45; }

    pre { margin: 0; padding: 0.9rem 1rem 1rem; overflow: auto; max-height: 340px; }
    code { font-family: ui-monospace, 'Cascadia Code', Consolas, 'Courier New', monospace; font-size: 0.8rem; line-height: 1.6; color: #e5e7eb; }

    .info-box {
        background: rgba(204, 255, 0, 0.06);
        border-left: 3px solid var(--accent, #ccff00);
        padding: 0.9rem 1.1rem;
        border-radius: 6px;
        margin: 1rem 0;
        color: #e5e7eb;
        font-size: 0.86rem;
        line-height: 1.55;
    }
    .info-box ul { margin: 0; padding-left: 1.1rem; }
    .info-box li { margin: 0.3rem 0; }

    .icon { width: 1.1rem; height: 1.1rem; stroke-width: 2; flex: none; }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }

    /* ── Export tips ── */
    .tips { margin-bottom: 1.25rem; }
    .tips summary {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        color: #b4b4b4;
        font-size: 0.82rem;
        padding: 0.35rem 0.75rem 0.35rem 0.6rem;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        list-style: none;
    }
    .tips summary::-webkit-details-marker { display: none; }
    .tips summary:hover { color: #fff; }
    .tips[open] summary { margin-bottom: 0.75rem; }
    .export-tips { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
    .tips .export-tips { margin-bottom: 0; }
    .export-tips-all-ok { display: flex; align-items: center; gap: 0.5rem; color: rgba(134, 239, 172, 0.9); font-size: 0.85rem; }
    .tip-item { display: flex; gap: 0.75rem; padding: 0.65rem 0.9rem; border-radius: 10px; font-size: 0.8rem; line-height: 1.45; }
    .tip-item.tip-info { background: rgba(96, 165, 250, 0.08); border: 1px solid rgba(96, 165, 250, 0.25); }
    .tip-item.tip-warning { background: rgba(251, 191, 36, 0.08); border: 1px solid rgba(251, 191, 36, 0.3); }
    .tip-item.tip-critical { background: rgba(248, 113, 113, 0.08); border: 1px solid rgba(248, 113, 113, 0.35); }
    .tip-icon { flex-shrink: 0; margin-top: 0.1rem; }
    .tip-icon.tip-info { color: rgba(96, 165, 250, 0.9); }
    .tip-icon.tip-warning { color: rgba(251, 191, 36, 0.9); }
    .tip-icon.tip-critical { color: rgba(248, 113, 113, 0.9); }
    .tip-body strong { display: block; margin-bottom: 0.2rem; }
    .tip-suggestion { margin-top: 0.25rem; opacity: 0.75; }

    @media (max-width: 640px) {
        .modal-container { width: 100%; height: 100%; max-height: 100dvh; border-radius: 0; }
        .modal-header { padding: 1rem 1.1rem; padding-top: calc(1rem + env(safe-area-inset-top)); }
        .modal-title { font-size: 1.1rem; }
        .modal-body { padding: 1.1rem; }
        .tab { padding: 0.5rem 0.8rem; font-size: 0.8rem; }
        pre { max-height: 260px; }
    }

    @media (prefers-reduced-motion: reduce) {
        :host, .close-btn, .download-btn { transition: none; }
    }
`;

export class ExportModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.codeBlocks = new Map();
        this.persistence = null;
        this.config = null;
        this.runtimeContext = null;
        this._language = 'en';
        this._activeTab = 'vanilla';
        this._previousFocus = null;
        this._onKeydown = (event) => {
            if (event.key === 'Escape') this.close();
        };
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this._onKeydown);
    }

    setPersistenceManager(persistenceManager) {
        this.persistence = persistenceManager;
        const persisted = this.persistence?.getLanguage?.();
        if (persisted === 'auto') {
            const raw = (navigator?.languages?.length ? navigator.languages[0] : navigator?.language) || 'en';
            this.setLanguage(String(raw).toLowerCase().startsWith('es') ? 'es' : 'en', { persist: false });
        } else if (persisted) {
            this.setLanguage(persisted, { persist: false });
        }
    }

    getLanguage() {
        return this._language === 'es' ? 'es' : 'en';
    }

    setLanguage(language, { persist = true } = {}) {
        const normalized = language === 'es' ? 'es' : 'en';
        if (this._language === normalized) return;

        this._language = normalized;
        if (persist) this.persistence?.setLanguage?.(normalized);

        const wasOpen = this.classList.contains('open');
        this.render();
        if (wasOpen) {
            this.classList.add('open');
            if (this.config) this.generateContent();
        }
    }

    t(key, params = null) {
        const raw = EXPORT_I18N[this.getLanguage()]?.[key] ?? EXPORT_I18N.en[key] ?? key;
        if (!params || typeof raw !== 'string') return raw;
        return raw.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`);
    }

    // ── Shell ────────────────────────────────────────────────────────────

    render() {
        const lang = this.getLanguage();
        this.shadowRoot.innerHTML = `
            <style>${STYLE}</style>
            <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-header">
                    <h2 class="modal-title" id="modal-title">${this.t('modalTitle')}</h2>
                    <div class="header-actions">
                        <div class="lang-switch" role="group" aria-label="${this.t('languageLabel')}">
                            <button class="lang-btn ${lang === 'en' ? 'active' : ''}" type="button" data-lang="en">EN</button>
                            <button class="lang-btn ${lang === 'es' ? 'active' : ''}" type="button" data-lang="es">ES</button>
                        </div>
                        <button class="close-btn" id="close-btn" type="button" aria-label="${this.t('close')}">${icon(X)}</button>
                    </div>
                </div>
                <div class="modal-body">
                    <div id="export-tips-section"></div>
                    <div id="summary"></div>
                    <div class="tabs" role="tablist">
                        ${TABS.map((tab) => `<button class="tab" type="button" role="tab" id="tab-${tab}" aria-controls="${tab}-content" aria-selected="${tab === this._activeTab}" data-tab="${tab}">${this.t(TAB_KEYS[tab])}</button>`).join('')}
                    </div>
                    ${TABS.map((tab) => `<div class="tab-content${tab === this._activeTab ? ' active' : ''}" role="tabpanel" id="${tab}-content" aria-labelledby="tab-${tab}"></div>`).join('')}
                </div>
            </div>
        `;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const root = this.shadowRoot;

        root.getElementById('close-btn').addEventListener('click', () => this.close());
        root.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.setLanguage(btn.dataset.lang, { persist: true }));
        });

        // Click on the backdrop closes; clicks inside the dialog never bubble out.
        this.addEventListener('click', (event) => {
            if (event.target === this) this.close();
        });

        root.querySelector('.modal-container').addEventListener('click', (event) => {
            const target = event.target instanceof Element ? event.target : event.target?.parentElement;
            const copyBtn = target?.closest('.copy-btn');
            if (copyBtn) this.copyCode(copyBtn);
            const downloadBtn = target?.closest('.download-btn');
            if (downloadBtn) this.downloadZip(downloadBtn.dataset.framework);
            event.stopPropagation();
        });

        root.querySelectorAll('.tab').forEach((tab) => {
            tab.addEventListener('click', () => this.activateTab(tab.dataset.tab));
        });
    }

    activateTab(tabId) {
        this._activeTab = tabId;
        this.shadowRoot.querySelectorAll('.tab').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.tab === tabId)));
        this.shadowRoot.querySelectorAll('.tab-content').forEach((content) => content.classList.toggle('active', content.id === `${tabId}-content`));
    }

    // ── Open / close ─────────────────────────────────────────────────────

    /**
     * @param {Object} config  Current background (see UIController.getCurrentConfiguration)
     * @param {Object} [runtimeContext]  GPU tier, fps, mobile, reduced motion, shader complexity
     */
    open(config, runtimeContext) {
        this.config = config;
        this.runtimeContext = runtimeContext ?? null;
        this.codeBlocks = new Map();

        const persisted = this.persistence?.getLanguage?.();
        if (persisted && persisted !== 'auto' && persisted !== this.getLanguage()) this.setLanguage(persisted, { persist: false });

        this._previousFocus = document.activeElement;
        this.generateContent();
        this.classList.add('open');
        document.addEventListener('keydown', this._onKeydown);
        this.shadowRoot.getElementById('close-btn')?.focus();
    }

    close() {
        this.classList.remove('open');
        document.removeEventListener('keydown', this._onKeydown);
        this._previousFocus?.focus?.();
        this._previousFocus = null;
    }

    // ── Content ──────────────────────────────────────────────────────────

    generateContent() {
        this.generateTips();
        this.generateSummary();
        ['vanilla', 'react', 'vue', 'angular', 'astro'].forEach((framework) => this.generateFramework(framework));
        this.generateTuning();
    }

    lang() {
        return this.getLanguage();
    }

    generateTips() {
        const container = this.shadowRoot.getElementById('export-tips-section');
        if (!container) return;
        if (!this.runtimeContext) {
            container.innerHTML = '';
            return;
        }

        const tips = evaluateTips(this.runtimeContext);
        const severityIcon = (severity) => {
            if (severity === 'critical') return icon(AlertOctagon);
            if (severity === 'warning') return icon(AlertTriangle);
            return icon(Info);
        };

        if (tips.length === 0) {
            container.innerHTML = `<div class="export-tips"><div class="export-tips-all-ok">${icon(Check)}<span>${this.t('tipsAllGood')}</span></div></div>`;
            return;
        }

        // Info-level notes stay folded so the guide is the first thing you see.
        const needsAttention = tips.some((tip) => tip.severity !== 'info');
        container.innerHTML = `
            <details class="tips"${needsAttention ? ' open' : ''}>
                <summary>${icon(Info)}<span>${this.t('tipsSummary', { n: tips.length })}</span></summary>
                <div class="export-tips">${tips.map((tip) => `
                    <div class="tip-item tip-${tip.severity}">
                        <span class="tip-icon tip-${tip.severity}">${severityIcon(tip.severity)}</span>
                        <div class="tip-body">
                            <strong>${this.t(tip.titleKey)}</strong>
                            <span>${this.t(tip.descriptionKey)}</span>
                            <div class="tip-suggestion">${this.t(tip.suggestionKey)}</div>
                        </div>
                    </div>`).join('')}</div>
            </details>`;
    }

    generateSummary() {
        const { config } = this;
        const name = config.name?.[this.lang()] ?? config.name?.en ?? config.shader;
        const scale = Math.round((config.renderScale ?? 1) * 100);
        this.shadowRoot.getElementById('summary').innerHTML = `
            <div class="summary">
                <span class="summary-name">${this.escapeHtml(name)}</span>
                <span class="badge" data-cost="${config.cost}">${this.t('cost')}: ${this.t(`cost.${config.cost}`)}</span>
                <span class="badge">${this.t('renderScale', { scale })}</span>
            </div>
            <p class="intro">${this.escapeHtml(this.t('intro'))}</p>`;
    }

    step(number, title, info = '') {
        return `
            <div class="step"><span class="step-number">${number}</span><span>${this.escapeHtml(title)}</span></div>
            ${info ? `<p class="step-info">${this.escapeHtml(info)}</p>` : ''}`;
    }

    /** @param {{ id: string, path: string, language: string, code: string }} file */
    fileBlock(file) {
        return this.codeBlock(file.path, file.code, this.t(`file.${file.id}`));
    }

    codeBlock(title, code, note = '') {
        const blockId = `code-${Math.random().toString(36).slice(2, 11)}`;
        this.codeBlocks.set(blockId, code);
        return `
            <div class="code-block">
                <div class="code-header">
                    <span class="code-title">${this.escapeHtml(title)}</span>
                    <button class="copy-btn" type="button" data-block-id="${blockId}">${icon(Clipboard)} ${this.t('copy')}</button>
                </div>
                ${note ? `<p class="file-note">${this.escapeHtml(note)}</p>` : ''}
                <pre><code>${this.escapeHtml(code)}</code></pre>
            </div>`;
    }

    generateFramework(framework) {
        const container = this.shadowRoot.getElementById(`${framework}-content`);
        const files = buildFiles(framework, this.config);
        const common = files.filter((f) => ['uniforms', 'lib', 'shader', 'mount'].includes(f.id));
        const glue = files.filter((f) => !['uniforms', 'lib', 'shader', 'mount'].includes(f.id));

        let n = 0;
        const install = framework === 'vanilla'
            ? `${this.step(++n, this.t('stepInstall'), this.t('stepInstallInfo'))}
               ${this.codeBlock('Terminal', 'npm install three')}
               ${this.step(++n, this.t('stepNoBuild'), this.t('stepNoBuildInfo'))}
               ${this.codeBlock('index.html', buildImportMap())}`
            : `${this.step(++n, this.t('stepInstall'), this.t('stepInstallInfo'))}
               ${this.codeBlock('Terminal', 'npm install three')}`;

        container.innerHTML = `
            <div class="section-head">
                <h3 class="section-title">${this.t(TAB_KEYS[framework])}</h3>
                <button class="download-btn" type="button" data-framework="${framework}" title="${this.t('downloadHint')}">${icon(Download)} ${this.t('download')}</button>
            </div>
            ${install}
            ${this.step(++n, this.t('stepFiles'), this.t('stepFilesInfo'))}
            ${common.map((file) => this.fileBlock(file)).join('')}
            ${this.step(++n, this.t('stepGlue'))}
            ${glue.map((file) => this.fileBlock(file)).join('')}
            ${this.step(++n, this.t('stepChecklist'))}
            <div class="info-box"><ul>${this.t('checklist').map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul></div>
        `;
    }

    generateTuning() {
        const container = this.shadowRoot.getElementById('tuning-content');
        const snippets = buildTuningSnippets(this.config);

        container.innerHTML = `
            <div class="section-head"><h3 class="section-title">${this.t('tuningTitle')}</h3></div>
            ${this.step(1, this.t('tuningBuiltIn'))}
            <div class="info-box"><ul>${this.t('builtIn').map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul></div>
            <p class="step-info">${this.escapeHtml(this.t('tuningSupport'))}</p>
            ${this.step(2, this.t('tuningOptions'), this.t('tuningOptionsInfo'))}
            ${this.codeBlock('mountBackground options', snippets.options)}
            ${this.step(3, this.t('tuningLazy'), this.t('tuningLazyInfo'))}
            ${this.codeBlock('lazy.js', snippets.lazy)}
            ${this.step(4, this.t('tuningSection'), this.t('tuningSectionInfo'))}
            ${this.codeBlock('section.css', snippets.section)}
        `;
    }

    // ── ZIP ──────────────────────────────────────────────────────────────

    downloadZip(framework) {
        if (!this.config) return;
        const files = buildFiles(framework, this.config);
        const readme = [
            `# ${this.config.name?.en ?? this.config.shader} — animated background`,
            '',
            'Generated with MMRG Background Generator (https://background.mretamozo.com).',
            '',
            '1. `npm install three`',
            '2. Copy the files into your project, keeping the folder structure.',
            '3. Follow the usage example (the last file) to mount it in your page.',
            '',
            'Palette and settings live in the DEFAULTS object at the top of the mount module.',
        ].join('\n');

        const blob = createZip([...files.map((f) => ({ path: f.path, content: f.code })), { path: 'README.md', content: readme }]);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.config.shader}-${framework}-background.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    // ── Clipboard ────────────────────────────────────────────────────────

    async copyCode(button) {
        const code = this.codeBlocks.get(button.getAttribute('data-block-id'));
        if (!code) {
            this.flash(button, 'copy-error', icon(AlertCircle), this.t('copyError'), 2500);
            return;
        }

        let success = false;
        try {
            await navigator.clipboard.writeText(code);
            success = true;
        } catch {
            success = this.copyWithTextarea(code);
        }

        if (success) this.flash(button, 'copied', icon(Check), this.t('copied'), 2000);
        else this.flash(button, 'copy-error', icon(AlertCircle), this.t('copyError'), 2500);
    }

    /** Fallback for insecure contexts / denied clipboard permission. */
    copyWithTextarea(text) {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
        document.body.appendChild(area);
        try {
            area.select();
            return document.execCommand('copy');
        } catch {
            return false;
        } finally {
            area.remove();
        }
    }

    flash(button, className, iconHtml, label, ms) {
        const original = button.innerHTML;
        button.innerHTML = `${iconHtml} ${label}`;
        button.classList.add(className);
        setTimeout(() => {
            button.innerHTML = original;
            button.classList.remove(className);
        }, ms);
    }

    escapeHtml(text) {
        return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
    }
}

customElements.define('export-modal', ExportModal);
