# Exploration: deps-update-and-export-tips

**Change:** `deps-update-and-export-tips`  
**Date:** 2026-05-01  
**Phase:** Explore  
**Status:** Complete

---

## Context

Esta change tiene cinco vectores: (1) desbloquear `pnpm lint` migrando de `.eslintrc.json` a flat config, (2) actualizar dependencias en ventanas de compatibilidad seguras, (3) actualizar culori 3→4 con posibles breaking changes en la API de conversión de colores, (4) refactorizar `ExportModal.js` de un generador estático de código a una guía dinámica con tips contextuales basados en GPU tier / FPS / móvil / reduced-motion, y (5) limpieza quirúrgica de leaks en `UIController.js`.

---

## Current State

### `package.json`

| Dep | Versión actual | Target | Tipo |
|-----|---------------|--------|------|
| `eslint` | ^9.0.0 | ^10 | devDep |
| `prettier` | ^3.3.0 | ^3.8 | devDep |
| `lightningcss` | ^1.30.2 | ^1.32 | devDep |
| `vite` | ^6.0.0 | ^7 (tope 7) | devDep |
| `vite-plugin-pwa` | ^1.1.0 | latest compatible vite 7 | devDep |
| `vite-plugin-compression` | ^0.5.1 | latest compatible vite 7 | devDep |
| `workbox-window` | ^7.3.0 | ^7.4 | devDep |
| `typescript` | ^5.6.0 | ^5.x latest (tope <6) | devDep |
| `@typescript-eslint/*` | ^8.0.0 | latest ^8.x | devDep |
| `three` | ^0.171.0 | ^0.184 | dep |
| `lucide` | ^0.555.0 | ^1.14 | dep |
| `culori` | ^3.2.1 | ^4 | dep |

**Script `lint`**: `eslint src --ext .js,.ts` — la flag `--ext` fue removida en ESLint 9 flat-config era. Ya falla hoy con ESLint 9.39.

### `.eslintrc.json`

Config en formato legacy (JSON): usa `env`, `extends: ["eslint:recommended"]`, `parserOptions`, `rules`. Formato incompatible con ESLint 9 flat config (y completamente inválido en ESLint 10).

Reglas activas:
- `no-unused-vars`: warn (ignora `_` prefix)
- `semi`: error → single semicolons
- `quotes`: error → single quotes
- `indent`: error → 4 spaces
- `comma-dangle`: error → always-multiline
- `eol-last`: error → always

**No tiene integración `@typescript-eslint`** a pesar de tenerlo instalado.

### `vite.config.js`

- Usa `vite-plugin-compression` con API `compress({ algorithm })` — comprobar compatibilidad con vite 7; el plugin tiene historial de romper en major de Vite.
- Usa `VitePWA` — depende de `workbox-window` y `vite-plugin-pwa`.
- `manualChunks` referencia `three/build/three.webgpu.js` y `three/build/three.tsl.js` — three 0.184 puede haber cambiado rutas de build; necesita verificación.
- `cssMinify: 'lightningcss'` — depende de lightningcss API estable (1.30→1.32 es minor, bajo riesgo).
- `optimizeDeps.include: ['three', 'culori']` — el chunk de culori sigue separado, bien.

### `tsconfig.json`

- `strict: false`, `noImplicitAny: false` — no hay riesgo de rotura por TS 5.x latest.
- `moduleResolution: "bundler"` — estable entre TS 5.x.
- `allowJs: true`, `checkJs: false` — el proyecto es principalmente JS con tipos JSDoc.

### `src/scripts/ColorManager.js`

**Uso de culori — superficie de breaking changes:**

| Función culori usada | Línea | Riesgo culori 4 |
|---------------------|-------|-----------------|
| `culori.rgb({ mode: 'oklch', l, c, h })` | 52-58 | ⚠️ oklch en v4: `l` en [0,1], `c` en [0,∞), `h` en [0,360]. Sin cambio. Bajo riesgo. |
| `culori.formatHex({ mode: 'oklch', l, c, h })` | 67-73 | Sin breaking change conocido. Bajo riesgo. |
| `culori.converter('oklch')` | 110 | API estable, bajo riesgo. |
| `this.culori` (referencia al namespace completo) | 15 | Import `import * as culori` — sigue siendo válido en v4. |

**Estado de los valores internos**: `l` se almacena en [0,1], `c` en [0,0.4], `h` en [0,360]. Esto es correcto y no cambia en oklch con culori 4.

**Breaking changes confirmados de culori 3→4:**
- `hsl`/`hwb`: `h` cambia de [0,360] a [0,360] ✅ (sin cambio) pero `s`,`l`,`w`,`b` cambian de [0,100] a [0,1]. **ColorManager NO usa hsl/hwb directamente**, solo oklch y rgb. ✅ Seguro.
- `lab`/`lch`: L cambia de [0,100] a [0,1]. **ColorManager NO usa lab/lch.** ✅ Seguro.
- `oklab`/`oklch`: sin cambios de rango. ✅
- Alpha: antes `undefined` = 1, ahora explícito. ColorManager nunca pasa alpha. ✅

**Conclusión**: ColorManager.js no requiere cambios de código para culori 4. Solo bump de versión.

### `src/scripts/GpuDetector.js`

- Clase autónoma, sin dependencias externas a tres (usa DOM y `navigator`).
- Expone `GpuTierResult` con `tier: 'low'|'mid'|'high'|'ultra'`, `signals.prefersReducedMotion`, `signals.isMobileUA`, `signals.devicePixelRatio`.
- El `profile` contiene `dprCeiling`, `dprFloor`, `qualityScaleFloor`, `powerPreference`, `antialias`.
- **No tiene event emitter** — el resultado es stateful en `this.#result` después de `await detect()`.
- Para que `ExportModal` acceda al tier, hay que **inyectárselo** en el momento del `open(config)`.

### `src/scripts/Renderer.js`

- **No expone FPS directamente**. Lo que existe es:
  - `_frameTimeEwmaMs`: EWMA del frame time en ms (privado de facto, no marcado como `#`).
  - `lastFrameDeltaMs` (getter público): último delta en ms de una sola frame.
  - `_qualityScale`: escala de calidad actual (0.75–1.0 para mid tier).
- **Para calcular FPS observado**: `1000 / renderer._frameTimeEwmaMs` — accesible desde `main.js` como `this.renderer._frameTimeEwmaMs`.
- No hay callback ni EventTarget para suscribirse al FPS. **El FPS debe leerse por polling o pasarse como snapshot al momento de abrir el modal.**

### `src/scripts/UIController.js`

**Event listeners sin removeEventListener (leaks potenciales):**

| Línea | Tipo | Elemento | ¿Tiene remove? |
|-------|------|----------|----------------|
| 131 | `change` | `langSelect` (DOM) | ❌ No |
| 141 | `i18n:change` | `document` | ❌ No |
| 199-202 | `mouseenter/mouseleave/focus/blur` | `infoIcon` | ❌ No |
| 504 | `resize` | `window` | ❌ No |
| 534,538,542 | `panel-open/close/action` | `dock` | ❌ No |
| 548 | `close` | `bottomSheet` | ❌ No |
| 560 | `click` | `document` | ❌ No |
| 674 | `change` | `selector` | ❌ No |
| 795,811 | `mouseenter/mouseleave` | `infoIcon` (por shader) | ❌ No |
| 838 | `input` | `input` (por control) | ❌ No |
| 872,877 | `color-change/request-preview-update` | `document` | ❌ No |
| 884 | `input` | `speedInput` | ❌ No |
| 936 | `click` | `document.body` | ❌ No |
| 977 | `click` | `exportBtn` (mobile) | ❌ No |

**No existe ningún `removeEventListener` en todo el archivo.** No hay método `destroy()` o `dispose()`.

**RAF leaks**: No hay RAF directo en UIController — el RAF vive en `GradientApp._tick()` en `main.js`. No aplica.

**Lazy load**: UIController instancia todo en `init()` de forma eager. Los listeners de `document.body.click` (línea 936) y `document.click` (línea 560) son globales permanentes. Riesgo bajo en SPA de página única, pero sí es ruido si se instancia UIController más de una vez (ej. HMR en dev).

### `src/scripts/components/ExportModal.js`

**Arquitectura actual (2366 líneas, 88KB):**

- Es un `HTMLElement` con Shadow DOM.
- `open(config)` recibe un objeto `config` con: `{ colors, speed, parameters, tslSource, shaderName, uniforms }` (deducido de líneas 924, 1659, 1756, 1922, 2108).
- Templates generados dinámicamente en JS inline strings para: Vanilla HTML/JS, React, Vue 3, Angular, Astro.
- Pestaña "Optimizaciones" (líneas 1340-1372): genera snippets estáticos de lazy-load, mobile optimization, visibility API. Métricas **hardcodeadas** ("FPS target: 60fps", "GPU usage: ~5-10%", "Memory: ~10-20MB").
- **No recibe GPU tier, FPS observado, ni estado de reduced-motion.** Los "tips" de optimización son genéricos, no contextuales.
- **No tiene acceso a `GpuDetector` ni a `Renderer`.**

**Punto de inyección para tips contextuales:**
- `UIController.setupSavedBackgrounds()` línea 447 y `setupExportButton()` línea 977: ambos llaman `exportModal.open(config)`.
- El `config` puede extenderse con campos adicionales: `gpuTier`, `observedFps`, `isMobile`, `prefersReducedMotion`, `shaderResolution`.
- En `main.js`, `GradientApp` tiene acceso a `this.gpuDetector`, `this.renderer`, y el `tierResult`.
- **El problema**: `UIController` no recibe ni `gpuDetector` ni `renderer`. Necesita que se le inyecten o que `main.js` los pase al abrir el modal.

---

## Affected Areas

- `package.json` — bump de todas las deps mencionadas
- `.eslintrc.json` — eliminar; reemplazar con `eslint.config.js`
- `vite.config.js` — verificar paths de three chunks (`three/build/three.webgpu.js`) en three 0.184
- `src/scripts/ColorManager.js` — solo bump de culori; sin cambios de código
- `src/scripts/components/ExportModal.js` — agregar tips contextuales en pestaña Optimizaciones
- `src/scripts/UIController.js` — cleanup quirúrgico de listeners globales + inyección de runtime state al modal
- `src/main.js` — pasar `gpuDetector`/`renderer` a `UIController` para que pueda armar el snapshot runtime

---

## Approaches

### 1. ESLint Flat Config Migration

**Enfoque recomendado**: crear `eslint.config.js` en raíz con `@eslint/js` + `@typescript-eslint` flat config, eliminar `.eslintrc.json`, actualizar script `lint` de `eslint src --ext .js,.ts` a `eslint src/`.

```js
// eslint.config.js (draft)
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { window: 'readonly', document: 'readonly', navigator: 'readonly' },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 4],
      'comma-dangle': ['error', 'always-multiline'],
      'eol-last': ['error', 'always'],
    },
  },
];
```

- Pros: desbloquea `pnpm lint`; compatible ESLint 9 y 10.
- Contras: requiere `@eslint/js` como nueva devDep.
- Esfuerzo: Bajo.

### 2. Actualización de Dependencias

**Orden recomendado de actualización (menor a mayor riesgo):**
1. `prettier` 3.8 — zero risk, minor
2. `lightningcss` 1.32 — zero risk, minor
3. `workbox-window` 7.4 — zero risk, minor
4. `@typescript-eslint/*` 8.x latest — low risk, same major
5. `typescript` 5.x latest — low risk (5.6→5.8 no breaking para este codebase no-strict)
6. `culori` 4 — medium risk, pero ColorManager solo usa oklch+rgb (safe)
7. `three` 0.184 — medium risk; verificar paths de `three/build/three.webgpu.js` en vite.config.js
8. `lucide` 1.14 — medium risk; verificar que los named exports `{ Package, Rocket, Atom, ... }` siguen existiendo
9. `vite` 7 + `vite-plugin-pwa` + `vite-plugin-compression` — high risk, requiere test de build

**Riesgo three 0.184**: los paths de build de three pueden haber cambiado. `three/build/three.webgpu.js` puede pasar a `three/webgpu` en three moderno. Necesita verificación post-bump.

**Riesgo lucide 1.14**: de 0.555 a 1.14 es un salto major. Los named exports `Package, Rocket, Atom, Layers, Hexagon, Zap, Lightbulb, AlertTriangle, Clipboard, Check, AlertCircle, BarChart, X, createElement` podrían haber cambiado nombres o API. `createElement` en particular es un helper que puede haber sido deprecado.

**Riesgo vite-plugin-compression**: el plugin `vite-plugin-compression@0.5.1` es un fork antiguo que no se actualiza activamente. Para vite 7 puede necesitarse cambiar a `vite-plugin-compression2` o `@vitejs/plugin-legacy`-compatible. **Asumido por defecto: migrar a `vite-plugin-compression2`** si el original no soporta vite 7.

### 3. Tips Contextuales en ExportModal

**Enfoque recomendado**: extender el objeto `config` que UIController pasa a `exportModal.open(config)` con un campo `runtimeContext`:

```js
// En UIController, al abrir el modal:
const runtimeContext = {
  gpuTier: this._gpuTier,           // 'low'|'mid'|'high'|'ultra'
  observedFps: this._observedFps,   // number (calculado de renderer)
  isMobile: this.isMobile,          // boolean (ya existe en UIController)
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  shaderResolution: /* from shaderManager */,
};
exportModal.open({ ...config, runtimeContext });
```

Para que UIController tenga acceso a `gpuTier` y `observedFps`:
- `main.js` debe pasar `tierResult.tier` y un getter del renderer a UIController.
- **Opción A**: agregar `gpuDetector` y `renderer` al constructor de UIController. Invasivo.
- **Opción B**: UIController recibe solo `{ gpuTier, getObservedFps }` como quinto o sexto argumento. Menos invasivo.
- **Opción C**: UIController expone un método `setRuntimeContext({ gpuTier, renderer })` que `main.js` llama post-init. Más limpio.

**Asumido por defecto**: Opción C — `UIController.setRuntimeContext(ctx)` — sin cambiar la firma del constructor.

**Tips contextuales a generar (en pestaña Optimizaciones):**

| Condición | Tip |
|-----------|-----|
| `gpuTier === 'low'` | "GPU de gama baja detectada — considerá reducir DPR a 1.0 y desactivar antialias" |
| `gpuTier === 'low' \|\| gpuTier === 'mid'` + isMobile | "Mobile gama media/baja — recomendamos `pointer-events: none` y DPR máximo 1.5" |
| `observedFps < 40` | "FPS observado bajo (~X fps) — este shader puede ser pesado a fullscreen; considerá reducir `u_octaves` o el tamaño del canvas" |
| `prefersReducedMotion` | "El usuario tiene `prefers-reduced-motion` activo — tu export incluirá automáticamente un fallback estático" |
| `gpuTier === 'ultra' \|\| gpuTier === 'high'` | "GPU de gama alta detectada — podés habilitar antialias y DPR nativo sin impacto perceptible" |
| resolución shader alta + tier bajo | "El shader actual tiene alta resolución — en gama baja puede causar caídas de FPS en móvil" |

### 4. UIController Cleanup de Listeners

**Enfoque**: agregar método `dispose()` con `removeEventListener` para los listeners globales (`document`, `window`, `document.body`). Los listeners en elementos dinámicos (infoIcon por shader, inputs por control) se limpian automáticamente cuando el DOM se destruye (no hay riesgo real de leak en SPA con un solo lifecycle).

**Listeners críticos a remover en `dispose()`:**

```js
// Listeners en document/window/body — ESTOS sí pueden leaked en HMR:
document.removeEventListener('i18n:change', ...);
window.removeEventListener('resize', ...);
document.removeEventListener('click', ...);
document.body.removeEventListener('click', ...);
document.removeEventListener('color-change', ...);
document.removeEventListener('request-preview-update', ...);
```

**Problema**: todos están registrados con arrow functions anónimas → necesita refactor para guardar referencias. Cambio quirúrgico: guardar como `this._onI18nChange`, `this._onResize`, etc.

---

## Risks

1. **lucide 0.555→1.14 (major)**: `createElement` y los named exports de `ExportModal.js` y `main.js` pueden haberse renombrado o cambiado API. **Requiere verificación manual post-bump antes de commit.**

2. **three 0.171→0.184**: Los paths `three/build/three.webgpu.js` y `three/build/three.tsl.js` en `vite.config.js` manualChunks pueden no existir en 0.184. Si three consolidó en `three/webgpu`, el chunk splitting falla silenciosamente (bundle se infla). **Verificar estructura de `node_modules/three/build/` post-bump.**

3. **vite 6→7 + vite-plugin-compression**: `vite-plugin-compression@0.5.1` es un plugin antiguo; su API de vite hooks puede ser incompatible con vite 7 (cambio de `apply`, `configResolved`, etc.). **Asumido: migrar a `vite-plugin-compression2` si hay error de incompatibilidad.**

4. **ESLint 10 + `@eslint/js`**: En ESLint 10, `eslint:recommended` ya no es string de extends — es `js.configs.recommended` from `@eslint/js`. Hay que agregar `@eslint/js` como devDep explícita. Si se usa ESLint 10 con `@typescript-eslint/parser` 8.x, la compatibilidad es declarada como soportada (8.x soporta ESLint 9-10).

5. **ExportModal tips sin GpuDetector/Renderer**: UIController actualmente no recibe ni `gpuDetector` ni `renderer`. La arquitectura actual de `main.js` pasa solo 5 managers a UIController. Extender el contrato de UIController es invasivo si no se hace con cuidado — puede romper instanciaciones futuras o tests.

---

## Open Decisions

| # | Decisión | Default asumido | Necesita confirmación |
|---|----------|-----------------|----------------------|
| 1 | Cómo inyectar runtime context en UIController | `setRuntimeContext(ctx)` post-init en main.js | No (razonable) |
| 2 | vite-plugin-compression incompatible con vite 7 | Migrar a `vite-plugin-compression2` | Sí — si el usuario prefiere mantener el original |
| 3 | Si lucide 1.14 rompe `createElement` | Adaptar uso a nueva API de lucide | No (necesario) |
| 4 | ESLint 10 vs quedarse en ESLint 9 | Actualizar a 10 como indica el scope | No |
| 5 | Dónde aparecen los tips en el modal | Dentro de pestaña "Optimizaciones", antes de los snippets de código | No (razonable) |
| 6 | Fallback estático para `prefers-reduced-motion` en export | Incluir bloque CSS `@media (prefers-reduced-motion: reduce)` en el HTML generado | No (razonable) |

---

## Affected Files Map

```
package.json                              → bump todas las deps listadas
.eslintrc.json                            → ELIMINAR
eslint.config.js (nuevo)                  → flat config ESLint 9/10
vite.config.js                            → verificar three chunk paths
src/main.js                               → pasar runtimeContext a UIController vía setRuntimeContext()
src/scripts/UIController.js               → agregar setRuntimeContext(), dispose(), refs a listeners globales
src/scripts/components/ExportModal.js     → leer runtimeContext.* en pestaña Optimizaciones, tips contextuales
src/scripts/ColorManager.js               → NO requiere cambios (culori 4 oklch safe)
src/scripts/GpuDetector.js               → NO requiere cambios
src/scripts/Renderer.js                  → NO requiere cambios
```

---

## Recommendation

Ejecutar en este orden:

1. **Bump seguro primero** (prettier, lightningcss, workbox-window, @typescript-eslint) — zero risk.
2. **ESLint flat config** — crea `eslint.config.js`, elimina `.eslintrc.json`, agrega `@eslint/js`, actualiza script en `package.json`. Desbloquea `pnpm lint`.
3. **culori 4** — bump + verificación manual de `ColorManager.js` (riesgo bajo confirmado).
4. **three 0.184** — bump + verificar `vite.config.js` manualChunks paths.
5. **lucide 1.14** — bump + verificar named exports en `ExportModal.js` y `main.js`.
6. **vite 7 + plugins** — bump + ajustar `vite-plugin-compression` si rompe.
7. **ESLint 10** — si se fue a 9 en paso 2, actualizar a 10.
8. **UIController.setRuntimeContext()** — método de inyección limpio.
9. **ExportModal tips contextuales** — usar `runtimeContext` inyectado.
10. **UIController.dispose()** — cleanup quirúrgico de listeners globales.

---

## Ready for Proposal

Sí. La exploración está completa. Los riesgos principales son lucide major bump y vite 7 plugin compatibility, ambos acotados y con estrategia de mitigación definida. La arquitectura de tips contextuales está clara: `setRuntimeContext()` → snapshot al abrir modal → render condicional de tips en pestaña Optimizaciones.
