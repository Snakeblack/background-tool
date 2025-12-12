/**
 * Background Library Manager - Guarda/carga backgrounds con nombre y versiones.
 *
 * Almacenamiento: localStorage (rápido para payloads pequeños).
 * Nota: aquí NO se guarda código de shader, solo estado (shader + uniforms + colores).
 */

const STORAGE_KEY = 'background-tool:library:v1';
const STORAGE_VERSION = 1;

function safeJsonParse(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function makeId() {
    try {
        if (crypto?.randomUUID) return crypto.randomUUID();
    } catch {
        // ignore
    }
    return `bg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export class BackgroundLibraryManager {
    constructor() {
        this._state = { version: STORAGE_VERSION, items: [] };
        this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = safeJsonParse(raw);
            if (!parsed || parsed.version !== STORAGE_VERSION) return;
            if (!Array.isArray(parsed.items)) return;
            // Enforce unique names: keep the highest version per name.
            const byName = new Map();
            parsed.items.forEach(it => {
                if (!it || typeof it !== 'object') return;
                const name = (it.name || '').toString().trim();
                if (!name) return;
                const current = byName.get(name);
                const v = typeof it.version === 'number' ? it.version : 0;
                const cv = typeof current?.version === 'number' ? current.version : -1;
                if (!current || v >= cv) byName.set(name, it);
            });

            this._state = { version: STORAGE_VERSION, items: Array.from(byName.values()) };
            this._save();
        } catch {
            // ignore
        }
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
        } catch {
            // ignore
        }
    }

    list() {
        const items = Array.isArray(this._state.items) ? this._state.items.slice() : [];
        items.sort((a, b) => {
            const an = (a?.name || '').toString().toLowerCase();
            const bn = (b?.name || '').toString().toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            const av = typeof a?.version === 'number' ? a.version : 0;
            const bv = typeof b?.version === 'number' ? b.version : 0;
            return bv - av;
        });
        return items;
    }

    get(id) {
        return this._state.items.find(it => it?.id === id) || null;
    }

    remove(id) {
        if (!id) return false;
        const before = this._state.items.length;
        this._state.items = this._state.items.filter(it => it?.id !== id);
        const changed = this._state.items.length !== before;
        if (changed) this._save();
        return changed;
    }

    saveNewVersion(name, snapshot) {
        const trimmed = (name || '').toString().trim();
        if (!trimmed) return null;
        if (!snapshot || typeof snapshot !== 'object') return null;
        if (!snapshot.shader || typeof snapshot.shader !== 'string') return null;

        // Unique names: same name updates the existing background.
        const existingIndex = this._state.items.findIndex(it => (it?.name || '') === trimmed);
        const now = Date.now();

        if (existingIndex >= 0) {
            const existing = this._state.items[existingIndex];
            const nextVersion = (typeof existing?.version === 'number' ? existing.version : 0) + 1;
            const updated = {
                ...existing,
                name: trimmed,
                version: nextVersion,
                updatedAt: now,
                shader: snapshot.shader,
                uniforms: snapshot.uniforms || {},
                colors: snapshot.colors || null
            };
            this._state.items[existingIndex] = updated;
            this._save();
            return updated;
        }

        const item = {
            id: makeId(),
            name: trimmed,
            version: 1,
            createdAt: now,
            updatedAt: now,
            shader: snapshot.shader,
            uniforms: snapshot.uniforms || {},
            colors: snapshot.colors || null
        };

        this._state.items.push(item);
        this._save();
        return item;
    }
}
