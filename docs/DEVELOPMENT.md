# 👨‍💻 Guía de Desarrollo

## Configuración Inicial del Entorno

### 1. Instalar Node.js
```bash
# Verificar instalación
node --version  # v16+ requerido
npm --version   # Incluido con Node.js
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Iniciar Desarrollo
```bash
npm run dev
```

Se abrirá automáticamente `http://localhost:3000`.

## Estructura de Desarrollo

### Hot Module Replacement (HMR)
Vite proporciona recarga automática:
- Cambios en `.ts` → Recarga JS
- Cambios en `.css` → Recarga CSS
- Cambios en `.html` → Recarga completa

### TypeScript
Todos los scripts usan TypeScript para tipado estático.

```bash
npm run lint      # Verificar errores
npm run format    # Autoformatear código
```

## Flujo de Desarrollo

### 1. Crear Nuevo Feature

```bash
# Crear archivo en src/scripts/
# src/scripts/myFeature.ts

export function myFunction() {
    console.log('Nueva función');
}
```

### 2. Importar en main.ts

```typescript
import { myFunction } from './myFeature';

myFunction(); // Usar función
```

### 3. Probar en el Navegador

```bash
# Ya está en http://localhost:3000
# Con HMR activo se recarga automáticamente
```

### 4. Build para Producción

```bash
npm run build     # Genera /dist
npm run preview   # Preview de la build
```

## Agregar Dependencias

### Instalación
```bash
# Agregar librería
npm install --save mi-libreria

# Agregar como dev dependency
npm install --save-dev mi-libreria
```

### Uso
```typescript
import MiLibreria from 'mi-libreria';

const instancia = new MiLibreria();
```

## Estructura de Carpetas - Mejores Prácticas

### Organización de Scripts

```typescript
// ✅ BIEN: Un archivo por responsabilidad
src/scripts/
├── colors.ts      // Lógica de colores
├── shaders.ts     // Gestión de shaders
├── ui.ts          // Eventos de UI
└── utils.ts       // Funciones auxiliares

// ❌ MAL: Todo mezclado en un archivo
src/scripts/
└── main.ts        // 5000 líneas de código
```

### Naming Conventions

```typescript
// Archivos
camelCase.ts           // General
MyClass.ts             // Clases
myFunction.helper.ts   // Helpers

// Funciones
function doSomething() {}      // ✅ Verbo
function getData() {}          // ✅ Acción clara
function color() {}            // ❌ Sustantivo

// Variables
const userColor = '#FF0000';   // ✅ Descriptivo
const c = '#FF0000';           // ❌ Abreviado

// Constantes
const MAX_ZOOM = 10;           // ✅ UPPER_SNAKE_CASE
const MAX_ZOOM_VALUE = 10;     // También aceptable
```

## Code Quality

### ESLint
```bash
# Verificar errores
npm run lint

# Arreglar automáticamente
npm run lint -- --fix
```

### Prettier
```bash
# Formatear código
npm run format

# Verificar formato
npm run format:check
```

### TypeScript
```bash
# El compilador TypeScript verifica tipos
# Los errores aparecen en la terminal y editor
```

## Debugging

### DevTools del Navegador

```javascript
// En consola del navegador
// DevTools > Console

// Ver estado
console.log('Debug:', variable);

// Punto de quiebre
debugger; // Pausa ejecución
```

### Sourcemaps
Los sourcemaps están habilitados en desarrollo:
- Los errores muestran código TypeScript original
- Debugging fácil sin buscar en código compilado

### Logging en Desarrollo

```typescript
// ✅ BIEN: Logs informativos
console.log('Color actualizado:', color);
console.warn('Shader no disponible');
console.error('Error crítico:', error);

// ❌ MAL: Logs innecesarios en producción
console.log('Esta línea se ejecutó');  // Spam
```

## Git Workflow

### Commits

```bash
# Verificar cambios
git status

# Agregar cambios
git add src/

# Commit descriptivo
git commit -m "feat: agregar nuevo shader"

# Empujar
git push origin main
```

### Ramas

```bash
# Crear rama para feature
git checkout -b feature/nuevo-shader

# Trabajar en la rama
# ...commits...

# Mergear a main
git checkout main
git merge feature/nuevo-shader
```

## Modificar Shaders

### Archivos de Shaders

```glsl
// src/shaders/liquid.glsl
#version 300 es
precision highp float;

// Uniforms (reciben del código JS)
uniform vec3 uColor;
uniform float uTime;

// Main
void main() {
    // Lógica del shader
}
```

### Cargar Shader Dinámicamente

```typescript
// src/scripts/shaders.ts
async function loadShader(path: string): Promise<string> {
    const response = await fetch(path);
    return response.text();
}

// Uso
const vertexShader = await loadShader('src/shaders/vertex.glsl');
```

## Agregar Panel Nuevo

### 1. HTML

```html
<!-- src/index.html -->
<div id="my-panel" class="side-panel">
    <div class="panel-header">
        <h2 class="panel-title">Mi Panel</h2>
    </div>
    <div class="panel-content">
        <!-- Contenido -->
    </div>
</div>
```

### 2. CSS

```css
/* src/styles/panels.css */
#my-panel {
    /* Estilos específicos */
}
```

### 3. JavaScript

```typescript
// src/scripts/ui.ts
const myPanel = document.getElementById('my-panel');
myPanel?.addEventListener('click', (e) => {
    // Manejar eventos
});
```

## Performance Checklist

- [ ] Usar `const` en lugar de `let` cuando sea posible
- [ ] Evitar operaciones en cada frame
- [ ] Usar RAF para animaciones
- [ ] Minimizar reflows/repaints
- [ ] Lazy load de recursos
- [ ] Caché de selectores DOM

```typescript
// ✅ BIEN: Caché DOM selector
const button = document.getElementById('btn');
button?.addEventListener('click', () => {});

// ❌ MAL: Selector en cada iteración
for (let i = 0; i < 1000; i++) {
    document.getElementById('btn').addEventListener('click', () => {});
}
```

## Documentación de Código

### JSDoc/TSDoc

```typescript
/**
 * Convierte color OKLCH a RGB
 * @param l - Lightness (0-1)
 * @param c - Chroma (0-0.4)
 * @param h - Hue (0-360)
 * @returns {string} Color RGB en formato #RRGGBB
 * @throws {Error} Si los parámetros están fuera de rango
 */
export function oklchToRgb(l: number, c: number, h: number): string {
    // Implementación
}
```

## Testing Local

```bash
# Verificar que todo funciona
npm run build

# Preview de la build
npm run preview

# Abrir http://localhost:4173 en navegador
```

## Troubleshooting

### Problema: Module not found
```bash
# Solución: Verificar rutas de importación
# node_modules/@alias/
# tsconfig.json paths

npm install  # Reinstalar si es necesario
```

### Problema: HMR no funciona
```bash
# Solución: Limpiar caché
rm -rf node_modules/.vite
npm run dev  # Reiniciar
```

### Problema: TypeScript errors
```bash
# Solución: Compilar para verificar
npx tsc --noEmit

# Si hay errores, arreglarios en tsconfig.json
```

## Recursos Útiles

- [Vite Docs](https://vitejs.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Three.js Docs](https://threejs.org/docs/)
- [Culori.js](https://culori.js.org/)
- [ESLint Rules](https://eslint.org/docs/rules/)

---

¡Feliz desarrollo! 🚀
