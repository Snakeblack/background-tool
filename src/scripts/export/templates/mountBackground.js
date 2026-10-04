// Template for the exported `mountBackground` module.
// This file is real, lintable code: the exporter only swaps the markers
// (/*__DEFAULTS__*/, /*__FALLBACK__*/) and strips the @mouse block when the
// background doesn't use the pointer.
import {
    Scene, OrthographicCamera, PlaneGeometry, Mesh,
    MeshBasicNodeMaterial, WebGPURenderer, LinearSRGBColorSpace,
} from 'three/webgpu';
import { main } from './background.js';
import * as U from './commonUniforms.js';

/** The look you designed. Override any of it per mount: mountBackground(canvas, { speed: 0.3 }). */
const DEFAULTS = /*__DEFAULTS__*/ {};

/** Painted while the GPU boots and kept if neither WebGPU nor WebGL2 is available. */
const FALLBACK_CSS = /*__FALLBACK__*/ '';

// OKLCH -> OKLab: the space the shader blends colors in.
const toLab = ({ l, c, h }) => [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];

/**
 * Mounts the animated background on a <canvas>.
 * Resolves to a controller: { dispose, setColors, setParam, setSpeed, pause, resume }.
 */
export async function mountBackground(canvas, options = {}) {
    const cfg = { ...DEFAULTS, ...options, params: { ...DEFAULTS.params, ...options.params } };
    const noop = { dispose() {}, setColors() {}, setParam() {}, setSpeed() {}, pause() {}, resume() {} };
    if (!canvas) return noop;

    canvas.style.background = FALLBACK_CSS;

    // Uses WebGPU when available and falls back to WebGL2 by itself.
    const renderer = new WebGPURenderer({ canvas, antialias: false, alpha: false });
    renderer.outputColorSpace = LinearSRGBColorSpace; // the shader already outputs display-ready sRGB

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.z = 1;
    const geometry = new PlaneGeometry(2, 2);
    const material = new MeshBasicNodeMaterial();
    material.colorNode = main();
    material.depthTest = false;
    material.depthWrite = false;
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    try {
        await renderer.init();
        await renderer.compileAsync(scene, camera);
    } catch (error) {
        console.warn('[background] WebGPU/WebGL2 unavailable, keeping the static fallback.', error);
        geometry.dispose();
        material.dispose();
        return noop;
    }

    const setColors = (colors) => colors.forEach((color, i) => U['u_color' + (i + 1)].value.set(...toLab(color)));
    const setParam = (name, value) => {
        const uniform = U['u_' + name];
        if (uniform && typeof uniform.value === 'number') uniform.value = value;
    };
    setColors(cfg.colors);
    Object.entries(cfg.params).forEach(([name, value]) => setParam(name, value));

    // Soft backgrounds look identical at a fraction of the resolution (cost drops with scale²).
    let scale = cfg.renderScale;
    const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, cfg.maxPixelRatio) * scale;
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;
        renderer.setPixelRatio(ratio);
        renderer.setSize(width, height, false);
        U.u_resolution.value.set(Math.round(width * ratio), Math.round(height * ratio));
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    // @mouse-start
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onPointerMove = (event) => {
        const rect = canvas.getBoundingClientRect(); // relative to the canvas, so it also works in a single section
        pointer.tx = (event.clientX - rect.left) / Math.max(rect.width, 1);
        pointer.ty = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    // @mouse-end

    let phase = cfg.staticTime;
    let frameId = 0;
    let last = 0;
    let frames = 0;
    let smoothed = 1000 / cfg.maxFps;
    let inView = true;
    let paused = false;

    const render = () => renderer.render(scene, camera);

    const frame = (now) => {
        frameId = requestAnimationFrame(frame);
        const elapsed = now - last;
        if (elapsed < 1000 / cfg.maxFps - 2) return; // fps cap (60 Hz even on 120/144 Hz screens)
        last = now;

        phase += Math.min(elapsed / 1000, 0.1) * cfg.speed * 2;
        U.u_time.value = phase;
        // @mouse-start
        const ease = 1 - Math.exp(-Math.min(elapsed / 1000, 0.1) * 6);
        pointer.x += (pointer.tx - pointer.x) * ease;
        pointer.y += (pointer.ty - pointer.y) * ease;
        U.u_mouse.value.set(pointer.x, pointer.y);
        // @mouse-end
        render();

        // Adaptive resolution: if frames get slow, render fewer pixels.
        if (cfg.adaptive) {
            smoothed += (elapsed - smoothed) * 0.06;
            if (++frames % 30 === 0 && smoothed > (1000 / cfg.maxFps) * 1.5 && scale > 0.4) {
                scale = Math.max(0.4, scale - 0.1);
                resize();
            }
        }
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const shouldRun = () => inView && !paused && !document.hidden && !reducedMotion.matches && cfg.speed > 0;

    const sync = () => {
        if (shouldRun()) {
            if (!frameId) {
                last = performance.now();
                frameId = requestAnimationFrame(frame);
            }
        } else {
            cancelAnimationFrame(frameId);
            frameId = 0;
            // A single still frame when motion is off (reduced motion, speed 0, paused).
            if (inView && !document.hidden) {
                U.u_time.value = phase;
                render();
            }
        }
    };

    // Pause when the canvas is off-screen or the tab is hidden: zero GPU work.
    const intersection = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        sync();
    });
    intersection.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    sync();

    return {
        setColors(colors) {
            setColors(colors);
            if (!frameId) render();
        },
        setParam(name, value) {
            setParam(name, value);
            if (!frameId) render();
        },
        setSpeed(value) {
            cfg.speed = value;
            sync();
        },
        pause() {
            paused = true;
            sync();
        },
        resume() {
            paused = false;
            sync();
        },
        dispose() {
            cancelAnimationFrame(frameId);
            frameId = 0;
            resizeObserver.disconnect();
            intersection.disconnect();
            document.removeEventListener('visibilitychange', sync);
            reducedMotion.removeEventListener('change', sync);
            // @mouse-start
            window.removeEventListener('pointermove', onPointerMove);
            // @mouse-end
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        },
    };
}
