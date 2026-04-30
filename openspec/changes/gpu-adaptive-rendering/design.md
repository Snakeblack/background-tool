# Design: GPU-Aware Adaptive Rendering Pipeline

**Change:** `gpu-adaptive-rendering`
**Date:** 2026-05-01
**Phase:** Design
**Status:** Draft

---

## 1. Architecture Overview

### Boot sequence (post-refactor)

```
DOMContentLoaded
  └─> GradientApp.init()
        ├─> _paintSplash()                    ← NEW (synchronous, first paint)
        │     fills <canvas> with first OKLCH
        │     stop color via 2D context
        ├─> liteRTManager.init()
        ├─> gpuDetector.detect()              ← NEW (async)
        │     returns: { tier, source, capabilities, signals, profile }
        ├─> renderer.init(tierProfile)        ← profile passed in
        │     creates WebGPU/WebGL renderer
        │     applies DPR caps, antialias, powerPreference
        ├─> shaderManager / colorManager / uiController / ...
        └─> _tick()  loop                     ← starts only after init resolves
```

### Splash flow

The canvas must show *something* during the `detect()` + `init()` window
(roughly 50–300 ms on cold boot, dominated by `requestAdapter()` and shader
compile). The splash is a single solid OKLCH fill drawn through a transient
**2D context** before any WebGL/WebGPU context is acquired:

1. `GradientApp.init()` synchronously calls `_paintSplash()` as its first step.
2. `_paintSplash()` reads the *first* color stop from `ColorManager`'s default
   palette (already a hardcoded OKLCH array; no async required), converts it
   to an sRGB CSS string via `culori`, and fills the canvas with a 2D context
   `fillRect`.
3. The 2D context is **not retained** — it is acquired with
   `getContext('2d', { willReadFrequently: false })`, used once, then dropped.
   Acquiring a WebGL/WebGPU context on the same canvas afterwards is
   permitted: browsers tolerate a 2D→GPU context transition as long as no GPU
   context was ever acquired (which is the case here, since `Renderer.init()`
   has not run yet).
4. If `_paintSplash()` throws (e.g. exotic browser without 2D context), boot
   continues unguarded — worst case the canvas stays the CSS background color,
   which is acceptable.

**Key timing guarantee:** the splash is painted *before* the first `await` in
`init()`, so the user never sees a flash of blank canvas regardless of how
slow `gpuDetector.detect()` is.

---

## 2. Module Design

### 2.1 `src/scripts/GpuDetector.js` *(new)*

**Public API:**

```js
export class GpuDetector {
    /**
     * Runs detection. Idempotent — second call returns the same frozen result
     * without re-querying the GPU.
     * @returns {Promise<GpuTierResult>}
     */
    async detect() { /* ... */ }
}

// GpuTierResult shape:
{
    tier: 'low' | 'mid' | 'high' | 'ultra',
    source: 'webgpu' | 'webgl' | 'fallback' | 'override',
    capabilities: {
        webgpu: boolean,
        adapterInfo: { vendor, architecture, device, description } | null,
        glRenderer: string | null,        // raw UNMASKED_RENDERER_WEBGL string
        glVendor: string | null,
        masked: boolean,                  // true if Firefox/privacy mode masked the GL string
    },
    signals: {
        hardwareConcurrency: number,      // navigator.hardwareConcurrency, default 4
        deviceMemoryGB: number | null,    // navigator.deviceMemory, null if unavailable
        devicePixelRatio: number,         // window.devicePixelRatio
        prefersReducedMotion: boolean,    // matchMedia('(prefers-reduced-motion: reduce)')
        isMobileUA: boolean,              // pure UA sniff, only used as a tiebreaker
    },
    profile: {
        dprCeiling: number,               // hard upper bound on setPixelRatio
        dprFloor: number,                 // hard lower bound (after _qualityScale applied)
        qualityScaleFloor: number,        // EWMA cannot scale below this
        powerPreference: 'low-power' | 'default' | 'high-performance',
        antialias: boolean,
    },
}
```

**Detection priority** (first non-empty signal wins for `source`, but `tier`
is the synthesis of *all* available signals):

1. **Override**: read `URLSearchParams` for `?tier=low|mid|high|ultra`.
   - If present and valid → return a synthetic result with
     `source: 'override'`, the requested tier, empty `capabilities`, real
     `signals`, and a profile derived from the tier table (§2.1.4). Skip all
     other detection.
2. **WebGPU**: `navigator.gpu?.requestAdapter({ powerPreference:
   'high-performance' })`. If an adapter is returned, read `adapter.info`
   (Chrome 113+ exposes `vendor`, `architecture`, `device`, `description`).
   - If `vendor === 'google'` → SwiftShader fallback → force `low` tier.
   - Otherwise classify via `adapter.info.architecture` first, then
     `adapter.info.description` as fallback.
   - `source: 'webgpu'`.
3. **WebGL**: acquire a throwaway `webgl2` (or `webgl`) context on a `<canvas>`
   element created via `document.createElement('canvas')` (NOT the app's main
   canvas — we don't want to lock its context type). Query
   `WEBGL_debug_renderer_info` extension.
   - If `UNMASKED_RENDERER_WEBGL` returns a real string, classify by regex.
   - If the string is `"Mozilla"` or empty, set `capabilities.masked = true`
     and fall through to signals-only.
   - Free the context immediately via `loseContext()` extension (best effort).
   - `source: 'webgl'`.
4. **Fallback**: classify purely from `signals`:
   - `hardwareConcurrency >= 8 && deviceMemoryGB >= 8` → `mid`.
   - `hardwareConcurrency >= 4` → `mid`.
   - Else `low`.
   - `source: 'fallback'`.

**Classification heuristic** (§2.1.3): a small lookup table of substring
matches, evaluated in order. Pragmatic, not exhaustive — to be iterated as
real-world data comes in.

```js
// (illustrative — not final)
const GPU_PATTERNS = [
    // ultra
    [/\bRTX [4-9]\d{3}\b/i,                    'ultra'],
    [/\bRX 7\d{3}\b/i,                         'ultra'],
    [/\bapple m[2-9]\b/i,                      'ultra'],
    [/\badreno[- ]?7[3-9]\d\b/i,               'ultra'],
    // high
    [/\bRTX [12-3]\d{3}\b|\bGTX 1[6-9]\d{0}\b/i, 'high'],
    [/\bRX [56]\d{3}\b/i,                      'high'],
    [/\bapple m1\b|\bapple gpu\b/i,            'high'],
    [/\badreno[- ]?[67]\d{2}\b/i,              'high'],
    [/\bmali-g7[7-9]\b/i,                      'high'],
    // mid
    [/\bgtx 10\d{2}\b|\bgtx 9\d{2}\b/i,        'mid'],
    [/\bintel.+iris xe\b|\barc a\d{3}\b/i,     'mid'],
    [/\badreno[- ]?6[0-4]\d\b/i,               'mid'],
    [/\bmali-g[57]\d\b/i,                      'mid'],
    // low
    [/\bpowervr\b|\bmali-[34]\d{2}\b/i,        'low'],
    [/\bswiftshader\b|\bgoogle\b/i,            'low'],
    // intel UHD/HD without Iris → mid by default, but flag low-end ones
    [/\bintel.+(uhd|hd) graphics 6\d{2}\b/i,   'mid'],
];
```

The detector iterates the table; first match wins. If nothing matches, the
detector falls through to signals-based classification (same logic as the
fallback path), but keeps `source: 'webgl'` or `'webgpu'` to preserve the
audit trail of *which* string was inspected.

**`prefers-reduced-motion` override:**

If `signals.prefersReducedMotion === true`, the **profile** is forcibly
overwritten with low-tier values (`dprCeiling: 1.0`, `qualityScaleFloor: 0.6`,
`powerPreference: 'low-power'`, `antialias: false`) — but **`tier` itself is
preserved** to reflect the *detected* tier. Caller (Renderer) decides whether
to surface tier vs. effective profile in debug output.

**Idempotency:**

```js
class GpuDetector {
    #result = null;
    #inflight = null;

    async detect() {
        if (this.#result) return this.#result;
        if (this.#inflight) return this.#inflight;
        this.#inflight = this.#runDetection()
            .then((r) => { this.#result = Object.freeze(r); return this.#result; })
            .finally(() => { this.#inflight = null; });
        return this.#inflight;
    }
}
```

The result object is `Object.freeze`-d (shallow is sufficient — nested
objects are also frozen explicitly) so callers cannot mutate the shared state.

**Failure modes:**

- `navigator.gpu` undefined → skip step 2, log debug, continue to step 3.
- `requestAdapter()` rejects → catch, set `capabilities.webgpu = false`,
  continue.
- WebGL context creation fails (rare, e.g. headless/no-GPU CI) → catch,
  `capabilities.glRenderer = null`, continue.
- All paths throw → return synthetic result with `tier: 'mid'`,
  `source: 'fallback'`, all capabilities null/false, signals populated as
  best-effort. **`mid` was chosen as the safe default** because it produces
  the closest behavior to current production (DPR ≤ 1.5, EWMA active).

**Tier → profile table** (§2.1.4):

| Tier   | dprCeiling | dprFloor | qualityScaleFloor | powerPreference   | antialias |
|--------|-----------:|---------:|------------------:|-------------------|----------:|
| low    | 1.0        | 0.6      | 0.6               | `low-power`       | false     |
| mid    | 1.5        | 0.75     | 0.75              | `default`         | false     |
| high   | 2.0        | 1.0      | 0.85              | `high-performance`| true      |
| ultra  | 3.0        | 1.0      | 0.9               | `high-performance`| true      |

These values match the table in `exploration.md` §Tier Definitions, with
one refinement: `qualityScaleFloor` is the *static* lower bound for the EWMA
loop. The dynamic `_qualityScale` cannot drop below this floor, preserving a
minimum visual fidelity per tier.

---

### 2.2 `src/scripts/Renderer.js` *(refactor)*

Document the refactor as **diff in intent** (no code yet):

#### Constructor

- Signature: `constructor(canvasId)` — unchanged externally.
- **Removed**: any DPR/pixel-ratio computation in the constructor. The
  constructor now only stores `this._canvasId` and prepares empty state.
- **Added private fields**:
  - `_tierProfile` — the `GpuTierResult.profile` passed to `init()`. Defaults
    to a synthetic `mid` profile if `init()` is called without an argument.
  - `_renderedTime` — accumulates `deltaMs` only on frames that actually
    rendered. Replaces "elapsed time since boot" semantics.
  - `_lastFrameDeltaMs` — last delta passed to `_tick`, exposed read-only
    for diagnostics.
  - `_isPageVisible` — initialized from `!document.hidden`.
  - `_renderInFlight` — replaces `_isRendering`. Renamed for clarity; same
    role (WebGPU `renderAsync` guard).

#### `init(tierProfile)`

- Accepts an optional `tierProfile` object (the `profile` field of
  `GpuTierResult`).
- If undefined, falls back to a synthetic `mid`-tier profile (preserves
  backward compatibility — see §6).
- WebGPU branch: passes `powerPreference: tierProfile.powerPreference` to
  `requestAdapter`. Constructs `WebGPURenderer` with `antialias:
  tierProfile.antialias`.
- WebGL branch: constructs `WebGLRenderer` with `antialias:
  tierProfile.antialias` and `powerPreference:
  tierProfile.powerPreference`.
- After renderer construction, calls `_applyPixelRatioAndSize()` for the
  first time using the new tier-aware DPR computation.

#### `_computeIsMobileLike()` and width-based heuristic — **REMOVED**

The notion of "is mobile" no longer drives any rendering decision. The tier
profile is the single source of truth. This eliminates the resize-induced
quality jank documented in `exploration.md` §Gaps #3.

#### `_computeEffectivePixelRatio()` — **rewritten**

Old signature: implicit (read `_isMobileLike`).
New signature: takes no args, reads `this._tierProfile`.

```text
effective = clamp(
    window.devicePixelRatio * this._qualityScale,
    this._tierProfile.dprFloor,
    this._tierProfile.dprCeiling
)
```

#### `updateQuality(frameDeltaMs)` — **un-gated, tier-aware bounds**

- **Removed** the `if (!this._isMobileLike) return;` early-return. EWMA now
  runs on **every tier**.
- EWMA α and sample window remain `0.06` and `20 frames` respectively — the
  same values used today on mobile. *Decision*: keep these constants
  uniform across tiers for simplicity. An earlier draft considered
  per-tier α (faster reaction on `low`, slower on `ultra`); deferred until
  real telemetry justifies the added complexity.
- Thresholds remain `> 26 ms → step down 0.1`, `< 18 ms → step up 0.05`.
  These map to ~38 fps and ~55 fps respectively, providing hysteresis around
  the 60 fps target.
- **New**: lower bound on `_qualityScale` is
  `this._tierProfile.qualityScaleFloor` (was hardcoded `0.75`). Upper bound
  remains `1.0` (the multiplier never amplifies above the tier ceiling).

> **Rejected alternative**: tighter thresholds for `ultra` (e.g. step down at
> 20 ms to keep latency low even with headroom). Reason: shader workload is
> uniform across tiers, and `ultra` devices already start at higher DPR; an
> aggressive step-down would produce visible DPR oscillation. Revisit if
> high-refresh-rate (120 Hz+) support lands.

#### `render()` — returns `boolean`

- WebGL path: synchronous `renderer.render()`, returns `true`.
- WebGPU path:
  - If `this._renderInFlight === true` → return `false` immediately. **Do
    not advance `u_time`** (the caller checks the return value).
  - Else: set `_renderInFlight = true`, schedule
    `renderer.renderAsync().finally(() => { _renderInFlight = false; })`,
    return `true`. The frame's `u_time` is "committed" optimistically; if
    the next tick still has the in-flight flag set, that next tick is the
    one that gets skipped.
  - Rationale for optimistic commit: holding `u_time` until the async
    resolves would couple `ShaderManager` to renderer lifecycle (see
    `exploration.md` §renderAsync option 1). The boolean-return approach
    keeps the time advance/skip decision in the caller (`_tick`) where it
    belongs.

#### `getRenderedTime()` — **new public method**

- Returns `this._renderedTime` in seconds (matches the unit `ShaderManager`
  expects for `u_time`).
- Replaces the `getElapsedTime()` call from `ShaderManager.updateTime()`.
- `_renderedTime` is incremented by `deltaMs / 1000` from inside `_tick`
  *only* when `render()` returned `true` on the previous tick.

> **Note**: the old `getElapsedTime()` (which delegated to the Three.js
> `Clock`) is kept as a deprecated alias returning `_renderedTime` for at
> least this change cycle. Other callers (color cycling) are reviewed in
> tasks; if any depend on wall-clock time rather than animation time, they
> stay on `Clock`.

#### `visibilitychange` listener — **new**

- Registered in `init()`, deregistered in a new `dispose()` method (also
  new — currently `Renderer` has no teardown, but adding one is cheap and
  prevents the listener from leaking in HMR).
- On change: `this._isPageVisible = !document.hidden`.
- The `_tick` loop in `main.js` checks `_isPageVisible` (exposed via getter)
  and skips both `render()` and time accumulation while hidden. See §3
  step 2.

---

### 2.3 `src/scripts/ShaderManager.js` *(minimal change)*

**Contract:**

- `updateTime()` now reads `renderer.getRenderedTime()` instead of
  `renderer.getElapsedTime()`.
- No other change. The `u_time` uniform path, TSL/GLSL split, and all
  shader-side logic are untouched.

This is the *only* change in `ShaderManager`. Confirms the proposal's
out-of-scope guarantee (no shader code touched).

---

### 2.4 `src/main.js` *(minimal change)*

**Boot order edit:**

```text
OLD:
    await liteRTManager.init();
    await renderer.init();
    shaderManager = new ShaderManager(...);
    ...

NEW:
    _paintSplash();                                 // synchronous
    await liteRTManager.init();
    const tierResult = await gpuDetector.detect();
    await renderer.init(tierResult.profile);
    shaderManager = new ShaderManager(...);
    ...
    if (import.meta.env.DEV) {
        window.__gpuDebug = { detector: gpuDetector, renderer, tierResult };
    }
```

- `Renderer` constructor stays argless.
- `tierResult` is held in a local variable so the dev-mode debug hook can
  expose it without making it a module-level global.
- The `_tick` loop gains a single new line at the top:
  `if (!renderer.isPageVisible) return this._scheduleNext();` — which still
  re-queues `requestAnimationFrame` so we resume cleanly when the tab
  returns.

---

## 3. Sequence of a Frame (post-refactor)

```
1. requestAnimationFrame fires → _tick(now)

2. if (document.hidden || !renderer.isPageVisible):
       _scheduleNext()                            // re-queue rAF, no time advance, no render
       return

3. deltaMs = now - _lastFrameTime
   _lastFrameTime = now

4. renderer.updateQuality(deltaMs)                // adjusts _qualityScale within tier bounds

5. if (renderer.isWebGPU && renderer._renderInFlight):
       _scheduleNext()                            // GPU still busy with previous frame
       return                                     // no time advance, no render

6. shaderManager.updateTime()
   // internally: u_time uniform += deltaMs/1000, sourced from renderer.getRenderedTime()
   // BUT: getRenderedTime advances _renderedTime ONLY here, before render(), so
   //      the value baked into the shader matches the frame about to be drawn.
   // Implementation detail: _tick passes deltaMs to renderer.tickTime(deltaMs) which
   //      increments _renderedTime, then ShaderManager reads getRenderedTime().

7. if (renderer.consumeResolutionChanged()):
       shaderManager.updateResolution()           // u_resolution uniform refresh

8. const rendered = renderer.render()
   // WebGL: returns true synchronously
   // WebGPU: returns true if scheduled, false if previous still in-flight
   // NOTE: step 5 already filtered the in-flight case, so step 8 should only
   //       return false in a race that's effectively impossible single-threaded.
   //       The boolean is kept for defense-in-depth.

9. _scheduleNext()                                // queue next rAF
```

**Critical fix:** the explicit pre-check at step 5 fixes the previous design
where `u_time` advanced while the render was silently dropped (see
`exploration.md` §renderAsync Frame-Scheduling Issue). With the new flow,
*both* time advance (step 6) and render (step 8) are gated by the same
in-flight check at step 5 — they advance together or not at all.

---

## 4. Edge Cases & Decisions

### iOS Safari WebGPU

As of writing (2026-05), Safari ships WebGPU behind a feature flag and most
users do not have it enabled. The detector falls through to the WebGL path,
where `WEBGL_debug_renderer_info` reliably returns `"Apple GPU"` on iOS.
Combined with the M-series UA detection on `signals.isMobileUA`, this
classifies iPhones as `high` and iPads as `high`/`ultra` (M-series).

Action: no special-case code. The fallthrough handles it correctly.

### WebGPU adapter loss event

`GPUAdapter` can fire `lost` events (e.g. driver crash, GPU reset). Handling
adapter loss requires re-running detection and re-initializing the renderer
mid-session, which is a substantial new flow.

**Decision**: out of scope for this change. Document as future work in the
follow-up section. Probability is low for the use case (single-page
generative tool, not long-lived).

### URL tier override (`?tier=mid`)

In scope, low cost. The detector reads `URLSearchParams` first; if a valid
tier (`low|mid|high|ultra`) is forced, detection is skipped and a synthetic
profile is built from the tier table. `source: 'override'` flags this in the
result. Useful for QA, screenshot diff testing, and reproducing user-reported
issues.

### DPR ceiling > 2.0 on 4K display

`ultra` tier sets `dprCeiling: 3.0`. Three.js `setPixelRatio` accepts any
positive float — internally it just multiplies the canvas backing-store
dimensions. Confirmed safe; tested in Three.js for years (Webflow, Spline,
etc. ship higher DPRs). The shader cost scales quadratically, but `ultra`
hardware is by definition fast enough.

### `antialias` change requires renderer recreation

Confirmed. Three.js `WebGLRenderer` and `WebGPURenderer` both bake
`antialias` into the WebGL context attributes / WebGPU swapchain at
construction. **Tier MUST be known before `renderer.init()`** — this is the
core constraint that drove the splash pattern. The boot sequence in §1
satisfies this constraint by awaiting `gpuDetector.detect()` *before*
`renderer.init()`.

### Two adapter requests (LiteRT + Renderer)

`LiteRTManager.init()` may internally call `requestAdapter()` for ML
acceleration. `GpuDetector.detect()` also calls `requestAdapter()`. Browsers
treat adapters as cached, lightweight handles — two requests on the same
device do not double-initialize the GPU. Order in the boot sequence
(LiteRT → detector) is preserved from the proposal.

---

## 5. Testing Approach

No test runner is installed in this project. Verification relies on:

- **Manual: throttled DevTools session.**
  Chrome DevTools → Performance → CPU 4× slowdown + GPU "low-end mobile".
  Reload, open `__gpuDebug` in console, verify:
  - `detector.detect()` resolves with `tier: 'low'` (or `mid` if signals
    push it up).
  - `renderer._tierProfile.dprCeiling === 1.0` (or 1.5 for mid).
  - `_qualityScale` adapts within the tier's `qualityScaleFloor..1.0`
    range under load.

- **Manual: `?tier=` override.**
  Visit `?tier=low`, `?tier=ultra`. Verify renderer constructs with the
  expected profile (check `__gpuDebug.renderer._tierProfile`).

- **Console-driven: dev hook.**
  In `import.meta.env.DEV`, expose `window.__gpuDebug = { detector,
  renderer, tierResult }`. Lets the developer inspect intermediate state
  without rebuilding.

- **Lint:** `pnpm lint` must pass clean.

- **Typecheck:** `pnpm typecheck` must pass clean. `GpuDetector.js` uses
  JSDoc `@typedef` for `GpuTierResult` and `TierProfile`, validated by
  TypeScript via `// @ts-check`.

- **Visual regression (manual):** verify the splash color matches the first
  OKLCH stop of the default palette by reloading several times — the
  transition from solid color to animated gradient should be seamless.

---

## 6. Migration Impact

- **`Renderer` constructor signature**: unchanged externally. `new
  Renderer(canvasId)`.
- **`Renderer.init()`**: now accepts an *optional* `tierProfile` argument.
  Backward-compatible if called without args (uses synthetic mid-tier
  profile). This means any code path that calls `renderer.init()` without a
  detector run still works — it just gets the conservative default.
- **`ShaderManager.updateTime()`**: internal change only (reads
  `getRenderedTime()` instead of `getElapsedTime()`). No external API
  impact.
- **`main.js` boot order**: insert detect step + paint splash. No external
  impact (no consumers of `main.js`).
- **No public API removal.** `getElapsedTime()` is kept as a deprecated
  alias returning `_renderedTime` for one cycle.

Rollback (per proposal): revert `main.js` boot order and `Renderer.init()`
default-arg path. `GpuDetector.js` becomes dead code but does not break
anything.

---

## 7. Out-of-Scope Reminder

Confirming the proposal's scope boundaries — **none of the following are
touched in this change**:

- Shader source code (TSL, GLSL).
- UI controls and panels.
- `LiteRTManager` and ML inference.
- FPS target downgrade (always 60 fps; sacrifice DPR before FPS).
- Persistence of the detected tier across sessions (`sessionStorage`,
  `localStorage`). `?tier=` override is per-page-load only.
- Telemetry or analytics on detected tiers.
- Adapter loss / device reset recovery.
- Runtime micro-benchmark (rejected in exploration as not worth the boot
  jank).

---

## Future Work (recorded, not in scope)

- WebGPU adapter loss recovery (re-detect + re-init).
- Optional micro-benchmark for `mid`/`high` ambiguity cases.
- Per-tier EWMA tuning once telemetry is available.
- Persist user-confirmed tier in `localStorage` to skip detection on repeat
  visits.
- 120 Hz / high-refresh-rate frame-time targets.
