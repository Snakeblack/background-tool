# UI Controller Lifecycle Specs

## Capabilities
- `UIController` MUST guardar y mantener referencias de todos los event listeners que adjunte al DOM o Window.
- `UIController` MUST exponer un método `dispose()` que llame a `removeEventListener` para todos los listeners registrados, permitiendo un cleanup adecuado.
- `UIController` MUST exponer el método `setRuntimeContext({ gpuTier, getObservedFps })` para poder recibir valores dinámicos del contexto post-inicialización.

## Scenarios

### Scenario: Full Cleanup on Dispose
**Given** an initialized `UIController` with active listeners on `document` and `window`
**When** the `dispose()` method is called
**Then** there MUST NOT remain any attached listeners originating from the controller on `document` or `window`.

### Scenario: Setting Runtime Context Before Export
**Given** a running `UIController`
**When** `setRuntimeContext` is invoked with current `gpuTier` and `getObservedFps` functions
**And** the user subsequently opens the Export Modal
**Then** the Export Modal MUST receive and utilize the up-to-date values provided in the context.

### Scenario: Fetching Accurate FPS
**Given** the runtime context is active
**When** `getObservedFps()` is called by the UI Controller
**Then** the returned value MUST reflect the Exponentially Weighted Moving Average (EWMA) of the Renderer exactly at the moment of the call (no stale data).
