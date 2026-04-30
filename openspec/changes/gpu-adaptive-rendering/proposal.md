# Proposal: GPU-Aware Adaptive Rendering Pipeline

## Intent

Performance on low-end devices suffers due to hardcoded High-DPI/60FPS rendering based strictly on a flawed width heuristic. This change replaces width-based guessing with real GPU detection (WebGPU/WebGL info) to classify devices into 4 capability tiers, enabling true adaptive rendering without compromising the 60FPS target.

## Scope

### In Scope
- GPU tiering logic mapping to 4 tiers (`low`, `mid`, `high`, `ultra`).
- Adaptive quality scaling logic (DPR caps and EWMA).
- Pre-render async detection step.
- Solid color splash screen during async detection.
- Frame-based `u_time` accumulation to fix rendering drift.
- Modifying `Renderer.js` and `main.js`.
- Adding `GpuDetector.js`.

### Out of Scope
- Modifying shader source code or `ShaderManager` visual logic.
- Modifying `LiteRTManager`.
- UI changes.
- FPS target downgrade (always target 60fps; sacrifice DPR before FPS).
- 30fps fallback.
- Accessibility flags beyond `prefers-reduced-motion` if relevant.

## Capabilities

### New Capabilities
- `gpu-detection`: System capability to asynchronously detect and classify user GPU into performance tiers (`low` to `ultra`) before rendering starts.

### Modified Capabilities
- `renderer`: Now supports dynamic DPR scaling tied to GPU tiers, asynchronous boot waiting for detection, and frame-counted `u_time`.

## Approach

We will introduce a standalone `GpuDetector` module to asynchronously fetch WebGPU adapter info or WebGL renderer strings before initializing the renderer. The detection identifies one of 4 tiers, setting hard maximum DPR caps. The `Renderer`'s time loop will switch to accumulating time solely upon resolved frames to prevent `u_time` drift when render loops drop frames. A solid color (first OKLCH) splash screen will cover the initial async detection delay.

## Decision Log

- **Scope**: GPU tiering + adaptive quality only. Rationale: Keep renderer improvements decoupled from shaders and UI logic.
- **FPS strategy**: Maintain 60fps target, no 30fps fallback. Rationale: Frame-pacing and animation consistency take priority; sacrifice visual fidelity via DPR instead.
- **Detection timing**: Async `detect()` before first render with OKLCH solid splash screen. Rationale: `antialias` and `powerPreference` must be set at construction; a splash hides the async gap.
- **u_time drift fix**: Frame-based time accumulation. Rationale: Prevents animation drift when `renderAsync` is behind and drops frames.
- **Tier model**: 4 tiers (`low`, `mid`, `high`, `ultra`). Rationale: Provides adequate granularity between software rendering and flagship desktop GPUs.
- **Persistence**: Hybrid (openspec/ + engram). Rationale: Provide local artifact alongside centralized history.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/scripts/Renderer.js` | Modified | DPR bounding, `u_time` tracking fix, constructor arg tier setup |
| `src/main.js` | Modified | Boot order and solid splash screen during async detection |
| `src/scripts/GpuDetector.js` | New | Hardware tier detection via WebGPU/WebGL |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Browser masking GPU info | High | Rely on fallback signals (e.g., `hardwareConcurrency`, `deviceMemory`) |
| WebGPU schema variance | Medium | Use forgiving regex matching and default to `mid` when uncertain |
| Splash UX duration | Low | Detection via adapter string is fast enough to make splash negligible |

## Rollback Plan

Revert the modified `main.js` boot order to bypass `GpuDetector.js` and fall back to the old synchronous `Renderer` initialization using the width-based mobile heuristic.

## Dependencies

- None (Relies on native WebGPU/WebGL APIs).

## Success Criteria

- [ ] WebGPU/WebGL detection correctly identifies the device GPU tier.
- [ ] 60FPS target remains uncompromised despite heavy shaders on low-end devices (DPR drops instead).
- [ ] `u_time` perfectly syncs with rendered frames, eliminating visual drift under load.
- [ ] `GpuDetector` correctly resolves and determines tier before `renderer.init()` is invoked.