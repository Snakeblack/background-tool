# 🏗️ Arquitectura del Proyecto

## Visión General

Este proyecto implementa un generador de gradientes WebGL con arquitectura modular, escalable y enfocada en la calidad de código.

```
┌─────────────────────────────────────────────────┐
│           UI Layer (HTML + CSS)                 │
│  ┌────────────┐         ┌──────────────────┐   │
│  │Left Panel  │         │ Right Panel      │   │
│  │Config      │         │ Color Controls   │   │
│  └────────────┘         └──────────────────┘   │
└─────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────┐
│      Application Logic Layer (TypeScript)       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Shaders │ │  Colors  │ │  UI Events   │   │
│  └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────┐
│      Rendering Engine (Three.js + WebGL)       │
│  ┌──────────────────────────────────────────┐  │
│  │  WebGL Canvas / Shader Compilation       │  │
│  │  Material & Uniform Management           │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Capas de Arquitectura

### 1. **UI Layer** (`src/styles/`)
- **main.css**: Estilos globales y reset
- **panels.css**: Estilos de paneles flotantes
- **controls.css**: Componentes de formularios
- **responsive.css**: Media queries y breakpoints

**Patrones:**
- CSS Variables para temas
- BEM-like naming
- Flexbox + Grid layout

### 2. **Application Logic** (`src/scripts/`)

#### `main.ts` - Punto de entrada
```typescript
// Inicializa la aplicación
- Setup de renderer
- Event listeners
- Loop de animación
```

#### `renderer.ts` - Three.js Integration
```typescript
// Gestiona:
- Creación de canvas
- Inicialización de scene
- Compilación de shaders
- Loop de renderizado
```

#### `shaders.ts` - Shader Management
```typescript
// Coordina:
- Carga de shaders GLSL
- Compilación de programas
- Switching de shaders
- Uniformes compartidas
```

#### `colors.ts` - Color Space Handling
```typescript
// Maneja:
- Conversión OKLCH ↔ RGB
- Actualización de uniformes
- Sincronización UI-Canvas
```

#### `ui.ts` - UI Interactions
```typescript
// Controla:
- Event listeners de paneles
- Minimize/Close/Toggle
- Collapsible sections
```

#### `utils.ts` - Utilidades
```typescript
// Funciones auxiliares:
- Validación de entrada
- Cálculos matemáticos
- Helpers generales
```

### 3. **Rendering Engine** (Three.js + WebGL)
- Renderización en tiempo real
- Compilación de shaders
- Gestión de materiales
- Uniforms y texturas

## Flujo de Datos

```
User Input (Slider)
       ↓
UI Event Listener (ui.ts)
       ↓
Color Conversion (colors.ts)
       ↓
Update Shader Uniform
       ↓
Renderer (renderer.ts)
       ↓
WebGL Canvas Output
       ↓
Visual Result
```

## Directorios Detallados

### `/src` - Código Fuente

```
src/
├── index.html          # Template HTML
├── main.ts             # Entrypoint
├── scripts/            # Lógica TypeScript
│   ├── main.ts
│   ├── renderer.ts
│   ├── shaders.ts
│   ├── colors.ts
│   ├── ui.ts
│   └── utils.ts
├── shaders/            # GLSL Shaders
│   ├── vertex.glsl
│   ├── liquid.glsl
│   ├── stripes.glsl
│   └── common.glsl
├── styles/             # CSS Modular
│   ├── main.css
│   ├── panels.css
│   ├── controls.css
│   └── responsive.css
└── assets/             # Recursos estáticos
    └── icons/
```

### `/public` - Assets Estáticos
- Favicon
- Archivos públicos no procesados

### `/dist` - Build Output
- JavaScript compilado (ES2020)
- CSS procesado
- HTML minificado
- Sourcemaps (desarrollo)

### `/docs` - Documentación
- ARCHITECTURE.md (este archivo)
- DEVELOPMENT.md
- SHADERS.md
- COLOR_SPACE.md

### `/config` - Configuración
- vite.config.ts
- Otros archivos de configuración

## Patrones de Diseño

### 1. **Module Pattern**
Cada script es un módulo independiente con responsabilidad única.

```typescript
// Ejemplo: colors.ts
export function updateColorFromOKLCH(L, C, H) {
    // Conversión OKLCH → RGB
    // Actualización de uniforms
}
```

### 2. **Observer Pattern**
Event listeners para comunicación entre módulos.

```typescript
// UI cambios → Renderer actualizaciones
document.addEventListener('colorChange', (e) => {
    updateShaderUniforms(e.detail);
});
```

### 3. **Singleton Pattern**
Una única instancia del renderer.

```typescript
class Renderer {
    private static instance: Renderer;
    
    static getInstance(): Renderer {
        if (!Renderer.instance) {
            Renderer.instance = new Renderer();
        }
        return Renderer.instance;
    }
}
```

## Dependencias Externas

### Producción
- **three.js r158** - Renderizado 3D/WebGL
- **culori.js 3.2.1** - Conversión de espacios de color

### Desarrollo
- **vite 5.x** - Build tool
- **typescript 5.x** - Tipado estático
- **eslint 8.x** - Linting
- **prettier 3.x** - Code formatting

## Seguridad y Performance

### Optimizaciones
- ✅ Lazy loading de shaders
- ✅ Reuse de materiales
- ✅ Minimización de redraw
- ✅ Uniforms batching
- ✅ CSS transforms (GPU-accelerated)

### Seguridad
- ✅ Input validation
- ✅ No eval() en shaders
- ✅ Sanitización de datos
- ✅ CORS considerado

## Testing

### Estructura sugerida (futuro)
```
tests/
├── unit/
│   ├── colors.test.ts
│   ├── utils.test.ts
│   └── shaders.test.ts
└── e2e/
    └── integration.test.ts
```

## Build Process

```
Source Code (TypeScript)
     ↓
Vite / ESBuild
     ↓
Bundling & Minification
     ↓
Tree-shaking
     ↓
Production Build (/dist)
```

## Escalabilidad Futura

### Potenciales Extensiones
1. **Más Shaders** - Sistema plugin para nuevos efectos
2. **Temas** - CSS variables dinámicas
3. **Exportación** - MP4, WebP, PNG
4. **Presets** - Guardar/cargar configuraciones
5. **Colaboración** - Compartir links con estado
6. **Analytics** - Tracking de uso

## Contribuciones

Cuando contribuyas, mantén:
- ✅ Separación de responsabilidades
- ✅ Tipado TypeScript completo
- ✅ Documentación de código
- ✅ Tests unitarios
- ✅ Linting y formatting
