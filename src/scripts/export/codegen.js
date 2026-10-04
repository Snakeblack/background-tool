/**
 * Export code generator — pure functions, no DOM.
 *
 * Every export is built from the real source files (shader, shared uniforms,
 * TSL helpers, mount module), so nothing is copied by hand and the exported
 * background is exactly what the preview renders.
 */

import { REVISION } from 'three/webgpu';
import commonUniformsSource from '../shaders/commonUniforms.js?raw';
import tslLibSource from '../shaders/tslLib.js?raw';
import mountTemplate from './templates/mountBackground.js?raw';

export const FRAMEWORKS = ['vanilla', 'react', 'vue', 'angular', 'astro'];

/** three.js version matching the one used by the generator (for import maps). */
export const THREE_VERSION = `0.${REVISION}.0`;

const PHASE_SECONDS = 6; // frame shown when motion is off (same instant the previews use)

const fixed = (value, digits = 3) => Number(Number(value).toFixed(digits));

const oklchCss = ({ l, c, h }) => `oklch(${fixed(l)} ${fixed(c)} ${fixed(h, 1)})`;

/** Static CSS gradient built from the palette (poster while loading, fallback without GPU). */
export function fallbackGradient(colors) {
    const stops = colors.map((color, index) => `${oklchCss(color)} ${Math.round((index / (colors.length - 1)) * 100)}%`);
    return `linear-gradient(135deg, ${stops.join(', ')})`;
}

/** @param {Array<{ oklch?: any } | any>} colors */
function normalizeColors(colors = []) {
    const fallback = { l: 0.6, c: 0.2, h: 280 };
    return Array.from({ length: 4 }, (_, i) => {
        const entry = colors[i]?.oklch ?? colors[i] ?? fallback;
        return { l: fixed(entry.l ?? fallback.l), c: fixed(entry.c ?? fallback.c), h: fixed(entry.h ?? fallback.h, 1) };
    });
}

/** JS object literal with the exact look that was designed. */
function renderDefaults(config) {
    const colors = normalizeColors(config.colors);
    const params = Object.entries(config.parameters ?? {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}: ${fixed(value, 4)}`)
        .join(', ');

    return [
        '{',
        '    colors: [',
        ...colors.map((c) => `        { l: ${c.l}, c: ${c.c}, h: ${c.h} },`),
        '    ],',
        `    speed: ${fixed(config.speed ?? 0.5, 3)}, // 0 freezes the animation`,
        `    params: { ${params} },`,
        `    renderScale: ${fixed(config.renderScale ?? 1, 2)}, // fraction of native resolution`,
        '    maxPixelRatio: 2,',
        '    maxFps: 60,',
        '    adaptive: true, // lowers the resolution automatically if frames get slow',
        `    staticTime: ${PHASE_SECONDS}, // frame shown when motion is off (reduced motion)`,
        '}',
    ].join('\n').replace(/\n/g, '\n');
}

/** Drops the uniforms (and orphan section headers) the background never reads. */
function pruneUniforms(source, usedNames) {
    const kept = source.split('\n').filter((line) => {
        const match = line.match(/^export const (u_[a-z0-9_]+) =/);
        return !match || usedNames.has(match[1]);
    });

    // Remove a "// ── Section ──" header when nothing is left under it.
    const lines = [];
    for (let i = 0; i < kept.length; i++) {
        const isHeader = /^\/\/ ── /.test(kept[i]);
        if (isHeader) {
            let next = i + 1;
            while (next < kept.length && (kept[next].trim() === '' || /^\/\/(?! ──)/.test(kept[next]))) next++;
            if (next >= kept.length || /^\/\/ ── /.test(kept[next])) continue;
        }
        lines.push(kept[i]);
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

const stripExtension = (code) => code.replace(/(from\s+'\.{1,2}\/[^']+?)\.js'/g, "$1'");

/** Build one file for a target (JS or TS). */
function finalize(code, ts) {
    const body = ts ? stripExtension(code) : code;
    return ts ? `// @ts-nocheck\n${body}` : body;
}

function renderShader(config, ts) {
    const source = config.tslSource
        .replace(/'\.\.\/commonUniforms\.js'/g, "'./commonUniforms.js'")
        .replace(/'\.\.\/tslLib\.js'/g, "'./tslLib.js'");
    return finalize(`// ${config.name?.en ?? config.shader} — shader (TSL)\n${source}`, ts);
}

function renderMount(config, ts) {
    let code = mountTemplate
        .replace(/^\/\/ Template[\s\S]*?\n(?=import)/, `// ${config.name?.en ?? config.shader} — mounts the animated background on a <canvas>.\n`)
        .replace('/*__DEFAULTS__*/ {}', renderDefaults(config))
        .replace("/*__FALLBACK__*/ ''", JSON.stringify(fallbackGradient(normalizeColors(config.colors))));

    code = config.mouse
        ? code.replace(/^[ \t]*\/\/ @mouse-(start|end)\n/gm, '')
        : code.replace(/^[ \t]*\/\/ @mouse-start\n[\s\S]*?\/\/ @mouse-end\n/gm, '');

    return finalize(code, ts);
}

function renderUniforms(config, shaderCode) {
    const used = new Set([
        ...(shaderCode.match(/\bu_[a-z0-9_]+\b/g) ?? []),
        ...(tslLibSource.match(/\bu_[a-z0-9_]+\b/g) ?? []),
        // read by the mount module
        'u_time', 'u_resolution', 'u_color1', 'u_color2', 'u_color3', 'u_color4',
        ...(config.mouse ? ['u_mouse'] : []),
        ...Object.keys(config.parameters ?? {}).map((key) => `u_${key}`),
    ]);
    return pruneUniforms(commonUniformsSource, used);
}

const CANVAS_CSS = (fallback, indent = '') => [
    '.bg-canvas {',
    '    position: fixed;',
    '    inset: 0;',
    '    width: 100%;',
    '    height: 100%;',
    '    z-index: -1;          /* behind your content */',
    '    pointer-events: none; /* never blocks clicks */',
    `    background: ${fallback}; /* poster while loading / no-GPU fallback */`,
    '}',
].map((line) => indent + line).join('\n');

/**
 * Files for a framework, in the order they should be created.
 * `id` is the key used for the guide texts (see export/i18n.js).
 * @returns {Array<{ id: string, path: string, language: string, code: string }>}
 */
export function buildFiles(framework, config) {
    const ts = framework === 'angular';
    const ext = ts ? 'ts' : 'js';
    const colors = normalizeColors(config.colors);
    const fallback = fallbackGradient(colors);
    const shaderCode = renderShader(config, ts);

    const dirs = {
        vanilla: '',
        react: 'src/background/',
        vue: 'src/background/',
        angular: 'src/app/background/',
        astro: 'src/lib/background/',
    };
    const dir = dirs[framework];
    const mountName = ts ? 'mount-background' : 'mountBackground';

    const common = [
        { id: 'uniforms', path: `${dir}commonUniforms.${ext}`, language: ts ? 'typescript' : 'javascript', code: finalize(renderUniforms(config, shaderCode), ts) },
        { id: 'lib', path: `${dir}tslLib.${ext}`, language: ts ? 'typescript' : 'javascript', code: finalize(tslLibSource, ts) },
        { id: 'shader', path: `${dir}background.${ext}`, language: ts ? 'typescript' : 'javascript', code: shaderCode },
        { id: 'mount', path: `${dir}${mountName}.${ext}`, language: ts ? 'typescript' : 'javascript', code: renderMount(config, ts) },
    ];

    const glue = {
        vanilla: () => [
            {
                id: 'html',
                path: 'index.html',
                language: 'html',
                code: [
                    '<!DOCTYPE html>',
                    '<html lang="en">',
                    '<head>',
                    '    <meta charset="UTF-8" />',
                    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
                    '    <title>My site</title>',
                    '    <style>',
                    '        html, body { margin: 0; }',
                    CANVAS_CSS(fallback, '        '),
                    '        .content { position: relative; }',
                    '    </style>',
                    '</head>',
                    '<body>',
                    '    <canvas id="bg-canvas" class="bg-canvas" aria-hidden="true"></canvas>',
                    '    <main class="content">',
                    '        <h1>Your content goes here</h1>',
                    '    </main>',
                    '    <script type="module" src="./main.js"></script>',
                    '</body>',
                    '</html>',
                ].join('\n'),
            },
            {
                id: 'main',
                path: 'main.js',
                language: 'javascript',
                code: [
                    '// three.js is loaded after the first paint, so it never blocks your page.',
                    "const canvas = document.getElementById('bg-canvas');",
                    '',
                    "import('./mountBackground.js')",
                    '    .then(({ mountBackground }) => mountBackground(canvas))',
                    '    .then((background) => {',
                    '        // background.dispose(); // call it if you remove the canvas',
                    '    });',
                ].join('\n'),
            },
        ],

        react: () => [
            {
                id: 'hook',
                path: 'src/background/useBackground.js',
                language: 'javascript',
                code: [
                    "import { useEffect, useRef } from 'react';",
                    '',
                    '/** Attach the returned ref to a <canvas>. three.js loads lazily after mount. */',
                    'export function useBackground(options) {',
                    '    const canvasRef = useRef(null);',
                    '',
                    '    useEffect(() => {',
                    '        let controller;',
                    '        let disposed = false;',
                    '',
                    '        // The timeout makes React StrictMode\'s throw-away first mount a no-op.',
                    '        const timer = setTimeout(async () => {',
                    "            const { mountBackground } = await import('./mountBackground.js');",
                    '            const instance = await mountBackground(canvasRef.current, options);',
                    '            if (disposed) instance.dispose();',
                    '            else controller = instance;',
                    '        }, 0);',
                    '',
                    '        return () => {',
                    '            disposed = true;',
                    '            clearTimeout(timer);',
                    '            controller?.dispose();',
                    '        };',
                    '        // eslint-disable-next-line react-hooks/exhaustive-deps',
                    '    }, []);',
                    '',
                    '    return canvasRef;',
                    '}',
                ].join('\n'),
            },
            {
                id: 'usage',
                path: 'src/App.jsx',
                language: 'jsx',
                code: [
                    "import { useBackground } from './background/useBackground.js';",
                    "import './App.css';",
                    '',
                    'export default function App() {',
                    '    const canvasRef = useBackground();',
                    '',
                    '    return (',
                    '        <>',
                    '            <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />',
                    '            <main className="content">',
                    '                <h1>Your content goes here</h1>',
                    '            </main>',
                    '        </>',
                    '    );',
                    '}',
                ].join('\n'),
            },
            { id: 'css', path: 'src/App.css', language: 'css', code: `${CANVAS_CSS(fallback)}\n\n.content {\n    position: relative;\n}` },
        ],

        vue: () => [
            {
                id: 'hook',
                path: 'src/background/useBackground.js',
                language: 'javascript',
                code: [
                    "import { onBeforeUnmount, onMounted, ref } from 'vue';",
                    '',
                    '/** Bind the returned ref to a <canvas>. three.js loads lazily after mount. */',
                    'export function useBackground(options) {',
                    '    const canvasRef = ref(null);',
                    '    let controller;',
                    '    let disposed = false;',
                    '',
                    '    onMounted(async () => {',
                    "        const { mountBackground } = await import('./mountBackground.js');",
                    '        const instance = await mountBackground(canvasRef.value, options);',
                    '        if (disposed) instance.dispose();',
                    '        else controller = instance;',
                    '    });',
                    '',
                    '    onBeforeUnmount(() => {',
                    '        disposed = true;',
                    '        controller?.dispose();',
                    '    });',
                    '',
                    '    return { canvasRef };',
                    '}',
                ].join('\n'),
            },
            {
                id: 'usage',
                path: 'src/App.vue',
                language: 'vue',
                code: [
                    '<script setup>',
                    "import { useBackground } from './background/useBackground.js';",
                    '',
                    'const { canvasRef } = useBackground();',
                    '</script>',
                    '',
                    '<template>',
                    '    <canvas ref="canvasRef" class="bg-canvas" aria-hidden="true" />',
                    '    <main class="content">',
                    '        <h1>Your content goes here</h1>',
                    '    </main>',
                    '</template>',
                    '',
                    '<style scoped>',
                    CANVAS_CSS(fallback),
                    '',
                    '.content {',
                    '    position: relative;',
                    '}',
                    '</style>',
                ].join('\n'),
            },
        ],

        angular: () => [
            {
                id: 'directive',
                path: 'src/app/background/background.directive.ts',
                language: 'typescript',
                code: [
                    "import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject } from '@angular/core';",
                    '',
                    '/** Put `appBackground` on a <canvas>. three.js loads lazily and runs outside Angular. */',
                    '@Directive({ selector: \'canvas[appBackground]\', standalone: true })',
                    'export class BackgroundDirective implements OnInit, OnDestroy {',
                    '    private readonly canvas = inject<ElementRef<HTMLCanvasElement>>(ElementRef).nativeElement;',
                    '    private readonly zone = inject(NgZone);',
                    '    private controller?: { dispose(): void };',
                    '    private destroyed = false;',
                    '',
                    '    ngOnInit(): void {',
                    '        // Outside the zone: the animation loop must not trigger change detection.',
                    '        this.zone.runOutsideAngular(async () => {',
                    "            const { mountBackground } = await import('./mount-background');",
                    '            const instance = await mountBackground(this.canvas);',
                    '            if (this.destroyed) instance.dispose();',
                    '            else this.controller = instance;',
                    '        });',
                    '    }',
                    '',
                    '    ngOnDestroy(): void {',
                    '        this.destroyed = true;',
                    '        this.controller?.dispose();',
                    '    }',
                    '}',
                ].join('\n'),
            },
            {
                id: 'usage',
                path: 'src/app/app.ts',
                language: 'typescript',
                code: [
                    "import { Component } from '@angular/core';",
                    "import { BackgroundDirective } from './background/background.directive';",
                    '',
                    '@Component({',
                    "    selector: 'app-root',",
                    '    imports: [BackgroundDirective],',
                    '    template: `',
                    '        <canvas appBackground class="bg-canvas" aria-hidden="true"></canvas>',
                    '        <main class="content">',
                    '            <h1>Your content goes here</h1>',
                    '        </main>',
                    '    `,',
                    '    styles: `',
                    CANVAS_CSS(fallback, '        '),
                    '',
                    '        .content {',
                    '            position: relative;',
                    '        }',
                    '    `,',
                    '})',
                    'export class App {}',
                ].join('\n'),
            },
        ],

        astro: () => [
            {
                id: 'component',
                path: 'src/components/Background.astro',
                language: 'astro',
                code: [
                    '---',
                    '// Rendered on the server; the animation mounts in the browser.',
                    '---',
                    '',
                    '<canvas id="bg-canvas" class="bg-canvas" aria-hidden="true"></canvas>',
                    '',
                    '<style>',
                    CANVAS_CSS(fallback, '    '),
                    '</style>',
                    '',
                    '<script>',
                    '    let controller;',
                    '    let starting = false;',
                    '',
                    '    async function setup() {',
                    '        if (controller || starting) return;',
                    "        const canvas = document.getElementById('bg-canvas');",
                    '        if (!canvas) return;',
                    '        starting = true;',
                    "        const { mountBackground } = await import('../lib/background/mountBackground.js');",
                    '        controller = await mountBackground(canvas);',
                    '        starting = false;',
                    '    }',
                    '',
                    '    function teardown() {',
                    '        controller?.dispose();',
                    '        controller = undefined;',
                    '    }',
                    '',
                    '    // View Transitions: remount on every navigation.',
                    "    document.addEventListener('astro:page-load', setup);",
                    "    document.addEventListener('astro:before-swap', teardown);",
                    '    // Without View Transitions:',
                    "    document.addEventListener('DOMContentLoaded', setup, { once: true });",
                    '</script>',
                ].join('\n'),
            },
            {
                id: 'usage',
                path: 'src/pages/index.astro',
                language: 'astro',
                code: [
                    '---',
                    "import Background from '../components/Background.astro';",
                    '---',
                    '',
                    '<html lang="en">',
                    '    <head>',
                    '        <meta charset="utf-8" />',
                    '        <meta name="viewport" content="width=device-width, initial-scale=1" />',
                    '        <title>My site</title>',
                    '    </head>',
                    '    <body>',
                    '        <Background />',
                    '        <main style="position: relative;">',
                    '            <h1>Your content goes here</h1>',
                    '        </main>',
                    '    </body>',
                    '</html>',
                ].join('\n'),
            },
        ],
    };

    return [...common, ...glue[framework]()];
}

/** Import map for projects without a bundler (plain HTML). */
export function buildImportMap() {
    const base = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/build`;
    return [
        '<script type="importmap">',
        '{',
        '    "imports": {',
        `        "three/webgpu": "${base}/three.webgpu.js",`,
        `        "three/tsl": "${base}/three.tsl.js"`,
        '    }',
        '}',
        '</script>',
    ].join('\n');
}

/** Snippets for the "performance & tuning" tab. */
export function buildTuningSnippets(config) {
    const colors = normalizeColors(config.colors);
    return {
        options: [
            '// Every option is optional: the defaults are the look you designed.',
            "import { mountBackground } from './mountBackground.js';",
            '',
            'mountBackground(canvas, {',
            '    speed: 0.3,          // slower (0 = static image, zero GPU use)',
            `    renderScale: ${fixed(config.renderScale ?? 1, 2)},       // fraction of native resolution; lower = cheaper`,
            '    maxPixelRatio: 1.5,  // cap on retina screens',
            '    maxFps: 30,          // halves the GPU work on slow devices',
            '    adaptive: true,      // lowers the resolution by itself if frames get slow',
            '    // colors: [{ l: 0.6, c: 0.2, h: 280 }, ...] // 4 OKLCH colors',
            '    // params: { distortion: 0.4 }              // any slider of the generator',
            '});',
        ].join('\n'),

        lazy: [
            '// Load three.js only when the section scrolls into view.',
            "const section = document.querySelector('#hero');",
            "const canvas = section.querySelector('canvas');",
            '',
            'const observer = new IntersectionObserver(async ([entry]) => {',
            '    if (!entry.isIntersecting) return;',
            '    observer.disconnect();',
            "    const { mountBackground } = await import('./mountBackground.js');",
            '    mountBackground(canvas);',
            '}, { rootMargin: \'200px\' });',
            '',
            'observer.observe(section);',
        ].join('\n'),

        section: [
            '/* Background for one section only (instead of the whole page). */',
            '.hero {',
            '    position: relative;',
            '    isolation: isolate; /* keeps the canvas inside this section */',
            '}',
            '',
            '.hero .bg-canvas {',
            '    position: absolute;',
            '    inset: 0;',
            '    width: 100%;',
            '    height: 100%;',
            '    z-index: -1;',
            '    pointer-events: none;',
            `    background: ${fallbackGradient(colors)};`,
            '}',
        ].join('\n'),
    };
}
