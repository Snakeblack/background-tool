# 🎨 MMRG Background Generator | Generador de Fondos Animados WebGPU

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://background.mretamozo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Made with WebGPU](https://img.shields.io/badge/Made%20with-WebGPU-black.svg)](https://www.w3.org/TR/webgpu/)
[![Three.js TSL](https://img.shields.io/badge/Powered%20by-Three.js%20TSL-orange.svg)](https://threejs.org/)

Generador profesional de fondos animados de alto rendimiento utilizando **WebGPU** y **Three.js TSL**. Crea fondos únicos con shaders personalizables, espacio de color **OKLCH** y exporta el código listo para React, Vue, Angular o Vanilla JS.

🌐 **[Ver Demo en Vivo](https://background.mretamozo.com)** | 📖 **[Documentación](docs/)** | 🚀 **[Guía de Uso](docs/GUIA_USO.md)**

---

## 🌟 ¿Por qué usar MMRG Background Generator?

✅ **Rendimiento Extremo** - WebGPU + Three.js TSL para animaciones a 60fps estables  
✅ **Sin suscripciones ni límites** - 100% gratuito y open source  
✅ **Exportación inteligente** - Código optimizado para tu framework favorito  
✅ **Colores vibrantes** - Espacio OKLCH para colores perceptualmente uniformes  
✅ **8 efectos únicos** - Aurora, Waves, Liquid, Mesh, Stripes, Geometric, Particles  
✅ **Responsive por defecto** - Optimizado para desktop, tablet y móvil  

## 🚀 WebGPU + Three.js TSL

Este proyecto evolucionó de WebGL a **WebGPU**, la próxima generación de gráficos web. Aprovechando el sistema **TSL (Three.js Shading Language)** logramos:

*   **Mayor Rendimiento:** Acceso de bajo nivel a la GPU para cálculos más complejos sin bloquear el hilo principal.
*   **Menor Consumo:** Shaders optimizados que consumen menos batería en dispositivos móviles.
*   **Mejor Calidad Visual:** Gradientes más suaves y efectos más detallados.

## ✨ Características

- 🎪 **Paneles flotantes y minimizables** - Interfaz moderna y flexible
- 🎨 **Espacio de color OKLCH** - Control perceptual de colores
- ⚡ **WebGPU Shaders** - Múltiples efectos en tiempo real con alto rendimiento
- 📱 **Responsive Design** - Funciona en desktop, tablet y móvil
- 🔧 **Controles intuitivos** - Ajusta cada parámetro con sliders
- 🎬 **Animaciones suaves** - Transiciones fluidas
- 💾 **Exportable** - Descarga tu gradiente como código listo para usar

## 🚀 Comenzar

### Requisitos
- **Node.js** 18+
- **Navegador compatible con WebGPU** (Chrome 113+, Edge 113+, Firefox Nightly)

### Instalación

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

Abre `http://localhost:5173` en tu navegador.

### Compilación para producción

```bash
pnpm build
```

## 📁 Estructura del Proyecto

```
background-tool/
├── src/
│   ├── index.html              # HTML principal
│   ├── main.js                 # Punto de entrada
│   ├── scripts/
│   │   ├── Renderer.js         # WebGPU/WebGL renderer (Three.js)
│   │   ├── ShaderManager.js    # Gestión de shaders
│   │   ├── ColorManager.js     # Control de colores OKLCH
│   │   ├── UIController.js     # Lógica de interfaz
│   │   └── components/         # Web Components
│   ├── shaders/
│   │   ├── aurora.glsl         # Shader de aurora
│   │   ├── liquid.glsl         # Shader de líquido
│   │   └── ...                 # Otros shaders
│   ├── styles/
│   │   ├── main.css            # Estilos globales
├── public/                      # Archivos estáticos
├── docs/                        # Documentación
├── package.json
├── vite.config.js
```

## 🎯 Tecnologías

| Stack | Componentes |
|-------|------------|
| **Frontend** | Vanilla JS, Web Components, CSS3 |
| **Graphics** | **WebGPU**, **Three.js TSL** |
| **Colors** | OKLCH Color Space |
| **Build** | Vite |
| **Tooling** | ESLint, Prettier |
| **Package Manager** | pnpm |

## 🛠️ Scripts Disponibles

```bash
pnpm dev              # Inicia servidor de desarrollo (http://localhost:5173)
pnpm build            # Compila para producción en /dist
pnpm preview          # Preview de la build compilada
```

## 🎨 Paneles de Control

### Panel Izquierdo: Configuración
- **Tipo de Fondo**: Aurora, Waves, Liquid, Mesh, etc.
- **Velocidad Global**: Controla animación
- **Controles Específicos**: Parámetros por shader

### Panel Derecho: Colores (OKLCH)
- **Color Base**: Selector de color
- **Lightness (L)**: Luminosidad (0-1)
- **Chroma (C)**: Saturación (0-0.4)
- **Hue (H)**: Matiz (0-360°)
- Mobile-first responsive design

---

## ⚙️ Archivo: `main.js`

**Responsabilidad:** Punto de entrada y orquestación

**Funciones principales:**

| Clase | Descripción |
|---------|-------------|
| `Renderer` | Gestiona el contexto WebGPU/WebGL (Three.js) y el pipeline de renderizado |
| `GpuDetector` | Detecta el tier de GPU y aplica perfiles de calidad adaptativa |
| `ShaderManager` | Carga y compila los shaders TSL/GLSL |
| `ColorManager` | Gestiona la conversión y estado de colores OKLCH |
| `UIController` | Maneja la interacción con el usuario y Web Components |

**Características:**
- Arquitectura basada en componentes
- Web Components nativos para la UI
- Gestión eficiente de recursos WebGPU

---

## 🚀 Cómo Usar

1. Abre `index.html` en un navegador compatible con WebGPU (Chrome, Edge, etc.)
2. Usa los controles para ajustar:
   - Tipo de shader
   - Velocidad global
   - Parámetros específicos del shader
   - Colores en formato OKLCH
3. Haz clic en "Exportar" para obtener el código.

---

## ✅ Buenas Prácticas Implementadas

### 1. **WebGPU First**
   - Uso de Compute Shaders para simulaciones complejas
   - Pipelines optimizados

### 2. **Arquitectura Modular**
   - Separación clara entre lógica de renderizado y UI
   - Uso de módulos ES6

### 3. **Rendimiento**
   - Minimización de cambios de estado en la GPU
   - Uso eficiente de buffers uniformes

### 4. **Accesibilidad**
   - Controles etiquetados correctamente
   - Soporte para navegación por teclado

---

## 🔗 Referencias Externas

- [WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Three.js TSL](https://threejs.org/docs/#api/en/renderers/webgpu/WebGPURenderer)
- [OKLCH Color Format](https://oklch.com/)

