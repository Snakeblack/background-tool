# Capability Specification: GPU Capability Detection

## Requirements

### Requirement: Detection Priority Order
The system MUST attempt GPU capability detection in a strict, prioritized sequence: WebGPU `adapter.info` first, followed by WebGL `WEBGL_debug_renderer_info`, and finally falling back to a heuristic based on generic navigator signals.

#### Scenario: Device with WebGPU Support
- **GIVEN** a device running Chrome 113+ with WebGPU enabled
- **WHEN** the GPU detection routine is invoked
- **THEN** it prioritizes extracting vendor and architecture strings from `navigator.gpu.requestAdapter().info` without initializing WebGL.

### Requirement: Deterministic Tier Classification
The detection logic MUST classify the user's hardware into exactly one of four tiers (`low`, `mid`, `high`, `ultra`). This classification MUST be deterministic for the same browser and device pair, avoiding any random or fluctuating fallbacks.

#### Scenario: Known High-End GPU
- **GIVEN** a desktop with an NVIDIA RTX 4080
- **WHEN** detection processes the unmasked WebGL renderer string
- **THEN** it deterministically maps the regex matching "NVIDIA" and "RTX 4080" to the `ultra` tier.

### Requirement: Handling Masked GPU Strings
The detector MUST gracefully handle masked or generic GPU strings returned by privacy-focused browsers, relying on secondary context rather than failing.

#### Scenario: Firefox with Resist Fingerprinting
- **GIVEN** Firefox where `WEBGL_debug_renderer_info` returns masked strings (e.g., "Mozilla")
- **WHEN** `detect()` runs
- **THEN** the tier defaults to `mid`, unless overridden by other generic hardware signals.

### Requirement: Fallback Signal Evaluation
If explicit GPU strings are unavailable or masked, the system MUST compute a heuristic based on generic hardware APIs (`hardwareConcurrency`, `deviceMemory`, `devicePixelRatio`, and user agent parsing).

#### Scenario: Masked GPU with High Concurrency
- **GIVEN** Safari returns a generic "Apple GPU" without model specifics
- **WHEN** the fallback logic evaluates
- **THEN** it uses `navigator.hardwareConcurrency >= 8 && deviceMemory >= 8` to classify as `mid`. Signal-only classification MUST cap at `mid` because masked GPU strings cannot be safely distinguished between hardware generations (e.g., M1/M2/M3) without explicit GPU evidence.

### Requirement: Non-Blocking Execution
The detector MUST be idempotent, caching its results to avoid redundant work, and return a frozen tier configuration object. It MUST NOT block the critical render path after its initial resolution.

#### Scenario: Repeated Detection Calls
- **GIVEN** the detection routine has already completed successfully
- **WHEN** another component requests the GPU tier
- **THEN** it instantly returns the frozen, cached tier object without re-evaluating APIs or re-requesting adapters.

### Requirement: Privacy and Telemetry Isolation
The system MUST strictly isolate detected hardware strings and capabilities. These strings MUST NOT be persisted to `localStorage`/`IndexedDB` and MUST NOT be sent to any external telemetry or analytics service.

#### Scenario: Production Deployment Logging
- **GIVEN** the application is running in a production environment
- **WHEN** GPU detection resolves the user's hardware string
- **THEN** the raw strings are logged at the `debug` level only, never transmitted over the network, and never saved across sessions.
