# 🎈 Actualización - Paneles Flotantes y Minimizables

## ✨ Nuevas Características

### 1. **Paneles Flotantes** 🎪

Los paneles ahora no están pegados a los bordes, sino **flotando con margen**.

```
ANTES:
┌────────────────────────────┐
│Panel│Canvas│Panel│
│pegado│ en centro│pegado│
└────────────────────────────┘

DESPUÉS:
╔═════════════════════════════╗
║ ┌──┐           ┌──┐        ║
║ │P1│  Canvas   │P2│        ║
║ │  │  Limpio   │  │        ║
║ └──┘           └──┘        ║
║ (con margen)  (con margen)  ║
╚═════════════════════════════╝
```

#### Ventajas:
- ✅ Canvas más visible
- ✅ Mejor espaciado visual
- ✅ Diseño más moderno
- ✅ Márgenes configurables

#### CSS:
```css
.side-panel.left-panel {
    left: 1rem;           /* Margen del borde izquierdo */
    top: 1rem;            /* Margen del borde superior */
}

.side-panel.right-panel {
    right: 1rem;          /* Margen del borde derecho */
    top: 1rem;            /* Margen del borde superior */
}

/* Los paneles tienen altura automática */
.side-panel {
    height: auto;
    max-height: calc(100vh - 2rem);  /* Máximo hasta abajo */
}
```

---

### 2. **Paneles Minimizables** 📦

Cada panel ahora tiene un **botón de minimizar (−)** que permite:
- Colapsar el contenido
- Ver solo el título
- Maximizar el espacio del canvas

```
PANEL EXPANDIDO:
┌─────────────────┐
│ − ✕             │ ← Botones
├─────────────────┤
│ Tipo de Fondo   │
│ [Selector ▼]    │
│                 │
│ ▼ Controles...  │
│   [Contenido]   │
│                 │
│ ▼ Colores...    │
│   [Contenido]   │
└─────────────────┘

PANEL MINIMIZADO:
┌─────────────────┐
│ + ✕             │ ← Botón cambió a "+"
└─────────────────┘
(Todo lo demás oculto)
```

#### Funcionalidad:
- Click en **−** → minimiza el panel
- Click en **+** → expande el panel
- El icono cambia dinámicamente
- Animaciones suaves

#### HTML:
```html
<div class="panel-buttons">
    <button id="minimize-left-panel" class="panel-btn">−</button>
    <button id="close-left-panel" class="panel-btn">✕</button>
</div>
```

#### CSS:
```css
.side-panel.minimized {
    max-height: auto;  /* Solo el header */
    width: auto;       /* Ancho mínimo */
}

.side-panel.minimized .panel-content {
    display: none;     /* Oculta contenido */
}
```

#### JavaScript:
```javascript
function toggleMinimize(panel, btn) {
    panel.classList.toggle('minimized');
    btn.textContent = panel.classList.contains('minimized') ? '+' : '−';
}
```

---

### 3. **Diseño Mejorado** 🎨

#### Nuevos Estilos:

**Botones de control:**
```css
.panel-btn {
    background: rgba(59, 130, 246, 0.2);     /* Fondo azul suave */
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: var(--color-gray-300);
    font-size: 1rem;
    padding: 0.375rem 0.625rem;
    border-radius: 0.375rem;
    min-width: 32px;
    height: 32px;
    transition: all var(--transition-fast);
}

.panel-btn:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
    color: var(--color-white);
}

.panel-btn:active {
    background: rgba(59, 130, 246, 0.4);
    transform: scale(0.95);
}
```

**Header redondeado:**
```css
.panel-header {
    border-radius: 0.75rem 0.75rem 0 0;
}

.side-panel {
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

---

## 🎯 Interacciones del Usuario

### Mostrar/Ocultar Paneles Completos
1. Click en botón flotante **☰** (cuando están ocultos)
2. O click en botón **✕** en cualquier panel
3. Los paneles se deslizan suavemente

### Minimizar/Expandir Paneles
1. Click en botón **−** del panel
2. El panel se minimiza (solo header visible)
3. Click en **+** para expandir de nuevo
4. Canvas se ve mejor cuando están minimizados

### Cerrar Paneles
1. Click en botón **✕**
2. Los paneles salen de pantalla
3. Botón flotante ☰ aparece

---

## 📐 Espaciado Responsive

### Desktop (>1024px)
- Margen paneles: **1rem** (16px)
- Ancho panel: **380px**
- Altura máxima: **calc(100vh - 2rem)**

### Tablet (768px - 1024px)
- Margen paneles: **0.75rem** (12px)
- Ancho panel: **320px**
- Altura máxima: **calc(100vh - 1.5rem)**

### Móvil (480px - 768px)
- Margen paneles: **0.5rem** (8px)
- Ancho panel: **280px**
- Altura máxima: **calc(100vh - 1rem)**

### Móvil pequeño (<480px)
- Margen paneles: **0.5rem**
- Ancho panel: **calc(100vw - 1rem)** (casi fullscreen)
- Altura máxima: **calc(100vh - 5rem)**

---

## 🎬 Estados de los Paneles

### Estados Posibles:

1. **Visible y Expandido** (por defecto)
   ```
   Panel completamente visible con todo el contenido
   ```

2. **Visible y Minimizado**
   ```
   Panel solo con header visible
   Contenido oculto para ver más canvas
   ```

3. **Oculto**
   ```
   Panel sale de pantalla (transformX)
   Botón flotante aparece
   Canvas ocupa pantalla completa
   ```

---

## 🔄 Transiciones y Animaciones

```css
/* Paneles flotantes */
.side-panel {
    transition: all 0.3s ease;  /* Animación suave */
}

/* Botones */
.panel-btn {
    transition: all 0.15s ease;  /* Rápido y responsivo */
}

/* Minimización */
.side-panel.minimized {
    /* Colapso automático sin animación específica */
    /* El CSS maneja el cambio de tamaño */
}
```

---

## 💡 Casos de Uso

### Caso 1: Visualización Máxima
```
Usuario: "Quiero ver el fondo completo"
→ Minimiza ambos paneles (− → +)
→ Resultado: Solo headers visibles
→ Canvas visible al 100%
```

### Caso 2: Ajuste de Colores
```
Usuario: "Ajusto colores"
→ Panel derecho expandido
→ Panel izquierdo minimizado
→ Resultado: Enfoque en colores
```

### Caso 3: Oscurecer Fondo
```
Usuario: "Oculto paneles"
→ Click en ☰
→ Paneles salen completamente
→ Resultado: Canvas completo sin UI
```

---

## 📋 Checklist de Funcionalidades

- [x] Paneles flotantes con margen
- [x] Borde redondeado en paneles
- [x] Sombra de profundidad
- [x] Botón minimizar (−)
- [x] Botón cerrar (✕)
- [x] Icono dinámico (−/+)
- [x] Minimización suave
- [x] Responsive en móvil
- [x] Margen adaptativo
- [x] Altura máxima calculada
- [x] Sin perder funcionalidad
- [x] Animaciones fluidas

---

## 🎨 Visualización Completa

```
┌───────────────────────────────────────────────────┐
│                                                   │
│ ┌──────────────┐                 ┌──────────────┐ │
│ │ − ✕          │                 │ − ✕          │ │
│ ├──────────────┤                 ├──────────────┤ │
│ │ Config       │    CANVAS       │ Colores      │ │
│ │ [Controles]  │    (Limpio)     │ [L/C/H]      │ │
│ │              │                 │              │ │
│ └──────────────┘                 └──────────────┘ │
│                                                   │
│                      [☰]                         │
│               (cuando ocultos)                    │
└───────────────────────────────────────────────────┘

MINIMIZADOS:
┌──────────────┐                 ┌──────────────┐
│ + ✕          │    CANVAS (/)   │ + ✕          │
└──────────────┘    Más espacio   └──────────────┘

OCULTOS:
                 CANVAS (Completo)
                 [☰] (visible)
```

---

## 🚀 Mejoras Técnicas

### Antes:
- Paneles pegados a bordes
- Altura 100vh
- No minimizables

### Después:
- Paneles flotantes con margen
- Altura automática/máxima
- Minimizables con un click
- Bordes redondeados
- Sombra de profundidad
- Botones mejorados
- Más espacio para canvas

---

## ⚡ Performance

- ✅ Sin JavaScript pesado
- ✅ Solo `classList.toggle()`
- ✅ CSS transitions suaves
- ✅ Sin afectar la animación WebGL

---

¡Resultado: Interfaz moderna, flexible y orientada al usuario! 🎉
