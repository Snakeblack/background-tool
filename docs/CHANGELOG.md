# 🎨 Actualización de UI/UX - Paneles Laterales Expandibles

## ✨ Cambios Realizados

### 1. **Nuevo Layout con Paneles Laterales**

#### Antes:
```
┌────────────────────────────────┐
│                                │
│   Canvas (fondo WebGL)         │
│                                │
│   ┌──────────────────────────┐ │
│   │  Centro - Panel único    │ │
│   │  (controles y colores)   │ │
│   └──────────────────────────┘ │
│                                │
└────────────────────────────────┘
```

#### Después:
```
┌──────────────────────────────────────────────┐
│┌──────┐                          ┌──────────┐│
││      │                          │          ││
││ LEFT │    Canvas (Full)         │  RIGHT   ││
││      │    (sin obstáculos)      │          ││
││      │                          │          ││
└└──────┘                          └──────────┘┘
       ↑                                  ↑
   Configuración                     Colores
   (Expandible)                      (Expandible)
```

---

### 2. **Panel Izquierdo: Configuración**

**Secciones Organizadas:**
- 📋 **Tipo de Fondo** (siempre visible)
  - Selector de Shader (Líquido/Rayas)

- **Controles Generales** (colapsable)
  - Velocidad Global

- **Controles Específicos** (colapsable)
  - Parámetros dinámicos según el shader
  - Zoom/Complejidad (Líquido)
  - Grosor Rayas + Velocidad (Rayas)

---

### 3. **Panel Derecho: Colores**

**Organización:**
- **Color 1** (colapsable con preview)
  - L (Luz), C (Croma), H (Tono)
  
- **Color 2** (colapsable con preview)
  - L, C, H

- **Color 3** (colapsable con preview)
  - L, C, H

Cada color muestra un **preview inline** en el header.

---

### 4. **Visibilidad de Paneles**

#### Botón de Toggle (FAB)
```
Cuando paneles están visibles:
  - Botón oculto (opacity: 0)
  
Cuando paneles están ocultos:
  - Botón visible (opacity: 1)
  - Posición: centro-inferior
  - Animación: fade in + escala
```

#### Cerrar Paneles
- Click en botón flotante central
- Click en botón "✕" de cada panel (en móvil)
- Los paneles salen animados

---

### 5. **Características de UI/UX**

#### 🎯 **Collapsible Sections**
```
▼ Controles Generales
  └─ Contenido expandido
     ├─ Velocidad Global: 0.2
     └─ Slider control

▶ Controles Específicos (colapsado)
```

Características:
- ✅ Icono de rotación (▼/▶)
- ✅ Animación smooth
- ✅ Estado persistente por sesión
- ✅ Fondo diferenciado

#### 🎨 **Preview de Colores**
- Inline en los headers colapsables
- Tamaño compacto (1.5rem)
- Sombra sutil
- Se actualiza en tiempo real

#### ⚡ **Animaciones**
- Transiciones smooth (300ms)
- Transformaciones de paneles (-100% → 0)
- Escalas de botones (hover)
- Fade in/out del botón flotante

#### 📐 **Responsivo**

**Desktop (>768px):**
- Paneles lado a lado
- Ancho: 380px cada uno
- Canvas ocupa el centro
- Botón flotante oculto

**Tablet (768px - 1024px):**
- Paneles lado a lado
- Ancho: 350px cada uno

**Móvil (<768px):**
- Paneles en fullscreen
- Se muestran uno a la vez
- Botón "✕" en header
- Botón flotante centrado

---

## 📝 Código Clave

### HTML Structure
```html
<!-- Toggle Button -->
<button id="toggle-panels-btn" class="toggle-panels-btn visible">☰</button>

<!-- Left Panel -->
<div id="left-panel" class="side-panel left-panel">
  <div class="panel-header">
    <h2 class="panel-title">Configuración</h2>
    <button id="close-left-panel" class="panel-close-btn">✕</button>
  </div>
  <div class="panel-content">
    <!-- Controles -->
  </div>
</div>

<!-- Right Panel -->
<div id="right-panel" class="side-panel right-panel">
  <!-- Similar -->
</div>
```

### CSS Classes

**Paneles:**
- `.side-panel` - Contenedor base
- `.left-panel` / `.right-panel` - Posicionamiento
- `.hidden` - Estado oculto

**Controles:**
- `.control-section` - Agrupación
- `.collapsible-header` - Header clickeable
- `.collapsible-content` - Contenido expandible
- `.collapsed` - Estado contraído

**Botones:**
- `.toggle-panels-btn` - FAB flotante
- `.visible` - Cuando está activo

### JavaScript Functions

```javascript
setupPanelToggle()        // Gestiona mostrar/ocultar paneles
setupCollapsibleHeaders() // Gestiona expandir/contraer secciones
```

---

## 🎭 Estados de UI

### Panel Visible
```css
.left-panel {
  transform: translateX(0);      /* Visible */
  opacity: 1;
  pointer-events: auto;
}

.toggle-panels-btn {
  opacity: 0;                    /* Botón oculto */
  pointer-events: none;
}
```

### Panel Oculto
```css
.left-panel.hidden {
  transform: translateX(-100%);  /* Fuera de pantalla */
  opacity: 1;
  pointer-events: none;
}

.toggle-panels-btn.visible {
  opacity: 1;                    /* Botón visible */
  pointer-events: auto;
}
```

### Sección Contraída
```css
.collapsible-header.collapsed {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.collapsible-header.collapsed .collapse-icon {
  transform: rotate(-90deg);     /* Icono rotado */
}

.collapsible-content.collapsed {
  max-height: 0;
  opacity: 0;
  padding: 0;
}
```

---

## 🎯 Beneficios UX

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Espacio Canvas** | Limitado | ✅ Máximo |
| **Organización** | Lineal | ✅ Contextual |
| **Movilidad** | Fijo en centro | ✅ Flotante/Toggleable |
| **Accesibilidad** | Todo visible | ✅ Colapsable |
| **Responsive** | Básico | ✅ Adaptativo |
| **Visual** | Centrado | ✅ Paneles laterales |

---

## 🎮 Interacción del Usuario

1. **Visualizar Canvas completo:**
   - Click en botón "☰" (cuando paneles visibles)
   - O click en "✕" de cualquier panel
   - Paneles se deslizan fuera
   - Canvas ocupa pantalla completa

2. **Mostrar Paneles:**
   - Click en botón "☰" (cuando paneles ocultos)
   - Paneles se deslizan hacia adentro

3. **Expandir Controles:**
   - Click en header de sección
   - Sección se expande/contrae con animación
   - Contenido se revela suavemente

4. **Cambiar Valores:**
   - Sliders responden en tiempo real
   - Colores se actualizan instantáneamente
   - Previews muestran color actual

---

## 🔧 Variables CSS Configurables

```css
:root {
    --panel-width: 380px;              /* Ancho de paneles */
    --transition-default: 0.3s ease;   /* Duración animaciones */
    --transition-fast: 0.15s ease;     /* Duración rápida */
    --backdrop-blur: 10px;             /* Desenfoque fondo */
}

/* Breakpoints responsivos */
@media (max-width: 1024px)  { --panel-width: 350px; }
@media (max-width: 768px)   { --panel-width: 100%;  }
@media (max-width: 480px)   { padding ajustado;      }
```

---

## ✅ Checklist de Funcionalidades

- [x] Paneles laterales izquierdo/derecho
- [x] Organización en secciones por contexto
- [x] Headers colapsables con animación
- [x] Preview de colores en headers
- [x] Botón flotante para toggle
- [x] Botones de cierre en móvil
- [x] Responsivo en todos los tamaños
- [x] Animaciones fluidas
- [x] Scrollbar personalizado
- [x] Transiciones suaves
- [x] Canvas sin obstáculos
- [x] Buena jerarquía visual

---

## 📱 Compatibilidad

- ✅ Desktop (1920px+)
- ✅ Laptop (1024px - 1920px)
- ✅ Tablet (768px - 1024px)
- ✅ Móvil (480px - 768px)
- ✅ Móvil pequeño (<480px)

---

## 🎬 Animaciones

| Elemento | Animación | Duración |
|----------|-----------|----------|
| Panel entrada/salida | translateX | 300ms |
| Botón toggle | fadeInOut + scale | 300ms |
| Collapsible expand | maxHeight + opacity | 150ms |
| Slider hover | scale | 100ms |
| Color preview | backgroundColor | 300ms |

---

Resultado: **UI/UX Profesional, Moderno y Responsivo** ✨
