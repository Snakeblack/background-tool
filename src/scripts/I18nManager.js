/**
 * I18n Manager - language preference + auto-detection + simple key-based translations.
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
        'dock.settings': 'Settings',
        'dock.colors': 'Colors',
        'dock.presets': 'Presets',
        'dock.random': 'Random',
        'dock.saved': 'Saved',

        'aria.settings': 'Settings',
        'aria.colors': 'Colors',
        'aria.presets': 'Presets',
        'aria.random': 'Generate random',
        'aria.saved': 'Saved backgrounds',

        'settings.language': 'Language',
        'settings.shaderType': 'Shader Type',
        'settings.globalSpeed': 'Global Speed',

        'saved.title': 'Saved backgrounds',
        'saved.subtitle': 'Names are unique. Saving the same name updates it and increments the version.',
        'saved.exportCurrent': 'Export current',
        'saved.namePlaceholder': 'Name (e.g. Landing Hero)',
        'saved.save': 'Save',
        'saved.empty': 'No saved backgrounds yet.',
        'saved.deleteAria': 'Delete',
        'saved.deleteTitle': 'Delete',
        'saved.deleteConfirm': 'Delete saved background "{name}"?',

        'presets.sunset': 'Sunset',
        'presets.ocean': 'Ocean',
        'presets.forest': 'Forest',
        'presets.purple': 'Purple',
        'presets.neon': 'Neon',
        'presets.fire': 'Fire',
        'presets.ice': 'Ice',
        'presets.midnight': 'Midnight',

        'github.aria': 'View source code on GitHub',

        'select.placeholder': 'Select…',
        'bottomSheet.toggleAria': 'Toggle panel',

        // Control labels/tooltips
        'control.brightness.label': 'Brightness',
        'control.brightness.tooltip': 'Adjusts the overall lightness of the scene.',
        'control.contrast.label': 'Contrast',
        'control.contrast.tooltip': 'Controls the difference between light and dark areas.',
        'control.noise.label': 'Noise',
        'control.noise.tooltip': 'Adds grain texture for a more organic look.',

        'control.wave-amplitude.label': 'Amplitude',
        'control.wave-amplitude.tooltip': 'Controls the height of the waves.',
        'control.wave-frequency.label': 'Frequency',
        'control.wave-frequency.tooltip': 'Adjusts the number of waves visible.',

        'control.stripe-width.label': 'Density',
        'control.stripe-width.tooltip': 'Controls the number of stripes.',
        'control.stripe-speed.label': 'Relative Speed',
        'control.stripe-speed.tooltip': 'Adjusts how fast stripes move relative to each other.',

        'control.zoom.label': 'Complexity',
        'control.zoom.tooltip': 'Controls the detail level of the fluid distortion.',

        'control.mesh-scale.label': 'Density',
        'control.mesh-scale.tooltip': 'Adjusts the grid tightness of the mesh.',
        'control.mesh-distortion.label': 'Distortion',
        'control.mesh-distortion.tooltip': 'Controls the amount of warping applied to the mesh.',

        'control.particle-intensity.label': 'Intensity',
        'control.particle-intensity.tooltip': 'Controls the brightness and visibility of particles.',

        'control.aurora-scale.label': 'Scale',
        'control.aurora-scale.tooltip': 'Adjusts the size of the aurora curtains.',
        'control.aurora-intensity.label': 'Intensity',
        'control.aurora-intensity.tooltip': 'Controls the brightness of the aurora effect.',

        'control.cloud-scale.label': 'Scale',
        'control.cloud-scale.tooltip': 'Adjusts the size and fluffiness of clouds.',
        'control.cloud-intensity.label': 'Coverage',
        'control.cloud-intensity.tooltip': 'Controls the amount of sky covered by clouds.',

        'control.flow-scale.label': 'Scale',
        'control.flow-scale.tooltip': 'Adjusts the size of the flow patterns.',
        'control.flow-intensity.label': 'Density',
        'control.flow-intensity.tooltip': 'Controls the compactness of the flow lines.',

        'control.geo-scale.label': 'Scale',
        'control.geo-scale.tooltip': 'Adjusts the size of the geometric shapes.',
        'control.geo-rotation.label': 'Base Rotation',
        'control.geo-rotation.tooltip': 'Controls the initial rotation angle of shapes.',

        'control.grid-size.label': 'Grid Scale',
        'control.grid-size.tooltip': 'Adjusts the size of the grid squares.',
        'control.grid-glow.label': 'Glow Intensity',
        'control.grid-glow.tooltip': 'Controls the brightness of the neon glow.',
        'control.grid-offset-x.label': 'Offset X',
        'control.grid-offset-x.tooltip': 'Shifts the grid horizontally.',
        'control.grid-offset-y.label': 'Offset Y',
        'control.grid-offset-y.tooltip': 'Shifts the grid vertically.',
        'control.sun-size.label': 'Sun Size',
        'control.sun-size.tooltip': 'Controls the size of the sun on the horizon.',

        'control.spiral-density.label': 'Spiral Density',
        'control.spiral-density.tooltip': 'Controls the tightness of the spiral arms.',
        'control.star-density.label': 'Star Density',
        'control.star-density.tooltip': 'Adjusts the number of stars in the background.',
        'control.core-size.label': 'Core Size',
        'control.core-size.tooltip': 'Controls the size of the galactic core.',

        'control.cell-density.label': 'Cell Density',
        'control.cell-density.tooltip': 'Controls the number of cells in the pattern.',
        'control.border-width.label': 'Border Width',
        'control.border-width.tooltip': 'Adjusts the thickness of cell borders.'
    },
    es: {
        'dock.settings': 'Config',
        'dock.colors': 'Colores',
        'dock.presets': 'Presets',
        'dock.random': 'Random',
        'dock.saved': 'Guardados',

        'aria.settings': 'Configuración',
        'aria.colors': 'Colores',
        'aria.presets': 'Presets',
        'aria.random': 'Generar aleatorio',
        'aria.saved': 'Fondos guardados',

        'settings.language': 'Idioma',
        'settings.shaderType': 'Tipo de shader',
        'settings.globalSpeed': 'Velocidad global',

        'saved.title': 'Fondos guardados',
        'saved.subtitle': 'Los nombres son únicos. Guardar el mismo nombre lo actualiza e incrementa la versión.',
        'saved.exportCurrent': 'Exportar actual',
        'saved.namePlaceholder': 'Nombre (ej. Hero Landing)',
        'saved.save': 'Guardar',
        'saved.empty': 'Todavía no hay fondos guardados.',
        'saved.deleteAria': 'Eliminar',
        'saved.deleteTitle': 'Eliminar',
        'saved.deleteConfirm': '¿Eliminar el fondo guardado "{name}"?',

        'presets.sunset': 'Atardecer',
        'presets.ocean': 'Océano',
        'presets.forest': 'Bosque',
        'presets.purple': 'Púrpura',
        'presets.neon': 'Neón',
        'presets.fire': 'Fuego',
        'presets.ice': 'Hielo',
        'presets.midnight': 'Medianoche',

        'github.aria': 'Ver código fuente en GitHub',

        'select.placeholder': 'Seleccionar…',
        'bottomSheet.toggleAria': 'Alternar panel',

        // Control labels/tooltips
        'control.brightness.label': 'Brillo',
        'control.brightness.tooltip': 'Ajusta la luminosidad general de la escena.',
        'control.contrast.label': 'Contraste',
        'control.contrast.tooltip': 'Controla la diferencia entre zonas claras y oscuras.',
        'control.noise.label': 'Ruido',
        'control.noise.tooltip': 'Agrega grano para un look más orgánico.',

        'control.wave-amplitude.label': 'Amplitud',
        'control.wave-amplitude.tooltip': 'Controla la altura de las olas.',
        'control.wave-frequency.label': 'Frecuencia',
        'control.wave-frequency.tooltip': 'Ajusta la cantidad de olas visibles.',

        'control.stripe-width.label': 'Densidad',
        'control.stripe-width.tooltip': 'Controla la cantidad de rayas.',
        'control.stripe-speed.label': 'Velocidad relativa',
        'control.stripe-speed.tooltip': 'Ajusta qué tan rápido se mueven entre sí.',

        'control.zoom.label': 'Complejidad',
        'control.zoom.tooltip': 'Controla el nivel de detalle de la distorsión.',

        'control.mesh-scale.label': 'Densidad',
        'control.mesh-scale.tooltip': 'Ajusta qué tan cerrada es la malla.',
        'control.mesh-distortion.label': 'Distorsión',
        'control.mesh-distortion.tooltip': 'Controla la cantidad de deformación aplicada.',

        'control.particle-intensity.label': 'Intensidad',
        'control.particle-intensity.tooltip': 'Controla el brillo y visibilidad de las partículas.',

        'control.aurora-scale.label': 'Escala',
        'control.aurora-scale.tooltip': 'Ajusta el tamaño de las cortinas de aurora.',
        'control.aurora-intensity.label': 'Intensidad',
        'control.aurora-intensity.tooltip': 'Controla el brillo del efecto de aurora.',

        'control.cloud-scale.label': 'Escala',
        'control.cloud-scale.tooltip': 'Ajusta el tamaño y la suavidad de las nubes.',
        'control.cloud-intensity.label': 'Cobertura',
        'control.cloud-intensity.tooltip': 'Controla la cantidad de cielo cubierto por nubes.',

        'control.flow-scale.label': 'Escala',
        'control.flow-scale.tooltip': 'Ajusta el tamaño de los patrones de flujo.',
        'control.flow-intensity.label': 'Densidad',
        'control.flow-intensity.tooltip': 'Controla la compactación de las líneas de flujo.',

        'control.geo-scale.label': 'Escala',
        'control.geo-scale.tooltip': 'Ajusta el tamaño de las formas geométricas.',
        'control.geo-rotation.label': 'Rotación base',
        'control.geo-rotation.tooltip': 'Controla el ángulo de rotación inicial de las formas.',

        'control.grid-size.label': 'Escala de grilla',
        'control.grid-size.tooltip': 'Ajusta el tamaño de los cuadros de la grilla.',
        'control.grid-glow.label': 'Intensidad de brillo',
        'control.grid-glow.tooltip': 'Controla el brillo del resplandor neón.',
        'control.grid-offset-x.label': 'Offset X',
        'control.grid-offset-x.tooltip': 'Desplaza la grilla horizontalmente.',
        'control.grid-offset-y.label': 'Offset Y',
        'control.grid-offset-y.tooltip': 'Desplaza la grilla verticalmente.',
        'control.sun-size.label': 'Tamaño del sol',
        'control.sun-size.tooltip': 'Controla el tamaño del sol en el horizonte.',

        'control.spiral-density.label': 'Densidad de espiral',
        'control.spiral-density.tooltip': 'Controla qué tan apretados están los brazos.',
        'control.star-density.label': 'Densidad de estrellas',
        'control.star-density.tooltip': 'Ajusta la cantidad de estrellas del fondo.',
        'control.core-size.label': 'Tamaño del núcleo',
        'control.core-size.tooltip': 'Controla el tamaño del núcleo galáctico.',

        'control.cell-density.label': 'Densidad de celdas',
        'control.cell-density.tooltip': 'Controla la cantidad de celdas del patrón.',
        'control.border-width.label': 'Grosor del borde',
        'control.border-width.tooltip': 'Ajusta el grosor de los bordes de las celdas.'
    }
};

const SHADER_I18N = {
    waves: {
        en: { name: 'Waves', description: 'Layered sinusoidal waves with smooth motion', colorLabels: ['Wave 1', 'Wave 2', 'Wave 3', 'Background'] },
        es: { name: 'Ondas', description: 'Ondas sinusoidales superpuestas con movimiento fluido', colorLabels: ['Ola 1', 'Ola 2', 'Ola 3', 'Fondo'] }
    },
    stripes: {
        en: { name: 'Stripes', description: 'Stripe patterns using sine and cosine functions', colorLabels: ['Color 1', 'Color 2', 'Color 3', 'Color 4'] },
        es: { name: 'Rayas', description: 'Patrones de rayas usando funciones seno y coseno', colorLabels: ['Color 1', 'Color 2', 'Color 3', 'Color 4'] }
    },
    liquid: {
        en: { name: 'Liquid', description: 'Liquid effect with FBM (Fractional Brownian Motion) noise', colorLabels: ['Color A', 'Color B', 'Color C', 'Background'] },
        es: { name: 'Líquido', description: 'Efecto líquido con ruido FBM (Fractional Brownian Motion)', colorLabels: ['Color A', 'Color B', 'Color C', 'Fondo'] }
    },
    mesh: {
        en: { name: 'Mesh Gradient', description: 'Mesh gradient with procedural distortion', colorLabels: ['Color 1', 'Color 2', 'Color 3', 'Color 4'] },
        es: { name: 'Mesh Gradient', description: 'Gradiente tipo malla con distorsión procedural', colorLabels: ['Color 1', 'Color 2', 'Color 3', 'Color 4'] }
    },
    particles: {
        en: { name: 'Particles', description: 'Animated particle system with wave-like motion', colorLabels: ['Background', 'Particles 1', 'Particles 2', 'Glow'] },
        es: { name: 'Partículas', description: 'Sistema de partículas animadas con movimiento ondulatorio', colorLabels: ['Fondo', 'Partículas 1', 'Partículas 2', 'Brillo'] }
    },
    aurora: {
        en: { name: 'Aurora', description: 'Northern lights effect with layered noise', colorLabels: ['Sky', 'Horizon', 'Aurora 1', 'Aurora 2'] },
        es: { name: 'Aurora', description: 'Efecto de aurora boreal con capas de ruido', colorLabels: ['Cielo', 'Horizonte', 'Aurora 1', 'Aurora 2'] }
    },
    clouds: {
        en: { name: 'Clouds', description: 'Sky with fluffy, realistic clouds', colorLabels: ['Sky', 'Clouds 1', 'Clouds 2', 'Sun'] },
        es: { name: 'Nubes', description: 'Cielo con nubes esponjosas y realistas', colorLabels: ['Cielo', 'Nubes 1', 'Nubes 2', 'Sol'] }
    },
    flow: {
        en: { name: 'Ethereal Flow', description: 'Dreamy fluid effect inspired by Vanta.js', colorLabels: ['Color 1', 'Color 2', 'Color 3', 'Background'] },
        es: { name: 'Flujo Etéreo', description: 'Efecto fluido y onírico estilo Vanta.js', colorLabels: ['Color 1', 'Color 2', 'Color 3', 'Fondo'] }
    },
    geometric: {
        en: { name: 'Geometric', description: 'Geometric patterns (hexagons, squares, triangles)', colorLabels: ['Shapes 1', 'Shapes 2', 'Background 1', 'Background 2'] },
        es: { name: 'Geométrico', description: 'Patrones geométricos (hexágonos, cuadrados, triángulos)', colorLabels: ['Formas 1', 'Formas 2', 'Fondo 1', 'Fondo 2'] }
    },
    neon_grid: {
        en: { name: 'Synth Horizon', description: 'Synthwave/Cyberpunk grid with 3D perspective', colorLabels: ['Sky', 'Grid', 'Sun', 'Glow'] },
        es: { name: 'Synth Horizon', description: 'Rejilla estilo Synthwave/Cyberpunk con perspectiva 3D', colorLabels: ['Cielo', 'Grilla', 'Sol', 'Brillo'] }
    },
    galaxy: {
        en: { name: 'Galaxy', description: 'Galactic spiral with stars and nebulae', colorLabels: ['Core', 'Arms', 'Nebula', 'Stars'] },
        es: { name: 'Galaxia', description: 'Espiral galáctica con estrellas y nebulosas', colorLabels: ['Núcleo', 'Brazos', 'Nebulosa', 'Estrellas'] }
    },
    voronoi: {
        en: { name: 'Cells', description: 'Organic/tech Voronoi cellular pattern', colorLabels: ['Cells 1', 'Cells 2', 'Borders', 'Background'] },
        es: { name: 'Células', description: 'Patrón celular Voronoi orgánico/tecnológico', colorLabels: ['Celdas 1', 'Celdas 2', 'Bordes', 'Fondo'] }
    }
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

    localizeControl(control) {
        if (!control || typeof control !== 'object') return control;
        const id = control.id;
        if (!id) return control;

        const labelKey = `control.${id}.label`;
        const tooltipKey = `control.${id}.tooltip`;

        const label = this.t(labelKey);
        const tooltip = this.t(tooltipKey);
        return {
            ...control,
            label: label !== labelKey ? label : control.label,
            tooltip: control.tooltip ? (tooltip !== tooltipKey ? tooltip : control.tooltip) : control.tooltip
        };
    }

    localizeShader(shaderKey, shaderConfig) {
        const lang = this.getLanguage();
        const shaderMeta = SHADER_I18N?.[shaderKey]?.[lang];
        const fallbackMeta = SHADER_I18N?.[shaderKey]?.en;

        if (!shaderMeta && !fallbackMeta) return shaderConfig;

        const meta = shaderMeta || fallbackMeta;
        return {
            ...shaderConfig,
            name: meta?.name ?? shaderConfig?.name,
            description: meta?.description ?? shaderConfig?.description,
            colorLabels: meta?.colorLabels ?? shaderConfig?.colorLabels,
            controls: Array.isArray(shaderConfig?.controls)
                ? shaderConfig.controls.map(c => this.localizeControl(c))
                : shaderConfig?.controls
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
                        preference: this.getPreference()
                    }
                })
            );
        } catch {
            // ignore
        }
    }
}
