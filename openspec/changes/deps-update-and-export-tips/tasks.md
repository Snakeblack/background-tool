# Tasks: deps-update-and-export-tips

> Estado: 🔄 En progreso (Phase 1 completa)  
> Refs: proposal.md · design.md · specs/build-tooling.md · specs/export-modal.md · specs/ui-controller-lifecycle.md

---

## Phase 1 — ESLint Flat Config

- [x] **1.1** Crear `eslint.config.js` con `@eslint/js` recommended, `typescript-eslint` v8 (parser + plugin), ignores para `dist/`, `node_modules/`, `public/wasm/`.
- [x] **1.2** Eliminar `.eslintrc.json` del repositorio.
- [x] **1.3** Ajustar el script `lint` en `package.json` si apunta explícitamente a `.eslintrc.json` (asegurar que use auto-discovery de flat config).
- [x] **1.4** Validar `pnpm lint` con exit code 0 (sin errores de configuración). _Depende de 1.1, 1.2, 1.3._

---

## Phase 2 — Minor Bumps (bajo riesgo)

- [x] **2.1** Bump `prettier` de 3.3 → 3.x latest (≥ 3.8). Validar `pnpm lint` + `pnpm typecheck`. _Depende de 1.4._
- [x] **2.2** Bump `workbox-window` de 7.3 → 7.x latest (≥ 7.4). Validar `pnpm typecheck`. _Depende de 1.4._
- [x] **2.3** Bump `typescript` de 5.6 → 5.x latest (verificar que sea < 6.1). Validar `pnpm typecheck`. _Depende de 1.4._
- [x] **2.4** Bump `@typescript-eslint/eslint-plugin` y `@typescript-eslint/parser` → 8.x latest. Validar `pnpm lint`. _Depende de 1.4._
- [x] **2.5** Bump `lightningcss` de 1.30 → 1.x latest (≥ 1.32). Validar `pnpm build` (sin crashes de CSS). _Depende de 1.4._

---

## Phase 3 — Major Bumps (uno a uno con verificación)

- [x] **3.1** Bump `eslint` de 9 → 10. Validar `pnpm lint` con exit code 0. Verificar que el flat config de 1.1 sea compatible. _Depende de 1.4, 2.4._
- [x] **3.2** Bump `three` de 0.171 → 0.184. Verificar existencia de `node_modules/three/build/three.webgpu.js` y `three.tsl.js`. Si los paths cambiaron, ajustar `manualChunks` en `vite.config.js`. Smoke test: `pnpm dev` levanta sin error de imports. _Depende de 1.4._
- [x] **3.3** Bump `lucide` de 0.555 → 1.x latest (≥ 1.14). Verificar named imports y uso de `createElement`/`createIcons` en `src/scripts/components/ExportModal.js` y `src/main.js`. Corregir imports rotos si los hay. Smoke test: íconos visibles en UI. _Depende de 1.4._
- [x] **3.4** Bump `vite` de 6 → 7. Verificar compatibilidad de todos los plugins declarados en `vite.config.js`. Validar `pnpm build` sin errores. _Depende de 3.2._
- [x] **3.5** Verificar si `vite-plugin-compression@0.5.1` arroja error con Vite 7 (hook `apply` o `configResolved`). Si falla: reemplazar por `vite-plugin-compression2` (drop-in). Validar `pnpm build`. _Depende de 3.4._
- [x] **3.6** Bump `vite-plugin-pwa` → latest compatible con Vite 7. Validar `pnpm build` + service worker generado correctamente. _Depende de 3.4._
- [x] **3.7** Bump `culori` de 3 → 4. Revisar usos en `ColorManager.js` (per exploración: probablemente sin cambios requeridos, pero verificar). Validar `pnpm typecheck` + smoke test de colores en UI. _Depende de 1.4._

---

## Phase 4 — Refactor ExportModal (contextual tips)

- [x] **4.1** Crear `src/scripts/export/evaluateTips.js`. Exportar función pura `evaluateTips(context): Tip[]` (sin dependencias DOM). El módulo debe estar completamente auto-contenido. _Sin dependencias en otras fases._
- [x] **4.2** Definir dentro de `evaluateTips.js` la forma `Tip` (fields: `id`, `severity`, `title`, `description`, `suggestion`, `evidence[]`) y las constantes de thresholds: `FPS_WARNING_THRESHOLD = 45`, `LOW_TIER_MAX = 1`. _Depende de 4.1._
- [x] **4.3** Implementar las 5 reglas en `evaluateTips`:
  - `low-tier-complex-shader`: `gpuTier <= 1` → severity `critical`.
  - `low-fps`: `observedFps < 45` → severity `warning`.
  - `mobile-fullscreen`: `isMobile === true` → severity `info`.
  - `prefers-reduced-motion`: `prefersReducedMotion === true` → severity `info`.
  - `ultra-tier-stable`: `gpuTier >= 3 && observedFps >= 60` → severity `info` (positivo).
  _Depende de 4.2._
- [x] **4.4** Agregar claves i18n `export.tips.<id>.title`, `export.tips.<id>.description`, `export.tips.<id>.suggestion` para los 5 tips en ES y EN (en los archivos de i18n del proyecto, o en un objeto inline si no hay sistema i18n). _Depende de 4.3._
- [x] **4.5** En `ExportModal.js`: modificar el método `open()` para aceptar un parámetro `runtimeContext` con shape `{ gpuTier, observedFps, isMobile, prefersReducedMotion, currentResolution }`. _Sin dependencias adicionales; prepara para 4.6._
- [x] **4.6** En `ExportModal.js`: llamar `evaluateTips(runtimeContext)` dentro de `open()` y renderizar la sección "Performance Tips" ANTES del bloque de código exportable. Cada tip renderiza `severity`, `title`, `description` y `suggestion`. _Depende de 4.3, 4.4, 4.5._
- [x] **4.7** En los templates de export (React, Vue, Angular, Vanilla, CSS): cuando `runtimeContext.prefersReducedMotion === true`, auto-inyectar bloque `@media (prefers-reduced-motion: reduce) { .bg-mmrg { animation: none; background: linear-gradient(<stops actuales del ColorManager>); } }` al final de cada snippet de código exportado. _Depende de 4.5._

---

## Phase 5 — Refactor UIController (listener registry + dispose)

- [x] **5.1** En `UIController.js`: convertir todas las arrow functions anónimas pasadas a `addEventListener` en métodos con nombre `_onXxx` (ej. `_onKeyDown`, `_onResize`, `_onVisibilityChange`). Hacer bind en el constructor (`this._onXxx = this._onXxx.bind(this)`). _Sin dependencias de otras fases._
- [x] **5.2** En `UIController.js`: crear `this._listeners = []` en el constructor. Crear helper privado `_addListener(target, event, handler, options)` que llama `target.addEventListener(event, handler, options)` y hace `this._listeners.push({ target, event, handler, options })`. Reemplazar todos los `addEventListener` existentes por llamadas a `_addListener`. _Depende de 5.1._
- [x] **5.3** En `UIController.js`: implementar `dispose()` que itera `this._listeners` y llama `target.removeEventListener(event, handler, options)` para cada entrada, luego vacía el array. _Depende de 5.2._
- [x] **5.4** En `UIController.js`: implementar `setRuntimeContext({ gpuTier, getObservedFps })`. Almacenar como `this._gpuTier` y `this._getObservedFps`. _Depende de 5.1 (puede ser paralelo a 5.2)._
- [x] **5.5** En `UIController.js`: en el handler del botón "Export" (`_onExportClick` o equivalente), construir el objeto context `{ gpuTier: this._gpuTier, observedFps: this._getObservedFps(), isMobile: ..., prefersReducedMotion: ..., currentResolution: ... }` y pasarlo a `this._exportModal.open(context)`. _Depende de 5.4, 4.5._
- [x] **5.6** En `src/main.js`: tras `await renderer.init()`, llamar `uiController.setRuntimeContext({ gpuTier, getObservedFps: () => renderer.getObservedFps() })`. _Depende de 5.4, 6.1._

---

## Phase 6 — Renderer FPS Exposure

- [x] **6.1** En `src/scripts/Renderer.js`: agregar método público `getObservedFps()` que retorna `Math.round(1000 / this._frameTimeEwmaMs)`. Asegurar que `this._frameTimeEwmaMs` exista y se actualice en el loop de render. _Sin dependencias de otras fases._

---

## Phase 7 — Verification

- [ ] **7.1** Ejecutar `pnpm typecheck`. El exit code MUST ser 0 (sin regresiones de tipos). _Depende de todas las fases previas._
- [ ] **7.2** Ejecutar `pnpm lint`. El exit code MUST ser 0 (solo issues preexistentes al cambio son aceptables; ningún error nuevo introducido). _Depende de todas las fases previas._
- [ ] **7.3** Smoke test manual: ejecutar `pnpm dev`. Abrir el Export Modal en 2 escenarios:
  - Escenario A: shader simple, GPU tier alto, FPS estable (≥ 60) → verificar tip `ultra-tier-stable` visible.
  - Escenario B: forzar mock de `gpuTier = 1` y `observedFps = 30` → verificar tips `low-tier-complex-shader` (critical) y `low-fps` (warning) visibles.
  Anotar resultados en `verification.md` en el directorio del change. _Depende de 7.1, 7.2._
- [ ] **7.4** (Recomendado, no bloqueante) Comparar bundle size: ejecutar `pnpm build` pre y post cambios; registrar diferencia en `verification.md`. Debe estar dentro del límite del 5% especificado en `specs/build-tooling.md`. _Depende de 7.1._
