# Proposal: deps-update-and-export-tips

## Intent / Motivation
Actualizar la deuda técnica acumulada en tooling (ESLint 9/10, Vite 7) y librerías clave (Three, Lucide, Culori), desbloqueando el linting en el proyecto. Además, aprovechar el estado interno de la aplicación (GPU tier, FPS, preferencias del usuario) para inyectar tips de optimización dinámicos y contextuales al momento de exportar código, brindando mayor valor educativo al usuario. Finalmente, sanear `UIController` para evitar memory leaks por event listeners globales huérfanos.

## Scope
- **INCLUIDO:**
  - Migración completa de ESLint a flat config (`eslint.config.js`).
  - Actualización segura de dependencias (`prettier`, `lightningcss`, `three`, `lucide`, `eslint` 10, `vite` 7, `workbox-window`, `typescript`, `@typescript-eslint`).
  - Bump a `culori` 4.
  - Refactor de `ExportModal` para incluir una sección dinámica de "Optimizaciones" con tips contextuales.
  - Inyección de estado runtime (`gpuTier`, `observedFps`, etc.) vía un nuevo método en `UIController`.
  - Creación de método `dispose()` en `UIController` para limpiar listeners globales.
- **EXCLUIDO:**
  - Refactorización masiva de componentes fuera de `ExportModal` y `UIController`.
  - Cambios en la lógica matemática o shaders core.
  - Migración de stack (ej. a React/Vue en el frontend de la herramienta).

## Approach
Se ejecutará en etapas incrementales para minimizar el radio de explosión:
1. **ESLint Flat Config:** Eliminar `.eslintrc.json`, crear `eslint.config.js` y ajustar el script `lint`.
2. **Dependencias menores y seguras:** `prettier`, `lightningcss`, `workbox-window`, TS y TS-ESLint.
3. **Majors críticos (uno a uno con verificación):** 
   - `culori` 4 (ya validado como seguro).
   - `three` 0.184 (verificando paths en `manualChunks` de Vite).
   - `lucide` 1.14 (verificando exports y `createElement`).
   - `vite` 7 y plugins (migrando a `vite-plugin-compression2` si es necesario).
4. **Refactor UIController (Context Inyection):** Implementar `setRuntimeContext(ctx)` para inyectar referencias del GPU y FPS, pasándolas en `exportModal.open()`.
5. **Refactor ExportModal:** Leer el contexto inyectado y renderizar condicionalmente los tips en la pestaña "Optimizaciones".
6. **Cleanup UIController:** Refactor quirúrgico para guardar referencias de listeners globales (`document`, `window`) y destruirlos en `dispose()`.

## Risks & Mitigations
1. **Rotura de Lucide API (v1.14):** 
   - *Mitigación:* Revisar manualmente los named exports y `createElement` post-bump antes de hacer commit.
2. **Caminos de imports internos en Three 0.184:** 
   - *Mitigación:* Validar la estructura de `node_modules/three/build/` y ajustar `vite.config.js` si los paths de webgpu/tsl cambiaron.
3. **Incompatibilidad de Vite 7 con vite-plugin-compression v0.5.1:** 
   - *Mitigación:* Reemplazar automáticamente por `vite-plugin-compression2` si la v0.5.1 revienta en el hook de apply.
4. **Fallas en linting por ESLint 10 + TypeScript:** 
   - *Mitigación:* Instalar explícitamente `@eslint/js` y asegurar que el parser/plugin de TS (v8.x) se acople bien al flat config.
5. **Memory leaks por inyección en UIController:** 
   - *Mitigación:* Pasar snapshots por valor o getters simples en `setRuntimeContext` en lugar de referencias pesadas y cíclicas.

## Rollback plan
- **Estrategia atómica:** Cada actualización mayor de dependencias y cada refactor se aplicará de manera atómica, aislando los cambios.
- **Vuelta atrás rápida:** Si una dependencia mayor (ej. Vite 7) no estabiliza con los plugins, se hace `git revert` o se vuelve a la versión del package.json original. 
- **Refactors aislados:** El refactor de `ExportModal` y `UIController` es aislado. Si los tips contextuales fallan, simplemente el modal renderizará los strings estáticos de siempre.

## Affected modules
- `package.json`
- `.eslintrc.json` (a borrar)
- `eslint.config.js` (nuevo)
- `vite.config.js`
- `src/main.js`
- `src/scripts/UIController.js`
- `src/scripts/components/ExportModal.js`

## Success criteria
- `pnpm lint` y la compilación de TS (`tsc`) pasan sin errores.
- Smoke test manual verifica que la app compila y no se infló el tamaño del bundle de JS.
- El Modal de exportación muestra tips reales ("FPS target: <tu fps real>", etc.) basados en el dispositivo del usuario.
- `UIController` registra sus listeners globales y los limpia al invocar `dispose()`.