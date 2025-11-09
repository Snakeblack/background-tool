# 📁 Guía Visual de la Carpeta del Proyecto

## Vista Completa de la Estructura

```
c:\Users\sn4ke\dev\herramientas\degradado\
│
├── 📄 ARCHIVOS RAÍZ (Configuración)
│   ├── package.json                    ← Dependencias y scripts npm
│   ├── tsconfig.json                   ← Configuración TypeScript
│   ├── vite.config.ts                  ← Configuración del build tool
│   ├── .eslintrc.json                  ← Reglas de linting
│   ├── .prettierrc.json                ← Reglas de formato
│   ├── .gitignore                      ← Archivos ignorados por Git
│   ├── LICENSE                         ← Licencia MIT
│   └── README.md                       ← Documentación principal
│
├── 📁 src/                             ← CÓDIGO FUENTE
│   ├── index.html                      ← HTML (sin CSS/JS mezclado)
│   ├── main.ts                         ← Punto de entrada TypeScript
│   │
│   ├── 📁 scripts/                     ← Lógica TypeScript modular
│   │   ├── main.ts                     ← Inicialización
│   │   ├── renderer.ts                 ← Three.js & WebGL
│   │   ├── shaders.ts                  ← Gestión de shaders
│   │   ├── colors.ts                   ← Control OKLCH
│   │   ├── ui.ts                       ← Eventos de interfaz
│   │   └── utils.ts                    ← Funciones auxiliares
│   │
│   ├── 📁 shaders/                     ← Shaders GLSL
│   │   ├── vertex.glsl                 ← Vertex shader común
│   │   ├── liquid.glsl                 ← Efecto líquido
│   │   ├── stripes.glsl                ← Efecto de rayas
│   │   └── common.glsl                 ← Código compartido
│   │
│   ├── 📁 styles/                      ← CSS modular
│   │   ├── main.css                    ← Variables CSS y reset
│   │   ├── panels.css                  ← Estilos de paneles
│   │   ├── controls.css                ← Botones y controles
│   │   └── responsive.css              ← Media queries
│   │
│   └── 📁 assets/                      ← Recursos estáticos
│       └── 📁 icons/                   ← Iconos SVG (opcional)
│
├── 📁 public/                          ← Assets públicos
│   └── favicon.ico                     ← Icono del sitio
│
├── 📁 dist/                            ← BUILD COMPILADO (generado)
│   ├── index.html                      ← HTML minificado
│   ├── main.js                         ← JavaScript compilado
│   ├── main.css                        ← CSS compilado
│   └── main.js.map                     ← Source maps
│
├── 📁 docs/                            ← DOCUMENTACIÓN PROFESIONAL
│   ├── ARCHITECTURE.md                 ← Arquitectura técnica
│   ├── DEVELOPMENT.md                  ← Guía de desarrollo
│   ├── PROJECT_STRUCTURE.md            ← Detalles de estructura
│   ├── SETUP_COMPLETE.md               ← Checklist de setup
│   ├── COLOR_SPACE.md                  ← Info de OKLCH (por crear)
│   └── SHADERS.md                      ← Info de shaders (por crear)
│
├── 📁 config/                          ← Archivos de configuración
│   └── (Se agregará más según necesidad)
│
└── 📁 node_modules/                    ← DEPENDENCIAS (generado)
    ├── three/
    ├── culori/
    ├── vite/
    ├── typescript/
    └── ... (muchas más)
```

## 🎯 Qué hace cada carpeta

### `src/` - Tu código fuente
```
Lo que escribes:
- TypeScript (.ts)
- Shaders GLSL (.glsl)
- CSS modular
- HTML limpio

Lo que Vite procesa:
- Bundling automático
- Minificación
- Optimizaciones
```

### `dist/` - Código compilado para producción
```
Lo que genera Vite:
npm run build

Contenido:
- JavaScript minificado y bundled
- CSS compilado
- HTML procesado
- Source maps para debugging
```

### `docs/` - Documentación del proyecto
```
Para ti y tus colaboradores:
- Guías de desarrollo
- Arquitectura del sistema
- Instrucciones de setup
- Información técnica
```

### `public/` - Assets que no se tocan
```
Archivos estáticos:
- Favicon
- Imágenes generales
- No se procesan, se copian tal cual
```

## 📊 Mapeo de Archivos Antigos → Nuevos

```
ANTIGUO                          NUEVO
────────────────────────────────────────────
index.html          →            src/index.html
script.js           →            src/main.ts
                                 src/scripts/*.ts (modular)
styles.css          →            src/styles/*.css (modular)

(nuevos)            →            tsconfig.json
                                 vite.config.ts
                                 package.json
                                 .eslintrc.json
                                 .prettierrc.json

docs/               →            docs/ (expandido)
```

## 🔄 Flujo de Desarrollo

```
┌─────────────────────────────────────────────────────────────┐
│  npm run dev                                                │
│  ↓                                                          │
│  Vite inicia servidor en http://localhost:3000             │
│  ↓                                                          │
│  Espera cambios en src/                                    │
│  ↓                                                          │
│  Detecta cambio (ej: modificas src/scripts/colors.ts)     │
│  ↓                                                          │
│  HMR (Hot Module Reload) actualiza el navegador            │
│  ↓                                                          │
│  Ves cambios al instante (sin refrescar manualmente)      │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Flujo de Build

```
┌─────────────────────────────────────────────────────────────┐
│  npm run build                                              │
│  ↓                                                          │
│  Vite lee tsconfig.json y vite.config.ts                   │
│  ↓                                                          │
│  Procesa src/main.ts (entry point)                         │
│  ↓                                                          │
│  Resuelve todas las importaciones                          │
│  ↓                                                          │
│  Bundle y minifica JavaScript                             │
│  ├── Elimina código no usado (tree-shaking)               │
│  ├── Minifica nombres de variables                        │
│  └── Comprime archivos                                    │
│  ↓                                                          │
│  Procesa CSS                                              │
│  ├── Autoprefixer (compatiblidad)                         │
│  ├── Minificación                                         │
│  └── Map de fuentes                                       │
│  ↓                                                          │
│  Procesa HTML                                             │
│  ├── Inyecta referencias a bundle.js y bundle.css         │
│  └── Minifica                                             │
│  ↓                                                          │
│  Genera dist/                                             │
│  ├── index.html                                           │
│  ├── main.js (todo el código bundled)                     │
│  ├── main.css (todos los estilos)                         │
│  └── main.js.map (debugging)                              │
└─────────────────────────────────────────────────────────────┘

Resultado: Carpeta dist/ lista para producción
```

## 📦 Scripts npm - Qué hacen

```bash
npm install              → Instala dependencias de package.json
                          Crea node_modules/ y package-lock.json

npm run dev              → npm run vite
                          Inicia dev server con HMR
                          Puerto 3000
                          Auto-abre navegador

npm run build            → npm run vite build
                          Compila todo
                          Genera dist/
                          Listo para producción

npm run preview          → npm run vite preview
                          Simula servidor producción
                          Prueba del build
                          Puerto 4173

npm run lint             → npm run eslint src
                          Verifica código
                          Muestra warnings y errores
                          No modifica código

npm run format           → npm run prettier --write src
                          Formatea código automáticamente
                          Modifica archivos
                          Sigue .prettierrc.json

npm run format:check     → npm run prettier --check src
                          Verifica si está formateado
                          No modifica
```

## 🎯 Casos de Uso

### Caso 1: Desarrollo Local
```bash
cd c:\Users\sn4ke\dev\herramientas\degradado
npm install (primera vez)
npm run dev

→ Abre http://localhost:3000
→ Edita src/scripts/colors.ts
→ Cambios aparecen automáticamente
```

### Caso 2: Verificar Código
```bash
npm run lint              # Ver errores
npm run format            # Arreglar formato
npm run lint -- --fix     # Arreglar algunos errores
```

### Caso 3: Preparar Producción
```bash
npm run build             # Genera dist/
npm run preview           # Prueba el build
                          # http://localhost:4173
```

### Caso 4: Compartir con Otros Desarrolladores
```bash
git add .
git commit -m "feat: nueva estructura profesional"
git push origin main

# Otro dev:
git clone <repo>
cd <repo>
npm install
npm run dev
```

## 🗂️ Dónde Poner Qué

| Tipo de Archivo | Ubicación | Ejemplo |
|---|---|---|
| **Código TypeScript** | `src/scripts/` | `src/scripts/colors.ts` |
| **Shaders GLSL** | `src/shaders/` | `src/shaders/liquid.glsl` |
| **CSS** | `src/styles/` | `src/styles/panels.css` |
| **HTML** | `src/` | `src/index.html` |
| **Imágenes** | `src/assets/` | `src/assets/logo.png` |
| **Iconos** | `src/assets/icons/` | `src/assets/icons/menu.svg` |
| **Config** | Raíz | `vite.config.ts` |
| **Docs** | `docs/` | `docs/ARCHITECTURE.md` |
| **Dependencias** | `package.json` | Listas automáticamente |

## ⚠️ No Toques Estas Carpetas

```
node_modules/      → Auto-generada, no commits
dist/              → Auto-generada, no commits
.vite/             → Cache, no commits
```

## ✅ Checklist de Setup

```bash
□ npm install                    # Instalar dependencias
□ npm run lint                   # Verificar código
□ npm run dev                    # Iniciar desarrollo
□ Abrir http://localhost:3000   # Verificar que funciona
□ npm run build                  # Crear build producción
□ npm run preview                # Previewar build
```

---

**¡Tu proyecto está completamente estructurado y listo para escalar! 🚀**

Cada carpeta tiene un propósito específico. Mantén esta estructura y tu código será escalable y profesional.
