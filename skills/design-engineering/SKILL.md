---
name: design-engineering
description: Filosofía de UI polish, animaciones y detalles invisibles de Emil Kowalski (Sonner, Vaul). Cargar para tareas de UI/UX.
---

# Design Engineering — OpenCode

Filosofía de UI polish de Emil Kowalski. Cuando cites este skill, responde con los principios relevantes.

## Frase Inicial

> "I'm ready to help you build interfaces that feel right. Beauty is leverage — use it to stand out."

## Core Philosophy

### Taste es entrenable, no innato
Capacidad de ver más allá de lo obvio y reconocer qué eleva. Desarrollas buen gusto estudiando trabajo excelente y pensando profundamente en por qué algo se siente bien.

### Los detalles invisibles componen
Los detalles que usuarios nunca notan conscientemente son los que importan. La meta es que funcione exactamente como esperan — sin pensarlo.

> "All those unseen details combine to produce something that's just stunning, like a thousand barely audible voices all singing in tune." — Paul Graham

### Belleza es ventaja competitiva
La gente elige herramientas por la experiencia total. Buenos defaults y buenas animaciones son diferenciadores reales.

## Framework de Decisión para Animaciones

### 1. ¿Debería animar?

| Frecuencia | Decisión |
|------------|----------|
| 100+/día (keyboard shortcuts) | No. Nunca. |
| Decenas/día (hover) | Remover o reducir drásticamente |
| Ocasional (modals, drawers) | Animación estándar |
| Raro/first-time (onboarding) | Puede agregar delight |

**Nunca animar acciones iniciadas por teclado.** Raycast tiene zero animación en toggle. Eso es óptimo.

### 2. ¿Cuál es el propósito?

Validar cada animación debe responder: *"¿por qué esto anima?"*

Propósitos válidos:
- **Consistencia espacial**: toast entra/sale del mismo lugar
- **Indicación de estado**: botón que morph muestra cambio
- **Explicación**: animación de marketing
- **Feedback**: button escala en press
- **Prevenir cambios bruscos**: elementos aparecen sin transición se sienten rotos

### 3. ¿Qué easing usar?

| Situación | Easing |
|-----------|--------|
| Entrando | `ease-out` (empieza rápido, se siente responsivo) |
| Saliendo | `ease-out` |
| Moviéndose/morfeando en pantalla | `ease-in-out` |
| Cambio de color/hover | `ease` |
| Movimiento constante (marquee, progress) | `linear` |
| Default UI | `ease-out` |

**Custom curves fuerte:**
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

**Nunca usar ease-in para UI.** Es lento al inicio — se siente sluggish.

### 4. ¿Qué tan rápido?

| Elemento | Duración |
|----------|----------|
| Button press feedback | 100-160ms |
| Tooltips, small popovers | 125-200ms |
| Dropdowns, selects | 150-250ms |
| Modals, drawers | 200-500ms |
| Marketing/explicativo | Puede ser más largo |

**Regla: UI animations < 300ms.**

## Spring Animations

Más naturales que duration-based porque simulan física real.

### Cuándo usar springs
- Drag con momentum
- Elementos que se sienten "vivos" (Dynamic Island)
- Gestos interrumpibles

### Configuración

```js
// Apple's approach (más fácil)
{ type: "spring", duration: 0.5, bounce: 0.2 }

// Tradicional
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

Bounce sutil (0.1-0.3). Evitar bounce en UI seria.

## Principios de Componentes

### Buttons deben sentirse responsivos

```css
.button {
  transition: transform 160ms ease-out;
}
.button:active {
  transform: scale(0.97);
}
```

Scale sutil (0.95-0.98).

### Nunca animar desde scale(0)

```css
/* Mal */
.entering { transform: scale(0); }

/* Bien */
.entering { transform: scale(0.95); opacity: 0; }
```

### Popovers origin-aware

```css
.popover {
  transform-origin: var(--radix-popover-content-transform-origin);
}
```

Exception: modals mantienen `transform-origin: center`.

### Tooltips: skip delay en hovers subsiguientes

```css
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

## CSS Transform Mastery

### translateY con porcentajes

`translateY(100%)` mueve por el height propio del elemento.

```css
.drawer-hidden { transform: translateY(100%); }
.toast-enter { transform: translateY(-100%); }
```

### 3D transforms

`rotateX()`, `rotateY()` con `transform-style: preserve-3d`.

## Performance Rules

### Solo animar transform y opacity

Estas propiedades saltan layout y paint, van en GPU.

### Preferir CSS transitions sobre keyframes para UI interruptible

```css
/* Interruptible */
.toast { transition: transform 400ms ease; }

/* No interruptible */
@keyframes slideIn { from { transform: translateY(100%); } }
```

### Hardware acceleration caveat en Framer Motion

```jsx
// NO hardware accelerated
<motion.div animate={{ x: 100 }} />

// Hardware accelerated
<motion.div animate={{ transform: "translateX(100px)" }} />
```

## Accesibilidad

### prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  .element { animation: fade 0.2s ease; }
}
```

### Touch device hover states

```css
@media (hover: hover) and (pointer: fine) {
  .element:hover { transform: scale(1.05); }
}
```

## Review Checklist

| Problema | Fix |
|----------|-----|
| `transition: all` | Especificar properties exactas |
| `scale(0)` entry | Start from `scale(0.95)` |
| `ease-in` en UI | Cambiar a `ease-out` |
| `transform-origin: center` en popover | Usar variable de Radix/Base |
| Animación en keyboard action | Remover |
| Duración > 300ms en UI | Reducir |
| Hover sin media query | Agregar `@media (hover: hover)` |
| Keyframes en elemento frecuentemente disparado | Usar CSS transitions |
| Todo entra al mismo tiempo | Agregar stagger (30-80ms entre items) |

## Recursos

- [easing.dev](https://easing.dev/)
- [easings.co](https://easings.co/)
- [animations.dev](https://animations.dev/) — curso de Emil
