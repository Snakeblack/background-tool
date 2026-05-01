# Design: deps-update-and-export-tips

## Technical Approach

Cambio incremental en seis fases atómicas: primero desbloqueamos linting con flat config, luego subimos minors seguros, después majors uno a uno con verificación, y al final dos refactors aislados (ExportModal con tips contextuales y UIController con `dispose()`). El runtime context se inyecta como snapshot por valor desde `main.js` post-init del Renderer.

## Architecture Decisions

### Decision: Orden de updates
**Choice**: ESLint flat config → minors → majors uno a uno → culori 4 → refactor ExportModal → cleanup UIController.
**Alternatives considered**: Bump masivo en un solo commit; refactor primero y deps después.
**Rationale**: Con flat config primero, recuperamos `pnpm lint` como gate de seguridad para todos los commits siguientes. Minors antes de majors reduce ruido en el diagnóstico cuando algo rompe. Majors uno a uno permite `git bisect` quirúrgico. Refactors al final consumen las APIs ya estables, evitando re-trabajo si una librería cambia.

### Decision: Channel de runtime context
**Choice**: `Renderer.getObservedFps(): number` lee snapshot sincrónico del EWMA. `UIController.setRuntimeContext({ gpuTier, getObservedFps })` se invoca en `main.js` tras `await renderer.init()`. ExportModal recibe valores frescos al `open(context)`, sin suscripción.
**Alternatives considered**: Event bus / observable; pasar el Renderer entero; polling.
**Rationale**: Snapshot pull-on-demand evita acoplamiento, ciclos de referencia, y memory leaks. ExportModal se abre puntualmente: no necesita stream.

### Decision: Modelo de Tips
**Choice**: `evaluateTips(context): Tip[]` función pura, separada del DOM.
```ts
type Tip = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;        // i18n key
  description: string;  // i18n key
  suggestion: string;   // i18n key con interpolación opcional
  evidence: { metric: string; value: number | string }[];
};
```
**Rationale**: Pure function = testeable conceptualmente sin DOM. Render se hace en otra capa que mapea Tip → HTML. i18n keys mantienen consistencia con el resto del proyecto.

### Decision: Auto-inject reduced-motion
**Choice**: Cuando `prefersReducedMotion === true`, los templates de export anexan:
```css
@media (prefers-reduced-motion: reduce) {
  .bg-mmrg { animation: none; background: <fallback-static-gradient>; }
}
```
El fallback se genera leyendo colores actuales del `ColorManager` y construyendo un `linear-gradient` estático.
**Alternatives considered**: Dejar al usuario escribir el fallback; omitir el bloque.
**Rationale**: Accesibilidad por defecto. El fallback estático con los mismos colores preserva la identidad visual sin animar.

### Decision: Refactor UIController
**Choice**: Arrow functions anónimas → métodos `_onXxx` bound en constructor. `this._listeners: Array<{target, event, handler, options}>`. `dispose()` itera y llama `removeEventListener` con la misma referencia.
**Alternatives considered**: AbortController con un solo `AbortSignal`.
**Rationale**: AbortController es más limpio pero requiere cambiar la firma de cada `addEventListener`. El array explícito es un refactor más quirúrgico, compatible con el código existente.

### Decision: Vite 7 + plugins
**Choice**: Intentar `vite-plugin-compression@0.5.1` con Vite 7. Si falla en el hook `apply` o `configResolved`, switch automático a `vite-plugin-compression2`.
**Condición de switch**: error de carga del plugin, exception en build, o warning de incompatibilidad declarada en el peer.
**Rationale**: Mantenemos el plugin actual si funciona (mínimo cambio). El fork `compression2` está mantenido y es drop-in.

### Decision: Bundle splitting con three 0.184
**Choice**: Verificar existencia de `three/build/three.webgpu.js` y `three/build/three.tsl.js` post-bump. Si los paths cambiaron, ajustar `manualChunks` de `vite.config.js` a la nueva estructura.
**Rationale**: Three reorganiza builds entre versiones. Validación empírica antes de tocar config evita romper el splitting del bundle.

## Data Flow

**Boot**:
```
main.js ─→ GpuDetector.detect() ─→ Renderer.init() ─→ UIController.setRuntimeContext({
                                                         gpuTier,
                                                         getObservedFps: () => renderer.getObservedFps()
                                                       })
```

**Open ExportModal**:
```
user click "Export"
   ↓
UIController.openExport()
   ↓ gather context: { gpuTier, observedFps: getObservedFps(), isMobile, prefersReducedMotion, currentResolution }
   ↓
ExportModal.open(context)
   ↓
evaluateTips(context) ──→ Tip[]
   ↓
render UI (tips section) + render code snippets (con auto-inject reduced-motion si aplica)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `eslint.config.js` | Create | Flat config con `@eslint/js`, TS parser/plugin |
| `.eslintrc.json` | Delete | Reemplazado por flat config |
| `package.json` | Modify | Bumps de deps; script `lint` ajustado |
| `vite.config.js` | Modify | Verificar `manualChunks` three; switch plugin compression si aplica |
| `src/main.js` | Modify | Llamar `uiController.setRuntimeContext(...)` post-init |
| `src/scripts/UIController.js` | Modify | `setRuntimeContext`, `_listeners`, métodos `_onXxx`, `dispose()` |
| `src/scripts/components/ExportModal.js` | Modify | Recibir context, sección Optimizaciones, auto-inject reduced-motion |
| `src/scripts/Renderer.js` | Modify | Exponer `getObservedFps(): number` (snapshot EWMA) |
| `src/scripts/export/evaluateTips.js` | Create | Función pura `evaluateTips(context): Tip[]` |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Manual | `pnpm lint`, `tsc`, dev server boot | Smoke test post-cada-bump |
| Manual | ExportModal con distintos contextos | Forzar `gpuTier`/`observedFps` mock para verificar tips |
| Manual | `dispose()` de UIController | DevTools → verificar 0 listeners residuales |
| Visual | Bundle size | `pnpm build` antes/después; comparar tamaños |

## Rollback Plan

Cada bullet del orden es un commit atómico independiente:
1. `chore(eslint): migrate to flat config`
2. `chore(deps): bump prettier, lightningcss, workbox-window, ts, ts-eslint`
3. `chore(deps): bump eslint to 10`
4. `chore(deps): bump culori to 4`
5. `chore(deps): bump three to 0.184` (+ ajuste manualChunks si aplica)
6. `chore(deps): bump lucide to 1.14`
7. `chore(deps): bump vite to 7` (+ switch a compression2 si aplica)
8. `refactor(export): contextual tips in ExportModal`
9. `refactor(ui): UIController dispose() and listener registry`

`git revert <sha>` aísla cada problema. Refactors finales no tocan deps.

## Open Questions

- [ ] DEFAULT (auto): Threshold de `observedFps` para warning = **45 fps** (alineado con scenario del spec).
- [ ] DEFAULT (auto): Threshold de critical = **gpuTier <= 1** AND complexity alta del shader actual.
- [ ] DEFAULT (auto): i18n keys con namespace `export.tips.*` (consistente con resto del proyecto).
- [ ] DEFAULT (auto): `getObservedFps()` retorna `Math.round(ewma)` para evitar ruido decimal en UI.
- [ ] DEFAULT (auto): Si `vite-plugin-compression@0.5.1` arroja cualquier error en build, switch inmediato a `vite-plugin-compression2` sin nuevo prompt.
- [ ] DEFAULT (auto): Reduced-motion fallback usa `linear-gradient` con los stops actuales del ColorManager (no radial, no conic).
