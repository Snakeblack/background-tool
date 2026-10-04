/**
 * I18n Manager - language preference + auto-detection + simple key-based translations.
 *
 * Background/control texts live next to each background in shaders/registry.js;
 * this file only holds the app chrome strings.
 */

function normalizePreference(pref) {
    if (pref === 'en' || pref === 'es' || pref === 'auto') return pref;
    return 'auto';
}

function detectBrowserLanguage() {
    try {
        const raw = (navigator?.languages && navigator.languages.length ? navigator.languages[0] : navigator?.language) || 'en';
        const lower = String(raw).toLowerCase();
        return lower.startsWith('es') ? 'es' : 'en';
    } catch {
        return 'en';
    }
}

function getUrlLanguageOverride() {
    try {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang');
        if (lang === 'en' || lang === 'es') return lang;
        return null;
    } catch {
        return null;
    }
}

const DICT = {
    en: {
        'dock.backgrounds': 'Backgrounds',
        'dock.settings': 'Tweak',
        'dock.colors': 'Colors',
        'dock.presets': 'Palettes',
        'dock.random': 'Shuffle',
        'dock.saved': 'Saved',

        'aria.backgrounds': 'Browse backgrounds',
        'aria.settings': 'Adjust the background',
        'aria.colors': 'Edit colors',
        'aria.presets': 'Color palettes',
        'aria.random': 'Shuffle the palette',
        'aria.saved': 'Saved backgrounds',

        'export.cta': 'Export',
        'export.cta.title': 'Get the code for your website (E)',

        'language.label': 'Language',
        'language.auto': 'Auto',
        'language.en': 'English',
        'language.es': 'Spanish',

        'gallery.all': 'All',
        'gallery.title': 'Backgrounds',
        'gallery.hint': 'Use ← → to browse quickly.',

        'cost.title': 'Relative GPU cost',
        'cost.light': 'Light on the GPU',
        'cost.medium': 'Medium GPU cost',
        'cost.heavy': 'Heavy on the GPU',

        'settings.background': 'Background',
        'settings.change': 'Change',
        'settings.globalSpeed': 'Speed',
        'settings.globalSpeed.tooltip': 'Controls the overall animation speed. At 0 the background is frozen and uses no GPU.',

        'color.lightness': 'Lightness',
        'color.chroma': 'Chroma',
        'color.hue': 'Hue',

        'presets.title': 'Color palettes',
        'presets.hint': 'Apply a ready-made palette to the current background.',

        'saved.title': 'Saved backgrounds',
        'saved.subtitle': 'Names are unique. Saving the same name updates it and increments the version.',
        'saved.namePlaceholder': 'Name (e.g. Landing Hero)',
        'saved.save': 'Save',
        'saved.saved': 'Saved ✓',
        'saved.empty': 'No saved backgrounds yet. Save the current one to reuse it later.',
        'saved.unavailable': 'background no longer available',
        'saved.deleteAria': 'Delete',
        'saved.deleteTitle': 'Delete',
        'saved.deleteConfirm': 'Delete saved background "{name}"?',

        'github.aria': 'View source code on GitHub',
        'select.placeholder': 'Select…',
        'bottomSheet.toggleAria': 'Toggle panel',
    },
    es: {
        'dock.backgrounds': 'Fondos',
        'dock.settings': 'Ajustes',
        'dock.colors': 'Colores',
        'dock.presets': 'Paletas',
        'dock.random': 'Aleatorio',
        'dock.saved': 'Guardados',

        'aria.backgrounds': 'Explorar fondos',
        'aria.settings': 'Ajustar el fondo',
        'aria.colors': 'Editar colores',
        'aria.presets': 'Paletas de color',
        'aria.random': 'Mezclar la paleta',
        'aria.saved': 'Fondos guardados',

        'export.cta': 'Exportar',
        'export.cta.title': 'Obtén el código para tu web (E)',

        'language.label': 'Idioma',
        'language.auto': 'Auto',
        'language.en': 'Inglés',
        'language.es': 'Español',

        'gallery.all': 'Todos',
        'gallery.title': 'Fondos',
        'gallery.hint': 'Usa ← → para explorar rápido.',

        'cost.title': 'Coste relativo de GPU',
        'cost.light': 'Ligero para la GPU',
        'cost.medium': 'Coste medio de GPU',
        'cost.heavy': 'Pesado para la GPU',

        'settings.background': 'Fondo',
        'settings.change': 'Cambiar',
        'settings.globalSpeed': 'Velocidad',
        'settings.globalSpeed.tooltip': 'Controla la velocidad general de la animación. En 0 el fondo se congela y no usa GPU.',

        'color.lightness': 'Luminosidad',
        'color.chroma': 'Croma',
        'color.hue': 'Tono',

        'presets.title': 'Paletas de color',
        'presets.hint': 'Aplica una paleta lista para usar al fondo actual.',

        'saved.title': 'Fondos guardados',
        'saved.subtitle': 'Los nombres son únicos. Guardar el mismo nombre lo actualiza e incrementa la versión.',
        'saved.namePlaceholder': 'Nombre (ej. Hero Landing)',
        'saved.save': 'Guardar',
        'saved.saved': 'Guardado ✓',
        'saved.empty': 'Aún no hay fondos guardados. Guarda el actual para reutilizarlo después.',
        'saved.unavailable': 'fondo ya no disponible',
        'saved.deleteAria': 'Eliminar',
        'saved.deleteTitle': 'Eliminar',
        'saved.deleteConfirm': '¿Eliminar el fondo guardado "{name}"?',

        'github.aria': 'Ver código fuente en GitHub',
        'select.placeholder': 'Seleccionar…',
        'bottomSheet.toggleAria': 'Alternar panel',
    },
};

export class I18nManager {
    constructor(persistenceManager = null) {
        this.persistence = persistenceManager;
        const urlOverride = getUrlLanguageOverride();
        this._preference = urlOverride ? urlOverride : normalizePreference(this.persistence?.getLanguage?.());
        this._language = this._preference === 'auto' ? detectBrowserLanguage() : this._preference;

        this._applyDocumentLanguage();
        this._broadcast();
    }

    getPreference() {
        return this._preference;
    }

    getLanguage() {
        return this._language === 'es' ? 'es' : 'en';
    }

    setPreference(preference) {
        const normalized = normalizePreference(preference);
        if (this._preference === normalized) return;

        this._preference = normalized;
        this._language = normalized === 'auto' ? detectBrowserLanguage() : normalized;

        if (this.persistence?.setLanguage) {
            this.persistence.setLanguage(this._preference);
        }

        this._applyDocumentLanguage();
        this._broadcast();
    }

    refreshAutoLanguage() {
        if (this._preference !== 'auto') return;
        const next = detectBrowserLanguage();
        if (next === this._language) return;
        this._language = next;
        this._applyDocumentLanguage();
        this._broadcast();
    }

    t(key, params = null) {
        const lang = this.getLanguage();
        const raw = DICT[lang]?.[key] ?? DICT.en[key] ?? key;
        if (!params) return raw;
        return String(raw).replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? `{${k}}`));
    }

    /** Resolves a control's label/tooltip for the active language. */
    localizeControl(control) {
        const lang = this.getLanguage();
        const texts = control?.i18n;
        if (!texts) return control;
        return {
            ...control,
            label: texts.label?.[lang] ?? texts.label?.en ?? control.label,
            tooltip: texts.tooltip?.[lang] ?? texts.tooltip?.en ?? control.tooltip,
        };
    }

    /** Resolves a registry entry (name, description, color labels, controls) for the active language. */
    localizeShader(_shaderKey, shaderConfig) {
        if (!shaderConfig) return shaderConfig;
        const lang = this.getLanguage();
        return {
            ...shaderConfig,
            name: shaderConfig.name?.[lang] ?? shaderConfig.name?.en ?? shaderConfig.name,
            description: shaderConfig.description?.[lang] ?? shaderConfig.description?.en ?? shaderConfig.description,
            colorLabels: shaderConfig.colorLabels?.[lang] ?? shaderConfig.colorLabels?.en ?? shaderConfig.colorLabels,
            controls: Array.isArray(shaderConfig.controls)
                ? shaderConfig.controls.map((c) => this.localizeControl(c))
                : shaderConfig.controls,
        };
    }

    _applyDocumentLanguage() {
        try {
            document.documentElement.lang = this.getLanguage();
        } catch {
            // ignore
        }
    }

    _broadcast() {
        try {
            document.dispatchEvent(
                new CustomEvent('i18n:change', {
                    detail: {
                        language: this.getLanguage(),
                        preference: this.getPreference(),
                    },
                }),
            );
        } catch {
            // ignore
        }
    }
}
