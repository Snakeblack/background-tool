# 🎨 MMRG Background Generator | Fondos animados para tu web

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://background.mretamozo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Made with WebGPU](https://img.shields.io/badge/Made%20with-WebGPU-black.svg)](https://www.w3.org/TR/webgpu/)
[![Three.js TSL](https://img.shields.io/badge/Powered%20by-Three.js%20TSL-orange.svg)](https://threejs.org/)

Diseña un fondo animado con **WebGPU + Three.js TSL**, afínalo con colores **OKLCH** y llévatelo a tu web con una guía paso a paso (HTML/JS, React, Vue, Angular y Astro). 100 % gratis y open source.

🌐 **[Demo en vivo](https://background.mretamozo.com)** | 📖 **[Guía de uso](docs/GUIA_USO.md)**

---

## ✨ Qué incluye

- **24 fondos** pensados para portfolios y landings: degradados mesh, auroras, cromo líquido, rejillas, topografía, galaxias, synthwave…
- **Color perceptual real:** los colores se eligen en OKLCH y el shader los mezcla en **OKLab**, así los degradados salen limpios y vibrantes (nada de grises apagados en el medio). Lo que eliges es exactamente lo que se ve.
- **Vista previa = exportación:** hay un único shader por fondo (TSL). El mismo archivo mueve la vista previa y el código que exportas. Sin versión GLSL paralela.
- **Exportación lista para producción:** un módulo `mountBackground` común con carga diferida de three.js, pausa fuera de pantalla, `prefers-reduced-motion`, tope de fps, resolución adaptativa y degradado CSS de respaldo. Descarga un `.zip` o copia archivo a archivo.
- **WebGPU donde exista, WebGL2 en el resto:** `WebGPURenderer` cambia de backend solo; el mismo shader corre en ambos.
- **Interfaz rápida:** galería con miniaturas, ajustes, paletas, aleatorio armónico, fondos guardados, atajos de teclado (`←` `→` `R` `E` `Esc`), ES/EN y responsive.

## 🖼️ Catálogo

| Categoría | Fondos |
|---|---|
| **Degradados** | Mesh Gradient · Aurora · Cromo líquido · Seda etérea · Degradado granulado · Iridiscente · Lámpara de lava* · Orbes de luz |
| **Patrones** | Olas en capas · Rayas suaves · Rejilla hexagonal · Rejilla de puntos* · Rejilla luminosa* · Topográfico · Células · Plasma |
| **Luz** | Foco de luz* · Rayos de luz · Vuelo entre nubes · Cáusticas de agua |
| **Espacio y Retro** | Galaxia espiral · Campo de estrellas · Hiperespacio* · Horizonte synth |

\* reacciona al puntero.

## 🚀 Comenzar

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # producción en /dist
pnpm lint
pnpm typecheck
```

Requisitos: Node 18+. Cualquier navegador moderno sirve (WebGPU si lo hay, WebGL2 si no).

Parámetros de URL útiles: `?bg=aurora` (abre un fondo), `?lang=es|en`, `?tier=low|mid|high|ultra` (fuerza el perfil de GPU), `?renderer=webgl` (fuerza el backend WebGL2).

## 🧩 Cómo funciona

```
src/scripts/
├── shaders/
│   ├── commonUniforms.js   # uniforms (los colores viajan como OKLab)
│   ├── tslLib.js           # ruido sin sin(), fbm, gradient4, finish (OKLab→sRGB + dither + grano)
│   ├── nodes/<id>.js       # UN fondo = UN archivo TSL (export const main = Fn(...))
│   ├── entries/*.js        # metadatos por categoría: controles, paleta, textos ES/EN, coste
│   └── registry.js         # agrega todo
├── Renderer.js             # WebGPURenderer, escala de render, tope de fps, calidad adaptativa
├── ShaderManager.js        # carga fondos, uniforms, reloj (fase = dt·velocidad)
├── ColorManager.js         # estado OKLCH → OKLab
├── palettes.js             # presets + paleta aleatoria armónica
├── UIController.js         # galería, ajustes, colores, guardados, teclado
└── export/
    ├── codegen.js          # genera los archivos a exportar desde los fuentes reales
    ├── templates/mountBackground.js   # el módulo de montaje (código real y lintable)
    └── zip.js              # .zip sin dependencias
```

### Añadir tu propio fondo

1. Crea `src/scripts/shaders/nodes/mifondo.js`:

   ```js
   import { Fn, mix } from 'three/tsl';
   import { u_time, u_color1, u_color2, u_scale } from '../commonUniforms.js';
   import { coords, finish } from '../tslLib.js';

   export const main = Fn(() => {
       const p = coords(); // centradas, y∈[-0.5, 0.5], con corrección de aspecto
       const lab = mix(u_color1, u_color2, p.y.add(0.5)); // colores en OKLab
       return finish(lab);                               // → sRGB + dither + grano + brillo/contraste
   });
   ```

2. Añade una entrada en `shaders/entries/*.js` (controles, paleta OKLCH, textos ES/EN, `cost`, `renderScale`).
3. `node scripts/thumbs.mjs` genera su miniatura. La exportación lo soporta sin más cambios: se construye desde los archivos reales y poda los uniforms que no usa.

Reglas de oro al escribir shaders TSL: nada de `-nodo` de JavaScript (usa `.negate()`), las derivadas (`fwidth`, `dFdx`) fuera de ramas `If`, y los colores siempre mezclados en OKLab.

## ⚡ Rendimiento

Un fondo animado es un quad a pantalla completa: lo que cuesta es el fragment shader. Por eso:

- **Escala de render por fondo:** los suaves (mesh, aurora, nubes…) se dibujan al 50–85 % de la resolución nativa; el navegador reescala con filtro bilineal y no se nota, pero el coste cae con el cuadrado de la escala.
- **Sin trabajo inútil:** sin MSAA, tope de 60 fps (30 en GPUs de gama baja) aunque la pantalla sea de 144 Hz, y con velocidad 0 o pestaña oculta no se renderiza nada.
- **Calidad adaptativa:** si los fotogramas se ralentizan baja la resolución y, como último recurso, el tope a 30 fps.
- **Ruido barato:** hashes sin `sin()` (más rápidos y sin artefactos en móviles) y fbm con octavas fijas desenrolladas.
- **Ramas coherentes:** `neon_grid` evalúa cielo o suelo, no ambos (3× más rápido).

Coste medido (RTX 4080, 8,3 Mpx a resolución completa; solo sirve como comparación relativa):

| Etiqueta | Fondos | ms/fotograma |
|---|---|---|
| Ligero | mesh, liquid, grain, iridescent, blobs, orbs, waves, stripes, geometric, dots, grid, plasma, spotlight, caustics, neon_grid | 0,17 – 0,30 |
| Medio | beams, topo, warp, particles, voronoi | 0,31 – 0,46 |
| Pesado | flow, galaxy, aurora, clouds | 0,53 – 0,64 |

Peso de JS al arrancar la app: **945 KB sin comprimir (266 KB gzip / 219 KB brotli)**. El modal de exportación (64 KB) se carga solo al exportar. En el código exportado, three.js (≈ 783 KB / 216 KB gzip) se importa **después** del primer pintado.

## 🛠️ Scripts

```bash
pnpm dev | build | preview | lint | format | typecheck
node scripts/thumbs.mjs   # regenera public/thumbs (necesita Chrome + playwright-core)
```

## 🎯 Tecnologías

Vanilla JS + Web Components · Three.js (WebGPURenderer + TSL) · OKLCH/OKLab · Vite · ESLint · Prettier · pnpm.

---

Hecho por [Manuel Retamozo](https://mretamozo.com) · Licencia MIT.
