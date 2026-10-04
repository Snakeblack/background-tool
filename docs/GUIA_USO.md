# 📖 Guía de uso — MMRG Background Generator

Crea un fondo animado, ajústalo a tu marca y llévatelo a tu web. Funciona con **WebGPU** y, si tu navegador no lo tiene, con **WebGL2** automáticamente.

---

## 🖥️ La interfaz

Arriba a la derecha tienes el botón **Exportar** (el paso final), el selector de idioma y el enlace a GitHub. Abajo, el dock:

| Botón | Qué hace |
|---|---|
| **Fondos** | Galería con miniaturas y filtro por categoría. Cada tarjeta indica su coste de GPU (▂▄▆). |
| **Ajustes** | Velocidad y los controles propios del fondo (brillo, contraste, grano, tamaño, ondulación…). |
| **Colores** | Los 4 colores en OKLCH (luminosidad, croma y tono). Se abre uno a la vez. |
| **Paletas** | 12 paletas listas, con vista previa de colores. |
| **Aleatorio** | Una paleta armónica nueva (no cuatro colores al azar). |
| **Guardados** | Guarda tu diseño con nombre y vuelve a él cuando quieras. |

**Atajos:** `←` `→` cambian de fondo · `R` paleta aleatoria · `E` exportar · `Esc` cierra paneles.

> En el móvil el dock hace de barra de pestañas: los paneles se abren como una hoja desde abajo y el dock sigue visible para cambiar de panel.

## 🎨 Crear tu fondo

1. **Elige un fondo** en *Fondos*. Pasa el ratón por una tarjeta para leer su descripción.
2. **Ajusta los colores.** Todos los fondos usan el mismo orden: el color 1 es la base (lo más oscuro, o el fondo) y los siguientes suben hasta el resalte. Por eso cualquier paleta funciona en cualquier fondo.
3. **Afina los parámetros** en *Ajustes*. Con velocidad 0 el fondo se congela y no usa GPU.
4. Si te gusta, **guárdalo**.

Algunos fondos reaccionan al puntero (lámpara de lava, rejilla de puntos, rejilla luminosa, foco de luz, hiperespacio).

## 📦 Llevarlo a tu web

Pulsa **Exportar** (o `E`). El modal te da una guía por pestañas: **HTML/JS, React, Vue 3, Angular y Astro**. Tu paleta y tus ajustes ya vienen dentro del código.

Cada pestaña tiene un botón **Descargar .zip** con todos los archivos en sus carpetas, o puedes copiarlos uno a uno. Los pasos, en todos los frameworks:

1. **Instala three.js:** `npm install three` (es la única dependencia). Sin bundler, usa el import map que te da la pestaña HTML/JS.
2. **Crea 4 archivos** en la misma carpeta:
   - `commonUniforms.js` — los uniforms que lee el shader (solo los que usa tu fondo).
   - `tslLib.js` — utilidades compartidas (ruido, color, acabado).
   - `background.js` — el fondo en sí: exactamente lo que ves en el generador.
   - `mountBackground.js` — monta el fondo en un `<canvas>`. Arriba tiene `DEFAULTS` con tu paleta y ajustes.
3. **Conéctalo a tu app** con el hook (React), composable (Vue), directiva (Angular), componente (Astro) o 5 líneas de JS.
4. **Revisa la lista final:** el contenido debe quedar por encima del canvas (`position: relative`), un fondo opaco en `body`/`html` lo taparía, y llama a `dispose()` si lo quitas a mano.

### Qué trae ya resuelto el código exportado

- **Carga diferida:** three.js se importa después del primer pintado.
- **Pausa inteligente:** fuera de pantalla, en pestaña oculta o con velocidad 0 no gasta GPU.
- **Accesibilidad:** con `prefers-reduced-motion` muestra un único fotograma fijo, para todos tus visitantes.
- **Rendimiento:** resolución reducida cuando el aspecto lo permite, tope de 60 fps, resolución adaptativa si los fotogramas se ralentizan.
- **Respaldo:** sin WebGPU usa WebGL2; sin ninguno de los dos, un degradado CSS con tu paleta (que también se ve mientras carga).

Todo se puede ajustar al montar:

```js
mountBackground(canvas, {
  speed: 0.3,         // más lento (0 = imagen fija)
  renderScale: 0.5,   // fracción de la resolución nativa
  maxPixelRatio: 1.5, // límite en pantallas retina
  maxFps: 30,         // la mitad de trabajo en equipos lentos
});
```

La pestaña **Rendimiento** añade cómo cargarlo solo cuando su sección sea visible y cómo usarlo en una sola sección (por ejemplo, un *hero*) en vez de toda la página.

### Next.js / SSR

El hook y la directiva importan `mountBackground` con `import()` dentro del efecto de montaje, así que three.js nunca se evalúa en el servidor. En Next.js marca el componente con `'use client'`.

## 🔧 Solución de problemas

**El fondo se queda en el degradado de la paleta (no se anima):**
- Ni WebGPU ni WebGL2 están disponibles (aceleración por hardware desactivada, navegador muy antiguo). Es el respaldo previsto. Abre la consola (F12): `mountBackground` avisa del motivo.

**No se ve nada / pantalla en blanco al usar el import map:**
- Sirve la página por `http(s)`, no con `file://`, y pega el import map antes de cualquier `<script>`.

**El canvas tapa mi contenido o mi contenido no se ve:**
- Dale `position: relative` al contenedor de tu contenido y comprueba que `body`/`html` no tengan un fondo opaco.

**Va lento en un móvil:**
- Elige un fondo *Ligero* o baja `renderScale` / `maxFps` (ver arriba). Los *Pesados* (aurora, seda, galaxia, nubes) lucen mejor en escritorio.

**Perdí mis fondos guardados de la versión anterior:**
- Los fondos se rediseñaron por completo (paletas y parámetros nuevos), así que los ajustes guardados por shader se reinician. Se conserva el idioma. Los fondos guardados con nombre siguen en la lista y cargan su paleta; los que usaban un fondo que ya no existe aparecen como no disponibles.

---

¿Más preguntas? Revisa el [README](../README.md) o abre un issue en el repositorio.
