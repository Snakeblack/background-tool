# Tasks: GPU-Aware Adaptive Rendering Pipeline

**Change:** `gpu-adaptive-rendering`
**Date:** 2026-05-01
**Status:** Ready for Implementation

---

> Each task is a single, independently verifiable deliverable.
> Complete phases in order — later phases depend on earlier ones.
> Complexity key: **S** = < 30 min · **M** = 30–90 min · **L** = > 90 min

---

## Phase 1 — Foundation: `GpuDetector.js`

- [x] **Task 1 — Skeleton and frozen result shape**
  - **Files:** `src/scripts/GpuDetector.js` *(new)*
  - **What to do:** Create the file. Export `GpuDetector` class with private fields `#result` and `#inflight`. Define the full `GpuTierResult` JSDoc `@typedef` (tier, source, capabilities, signals, profile sub-objects) with `// @ts-check` at the top. Implement the idempotency shell (`detect()` delegates to `#runDetection()`, freezes the result, caches in `#result`, guards concurrent calls with `#inflight`). `#runDetection()` may simply return a hard-coded `mid` stub at this stage.
  - **Acceptance criterion:** `new GpuDetector().detect()` resolves to a frozen object matching the documented shape; calling it twice returns the exact same reference.
  - **Complexity:** S

- [x] **Task 2 — WebGPU adapter detection branch**
  - **Files:** `src/scripts/GpuDetector.js`
  - **What to do:** Inside `#runDetection()`, add the WebGPU branch: check `navigator.gpu` existence, call `navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })`, read `adapter.info` (vendor, architecture, device, description). If vendor equals `'google'` (SwiftShader), record tier hint `'low'`. Store results in `capabilities.webgpu = true`, `capabilities.adapterInfo`. Wrap the entire branch in try/catch; on any failure set `capabilities.webgpu = false` and continue. Set `source = 'webgpu'` when this path succeeds. Log the raw info at `console.debug` level only — no network, no storage.
  - **Acceptance criterion:** On Chrome with WebGPU enabled, `detect()` returns `source: 'webgpu'` and `capabilities.adapterInfo` is populated. On a browser without `navigator.gpu`, the branch is silently skipped and execution continues.
  - **Complexity:** M

- [x] **Task 3 — WebGL `WEBGL_debug_renderer_info` detection branch**
  - **Files:** `src/scripts/GpuDetector.js`
  - **What to do:** Create a **throwaway** `document.createElement('canvas')` (not the app canvas). Acquire a `webgl2` or `webgl` context. Query the `WEBGL_debug_renderer_info` extension. If available, read `UNMASKED_RENDERER_WEBGL` and `UNMASKED_VENDOR_WEBGL` into `capabilities.glRenderer` / `capabilities.glVendor`. If the renderer string is `"Mozilla"`, empty, or another known masked sentinel, set `capabilities.masked = true`. Release the context via `WEBGL_lose_context` extension (best-effort). Wrap in try/catch; swallow errors, continue. Set `source = 'webgl'` when this path is reached.
  - **Acceptance criterion:** On Chrome, `capabilities.glRenderer` contains the real GPU string. On Firefox with resist-fingerprinting, `capabilities.masked === true` and `capabilities.glRenderer` is the masked string (not null — preserve it for audit). No reference to the throwaway canvas escapes the function.
  - **Complexity:** M

- [x] **Task 4 — Signals fallback population**
  - **Files:** `src/scripts/GpuDetector.js`
  - **What to do:** Always populate `signals` (regardless of which earlier branches ran): `hardwareConcurrency` (default `4` if undefined), `deviceMemoryGB` (`navigator.deviceMemory ?? null`), `devicePixelRatio` (`window.devicePixelRatio`), `prefersReducedMotion` (`matchMedia('(prefers-reduced-motion: reduce)').matches`), `isMobileUA` (UA string includes "Mobile" or "Android"). This block runs unconditionally — it is not a fallback path but a supplemental enrichment step; the signals-only *tier classification* is the fallback (Task 5).
  - **Acceptance criterion:** `detect()` always returns a `signals` object with all five fields populated and of the correct type. `hardwareConcurrency` is never `undefined`.
  - **Complexity:** S

- [x] **Task 5 — Classification heuristic (lookup table → tier)**
  - **Files:** `src/scripts/GpuDetector.js`
  - **What to do:** Implement the `_classifyByString(str)` helper that iterates `GPU_PATTERNS` (as defined in design §2.1.3) and returns the first matching tier, or `null` if none match. Implement the `_classifyBySignals(signals)` helper: `hardwareConcurrency >= 8 && deviceMemoryGB >= 8 → 'mid'`; `hardwareConcurrency >= 4 → 'mid'`; else `'low'`. In `#runDetection()`, wire the priority: (1) if override (Task 7) → return early; (2) try classify WebGPU `adapterInfo.architecture` then `adapterInfo.description`; (3) try classify WebGL `glRenderer`; (4) fall back to signals. SwiftShader/Google vendor short-circuits to `'low'`. Masked GL string short-circuits to signals classification. If nothing resolves, default to `'mid'`.
  - **Acceptance criterion:** The pattern table correctly maps `'NVIDIA GeForce RTX 4090'` → `ultra`, `'Mali-G57'` → `mid`, `'SwiftShader'` → `low`, an unknown string → signals-derived tier. Unit-testable with `console.assert` in a scratch file if desired.
  - **Complexity:** M

- [x] **Task 6 — Profile builder (tier → dprCeiling / floor / powerPreference / antialias)**
  - **Files:** `src/scripts/GpuDetector.js`
  - **What to do:** Implement `_buildProfile(tier)` using the table from design §2.1.4:

    | tier  | dprCeiling | dprFloor | qualityScaleFloor | powerPreference     | antialias |
    |-------|------------|----------|--------------------|---------------------|-----------|
    | low   | 1.0        | 0.6      | 0.6                | `'low-power'`       | false     |
    | mid   | 1.5        | 0.75     | 0.75               | `'default'`         | false     |
    | high  | 2.0        | 1.0      | 0.85               | `'high-performance'`| true      |
    | ultra | 3.0        | 1.0      | 0.9                | `'high-performance'`| true      |

    Return a frozen profile object. Wire it into `#runDetection()` so `result.profile` is always populated.
  - **Acceptance criterion:** `_buildProfile('ultra')` returns `{ dprCeiling: 3.0, dprFloor: 1.0, qualityScaleFloor: 0.9, powerPreference: 'high-performance', antialias: true }` (frozen). `_buildProfile` called with an unknown string falls back to `mid` profile.
  - **Complexity:** S

- [x] **Task 7 — `?tier=` URL override**
  - **Files:** `src/scripts/GpuDetector.js`
  - **What to do:** At the very start of `#runDetection()`, read `new URLSearchParams(location.search).get('tier')`. If the value is one of `low | mid | high | ultra`, skip all detection, set `source: 'override'`, leave `capabilities` as empty/null, still populate `signals` (Task 4), build the profile from Task 6, and return. Log a `console.debug` message confirming the override.
  - **Acceptance criterion:** Loading `?tier=low` causes `detect()` to return `{ tier: 'low', source: 'override' }` without ever touching `navigator.gpu` or creating a WebGL context. Invalid values (e.g. `?tier=insane`) are ignored; detection proceeds normally.
  - **Complexity:** S

- [x] **Task 8 — `prefers-reduced-motion` profile override**
  - **Files:** `src/scripts/GpuDetector.js`
  - **What to do:** After building the profile in `#runDetection()` (after Task 6), if `signals.prefersReducedMotion === true`, overwrite the profile fields with low-tier values: `dprCeiling: 1.0`, `qualityScaleFloor: 0.6`, `powerPreference: 'low-power'`, `antialias: false` — but **preserve `result.tier`** (the detected tier is kept for audit/debug). Re-freeze the modified profile. Log at `console.debug`: detected tier + "profile overridden by prefers-reduced-motion".
  - **Acceptance criterion:** A device classified as `ultra` but with `prefers-reduced-motion` enabled returns `tier: 'ultra'` and `profile.dprCeiling: 1.0`, `profile.antialias: false`. A device without `prefers-reduced-motion` is unaffected.
  - **Complexity:** S

- [x] **Task 9 — Idempotency: cache result, freeze nested objects**
  - **Files:** `src/scripts/GpuDetector.js`
  - **What to do:** Ensure `Object.freeze` is applied to the top-level result **and** all nested sub-objects (`capabilities`, `signals`, `profile`). Verify the `#inflight` guard correctly handles concurrent callers (both resolve to the same frozen object). No re-querying on a second call. This task is a hardening pass — review the code written in Tasks 1–8 and close any freeze or race gaps.
  - **Acceptance criterion:** `Object.isFrozen(result) && Object.isFrozen(result.profile) && Object.isFrozen(result.signals) && Object.isFrozen(result.capabilities)` all true. Two simultaneous `detect()` calls resolve to `===` the same object. Attempting to mutate `result.tier` throws in strict mode.
  - **Complexity:** S

---

## Phase 2 — Renderer Refactor: `Renderer.js`

- [x] **Task 10 — `Renderer.init()` accepts `tierProfile` argument**
  - **Files:** `src/scripts/Renderer.js`
  - **What to do:** Add private field `_tierProfile`. Change `init()` signature to `init(tierProfile)`. If `tierProfile` is undefined, assign a synthetic `mid`-tier profile (same values as `_buildProfile('mid')` from Task 6 — hardcode the literal here; no import of `GpuDetector` into `Renderer`). Store the profile in `this._tierProfile`. Add JSDoc `@param` documenting the shape. No other behavior changes in this task.
  - **Acceptance criterion:** `renderer.init()` (no argument) sets `_tierProfile` to the mid defaults. `renderer.init(someProfile)` stores `someProfile`. `_tierProfile` is readable in the same call for use in later tasks.
  - **Complexity:** S

- [x] **Task 11 — Apply `powerPreference` and `antialias` from profile in WebGL/WebGPU constructor**
  - **Files:** `src/scripts/Renderer.js`
  - **What to do:** In the WebGPU branch of `init()`, pass `powerPreference: this._tierProfile.powerPreference` to `requestAdapter`. Pass `antialias: this._tierProfile.antialias` to the `WebGPURenderer` constructor. In the WebGL branch, pass both `antialias` and `powerPreference` to the `WebGLRenderer` constructor options. Remove any previous hardcoded values for these options.
  - **Acceptance criterion:** On `tier: 'low'`, the renderer is constructed with `antialias: false` and `powerPreference: 'low-power'`. On `tier: 'ultra'`, with `antialias: true` and `powerPreference: 'high-performance'`. Verify via `window.__gpuDebug` (Task 32) or console log in dev mode.
  - **Complexity:** M

- [x] **Task 12 — Remove `_computeIsMobileLike()` and width/pointer heuristic**
  - **Files:** `src/scripts/Renderer.js`
  - **What to do:** Delete the `_computeIsMobileLike()` method and the private field `_isMobileLike`. Remove all code that reads or sets `_isMobileLike`. Trace every call site and replace width/pointer-based logic with tier-profile-based logic (or simply remove if the logic is superseded by Tasks 13–14). Ensure no reference to `_isMobileLike` remains.
  - **Acceptance criterion:** `grep -r '_isMobileLike' src/` returns no results. No runtime errors when resizing or initializing the renderer.
  - **Complexity:** M

- [x] **Task 13 — Rewrite `_computeEffectivePixelRatio()` using `tierProfile`**
  - **Files:** `src/scripts/Renderer.js`
  - **What to do:** Replace the existing method body with:
    ```js
    const raw = window.devicePixelRatio * this._qualityScale;
    return Math.min(
        Math.max(raw, this._tierProfile.dprFloor),
        this._tierProfile.dprCeiling
    );
    ```
    Remove any reference to `_isMobileLike` from this method (already gone after Task 12). Update the JSDoc to document the clamp behavior.
  - **Acceptance criterion:** On `tier: 'low'` with `devicePixelRatio = 3` and `_qualityScale = 1.0`, the method returns `1.0` (ceiling). With `_qualityScale = 0.4`, it returns `0.6` (floor). On `tier: 'ultra'` with `devicePixelRatio = 2`, it returns `2.0`.
  - **Complexity:** S

- [x] **Task 14 — Remove `_isMobileLike` gate from `updateQuality()`**
  - **Files:** `src/scripts/Renderer.js`
  - **What to do:** Remove the `if (!this._isMobileLike) return;` early-return (or equivalent guard) from `updateQuality()`. Replace the hardcoded `qualityScaleFloor` value (`0.75` or similar) with `this._tierProfile.qualityScaleFloor`. The upper bound on `_qualityScale` remains `1.0`. EWMA constants (α = `0.06`, window = 20 frames, step-down at 26 ms, step-up at 18 ms) are unchanged.
  - **Acceptance criterion:** `updateQuality()` runs for every tier. On `tier: 'low'`, `_qualityScale` never drops below `0.6`. On `tier: 'ultra'`, never below `0.9`. On `tier: 'mid'`, never below `0.75`.
  - **Complexity:** S

- [x] **Task 15 — Add `_renderedTime` field and `getRenderedTime()` method**
  - **Files:** `src/scripts/Renderer.js`
  - **What to do:** Add private field `_renderedTime = 0` (seconds). Add public method `getRenderedTime()` returning `this._renderedTime`. Add public method `tickTime(deltaMs)` that increments `_renderedTime += deltaMs / 1000` — this is called by `_tick()` in `main.js` (Task 20) only when a frame is to be rendered. Also add `_lastFrameDeltaMs = 0` and a read-only getter `lastFrameDeltaMs`.
  - **Acceptance criterion:** `getRenderedTime()` starts at `0`. After two calls to `tickTime(16.67)`, it equals approximately `0.03334`. Calling `tickTime` is the only way to advance the value; nothing inside `Renderer` advances it automatically.
  - **Complexity:** S

- [x] **Task 16 — Refactor `render()` WebGPU path to return `boolean`**
  - **Files:** `src/scripts/Renderer.js`
  - **What to do:** Rename `_isRendering` to `_renderInFlight` for clarity. Change the return type of `render()` to `boolean`. WebGL path: call sync render, return `true`. WebGPU path: if `_renderInFlight === true`, return `false` immediately — caller must NOT advance time. Otherwise: set `_renderInFlight = true`, call `renderer.renderAsync().finally(() => { this._renderInFlight = false; })`, return `true`. Do **not** call `tickTime` inside `render()` — the time advance is the caller's responsibility (Task 20).
  - **Acceptance criterion:** The WebGL path always returns `true`. The WebGPU path returns `false` when in-flight. Returning `false` means no `tickTime` call should occur in that tick (enforced in Task 20, not here). The field rename from `_isRendering` → `_renderInFlight` is consistent across the file.
  - **Complexity:** M

- [x] **Task 17 — Add `visibilitychange` listener and `isPageVisible` getter**
  - **Files:** `src/scripts/Renderer.js`
  - **What to do:** Add private field `_isPageVisible = !document.hidden`. In `init()`, register `document.addEventListener('visibilitychange', this.#onVisibilityChange)` using a private method (arrow function or bound). In a new `dispose()` method, remove the listener. Add a public getter `isPageVisible` returning `this._isPageVisible`. The listener sets `this._isPageVisible = !document.hidden`.
  - **Acceptance criterion:** After calling `init()`, `renderer.isPageVisible` is `true`. Simulating `document.hidden = true` and dispatching `visibilitychange` sets it to `false`. `dispose()` removes the listener (verify by checking `document.hidden` handling after dispose + visibility toggle).
  - **Complexity:** S

- [x] **Task 18 — Keep `getElapsedTime()` as deprecated alias**
  - **Files:** `src/scripts/Renderer.js`
  - **What to do:** Retain the existing `getElapsedTime()` method. Change its implementation to return `this._renderedTime` (instead of delegating to the Three.js `Clock`). Add a `/** @deprecated Use getRenderedTime() instead */` JSDoc comment. Do not delete the method.
  - **Acceptance criterion:** `renderer.getElapsedTime()` returns the same value as `renderer.getRenderedTime()`. No callers are broken. TypeScript (via `// @ts-check`) does not error on the file.
  - **Complexity:** S

---

## Phase 3 — Wiring: `main.js` + `ShaderManager.js`

- [x] **Task 19 — Update `main.js` boot order: detect before renderer init**
  - **Files:** `src/main.js`
  - **What to do:** Import `GpuDetector`. Instantiate it: `const gpuDetector = new GpuDetector()`. In `GradientApp.init()`, add `_paintSplash()` as the **first synchronous call** (before any `await`). After `await liteRTManager.init()`, add `const tierResult = await gpuDetector.detect()`. Pass `tierResult.profile` to `await renderer.init(tierResult.profile)`. Hold `tierResult` in a local variable in `init()` for use in Task 32's debug hook.
  - **Acceptance criterion:** On page load, `_paintSplash()` fires before any `await`. `renderer.init()` is called with a `tierProfile` object (not `undefined`). The boot sequence matches the design §1 diagram. No regressions in the existing boot flow.
  - **Complexity:** M

- [x] **Task 20 — Update `_tick()` in `main.js`**
  - **Files:** `src/main.js`
  - **What to do:** At the top of `_tick(now)`:
    1. If `document.hidden || !renderer.isPageVisible` → call `_scheduleNext()` and `return`. No time advance, no render.
    2. Compute `deltaMs = now - _lastFrameTime`, set `_lastFrameTime = now`.
    3. Call `renderer.updateQuality(deltaMs)`.
    4. If `renderer.isWebGPU && renderer._renderInFlight` → call `_scheduleNext()` and `return`. No time advance.
    5. Call `renderer.tickTime(deltaMs)` to advance `_renderedTime`.
    6. Call `shaderManager.updateTime()`.
    7. If `renderer.consumeResolutionChanged()` → call `shaderManager.updateResolution()`.
    8. Call `renderer.render()` (boolean result available for defense-in-depth logging).
    9. Call `_scheduleNext()`.
  - **Acceptance criterion:** While `document.hidden`, `u_time` does not advance (verify `renderer.getRenderedTime()` is stable). When an in-flight WebGPU render is detected in step 4, the tick exits early without advancing time. Frame rendering and time advance are always in lockstep.
  - **Complexity:** M

- [x] **Task 21 — Update `ShaderManager.updateTime()` to use `getRenderedTime()`**
  - **Files:** `src/scripts/ShaderManager.js`
  - **What to do:** Replace the call to `renderer.getElapsedTime()` with `renderer.getRenderedTime()`. No other changes to `ShaderManager`.
  - **Acceptance criterion:** `u_time` uniform is sourced from `_renderedTime`. The method compiles without errors. `pnpm typecheck` passes.
  - **Complexity:** S

- [x] **Task 22 — Implement `_paintSplash()` in `main.js`**
  - **Files:** `src/main.js`
  - **What to do:** Implement a synchronous `_paintSplash()` method (or function, matching the existing code style). It must: (1) get the app canvas element; (2) read the **first** OKLCH color stop from `ColorManager`'s default palette (use whatever accessor is already available — no async); (3) convert that OKLCH value to an sRGB CSS string via `culori` (already a project dependency); (4) acquire a 2D context with `getContext('2d', { willReadFrequently: false })`; (5) set `fillStyle` and call `fillRect(0, 0, canvas.width, canvas.height)`; (6) let the 2D context be garbage collected — do **not** store it. Wrap the entire function body in try/catch; if it throws, log a warning and return — do not let it abort boot.
  - **Acceptance criterion:** On page load, the canvas immediately shows a solid color matching the first OKLCH palette stop before any WebGL/WebGPU initialization. On browsers lacking 2D context support, boot continues without error. Acquiring a WebGPU or WebGL context on the same canvas afterwards succeeds (no "canvas already has a different context type" error).
  - **Complexity:** M

---

## Phase 4 — Verification

- [x] **Task 23 — Lint pass**
  - **Files:** All modified/created files
  - **What to do:** Run `pnpm lint`. Fix all reported errors and warnings.
  - **Acceptance criterion:** `pnpm lint` exits with code `0`, zero errors, zero warnings.
  - **Complexity:** S
  - **Note:** Pre-existing lint errors exist in unmodified files (shaders, components, UIController, etc. — 188 pre-existing errors). All 4 modified/created files pass with 0 errors, 0 warnings. `pnpm lint` itself exits non-zero due to pre-existing errors; the new files are clean. The ESLint config (`.eslintrc.json` + ESLint 9) requires `ESLINT_USE_FLAT_CONFIG=false` — also a pre-existing issue.

- [x] **Task 24 — Typecheck pass**
  - **Files:** All modified/created files
  - **What to do:** Run `pnpm typecheck`. Fix all type errors. `GpuDetector.js` must have `// @ts-check` at the top and complete JSDoc `@typedef` definitions for `GpuTierResult` and `TierProfile`.
  - **Acceptance criterion:** `pnpm typecheck` exits with code `0`, zero errors.
  - **Complexity:** S
  - **Result:** ✅ `pnpm typecheck` exits 0, zero errors.

- [ ] **Task 25 — Manual smoke: Chrome desktop high-end GPU**
  - **Files:** *(no code changes — verification only)*
  - **What to do:** Load the app in Chrome desktop on a high-end machine. Open DevTools console, inspect `window.__gpuDebug` (requires Task 32 to be done first, or add a temporary log). Confirm tier resolves to `high` or `ultra`. Confirm `renderer._tierProfile.dprCeiling` is `2.0` or `3.0`. Confirm DPR adapts per the profile.
  - **Acceptance criterion:** Tier is `high` or `ultra`, DPR ceiling matches the table, no console errors.
  - **Complexity:** S

- [ ] **Task 26 — Manual smoke: Chrome DevTools CPU/GPU throttle (low-end simulation)**
  - **Files:** *(no code changes — verification only)*
  - **What to do:** In Chrome DevTools, enable "CPU 4× slowdown" and (if available) "GPU: low-end mobile" throttling. Reload. Confirm tier resolves to `low` or `mid`. Confirm `_tierProfile.dprCeiling` is `1.0` or `1.5`. Monitor the frame loop — 60fps target is maintained (frames may be skipped, not downgraded to 30fps). Confirm `_qualityScale` adapts without going below the tier floor.
  - **Acceptance criterion:** Tier ≤ `mid`, DPR floor respected, no 30fps fallback observed, no console errors.
  - **Complexity:** S

- [ ] **Task 27 — Manual smoke: Firefox masked GL strings**
  - **Files:** *(no code changes — verification only)*
  - **What to do:** Load the app in Firefox (enable resist-fingerprinting if available). Confirm `capabilities.masked === true` in `__gpuDebug.tierResult`. Confirm tier defaults to `mid` (or signal-derived value). Confirm no uncaught errors from the WebGL detection path.
  - **Acceptance criterion:** `source` is `'webgl'`, `capabilities.masked === true`, tier is `mid` or `low`, no errors.
  - **Complexity:** S

- [ ] **Task 28 — Manual smoke: WebGPU `adapter.info` population**
  - **Files:** *(no code changes — verification only)*
  - **What to do:** Load the app in Chrome (WebGPU enabled). Inspect `__gpuDebug.tierResult.capabilities.adapterInfo`. Confirm vendor, architecture, device, description fields are non-null strings. Confirm `source === 'webgpu'`.
  - **Acceptance criterion:** `adapterInfo` has all four fields populated; `source === 'webgpu'`; no errors.
  - **Complexity:** S

- [ ] **Task 29 — Manual smoke: background tab suspension**
  - **Files:** *(no code changes — verification only)*
  - **What to do:** Open the app, switch to a different tab for ~5 seconds, switch back. Check the console — rAF should have continued firing (cheap loop). Confirm `renderer.getRenderedTime()` did **not** advance while hidden. Confirm `u_time` does not jump on tab return (no accumulated time dump).
  - **Acceptance criterion:** `getRenderedTime()` is stable while hidden, resumes smoothly on return, no console errors, no visible `u_time` jump in the shader animation.
  - **Complexity:** S

- [ ] **Task 30 — Manual smoke: `?tier=low` URL override**
  - **Files:** *(no code changes — verification only)*
  - **What to do:** Load `http://localhost:PORT/?tier=low`. Inspect `__gpuDebug.tierResult`. Confirm `source === 'override'`, `tier === 'low'`, `profile.dprCeiling === 1.0`, `profile.antialias === false`. Confirm detection did not touch `navigator.gpu` (check: `capabilities.webgpu` is `false` or not evaluated).
  - **Acceptance criterion:** `source: 'override'`, `tier: 'low'`, profile matches low-tier table values.
  - **Complexity:** S

- [ ] **Task 31 — Manual smoke: `prefers-reduced-motion` OS override**
  - **Files:** *(no code changes — verification only)*
  - **What to do:** Enable "prefers-reduced-motion" in OS accessibility settings (or emulate in Chrome DevTools → Rendering). Load the app. Confirm `signals.prefersReducedMotion === true`. Confirm the original `tier` is still logged (e.g., `'high'`). Confirm `profile.dprCeiling === 1.0`, `profile.antialias === false`, `profile.powerPreference === 'low-power'`.
  - **Acceptance criterion:** `tier` reflects actual hardware; `profile` is overridden to low-tier values; debug log mentions the override; no errors.
  - **Complexity:** S

- [x] **Task 32 — Expose `window.__gpuDebug` in dev mode**
  - **Files:** `src/main.js`
  - **What to do:** After the `shaderManager` (and other managers) are initialized in `GradientApp.init()`, add:
    ```js
    if (import.meta.env.DEV) {
        window.__gpuDebug = { detector: gpuDetector, renderer, tierResult };
    }
    ```
    Ensure `tierResult` is in scope (from Task 19). This must be gated strictly by `import.meta.env.DEV` — no leak in production.
  - **Acceptance criterion:** In dev mode, `window.__gpuDebug` exists in the console and exposes all three fields. In a production build (`pnpm build`), `window.__gpuDebug` is `undefined` (dead code eliminated by Vite).
  - **Complexity:** S
