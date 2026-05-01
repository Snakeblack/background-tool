# Build Tooling Specs

## Capabilities
- El proceso de linteo MUST usar la nueva configuración plana (Flat Config) vía `eslint.config.js`.
- El comando `pnpm lint` MUST ejecutarse sin arrojar errores de configuración del framework de linting.
- La configuración de Vite (`vite.config.ts`/`.js`) MUST ser completamente compatible con Vite 7.
- El bundle size resultante de la build en producción MUST NO exceder un crecimiento del 5% en comparación con el baseline de tamaño pre-actualización de dependencias.

## Scenarios

### Scenario: Successful Linting Command
**Given** the codebase with ESLint flat config set up
**When** the developer runs `pnpm lint`
**Then** the exit code MUST be `0` (allowing normal code-level warnings/errors to be reported)
**And** the execution MUST NOT fail due to configuration resolution errors.

### Scenario: Successful Type Checking
**Given** TypeScript configured in the project
**When** the developer runs `pnpm typecheck`
**Then** the exit code MUST be `0`, confirming no type regressions.

### Scenario: Successful Production Build
**Given** the updated Vite 7 configuration
**When** the developer runs `pnpm build`
**Then** it MUST produce the `dist` directory output
**And** all `manualChunks` configurations MUST be resolved correctly without circular dependency errors or unresolved chunks.
