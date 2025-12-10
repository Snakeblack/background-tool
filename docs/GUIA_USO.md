# 📖 Guía de Uso - MMRG Background Generator

Bienvenido a la guía oficial de **MMRG Background Generator**. Esta herramienta te permite crear fondos animados de alto rendimiento utilizando la potencia de **WebGPU** y **LiteRT.js**.

## 🚀 Primeros Pasos

### Requisitos Previos
Para utilizar el generador, necesitas un navegador compatible con **WebGPU**:
- **Google Chrome** 113+
- **Microsoft Edge** 113+
- **Firefox Nightly** (con configuración habilitada)

Si tu navegador no es compatible, verás un mensaje de advertencia al iniciar la aplicación.

---

## 🖥️ Interfaz de Usuario

La interfaz es minimalista y está diseñada para maximizar el espacio visual de tu creación.

### 1. Dock de Herramientas (Inferior)
Es el centro de control principal. Desde aquí accedes a todas las funcionalidades mediante botones:
- **Config**: Despliega el panel de configuración del efecto.
- **Colors**: Despliega el gestor de paletas de colores.
- **Presets**: Muestra configuraciones predefinidas rápidas.
- **Random**: Genera instantáneamente una combinación aleatoria.
- **Export**: Abre el modal para obtener el código.

### 2. Paneles Flotantes
Al hacer clic en *Config*, *Colors* o *Presets*, aparecerá un panel flotante justo encima del dock (o una hoja deslizante en móviles).
- **Panel Config**: Contiene el selector de efectos y los controles deslizantes específicos (velocidad, escala, etc.).
- **Panel Colors**: Permite ajustar los 4 colores principales usando el sistema OKLCH.
- **Panel Presets**: Ofrece temas de color listos para usar (Sunset, Ocean, Neon, etc.).

---

## 🎨 Creando tu Fondo

### Paso 1: Seleccionar un Efecto
1. Haz clic en el botón **Config** del dock.
2. En el panel que aparece, usa el menú desplegable "Shader Type" para elegir un efecto:

*   **Aurora**: Luces del norte suaves y etéreas.
*   **Clouds**: Nubes procedurales en movimiento.
*   **Flow**: Corrientes fluidas y orgánicas.
*   **Galaxy**: Espiral cósmica de estrellas y nebulosas.
*   **Geometric**: Formas geométricas abstractas.
*   **Liquid**: Simulación de fluidos viscosos.
*   **Mesh**: Red de vértices conectados.
*   **Neon Grid**: Rejilla retro-futurista estilo synthwave.
*   **Particles**: Sistema de partículas interactivo.
*   **Stripes**: Bandas de color animadas.
*   **Voronoi**: Patrones celulares naturales.
*   **Waves**: Ondas suaves y relajantes.

### Paso 2: Personalizar Colores (OKLCH)
El generador utiliza el espacio de color **OKLCH** para garantizar gradientes perceptualmente uniformes y vibrantes.
- Haz clic en los círculos de color para abrir el selector.
- Ajusta **Lightness (L)**, **Chroma (C)** y **Hue (H)**.
- Puedes añadir o eliminar paradas de color según lo permita el efecto seleccionado.

### Paso 3: Ajustar Parámetros
Cada efecto tiene sus propios controles únicos. Experimenta con:
- **Speed**: Velocidad de la animación.
- **Scale/Zoom**: Tamaño de los patrones.
- **Intensity/Distortion**: Fuerza del efecto visual.
- **Noise**: Cantidad de textura o granulosidad.

---

## 💾 Exportando tu Diseño

Una vez que estés satisfecho con tu creación, haz clic en el botón **"Exportar"** del dock.

### Opciones de Exportación
El modal te ofrecerá el código adaptado para:
1.  **HTML/JS (Vanilla)**: Para sitios web estándar o estáticos.
2.  **React**: Hook personalizado (`useGradientBackground`).
3.  **Vue 3**: Composable (`useGradientBackground`).
4.  **Angular**: Servicio y directiva.

### Cómo implementar en tu proyecto
El código generado utiliza **WebGPU** a través de Three.js. El modal te guiará paso a paso, pero el flujo general es:

1.  **Instalar dependencias**: Necesitarás `three` (motor gráfico) y `culori` (para la gestión de color OKLCH).
    ```bash
    npm install three culori
    ```
2.  **Archivos Auxiliares**: El exportador te dará el código para dos archivos pequeños que contienen la lógica compartida:
    *   `commonUniforms.js`: Variables compartidas.
    *   `shaderNode.js`: La lógica visual del efecto (TSL).
3.  **Componente Principal**: Finalmente, copias el componente o script que conecta todo en tu framework.

> **Nota:** Esta arquitectura modular facilita el mantenimiento y permite que el fondo funcione de manera óptima sin bloquear el hilo principal de tu aplicación.

---

## 🔧 Solución de Problemas

**El fondo se ve negro o no carga:**
- Verifica que tu navegador soporte WebGPU.
- Asegúrate de tener los drivers de tu tarjeta gráfica actualizados.
- Revisa la consola del navegador (F12) para ver si hay errores.

**La animación va lenta:**
- Reduce la resolución del navegador o el tamaño de la ventana.
- Algunos efectos como *Liquid* o *Galaxy* pueden ser intensivos en GPUs antiguas.

---

¿Tienes más preguntas? Revisa el [README](../README.md) principal o abre un issue en el repositorio.
