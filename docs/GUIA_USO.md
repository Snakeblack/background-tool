# 🎮 Guía de Uso - Generador de Fondos WebGL

## 🚀 Inicio Rápido

1. Abre `index.html` en tu navegador
2. Verás un fondo WebGL animado con dos paneles laterales

---

## 🎯 Interfaz Principal

### Layout
```
[Panel Izq] [Canvas Completo] [Panel Der]
```

- **Panel Izquierdo**: Configuración y controles generales
- **Canvas Central**: Fondo WebGL animado (sin obstáculos)
- **Panel Derecho**: Control de colores OKLCH

---

## 📋 Panel Izquierdo: Configuración

### 1️⃣ Tipo de Fondo
Selecciona el shader que quieres usar:
- **Líquido (Ruido FBM)**: Efecto fluido y orgánico
- **Rayas (Seno/Coseno)**: Patrón geométrico animado

### 2️⃣ Controles Generales (Expandible)
Click en **▼ Controles Generales** para expandir:
- **Velocidad Global**: 0.01 - 1.0
  - Controla la velocidad de animación global

### 3️⃣ Controles Específicos (Expandible)
Los controles cambian según el shader seleccionado:

#### Si seleccionaste "Líquido":
- **Zoom/Complejidad**: 1.0 - 10.0
  - Aumenta = más detalle en el ruido
  - Disminuye = fondo más suave

#### Si seleccionaste "Rayas":
- **Grosor Rayas**: 1.0 - 50.0
  - Controla el espesor de las líneas
- **Velocidad Rayas**: 0.1 - 3.0
  - Velocidad de movimiento de las rayas

---

## 🎨 Panel Derecho: Colores (OKLCH)

### ¿Qué es OKLCH?

OKLCH es un formato moderno de color que separa:
- **L (Luz)**: 0.1 (oscuro) → 1.0 (brillante)
- **C (Croma)**: 0.0 (gris) → 0.4 (saturado)
- **H (Tono)**: 0 - 360° (rueda de colores)

### Controlar Colores

Cada color tiene 3 sliders expandibles:

#### Color 1, 2 y 3
Click en **▼ Color X** para expandir:

1. **Luz (L)**: 0.1 - 1.0
   - Oscuro → Brillante
   
2. **Croma (C)**: 0.0 - 0.4
   - Gris → Saturado
   
3. **Tono (H)**: 0 - 360°
   - Rojo, Amarillo, Verde, Cian, Azul, Magenta

### Tips de Color
- Usa **Luz alta (0.7-1.0)** para colores brillantes
- Usa **Luz baja (0.1-0.3)** para colores oscuros
- Aumenta **Croma** para colores más vibrantes
- Disminuye **Croma** para tonos más neutros
- Experimenta con diferentes **Tonos** para variedad

---

## 👁️ Visualización: Mostrar/Ocultar Paneles

### Para Ocultar Paneles
Tienes 3 opciones:
1. Click en el botón flotante **☰** (cuando está visible)
2. Click en el botón **✕** del Panel Izquierdo
3. Click en el botón **✕** del Panel Derecho

### Para Mostrar Paneles
- Click en el botón flotante **☰** (centro-inferior)

### Animación
- Los paneles se deslizan suavemente
- Duración: 300ms
- El botón flotante aparece/desaparece con fade

---

## 🎮 Controles Expandibles

### Expandir/Contraer
Click en cualquier header azul (ej. "▼ Controles Generales"):
- ▼ = Expandido
- ▶ = Contraído

### Secciones Expandibles
- Controles Generales
- Controles Específicos
- Color 1, 2, 3

### Beneficio
- Organiza mejor los controles
- Menos scrolling necesario
- Foco en lo importante

---

## 🎬 Ajustes en Tiempo Real

### Características
- Todos los cambios ocurren **al instante**
- No hay botón "Aplicar" necesario
- El fondo se actualiza mientras ajustas
- Los colores se previewan en los headers

### Experimenta
1. Mueve los sliders lentamente
2. Observa los cambios en tiempo real
3. Combina diferentes shaders con colores
4. Encuentra tu fondo favorito

---

## 💡 Ejemplos de Uso

### Fondo Lava
- Shader: **Líquido**
- Zoom: **6.0**
- Velocidad: **0.5**
- Colores: Rojo, Naranja, Amarillo

### Fondo Técnico
- Shader: **Rayas**
- Grosor: **15.0**
- Velocidad: **1.0**
- Colores: Cian, Azul, Púrpura

### Fondo Pastel
- Shader: **Líquido**
- Zoom: **3.0**
- Velocidad: **0.1**
- Colores: Rosa, Melocotón, Lavanda

---

## 📱 Responsivo

### Desktop (>768px)
- Paneles lado a lado
- Canvas en el centro
- Botón flotante oculto (no se necesita)

### Tablet (768px)
- Paneles en fullscreen
- Botón de cierre ✕ visible
- Botón flotante ☰ en la base

### Móvil (<768px)
- Paneles en fullscreen
- Un panel a la vez
- Cierre fácil con ✕

---

## ⌨️ Atajos Útiles

| Acción | Cómo |
|--------|------|
| Mostrar/Ocultar | Click ☰ o ✕ |
| Expandir sección | Click en header |
| Cambiar valor | Drag slider |
| Cambiar shader | Dropdown selector |

---

## 🐛 Solución de Problemas

### El fondo no se ve
- Asegúrate que el navegador soporte WebGL
- Intenta actualizar la página (F5)

### Los sliders no responden
- Haz click en el slider
- Arrastra lentamente
- Verifica que el panel está expandido

### Los colores no cambian
- Verifica que la sección Color está expandida
- Intenta cambiar otro slider primero

### Paneles no se cierran
- Click en el botón ✕ en el header
- O click en ☰ para togglear

---

## 🎨 Combinaciones Recomendadas

**Ambient/Relajante**
```
Shader: Líquido
Zoom: 2.0
Velocidad: 0.05
Colors: Azules y verdes suaves
```

**Energético**
```
Shader: Rayas
Grosor: 20.0
Velocidad: 2.0
Colors: Rojos, naranjas, amarillos
```

**Profesional**
```
Shader: Líquido
Zoom: 5.0
Velocidad: 0.3
Colors: Azules, grises, blancos
```

**Nocturno**
```
Shader: Rayas
Grosor: 10.0
Velocidad: 0.8
Colors: Púrpuras, azul oscuro, negro
```

---

## ❓ Preguntas Frecuentes

**¿Se guardas mis configuraciones?**
No, cada vez que refrescas vuelven a los valores iniciales.

**¿Puedo usar esto en producción?**
Sí, es un generador de fondos. Úsalo en tu web.

**¿Puedo agregar más shaders?**
Sí, agrega nuevos shaders en `index.html` y la lógica en `script.js`.

**¿Funciona en móvil?**
Sí, está completamente optimizado para móvil.

**¿Puedo cambiar los colores por defecto?**
Sí, edita los valores en `script.js` en la sección `initialColors`.

---

## 🔗 Referencias

- [Culori.js](https://culorijs.org/) - Conversión de colores
- [Three.js](https://threejs.org/) - Motor WebGL
- [OKLCH Color](https://oklch.com/) - Formato de color

---

¡Diviértete creando fondos! 🎉
