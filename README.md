# 🎨 MMRG Background Generator | Generador de Fondos WebGL

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://background.mretamozo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Made with Three.js](https://img.shields.io/badge/Made%20with-Three.js-black.svg)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

Generador profesional de fondos animados con **WebGL**, **Three.js** y espacio de color **OKLCH**. Crea fondos únicos con 8 shaders personalizables y exporta el código listo para React, Vue, Angular o Vanilla JS.

🌐 **[Ver Demo en Vivo](https://background.mretamozo.com)** | 📖 **[Documentación](docs/)** | 🚀 **[Guía de Uso](docs/GUIA_USO.md)**

---

## 🌟 ¿Por qué usar MMRG Background Generator?

✅ **Sin suscripciones ni límites** - 100% gratuito y open source  
✅ **Exportación inteligente** - Código optimizado para tu framework favorito  
✅ **Colores vibrantes** - Espacio OKLCH para colores perceptualmente uniformes  
✅ **8 efectos únicos** - Aurora, Waves, Liquid, Mesh, Stripes, Geometric, Particles  
✅ **Responsive por defecto** - Optimizado para desktop, tablet y móvil  
✅ **Rendimiento** - WebGL acelerado por GPU para animaciones fluidas

## ✨ Características

- 🎪 **Paneles flotantes y minimizables** - Interfaz moderna y flexible
- 🎨 **Espacio de color OKLCH** - Control perceptual de colores
- ⚡ **WebGL Shaders** - Múltiples efectos en tiempo real
- 📱 **Responsive Design** - Funciona en desktop, tablet y móvil
- 🔧 **Controles intuitivos** - Ajusta cada parámetro con sliders
- 🎬 **Animaciones suaves** - Transiciones fluidas
- 💾 **Exportable** - Descarga tu gradiente como imagen

## 🚀 Comenzar

### Requisitos
- **Node.js** 16+
- **npm** o **yarn**

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

### Compilación para producción

```bash
npm run build
```

## 📁 Estructura del Proyecto

```
gradient-generator-webgl/
├── src/
│   ├── index.html              # HTML principal
│   ├── main.ts                 # Punto de entrada
│   ├── scripts/
│   │   ├── renderer.ts         # Inicialización Three.js
│   │   ├── shaders.ts          # Gestión de shaders
│   │   ├── colors.ts           # Control de colores OKLCH
│   │   ├── ui.ts               # Lógica de interfaz
│   │   └── utils.ts            # Utilidades
│   ├── shaders/
│   │   ├── liquid.glsl         # Shader de líquido
│   │   ├── stripes.glsl        # Shader de rayas
│   │   └── common.glsl         # Código compartido
│   ├── styles/
│   │   ├── main.css            # Estilos globales
│   │   ├── panels.css          # Estilos de paneles
│   │   ├── controls.css        # Estilos de controles
│   │   └── responsive.css      # Media queries
│   └── assets/
│       └── icons/              # Iconos SVG (opcional)
├── public/                      # Archivos estáticos
├── docs/                        # Documentación
├── dist/                        # Build de producción
├── config/                      # Configuración
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.json
├── .prettierrc.json
└── .gitignore
```

## 🎯 Tecnologías

| Stack | Componentes |
|-------|------------|
| **Frontend** | TypeScript, HTML5, CSS3 |
| **3D & Graphics** | Three.js r158, WebGL |
| **Colors** | Culori.js, OKLCH Color Space |
| **Build** | Vite 5.x, ESBuild |
| **Tooling** | ESLint, Prettier |
| **Package Manager** | npm |

## 🛠️ Scripts Disponibles

```bash
npm run dev           # Inicia servidor de desarrollo (http://localhost:3000)
npm run build         # Compila para producción en /dist
npm run preview       # Preview de la build compilada
npm run lint          # Verifica código con ESLint
npm run format        # Formatea código con Prettier
npm run format:check  # Verifica formato sin cambiar
```

## 🎨 Paneles de Control

### Panel Izquierdo: Configuración
- **Tipo de Fondo**: Líquido o Rayas
- **Velocidad Global**: Controla animación
- **Controles Específicos**: Parámetros por shader

### Panel Derecho: Colores (OKLCH)
- **Color Base**: Selector de color
- **Lightness (L)**: Luminosidad (0-1)
- **Chroma (C)**: Saturación (0-0.4)
- **Hue (H)**: Matiz (0-360°)
- Mobile-first responsive design

---

## ⚙️ Archivo: `script.js`

**Responsabilidad:** Lógica de aplicación y comportamiento

**Funciones principales:**

| Función | Descripción |
|---------|-------------|
| `oklchToThreeColor()` | Convierte valores OKLCH a THREE.Color |
| `init()` | Inicializa la escena de Three.js |
| `animate()` | Loop de animación |
| `onWindowResize()` | Maneja el redimensionamiento de ventana |
| `updateColorFromOKLCH()` | Actualiza colores desde sliders |
| `setupControls()` | Configura todos los event listeners |

**Características:**
- Separación clara de responsabilidades
- Comentarios JSDoc para documentación
- Event delegation para eficiencia
- Gestión de uniforms de shaders
- Soporte para cambio dinámico de shaders

---

## 🚀 Cómo Usar

1. Abre `index.html` en un navegador moderno (que soporte WebGL)
2. Usa los controles para ajustar:
   - Tipo de shader (Líquido o Rayas)
   - Velocidad global
   - Parámetros específicos del shader
   - Colores en formato OKLCH

---

## ✅ Buenas Prácticas Implementadas

### 1. **Separación de Responsabilidades**
   - HTML para estructura
   - CSS para estilos
   - JavaScript para lógica

### 2. **Arquitectura Modular**
   - Funciones pequeñas y reutilizables
   - Uniforms centralizados
   - Event delegation eficiente

### 3. **Código Limpio**
   - Nombres descriptivos
   - Comentarios en funciones complejas
   - Documentación JSDoc

### 4. **Rendimiento**
   - Caché de elementos del DOM
   - Event delegation (no listeners individuales)
   - Pixel ratio optimizado para dispositivos

### 5. **Compatibilidad**
   - Estilos cross-browser para inputs range
   - Fallbacks CSS
   - Soporte para Firefox, Chrome, Safari

### 6. **Responsive Design**
   - Media queries para móviles
   - Viewport meta tag
   - Layout adaptativo

### 7. **Mantenibilidad**
   - Variables CSS reutilizables
   - Comentarios de sección
   - Estructura coherente

---

## 🔧 Estructura de Shaders

Los shaders GLSL están definidos en `index.html` como scripts de tipo `x-shader`:

### Vertex Shader
- Común para todos los shaders
- Renderiza la geometría al espacio pantalla

### Fragment Shaders
1. **Líquido (FBM)**: Ruido Perlin fractal
2. **Rayas**: Patrones de seno/coseno animados

---

## 📱 Variables CSS (Temas)

Todas las propiedades de color y transición están definidas en `:root`:

```css
--color-gray-200, --color-gray-300, --color-gray-800, --color-gray-900
--color-white, --color-blue-500
--transition-default: 0.3s ease
--backdrop-blur: 10px
```

Fácil de customizar para temas oscuros/claros.

---

## 🔗 Referencias Externas

- [Three.js Documentation](https://threejs.org/docs/)
- [Culori.js](https://culorijs.org/)
- [OKLCH Color Format](https://oklch.com/)
- [WebGL Shaders](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
