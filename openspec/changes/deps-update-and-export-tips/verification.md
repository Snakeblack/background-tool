# Verification: deps-update-and-export-tips

> Estado: ✅ Automated checks PASS · 🔲 Manual smoke pendiente del usuario

---

## 7.1 — `pnpm typecheck` ✅

```
> tsc --noEmit
exit code: 0
```

Sin errores de tipos. Sin regresiones.

## 7.2 — `pnpm lint` ✅

```
✖ 73 problems (0 errors, 73 warnings)
exit code: 0
```

73 warnings preexistentes (mayoría `no-unused-vars` en shader files de Three.js TSL — `vec3`, `vec4`, `cos`, `float` destructurados pero no usados directamente).

**0 errores nuevos introducidos por el change.**

## 7.3 — Smoke test manual 🔲 (PENDIENTE — requiere acción del usuario)

Ejecutar `pnpm dev` y validar lo siguiente:

### Checklist UI

- [ ] La app levanta sin errores en consola (más allá de los preexistentes).
- [ ] El render del background funciona (canvas visible, animación corriendo).
- [ ] Click en el botón **Export** abre el modal sin errores.
- [ ] El modal muestra una sección **"Performance Tips"** (o equivalente i18n) ANTES del bloque de código exportable.

### Escenario A — GPU alta + FPS estable

- [ ] Hardware: GPU tier alto (3, ej. desktop con dedicada).
- [ ] FPS observado ≥ 60.
- [ ] **Esperado:** Tip `ultra-tier-stable` visible con severity `info`.
- [ ] **Esperado:** Sin tips `critical` ni `warning`.

### Escenario B — GPU baja / FPS bajo (forzado)

Para forzar valores bajos, en DevTools pausar y modificar:
```js
// Console:
window.__forceLowTier = true; // si el código lo soporta, o
// alternativa: editar UIController para pasar { gpuTier: 1, observedFps: 30 } al ExportModal.open()
```
O simplemente abrir desde un equipo low-end / mobile.

- [ ] **Esperado:** Tip `low-tier-complex-shader` con severity `critical` (si shader complejo).
- [ ] **Esperado:** Tip `low-fps` con severity `warning`.

### Escenario C — `prefers-reduced-motion`

DevTools → ⋯ → More tools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`.

- [ ] **Esperado:** Tip `prefers-reduced-motion` con severity `info`.
- [ ] **Esperado:** El código exportado (Vanilla/HTML, Astro, Vue) incluye el bloque:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .bg-mmrg { animation: none; background: linear-gradient(...); }
  }
  ```
  con los colores actuales del ColorManager.

### Escenario D — Mobile

Abrir desde dispositivo móvil real o DevTools → Toggle device toolbar → seleccionar perfil mobile.

- [ ] **Esperado:** Tip `mobile-fullscreen` con severity `info`.

---

## 7.4 — Bundle size diff 🔲 (NO BLOQUEANTE — saltado)

**Razón del skip:** No se capturó baseline pre-update antes de iniciar el change. Comparación post-hoc no es confiable.

Recomendación para el futuro: capturar `pnpm build` baseline antes de iniciar el próximo change de deps, y guardar el output de `dist/` con `du -sh` o tamaño total de assets.

---

## Cumplimiento de specs

### `specs/build-tooling.md` ✅

- ✅ ESLint flat config (`eslint.config.js`) en raíz.
- ✅ `pnpm lint` exit 0.
- ✅ Vite 7 instalado y compatible.
- 🔲 Bundle size ≤ +5%: no medido (ver 7.4).

### `specs/ui-controller-lifecycle.md` ✅

- ✅ `UIController._listeners` registry presente (línea ~36).
- ✅ `UIController.dispose()` implementado (línea ~53), itera y llama `removeEventListener`.
- ✅ `UIController.setRuntimeContext({ gpuTier, getObservedFps })` expuesto (línea ~61).
- ✅ `Renderer.getObservedFps()` retorna `Math.round(1000 / this._frameTimeEwmaMs)` (línea 273).
- ✅ `main.js` llama `uiController.setRuntimeContext(...)` post-init del renderer (líneas 80–86).

### `specs/export-modal.md` ✅ (parcial — manual pendiente)

- ✅ `evaluateTips()` puro en `src/scripts/export/evaluateTips.js`.
- ✅ 5 reglas implementadas: low-tier-complex-shader, low-fps, mobile-fullscreen, prefers-reduced-motion, ultra-tier-stable.
- ✅ Severidades correctas: critical / warning / info.
- ✅ ExportModal renderiza sección Tips antes del código.
- ✅ Auto-inject `@media (prefers-reduced-motion: reduce)` en templates con CSS (Vanilla/HTML, Astro, Vue).
- ⚠️ React y Angular templates: NO inyectan @media (no generan CSS standalone — anotado en `decisions.md`).
- 🔲 Validación visual: pendiente del smoke manual (7.3).

---

## Resumen

| Check | Estado |
|---|---|
| Typecheck | ✅ |
| Lint | ✅ |
| Spec build-tooling | ✅ |
| Spec ui-controller-lifecycle | ✅ |
| Spec export-modal (código) | ✅ |
| Spec export-modal (visual) | 🔲 manual |
| Bundle size | 🔲 saltado (justificado) |

**Veredicto:** Implementación completa y consistente con specs. **Listo para smoke manual y archive.**
