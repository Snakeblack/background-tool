# Exploration: GPU-Aware Adaptive Rendering Pipeline

**Change:** `gpu-adaptive-rendering`  
**Date:** 2026-05-01  
**Phase:** Explore  
**Status:** Complete

---

## Context

The background generator runs fullscreen shader animations (WebGL/WebGPU) that are visually heavy by nature — fractal noise, voronoi cells, multi-octave FBM. The current quality adaptation logic uses only viewport width and `pointer: coarse` to decide if a device is "mobile-like", then scales down the pixel ratio slightly if frame time degrades. This heuristic is fundamentally blind to GPU capability: a 768px-wide desktop connected to an external display appears "mobile" to the renderer, while a flagship phone with an Adreno 730 gets throttled unnecessarily. The goal of this change is to replace the width-based guess with real GPU tier detection (WebGPU `adapter.info`, WebGL `WEBGL_debug_renderer_info`, and fallback signals), classify devices into four capability tiers (`low / mid / high / ultra`), and drive DPR caps, frame scheduling, and power preference from those tiers — without touching any shader source code.

---

## Current State

### `src/scripts/Renderer.js`

| Piece | Lines | What it does |
|---|---|---|
| `_computeIsMobileLike()` | 96–104 | Returns `true` if `innerWidth <= 768` OR `pointer: coarse`. Binary, no GPU signal. |
| `_computeEffectivePixelRatio()` | 106–114 | Clamps DPR: mobile max = 1.25, desktop max = 2.0. Applies `_qualityScale` multiplier. Min floor: mobile = 0.75, desktop = 1.0. |
| `_applyPixelRatioAndSize()` | 116–133 | Calls both above. On mobile↔desktop transition, **hard-resets** `_qualityScale = 1` and EWMA. |
| `updateQuality(frameDeltaMs)` | 139–166 | **Only runs on mobile-like devices.** EWMA α=0.06, sample every 20 frames. Steps down `_qualityScale` by −0.1 if EWMA > 26ms (~38fps), steps up by +0.05 if EWMA < 18ms (~55fps). Floor = 0.75. |
| `render()` | 201–215 | WebGPU path: guards with `_isRendering` flag to skip if `renderAsync` is still in-flight. WebGL path: synchronous `renderer.render()`. |
| `init()` — WebGPU check | 46–56 | Requests adapter with `navigator.gpu.requestAdapter()` — **no options, no `powerPreference`**. Does not read `adapter.info`. |
| WebGPURenderer init | 58–64 | `antialias: true`, `precision: 'highp'` hardcoded. No tier-dependent options. |
| WebGLRenderer init | 66–74 | `antialias: true`, `precision: 'highp'`, `powerPreference: 'high-performance'` hardcoded. No tier-dependent options. |

### `src/scripts/ShaderManager.js`

- Has `u_octaves` uniform (line 56) but it is **user-controlled** — set per shader defaults and per user UI controls. No renderer-side clamping.
- TSL (WebGPU) and GLSL (WebGL) paths share the same uniforms object. Both paths updated via `updateUniform()` (lines 168–181).
- Does **not** read any tier or quality signal. Completely decoupled from performance decisions.

### `src/main.js`

- Boot order (lines 54–93): `liteRTManager.init()` → `renderer.init()` → ShaderManager/ColorManager/UI instantiation → `_tick()`.
- `updateQuality(deltaMs)` called every frame inside `_tick()` (line 107), **before** render.
- No GPU detection step before `renderer.init()`.

### `src/scripts/LiteRTManager.js`

- Calls `isWebGPUSupported()` from `@litertjs/core` to pick WebGPU vs WASM accelerator (lines 29, 63).
- Has **no role** in rendering — used only for ML inference. Not touched by this change.

---

## Gaps

1. **`_computeIsMobileLike()` conflates device type with GPU capability.** A Surface Pro at 768px is throttled; a Pixel 9 at 393px is over-throttled. The heuristic produces both false positives and false negatives.

2. **`updateQuality()` is gated on `_isMobileLike`.** Desktop devices never get dynamic quality adaptation. If a low-end integrated GPU is running on a 1080p screen, quality will never scale down.

3. **`_qualityScale` hard-reset on mobile↔desktop transition (line 121–123) causes visual jank.** When the user resizes a browser window across the 768px threshold, quality drops to 1.0 immediately and EWMA resets — producing a frame spike that the adaptive loop must then correct.

4. **No `powerPreference` adaptation.** `WebGLRenderer` is always created with `'high-performance'` (line 72). WebGPURenderer uses the browser default (neither option passed to `requestAdapter()` at line 48). Low-tier or battery-saving scenarios should request `'low-power'`.

5. **`adapter.info` is never read.** The WebGPU path requests an adapter (line 48) but discards all metadata. `adapter.info.vendor`, `adapter.info.architecture`, `adapter.info.description` are available in Chrome 113+ and Edge 113+, giving enough signal to classify GPU tier without any benchmark.

6. **`WEBGL_debug_renderer_info` is never queried.** For WebGL-only browsers, `UNMASKED_RENDERER_WEBGL` (e.g. `"ANGLE (NVIDIA, GeForce RTX 4080 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)"`) gives a reliable classification signal.

7. **`renderAsync` skip-frame logic is silent and frame-advancing.** The `_isRendering` guard at line 203 drops frames when the GPU is behind, but `requestAnimationFrame` in `main.js:_tick()` keeps advancing time. Result: `u_time` advances on dropped frames, causing imperceptible but measurable animation time drift. The loop should hold the time update or reschedule rather than silently drop.

8. **No visibility / background-tab throttle.** `document.visibilityState` changes are not handled. All rendering continues even when the tab is hidden, wasting GPU on mobile.

9. **No user-facing tier override or debug escape hatch.** Impossible to test tier logic without code changes.

10. **First-frame tier detection must be synchronous or pre-init.** If GPU detection is async (e.g. a micro-benchmark), it must resolve before `renderer.init()` to inform `antialias` and `powerPreference` at construction time. Currently no detection step exists.

---

## Investigation Findings

### GPU Detection APIs

#### WebGPU: `GPUAdapter.info`

```js
const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
// adapter.info: { vendor, architecture, device, description }
```

- **Chrome 113+ / Edge 113+**: `adapter.info` is available. `vendor` = `"google"` (SwiftShader/software), `"nvidia"`, `"amd"`, `"intel"`, `"qualcomm"`, `"apple"`. `architecture` = `"turing"`, `"rdna-3"`, `"apple-m2"`, `"adreno-740"`, etc.
- **Firefox**: WebGPU is behind a flag; `adapter.info` partially exposed — `vendor` may be empty on some builds.
- **Safari 17+**: WebGPU available; `adapter.info` returns limited strings, `architecture` may be empty.
- **Practical rule**: if `adapter.info.vendor === "google"` → software renderer → force `low` tier.

#### WebGL: `WEBGL_debug_renderer_info`

```js
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
const ext = gl.getExtension('WEBGL_debug_renderer_info');
const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
// e.g. "ANGLE (NVIDIA, GeForce RTX 4080 SUPER...)"
// e.g. "Apple GPU"
// e.g. "Adreno (TM) 730"
// e.g. "Mali-G78"
// e.g. "PowerVR Rogue GE8320"
```

- **Privacy caveats**: Firefox (≥120) returns a **masked generic string** (`"Mozilla"`) unless the user has explicitly granted the permission via `privacy.resistFingerprinting = false`. Chrome returns full strings. Safari returns `"Apple GPU"` without model detail.
- **Practical rule**: match regex patterns — `NVIDIA|AMD|Radeon|Arc` → high candidate; `Apple GPU` on M-series → high; `Adreno 7[0-9]{2}` → high; `Adreno 6[0-9]{2}` → mid; `Adreno 5[0-9]{2}|Mali-G7[0-9]` → mid-low; `PowerVR|Mali-4|Vivante` → low.

#### Fallback Signals (when GPU strings are masked or unavailable)

| Signal | API | Notes |
|---|---|---|
| Hardware concurrency | `navigator.hardwareConcurrency` | ≥8 → not low-end; <4 → suspect low |
| Device memory | `navigator.deviceMemory` | ≥4 GB → not low; <2 GB → low candidate. Firefox masks to 8 GB. |
| DPR | `window.devicePixelRatio` | >2.0 usually flagship display but doesn't imply GPU power |
| User agent | `navigator.userAgent` | Last resort. Detects very old Android (version < 9) |
| `prefers-reduced-motion` | `matchMedia` | Should always force `low-power` regardless of tier |

#### Runtime Micro-Benchmark

Render N=60 frames offscreen (`OffscreenCanvas`) using the simplest possible shader and measure median frame time. Thresholds: <8ms → `high`+, 8–14ms → `mid`, >14ms → `low`. 

**Risks**: adds ~1 second of startup jank; cannot use the actual complex shaders without loading the full ShaderManager first; `OffscreenCanvas` availability is not universal (Safari 16.4+). This should be an optional refinement, not the primary detection path.

---

### Tier Definitions

| Tier | Typical device examples | DPR cap | powerPreference | antialias | Frame skip (hidden tab) | Dynamic adaptive? |
|---|---|---|---|---|---|---|
| `ultra` | RTX 4000+, M2/M3 Mac, Adreno 740 | `min(dpr, 3.0)` | `high-performance` | true | skip after 500ms | No (always full) |
| `high` | GTX 1060+, RX 580, M1, Adreno 650 | `min(dpr, 2.0)` | `high-performance` | true | skip after 200ms | No |
| `mid` | Integrated Intel Xe, Adreno 610, Mali-G78 | `min(dpr, 1.5)` | default | false | skip after 100ms | Yes — EWMA |
| `low` | PowerVR, Mali-4xx, software rasterizer | `min(dpr, 1.0)` | `low-power` | false | skip immediately | Yes — aggressive |

**Key insight**: `antialias` cannot be changed after renderer construction. It **must** be set at `init()` time, which makes pre-init tier detection mandatory for this knob.

---

### Static Tier + Dynamic EWMA: Preventing Conflict

The current `updateQuality` applies a `_qualityScale` multiplier that compounds with the DPR cap. With tiers, the risk is that the static tier sets DPR cap to 1.5 and the dynamic EWMA then tries to push it up to 2.0 — exceeding the tier ceiling and undoing the intent.

**Proposed contract**:
- Static tier sets the **absolute ceiling** for DPR (e.g. `mid` max = 1.5).
- Dynamic EWMA operates the `_qualityScale` within `[tierFloor, 1.0]` — never above 1.0 relative to the tier ceiling.
- Tier detection runs **once** at startup and is treated as immutable unless the user explicitly overrides.
- EWMA α and sample window remain device-class-aware: `mid` uses α=0.06/20 frames (current), `low` uses α=0.12/10 frames (faster reaction).

This prevents the two systems from "fighting" while still allowing recovery on devices that are better than their tier suggests.

---

### `renderAsync` Frame-Scheduling Issue

Current code (`Renderer.js:201–212`):

```js
render() {
    if (this.isWebGPUSupported) {
        if (this._isRendering) return;   // ← silent drop
        this._isRendering = true;
        this.renderer.renderAsync(this.scene, this.camera)
            .catch(() => {})
            .finally(() => { this._isRendering = false; });
        return;
    }
    this.renderer.render(this.scene, this.camera);
}
```

The `_tick()` loop in `main.js` calls `requestAnimationFrame(this._tick)` unconditionally before calling `render()`. When `_isRendering` is `true`, `render()` returns early — **but `u_time` and `_lastFrameTime` still advance on that tick**. Over many dropped frames on a slow GPU, time drifts visually ahead of what was actually rendered.

**Two viable fixes**:
1. **Hold `u_time` update** when a frame is dropped (move `updateTime()` inside the resolved callback) — breaks encapsulation since ShaderManager would couple to renderAsync lifecycle.
2. **Schedule via `requestAnimationFrame` inside the `finally` callback** instead of the outer loop — a self-scheduling render loop that only re-queues after GPU resolves. Simpler and semantically correct.

Option 2 is cleaner. The outer `_tick` loop would only handle input polling; render scheduling would be internal to `Renderer`.

---

## Risks & Open Questions

| # | Risk / Question | Analysis |
|---|---|---|
| 1 | **Privacy: GPU strings exposed?** | Strings stay in JS only — no network leak. Log only in `console.debug` (dev). Consider a `__DEV__` flag guard to avoid leaking info in production console. |
| 2 | **User tier override (debug escape hatch)** | `localStorage.setItem('gpu-tier', 'low')` at startup overrides detection. Simple, no UI needed, sufficient for debug. |
| 3 | **First-frame jank from async detection** | `requestAdapter()` is already async in `renderer.init()`. Detection can happen in the same `await` chain with zero added latency. Micro-benchmark adds ~1s — should be optional. |
| 4 | **`antialias` must be set at construction** | WebGLRenderer/WebGPURenderer do not support changing `antialias` post-init. This forces tier detection to complete **before** `renderer.init()`. The current boot order in `main.js:54–59` (`liteRTManager.init()` → `renderer.init()`) must insert a `GpuDetector.detect()` step between them. |
| 5 | **Battery: `low-power` on reduced motion** | `prefers-reduced-motion: reduce` should force `powerPreference: 'low-power'` regardless of tier. Detection can read this once via `matchMedia` before renderer creation. |
| 6 | **`renderAsync` time drift** | Confirmed issue (see §Investigation). Fix is scoped to `Renderer.js` — manageable. |
| 7 | **Firefox GPU masking** | `WEBGL_debug_renderer_info` is masked in Firefox. Fallback signals (`hardwareConcurrency`, `deviceMemory`) provide a rough tier. Accept that Firefox will default to `mid` unless WebGPU adapter info is available. |
| 8 | **Safari `adapter.info` gaps** | `architecture` may be empty string. Match on `vendor === "apple"` + `hardwareConcurrency >= 8` → `high`. |
| 9 | **LiteRTManager WebGPU context conflict** | `LiteRTManager.init()` calls `isWebGPUSupported()` and may request its own adapter internally. Two adapter requests on the same device should be fine (adapters are shared objects in browsers), but ordering matters. `GpuDetector` should run before `LiteRTManager.init()` so both can share the same adapter metadata. |
| 10 | **No test runner** | Verification is manual + lint + typecheck. Tier classification logic (pure JS functions) is unit-testable in isolation — consider extracting to a separate module that could be tested if a runner is added later. |

---

## Recommended Next Phase Scope

### → Propose phase

Define the **GPUDetector** module API surface and its contract with `Renderer`:
- `GpuDetector.detect(): Promise<GpuTier>` — returns `'low' | 'mid' | 'high' | 'ultra'`
- Tier persistence in `sessionStorage` (avoid re-detecting on navigation within the same session)
- `powerPreference` and `antialias` derivation from tier
- Boot order revision in `main.js`

### → Spec phase

Write requirements for:
- Detection strategy (WebGPU → WebGL → fallback signals, priority order)
- Tier thresholds (GPU string patterns, concurrency floors)
- DPR cap table per tier
- EWMA parameters per tier class
- `prefers-reduced-motion` override rule
- `localStorage` debug override contract
- Background-tab throttle behavior

### → Design phase

Architecture decisions:
- `GpuDetector` as a standalone module (`src/scripts/GpuDetector.js`) — pure function, no class state
- How `Renderer` receives tier (constructor arg vs static property set before `init()`)
- `renderAsync` self-scheduling loop design
- Whether `updateQuality()` EWMA parameters are passed in or derived from tier internally

### → Tasks phase

Implementation breakdown:
1. Create `GpuDetector.js` (detection + tier classification)
2. Modify `main.js` boot order (insert detect step)
3. Modify `Renderer.init()` to accept tier options (`powerPreference`, `antialias`, DPR caps)
4. Extend `updateQuality()` to accept tier-aware EWMA config, remove `_isMobileLike` gate
5. Fix `renderAsync` scheduling in `render()` / `_tick()`
6. Add background-tab `visibilitychange` handler
7. Add `localStorage` debug override
8. Manual verification checklist (desktop, mid-range Android, iOS Safari, Firefox)

---

## Files Involved in Refactor

| File | Role | Touch scope |
|---|---|---|
| `src/scripts/Renderer.js` | Main surgery — DPR logic, render loop, tier options | High |
| `src/scripts/GpuDetector.js` | **New file** — detection + tier classification | New |
| `src/main.js` | Boot order, liteRT/detect interleaving | Low (3–5 lines) |
| `src/scripts/ShaderManager.js` | **Untouched** — no shader changes in scope | None |
| `src/scripts/LiteRTManager.js` | **Untouched** — not a rendering concern | None |

> **Confirmed**: `u_octaves` in `ShaderManager.js:56` is user-controlled. No per-tier clamping of shader uniforms is in scope for this change.
