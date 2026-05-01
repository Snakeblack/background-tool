# Export Modal Specs

## Capabilities
- `ExportModal` MUST mostrar una sección "Optimizaciones" o "Performance Tips" ANTES del bloque de código exportable.
- Los tips MUST ser contextuales según el runtime actual del usuario: `gpuTier`, `observedFps`, `isMobile`, `prefersReducedMotion`, `currentResolution`.
- Cuando la media query `prefersReducedMotion` está activa, el código exportado MUST incluir explícitamente `@media (prefers-reduced-motion: reduce)` con un fallback estático (animaciones pausadas o desactivadas).
- Cada tip MUST contener la siguiente estructura de datos:
  - `severity`: enum (info | warning | critical)
  - `title`: Título corto del problema/tip.
  - `description`: Explicación del impacto.
  - `suggestion`: Acción sugerida o accionable para resolverlo.

## Scenarios

### Scenario: Low GPU Tier with Complex Shader
**Given** that the user's detected GPU Tier is low (e.g., Tier 1)
**And** the selected shader has high complexity metrics
**When** the user opens the Export Modal
**Then** the tips section MUST display a `critical` tip
**And** the suggestion MUST recommend setting a lower DPR cap (e.g., max 1.0) or choosing a simpler shader.

### Scenario: Low Observed FPS
**Given** the current running instance is experiencing framerate drops
**When** the user opens the Export Modal and `observedFps` is below 45
**Then** the tips section MUST display a `warning` tip
**And** the tip MUST suggest downscaling the resolution or simplifying geometry.

### Scenario: Mobile Device Detected
**Given** the user is running the app on a mobile device (`isMobile` is true)
**When** the user opens the Export Modal
**Then** the tips section MUST display an `info` tip
**And** the tip MUST advise using `pointer-events: none` on the background canvas and recommend appropriate mobile resolutions.

### Scenario: Prefers Reduced Motion Active
**Given** the user's OS or browser has "Prefers Reduced Motion" enabled
**When** the user generates the export code
**Then** the tips section MUST display an `info` tip about accessibility
**And** the generated export code MUST auto-inject `@media (prefers-reduced-motion: reduce)` with a static fallback implementation.

### Scenario: High-End Device with Stable FPS
**Given** the user has a high GPU tier (e.g., Tier 3 or ultra)
**And** the `observedFps` is stable at or near the display refresh rate (e.g., 60+)
**When** the user opens the Export Modal
**Then** the tips section MUST NOT display any `critical` or `warning` tips
**And** MAY display only `info` tips.
