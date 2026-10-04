/**
 * Shader Manager — loads backgrounds, owns the uniform state and the clock.
 *
 * Everything is TSL: uniforms live in commonUniforms.js (the very same
 * module that gets exported), so there is no parallel GLSL/WebGL copy.
 */

import { MeshBasicNodeMaterial } from 'three/webgpu';
import { BACKGROUNDS, SHADERS } from './shaders/registry.js';
import * as U from './shaders/commonUniforms.js';

/** Runtime/palette uniforms that are not "parameters". */
const RESERVED = new Set(['u_time', 'u_resolution', 'u_mouse', 'u_color1', 'u_color2', 'u_color3', 'u_color4']);

/** Animation phase advance per second at speed = 1 (speed 0.5 → 1 unit/s). */
const PHASE_RATE = 2;

/** Numeric uniforms that parameterize a background, with their initial values. */
const PARAM_DEFAULTS = Object.fromEntries(
    Object.entries(U)
        .filter(([name, node]) => !RESERVED.has(name) && typeof node?.value === 'number')
        .map(([name, node]) => [name, node.value]),
);

export class ShaderManager {
    /**
     * @param {import('./Renderer.js').Renderer} renderer
     */
    constructor(renderer) {
        this.renderer = renderer;
        this.currentShader = null;

        /** @type {Map<string, MeshBasicNodeMaterial>} */
        this._materials = new Map();
        this._speed = 0.5;
        this._phase = 0;
        this._frozen = false;
        this._dirty = true;
        this._mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false };
    }

    /**
     * Loads a background: resets every parameter to its default, binds the
     * (cached) material and applies the background's render scale.
     * @param {string} id
     * @returns {import('./shaders/registry.js').Background | null}
     */
    loadShader(id) {
        const def = SHADERS[id];
        if (!def) {
            console.error(`Background "${id}" not found`);
            return null;
        }

        this.currentShader = id;

        Object.entries(PARAM_DEFAULTS).forEach(([name, value]) => {
            U[name].value = value;
        });
        def.controls.forEach((control) => this.setParam(control.uniform, control.value));
        this._speed = def.speed ?? 0.5;

        let material = this._materials.get(id);
        if (!material) {
            material = new MeshBasicNodeMaterial();
            material.colorNode = def.main();
            material.depthTest = false;
            material.depthWrite = false;
            material.fog = false;
            material.toneMapped = false;
            this._materials.set(id, material);
        }
        this.renderer.setMaterial(material);
        this.renderer.setRenderScale(def.renderScale ?? 1);

        this._mouse.active = Boolean(def.mouse);
        this._dirty = true;
        return def;
    }

    /**
     * @param {string} name Uniform name (`u_scale`…) or `u_speed`
     * @param {number} value
     */
    setParam(name, value) {
        if (name === 'u_speed') {
            this._speed = value;
        } else if (U[name] && typeof U[name].value === 'number') {
            U[name].value = value;
        } else {
            return;
        }
        this._dirty = true;
    }

    /** @param {string} name @returns {number | undefined} */
    getParam(name) {
        if (name === 'u_speed') return this._speed;
        const node = U[name];
        return typeof node?.value === 'number' ? node.value : undefined;
    }

    /**
     * @param {number} index 1..4
     * @param {[number, number, number]} lab OKLab triple
     */
    setColorOklab(index, [L, a, b]) {
        U[`u_color${index}`]?.value.set(L, a, b);
        this._dirty = true;
    }

    /** Advances the animation phase (speed-scaled) and eases the pointer. */
    advance(dtSec) {
        if (!this._frozen) {
            this._phase += Math.min(dtSec, 0.1) * this._speed * PHASE_RATE;
            U.u_time.value = this._phase;
        }

        const m = this._mouse;
        if (m.active) {
            const k = 1 - Math.exp(-dtSec * 6);
            m.x += (m.tx - m.x) * k;
            m.y += (m.ty - m.y) * k;
            U.u_mouse.value.set(m.x, m.y);
        }
    }

    /** Pointer in 0..1, origin bottom-left. */
    setPointer(x, y) {
        this._mouse.tx = x;
        this._mouse.ty = y;
        if (this._mouse.active) this._dirty = true;
    }

    /** True while time-driven motion requires rendering every frame. */
    isAnimating() {
        return !this._frozen && this._speed > 0;
    }

    /** True once if something changed since the last call (used to skip idle frames). */
    consumeDirty() {
        const dirty = this._dirty;
        this._dirty = false;
        return dirty;
    }

    markDirty() {
        this._dirty = true;
    }

    updateResolution() {
        U.u_resolution.value.copy(this.renderer.getResolution());
        this._dirty = true;
    }

    /** Debug/testing: freezes the clock at `t` seconds (null to resume). */
    freeze(t) {
        this._frozen = t !== null && t !== undefined;
        if (this._frozen) {
            this._phase = t;
            U.u_time.value = t;
        }
        this._dirty = true;
    }

    getAvailableShaders() {
        return BACKGROUNDS.map((b) => b.id);
    }

    getShaderConfig(id) {
        return SHADERS[id];
    }

    getCurrentShaderConfig() {
        return SHADERS[this.currentShader];
    }

    /**
     * Parameter map used by the exporter: uniform name without the `u_` prefix.
     * @param {string} [id]
     * @returns {Record<string, number>}
     */
    getShaderParameters(id) {
        const def = SHADERS[id || this.currentShader];
        if (!def) return {};
        const out = {};
        def.controls.forEach((control) => {
            const value = this.getParam(control.uniform);
            if (typeof value === 'number') out[control.uniform.replace(/^u_/, '')] = value;
        });
        return out;
    }
}
