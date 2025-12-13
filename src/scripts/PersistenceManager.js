/**
 * Persistence Manager - Persistencia optimizada (localStorage + debounce + versioning)
 */

const STORAGE_KEY = 'background-tool:persist:v1';
const STORAGE_VERSION = 1;

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function safeJsonParse(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export class PersistenceManager {
    constructor() {
        this._state = {
            version: STORAGE_VERSION,
            lastShader: null,
            shaders: {},
            ui: {
                language: 'auto'
            }
        };

        this._writeTimer = null;
        this._idleHandle = null;
        this._lastSerialized = '';

        this._loadFromStorage();
        this._bestEffortRequestPersistentStorage();

        // Flush ASAP when the page is being backgrounded/closed.
        try {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this._flushToStorage();
                }
            });
            window.addEventListener('beforeunload', () => this._flushToStorage());
            window.addEventListener('pagehide', () => this._flushToStorage());
        } catch {
            // Ignore
        }
    }

    _bestEffortRequestPersistentStorage() {
        // Best-effort: may be denied depending on browser/user settings.
        try {
            if (navigator?.storage?.persist) {
                navigator.storage.persist().catch(() => {});
            }
        } catch {
            // Ignore
        }
    }

    _loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const parsed = safeJsonParse(raw);
            if (!parsed || parsed.version !== STORAGE_VERSION) return;

            if (typeof parsed !== 'object' || !parsed) return;
            if (!parsed.shaders || typeof parsed.shaders !== 'object') return;

            const persistedLanguage = parsed?.ui?.language;
            const language = persistedLanguage === 'es' || persistedLanguage === 'en' || persistedLanguage === 'auto'
                ? persistedLanguage
                : 'auto';

            this._state = {
                version: STORAGE_VERSION,
                lastShader: typeof parsed.lastShader === 'string' ? parsed.lastShader : null,
                shaders: parsed.shaders,
                ui: {
                    language
                }
            };

            this._lastSerialized = raw;
        } catch {
            // Ignore corrupt/blocked storage
        }
    }

    _ensureShader(shaderName) {
        if (!shaderName || typeof shaderName !== 'string') return null;

        if (!this._state.shaders[shaderName]) {
            this._state.shaders[shaderName] = { uniforms: {}, colors: null };
        } else {
            if (!this._state.shaders[shaderName].uniforms || typeof this._state.shaders[shaderName].uniforms !== 'object') {
                this._state.shaders[shaderName].uniforms = {};
            }
            if (!('colors' in this._state.shaders[shaderName])) {
                this._state.shaders[shaderName].colors = null;
            }
        }

        return this._state.shaders[shaderName];
    }

    _scheduleWrite() {
        // Coalesce frequent slider updates into a single write.
        if (this._writeTimer) {
            clearTimeout(this._writeTimer);
            this._writeTimer = null;
        }

        // Use requestIdleCallback when available, otherwise a short debounce.
        const write = () => {
            this._idleHandle = null;
            this._flushToStorage();
        };

        if (typeof requestIdleCallback === 'function') {
            // Keep a timeout so it still persists even on busy main thread.
            this._idleHandle = requestIdleCallback(write, { timeout: 1200 });
        } else {
            this._writeTimer = setTimeout(write, 250);
        }
    }

    _flushToStorage() {
        try {
            const serialized = JSON.stringify(this._state);
            if (serialized === this._lastSerialized) return;
            localStorage.setItem(STORAGE_KEY, serialized);
            this._lastSerialized = serialized;
        } catch {
            // Ignore quota / private mode / blocked storage
        }
    }

    getLastShader() {
        return this._state.lastShader;
    }

    setLastShader(shaderName) {
        if (!shaderName || typeof shaderName !== 'string') return;
        if (this._state.lastShader === shaderName) return;
        this._state.lastShader = shaderName;
        this._scheduleWrite();
    }

    getShaderState(shaderName) {
        const entry = this._ensureShader(shaderName);
        if (!entry) return null;

        return {
            uniforms: entry.uniforms || {},
            colors: entry.colors || null
        };
    }

    setShaderUniform(shaderName, uniformName, value) {
        const entry = this._ensureShader(shaderName);
        if (!entry) return;
        if (!uniformName || typeof uniformName !== 'string') return;
        if (!isFiniteNumber(value)) return;

        entry.uniforms[uniformName] = value;
        this._scheduleWrite();
    }

    setShaderColors(shaderName, colorsByIndex) {
        const entry = this._ensureShader(shaderName);
        if (!entry) return;
        if (!colorsByIndex || typeof colorsByIndex !== 'object') return;

        // Normalize to {"1":{l,c,h}, ...} (numbers only)
        const normalized = {};
        for (let i = 1; i <= 4; i++) {
            const raw = colorsByIndex[i] || colorsByIndex[String(i)];
            if (!raw) continue;

            const l = raw.l;
            const c = raw.c;
            const h = raw.h;
            if (!isFiniteNumber(l) || !isFiniteNumber(c) || !isFiniteNumber(h)) continue;
            normalized[String(i)] = { l, c, h };
        }

        entry.colors = Object.keys(normalized).length ? normalized : null;
        this._scheduleWrite();
    }

    getLanguage() {
        const lang = this._state?.ui?.language;
        return lang === 'es' || lang === 'en' || lang === 'auto' ? lang : 'auto';
    }

    setLanguage(language) {
        if (language !== 'es' && language !== 'en' && language !== 'auto') return;
        if (!this._state.ui || typeof this._state.ui !== 'object') {
            this._state.ui = { language: 'auto' };
        }
        if (this._state.ui.language === language) return;
        this._state.ui.language = language;
        this._scheduleWrite();
    }
}
