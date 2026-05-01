# Capability Specification: Adaptive Rendering Pipeline

## Requirements

### Requirement: Pre-Initialization GPU Tier Injection
The system MUST block the initialization of the rendering pipeline until the GPU tier has been asynchronously detected, injecting the resolved tier constraints (antialias, powerPreference, and DPR limits) during the renderer's construction.

#### Scenario: First Frame Boot Sequence
- **GIVEN** detection takes 250ms on a slow phone
- **WHEN** the page loads
- **THEN** the canvas displays a solid color (first OKLCH color) until detection resolves, after which the renderer initializes with the correct hardware constraints.

### Requirement: Static DPR Tier Caps
The system MUST enforce absolute maximum device pixel ratio (DPR) caps based on the resolved GPU tier, clamping any physical display DPR to the tier's ceiling.

#### Scenario: Ultra-Tier Device with High-DPR Display
- **GIVEN** a Chrome desktop with Apple M2
- **WHEN** detect() runs
- **THEN** tier resolves to `ultra` and DPR ceiling is `min(devicePixelRatio, 3.0)`.

#### Scenario: Reduced Motion Override
- **GIVEN** a user has enabled `prefers-reduced-motion` at the OS level
- **WHEN** the renderer initializes
- **THEN** the system MUST force `low` tier behavior regardless of the actual GPU detection (DPR floor=1.0, powerPreference='low-power', antialias=false).

### Requirement: Dynamic Quality Adaptation (EWMA)
The system MUST scale rendering quality dynamically based on an Exponentially Weighted Moving Average (EWMA) of frame times, but this scaling MUST operate strictly within a tier-specific boundary `[floor, 1.0]` relative to the tier's static DPR ceiling. 

*Constraints:*
- `ultra`: Floor = 0.90
- `high`: Floor = 0.85
- `mid`: Floor = 0.75
- `low`: Floor = 0.60

#### Scenario: Mid-Tier Mobile Performance Recovery
- **GIVEN** a mid-tier mobile sustaining 16ms EWMA
- **WHEN** updateQuality() runs
- **THEN** `_qualityScale` gradually rises toward 1.0 capped by the tier's DPR ceiling.

### Requirement: Strict 60FPS Targeting
The adaptive pipeline MUST prioritize a 60fps frame rate over visual resolution. The system SHALL NOT downgrade the target framerate to 30fps under any circumstances; it MUST instead degrade the DPR down to the tier's floor.

#### Scenario: Heavy Shader Load
- **GIVEN** a complex shader executing on a `low` tier device
- **WHEN** frame time consistently exceeds 16.6ms
- **THEN** the system reduces `_qualityScale` down to the tier floor (0.60 for `low`) to maintain 60fps, without ever falling back to a 30fps scheduling target.

### Requirement: Synchronous Time Accumulation (u_time)
The `u_time` uniform MUST NOT advance based on wall-clock time if a frame was dropped. Time accumulation MUST be strictly bound to successfully rendered frames.

#### Scenario: Async Render In-Flight Frame Drop
- **GIVEN** `renderAsync` is still in flight when the next `requestAnimationFrame` (rAF) fires
- **WHEN** `_tick()` runs
- **THEN** `u_time` does NOT advance and no duplicate render is queued.

### Requirement: Background Tab Suspension
The system MUST suspend rendering operations when the document is hidden to conserve power, while keeping the main loop alive cheaply for instant resumption.

#### Scenario: User Switches Tabs
- **GIVEN** `document.hidden` becomes true
- **WHEN** the rAF loop continues
- **THEN** `render()` is skipped entirely, `u_time` does NOT advance, but the cheap rAF loop continues firing so re-entry is instant when the tab becomes visible.

## Technical Constraints Encoding

- **DPR Ceilings:** 
  - `low`: 1.0
  - `mid`: 1.5
  - `high`: 2.0
  - `ultra`: 3.0
- **powerPreference:** 
  - `low`: 'low-power'
  - `mid`: 'default'
  - `high`: 'high-performance'
  - `ultra`: 'high-performance'
- **antialias:** 
  - `low`: false
  - `mid`: false
  - `high`: true
  - `ultra`: true
