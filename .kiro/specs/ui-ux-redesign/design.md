# Design Document — UI/UX Redesign

## Overview

Rediseño visual integral del frontend de Lookitry. El objetivo es unificar la identidad de marca en todas las páginas autenticadas y de confirmación, sin tocar lógica de negocio, APIs ni funcionalidad existente.

Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS.

**Scope:**
- Shared UI components (`frontend/src/components/ui/`) — Button, Card, Input, Spinner
- DashboardLayout (`frontend/src/components/dashboard/DashboardLayout.tsx`)
- Dashboard sub-pages (`/dashboard/*`) — products, analytics, settings, usage, subscription, generations, profile
- Admin layout y sub-páginas (`/admin/*`)
- Auth pages (`/login`, `/register`) — solo correcciones de inconsistencias de marca
- Confirmation pages (`/pago-exitoso`, `/trial-activado`)

**Fuera de scope (prohibido modificar):**
- Landing page (`/`)
- Checkout (`/checkout`, `/dashboard/checkout`, `/dashboard/checkout-landing`)
- Mini-landing templates (`frontend/src/components/mini-landing/`)
- Cualquier lógica de negocio, APIs o funcionalidad

---

## Architecture

El sistema ya tiene una arquitectura de design tokens bien definida en `globals.css`. El rediseño no introduce nueva arquitectura — refuerza el uso correcto de los tokens existentes.

```
globals.css (fuente de verdad)
  └── CSS Variables (--bg-base, --bg-card, --border-color, etc.)
        ├── Shared Components (Button, Card, Input, Spinner)
        ├── DashboardLayout (sidebar, header, main)
        ├── AdminLayout (sidebar, header, main)
        ├── Dashboard sub-pages
        ├── Auth pages
        └── Confirmation pages
```

**Principio central:** Toda referencia a color, fondo o borde en los componentes en scope DEBE usar variables CSS del design system, nunca valores hardcodeados de Tailwind (`bg-white`, `text-gray-900`, `border-gray-200`) ni colores hexadecimales directos excepto el accent `#FF5C3A` y los colores de estado definidos.

**Modo oscuro:** Implementado con la clase `.dark` en `<html>`. Las variables CSS ya tienen overrides para dark mode en `globals.css`. No se requiere ningún cambio en la lógica del ThemeToggle.

---

## Components and Interfaces

### 1. Shared UI Components

#### Button (`frontend/src/components/ui/Button.tsx`)

El componente actual ya usa `#FF5C3A` para la variante primary. Los cambios necesarios son:

- Agregar `cursor-pointer` explícito en la clase base
- Agregar `focus-visible:ring-2 focus-visible:ring-[#FF5C3A]/50 focus-visible:outline-none` en la clase base
- La variante `secondary` ya usa `var(--border-color)` y `var(--bg-card)` — correcto
- La variante `ghost` ya usa `var(--text-secondary)` — correcto

```tsx
// Clase base actualizada
const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A]/50
  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
```

#### Card (`frontend/src/components/ui/Card.tsx`)

El componente actual ya usa `var(--bg-card)` y `var(--border-color)` — correcto. Los cambios necesarios son:

- Agregar variante `interactive` con `cursor-pointer hover:border-[#FF5C3A]/40 hover:shadow-md transition-all duration-200`
- Agregar `motion-safe:hover:scale-[1.01]` para cards interactivas (respeta `prefers-reduced-motion`)

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean; // nueva prop
}
```

#### Input (`frontend/src/components/ui/Input.tsx`)

El componente actual ya tiene `focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A]`. Los cambios necesarios son:

- Cambiar `backgroundColor: 'var(--bg-card)'` por `backgroundColor: 'var(--bg-input)'` para usar el token correcto
- Agregar `cursor-text` explícito

#### Spinner (`frontend/src/components/ui/Spinner.tsx`)

Sin cambios necesarios — ya usa `#FF5C3A` correctamente.

---

### 2. DashboardLayout

El layout actual (`frontend/src/components/dashboard/DashboardLayout.tsx`) ya implementa la mayoría del diseño correcto. Los cambios necesarios son:

**Sidebar:**
- Ya usa `var(--bg-sidebar)`, `#1f1f1f` para bordes internos — correcto
- Ya usa `#FF5C3A` para item activo — correcto
- Ya usa `var(--bg-sidebar-hover)` para hover — correcto
- Agregar `cursor-pointer` explícito en todos los `<Link>` del nav

**Header:**
- Ya usa `var(--bg-header)`, `var(--border-color)`, `var(--shadow-header)` — correcto
- Verificar que el `main` tenga `pt-14` (compensación por header sticky de 56px)

**Email verification banner:**
- Cambiar `bg-[#0a0a0a]` → `var(--bg-card)`
- Cambiar `border-[#1a1a1a]` → `var(--border-color)`

**Mobile drawer:**
- Ya implementado con `transition-transform duration-200 ease-in-out` — correcto
- Agregar `overflow-hidden` al body cuando el drawer está abierto

---

### 3. AdminLayout

El layout actual (`frontend/src/app/admin/layout.tsx`) ya implementa la mayoría del diseño correcto. Los cambios son mínimos:

- Sidebar: ya usa `var(--bg-sidebar)`, `#FF5C3A` para activo, `var(--bg-sidebar-hover)` para hover — correcto
- Header: ya usa `var(--bg-header)`, `var(--border-color)`, `var(--shadow-header)` — correcto
- Agregar `cursor-pointer` en todos los `<Link>` del nav
- Los group labels ya usan `#4a4a4a` — correcto, no es un Prohibited_Color

---

### 4. Dashboard Sub-pages

**Patrón de error alert (corrección universal):**
```tsx
// ANTES (rompe en dark mode)
<div className="border border-red-200 bg-red-50 text-red-700">

// DESPUÉS (correcto)
<div className="border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]">
```

**Patrón de success alert (corrección universal):**
```tsx
// ANTES
<div className="border border-emerald-200 bg-emerald-50 text-emerald-700">

// DESPUÉS
<div className="border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]">
```

**Páginas afectadas por corrección de alerts:**
- `usage/page.tsx` — error alert usa `border-red-200 bg-red-50 text-red-700`
- `trial-activado/page.tsx` — texto usa `text-[#333]` (Prohibited_Color)
- `pago-exitoso/page.tsx` — texto usa `text-[#444]` y `text-[#666]` (Prohibited_Colors)

**Analytics page:** Ya usa `var(--bg-card)`, `var(--border-color)`, `bg-[#FF5C3A]/10` — correcto.

**KPI cards:** Máximo 4-6 por vista. Las páginas que muestran más de 6 stats deben reorganizarse en grupos o usar tabs.

---

### 5. Auth Pages

Los componentes de auth (`LoginForm`, `RegisterForm`) tienen hardcoded colors que deben migrar a variables CSS.

**Cambios en LoginForm/RegisterForm:**

| Elemento | Antes | Después |
|---|---|---|
| Page background | `bg-[#0a0a0a]` | `var(--bg-base)` |
| Card background | `bg-[#141414]` | `var(--bg-card)` |
| Card border | `border-[#2a2a2a]` | `var(--border-color)` |
| Input background | `bg-[#0f0f0f]` | `var(--bg-input)` |
| Input border | `border-[#2a2a2a]` | `var(--border-color)` |
| Labels | `text-[#888]` | `var(--text-secondary)` |
| Link text | `text-[#444]` | `var(--text-muted)` |
| Error message | `text-[#ff6b6b]` | `text-[#ef4444]` |
| Error alert | `bg-red-50 text-red-700` | `bg-[#ef4444]/10 text-[#ef4444]` |

Logo pattern (ya correcto en la mayoría):
```tsx
<Image src="/logo.svg" alt="Lookitry" width={28} height={28} />
<span className="font-jakarta font-extrabold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
  Look<span style={{ color: '#FF5C3A' }}>itry</span>
</span>
```

---

### 6. Confirmation Pages

#### `/pago-exitoso`

**Cambios necesarios:**
- `bg-[#0a0a0a]` → `style={{ backgroundColor: 'var(--bg-base)' }}`
- `bg-[#141414]` → `style={{ backgroundColor: 'var(--bg-card)' }}`
- `border-[#2a2a2a]` → `style={{ borderColor: 'var(--border-color)' }}`
- `text-[#666]` → `style={{ color: 'var(--text-secondary)' }}`
- `text-[#444]` → `style={{ color: 'var(--text-muted)' }}` (Prohibited_Color)
- `text-[#888]` → `style={{ color: 'var(--text-secondary)' }}`
- El botón primario ya usa `bg-[#FF5C3A]` — correcto
- El botón secundario: `border-[#2a2a2a]` → `var(--border-color)`, `text-[#666]` → `var(--text-secondary)`
- Agregar `cursor-pointer` en ambos botones/links
- El loading spinner ya usa `border-[#FF5C3A]` — correcto

#### `/trial-activado`

**Cambios necesarios:**
- `bg-[#0a0a0a]` → `style={{ backgroundColor: 'var(--bg-base)' }}`
- `bg-[#141414]` → `style={{ backgroundColor: 'var(--bg-card)' }}`
- `border-[#2a2a2a]` → `style={{ borderColor: 'var(--border-color)' }}`
- `text-[#555]` → `style={{ color: 'var(--text-secondary)' }}` (Prohibited_Color)
- `text-[#333]` → `style={{ color: 'var(--text-muted)' }}` (Prohibited_Color)
- `text-[#444]` → `style={{ color: 'var(--text-muted)' }}` (Prohibited_Color)
- `bg-[#0f2a1a]` → `bg-[#10b981]/10` (más semántico y adaptable)
- El logo: agregar `<Image src="/logo.svg" />` junto al texto (actualmente solo texto)
- El botón ya usa `bg-[#FF5C3A]` — correcto
- Agregar `cursor-pointer` en el botón

---

### 7. Responsive Behavior

```
Breakpoints:
  375px  — mobile S: sidebar oculto, single column, full-width cards
  768px  — tablet: sidebar oculto (drawer), 2-col grids
  1024px — laptop: sidebar persistente visible, multi-col grids
  1440px — desktop: sidebar persistente, max-width containers
```

**Sidebar behavior:**
- `< 1024px` (`lg` breakpoint en Tailwind): sidebar oculto, hamburger visible en header
- `≥ 1024px`: sidebar fijo de 240px (`w-60`), main content con `lg:pl-60`

**Main content:**
- Siempre `overflow-x-hidden` para prevenir scroll horizontal
- Header sticky con `h-14` (56px), main content con `pt-0` (el padding ya está en el layout)
- Tablas siempre envueltas en `overflow-x-auto`

**Grid patterns:**
```
KPI cards:    grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
Form fields:  w-full md:max-w-lg
Tables:       overflow-x-auto wrapper
```

---

## Data Models

Este rediseño es puramente visual — no introduce ni modifica modelos de datos. Los únicos "datos" relevantes son los tokens del design system:

### Design Tokens (ya definidos en `globals.css`)

```
Color Tokens:
  --color-accent:    #FF5C3A  (único, inmutable)
  --color-dark:      #0a0a0a
  --color-warm:      #f5f2ee

Layout Tokens (light mode):
  --bg-base:         #f5f2ee
  --bg-card:         #ffffff
  --bg-sidebar:      #0a0a0a
  --bg-sidebar-hover:#1a1a1a
  --bg-header:       #ffffff
  --bg-hover:        #ede9e4
  --bg-input:        #ffffff
  --border-color:    #e0dcd7
  --shadow-header:   0 1px 3px rgba(0,0,0,0.08)

Layout Tokens (dark mode — clase .dark):
  --bg-base:         #0a0a0a
  --bg-card:         #141414
  --bg-sidebar:      #0a0a0a
  --bg-sidebar-hover:#1f1f1f
  --bg-header:       #111111
  --bg-hover:        #1a1a1a
  --bg-input:        #0f0f0f
  --border-color:    #2a2a2a
  --shadow-header:   0 1px 3px rgba(0,0,0,0.4)

Text Tokens (light):
  --text-primary:    #0a0a0a
  --text-secondary:  #6b6560
  --text-muted:      #9c9590
  --text-sidebar:    #d4d0cc

Text Tokens (dark):
  --text-primary:    #f5f2ee
  --text-secondary:  #a09b96
  --text-muted:      #6b6560
  --text-sidebar:    #a09b96

Status Colors (fijos, no cambian con el tema):
  info:    #3b82f6
  warning: #f59e0b
  error:   #ef4444
  success: #10b981

Typography:
  --font-jakarta:  Plus Jakarta Sans (títulos, h1-h6)
  --font-dm-sans:  DM Sans (cuerpo, párrafos)
```

### Prohibited Values

Los siguientes valores NO deben aparecer en ningún componente en scope:

```
Prohibited text colors: #333, #444, #555 (demasiado oscuros para dark mode)
Prohibited bg classes:  bg-white, bg-gray-50, bg-gray-100 (no adaptan a dark mode)
Prohibited border:      border-gray-200, border-gray-300
Prohibited text:        text-gray-900, text-gray-800, text-gray-700
Prohibited toggle:      bg-blue-600, bg-blue-500 (usar #FF5C3A)
Prohibited icons:       emoji characters (usar SVG o lucide-react)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CSS variables para todos los colores

*For any* componente en scope (Dashboard, Admin, Auth, Confirmation), todos los valores de color para fondos, bordes y texto deben usar variables CSS del design system (`var(--bg-*)`, `var(--border-color)`, `var(--text-*)`) en lugar de clases Tailwind hardcodeadas (`bg-white`, `border-gray-200`, `text-gray-900`) o valores hexadecimales directos (excepto `#FF5C3A` y los colores de estado definidos).

**Validates: Requirements 1.1, 8.1, 8.3, 8.4**

---

### Property 2: Contraste mínimo 7:1 en dark mode

*For any* elemento de texto en cualquier componente en scope, cuando la clase `.dark` está aplicada al `<html>`, el ratio de contraste entre el color del texto y el color de fondo debe ser mayor o igual a 7:1 para texto primario y mayor o igual a 4.5:1 para texto secundario.

**Validates: Requirements 1.2, 2.9, 8.2, 8.7, 9.5**

---

### Property 3: Sin Prohibited_Colors en texto

*For any* elemento de texto en cualquier componente en scope, el color del texto no debe ser `#333`, `#444`, ni `#555`. El gris mínimo permitido para texto secundario es `#999` o el equivalente en variables CSS (`var(--text-muted)` que resuelve a `#6b6560` en dark y `#9c9590` en light).

**Validates: Requirements 1.6, 5.3**

---

### Property 4: Elementos interactivos — cursor, transiciones e iconos

*For any* elemento interactivo (botón, link, card clickeable, toggle) en cualquier componente en scope:
- Debe tener `cursor-pointer` aplicado
- Las transiciones de hover deben estar entre 150ms y 300ms (`duration-150` a `duration-300`)
- Los iconos deben ser elementos SVG o componentes de `lucide-react`, nunca caracteres emoji

**Validates: Requirements 1.8, 3.13, 5.7, 7.1, 7.4, 7.5, 7.8**

---

### Property 5: Estado activo del sidebar

*For any* item de navegación en el sidebar (Dashboard o Admin), cuando ese item corresponde a la ruta activa actual, debe tener `background-color: #FF5C3A` y `color: #ffffff`. Ningún otro item debe tener ese background.

**Validates: Requirements 3.2, 5.1**

---

### Property 6: Estado hover del sidebar

*For any* item de navegación en el sidebar que no está activo, al hacer hover debe aplicarse `var(--bg-sidebar-hover)` como background y al quitar el hover debe volver a `transparent`.

**Validates: Requirements 3.3**

---

### Property 7: Tipografía de títulos en Dashboard y Admin

*For any* elemento `h1` en cualquier página del Dashboard o Admin panel, debe tener la clase `font-jakarta` (o `font-family: var(--font-jakarta)`) y el color `var(--text-primary)`.

**Validates: Requirements 3.6, 5.5**

---

### Property 8: Sidebar como drawer en mobile

*For any* viewport con ancho menor a 1024px, el sidebar persistente debe estar oculto (`hidden` o `translate-x-full`) y debe existir un botón hamburger visible en el header que al presionarse muestre el sidebar como un drawer overlay con backdrop semitransparente.

**Validates: Requirements 3.10, 5.6, 6.3**

---

### Property 9: Cards y alerts usan colores del design system

*For any* card de datos, alerta de error o alerta de éxito en cualquier sub-página del Dashboard o Admin:
- Cards: deben usar `var(--bg-card)` y `var(--border-color)`
- Error alerts: deben usar `bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]`
- Success alerts: deben usar `bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]`
- Nunca deben usar `bg-red-50`, `bg-emerald-50`, `border-red-200`, `border-emerald-200`

**Validates: Requirements 4.1, 4.2, 4.3, 4.8, 4.10, 8.5**

---

### Property 10: Sin overflow horizontal en ningún breakpoint

*For any* página en scope (Dashboard, Admin, Auth, Confirmation) renderizada en cualquiera de los breakpoints definidos (375px, 768px, 1024px, 1440px), el ancho del contenido no debe exceder el ancho del viewport (sin scroll horizontal).

**Validates: Requirements 6.1, 6.7, 6.8, 9.7**

---

### Property 11: Hover feedback en cards interactivas

*For any* card o contenedor interactivo (clickeable) en cualquier componente en scope, al hacer hover debe proporcionar feedback visual mediante `hover:border-[#FF5C3A]/40` o `hover:shadow-md`, con transición `transition-all duration-200`.

**Validates: Requirements 7.3**

---

### Property 12: Alt text en imágenes

*For any* elemento `<img>` o componente `<Image>` en cualquier componente en scope, debe tener un atributo `alt` con texto descriptivo no vacío.

**Validates: Requirements 7.6**

---

### Property 13: Respeto a prefers-reduced-motion

*For any* animación basada en transformaciones (translate, scale) en cualquier componente en scope, debe estar envuelta con el prefijo `motion-safe:` de Tailwind para que no se ejecute cuando el usuario tiene `prefers-reduced-motion: reduce` activado.

**Validates: Requirements 7.7**

---

### Property 14: Toggle activo usa Accent_Color

*For any* elemento toggle o switch en cualquier componente en scope, el estado activo debe usar `#FF5C3A` como color de fondo. Nunca debe usar `bg-blue-600`, `bg-blue-500` u otros colores no pertenecientes al design system.

**Validates: Requirements 1.5**

---

### Property 15: Máximo 4-6 KPI cards por vista

*For any* vista del Dashboard que muestre KPI/stat cards, el número de cards en la fila principal no debe exceder 6. Si hay más métricas, deben organizarse en secciones secundarias o tabs.

**Validates: Requirements 3.14**

---

### Property 16: Stat cards en columna única en mobile

*For any* grid de stat cards en el Dashboard renderizado en viewport menor a 768px, las cards deben apilarse en una sola columna (`grid-cols-1`).

**Validates: Requirements 4.9, 6.2**

---

## Error Handling

Este rediseño es puramente visual. Los únicos "errores" relevantes son violaciones del design system:

**Violaciones detectadas en el código actual (a corregir):**

| Archivo | Violación | Corrección |
|---|---|---|
| `usage/page.tsx` | `border-red-200 bg-red-50 text-red-700` | `border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]` |
| `trial-activado/page.tsx` | `text-[#333]`, `text-[#555]`, `text-[#444]` | `var(--text-muted)`, `var(--text-secondary)` |
| `pago-exitoso/page.tsx` | `text-[#444]`, `text-[#666]`, `bg-[#0a0a0a]` hardcoded | Variables CSS |
| `LoginForm.tsx` | `bg-[#0a0a0a]`, `bg-[#141414]`, `text-[#888]`, `text-[#444]` | Variables CSS |
| `RegisterForm.tsx` | Mismos problemas que LoginForm | Variables CSS |
| `DashboardLayout.tsx` | Email banner usa `bg-[#0a0a0a]` hardcoded | `var(--bg-card)` |
| `Input.tsx` | Usa `var(--bg-card)` en lugar de `var(--bg-input)` | `var(--bg-input)` |

**Estrategia de corrección:** Cada archivo se corrige de forma independiente. Los cambios son aditivos (agregar variables CSS) o sustitutivos (reemplazar hardcoded por variables). No hay riesgo de regresión funcional.

---

## Testing Strategy

### Enfoque dual: Unit tests + Property-based tests

Los tests son complementarios. Los unit tests verifican ejemplos concretos y casos edge. Los property tests verifican que las propiedades universales se cumplan para cualquier input generado.

### Unit Tests

Verifican comportamientos específicos y casos concretos:

- **Button**: renderiza con `cursor-pointer`, tiene `focus-visible:ring-2 focus-visible:ring-[#FF5C3A]/50`, variante primary usa `bg-[#FF5C3A]`
- **Input**: usa `var(--bg-input)` en background, muestra error con `text-[#ef4444]`
- **Card**: renderiza con `var(--bg-card)` y `var(--border-color)`, variante interactive tiene `cursor-pointer`
- **DashboardLayout**: header tiene `var(--bg-header)`, sidebar tiene `var(--bg-sidebar)`
- **ThemeToggle**: toggle `.dark` class en `<html>` al hacer click
- **Confirmation pages**: contienen checkmark SVG, botón primario con `bg-[#FF5C3A]`, usan `var(--bg-base)` y `var(--bg-card)`
- **Auth pages**: inputs usan `var(--bg-input)`, labels usan `var(--text-secondary)`, error usa `text-[#ef4444]`

### Property-Based Tests

Librería: **fast-check** (TypeScript/JavaScript, compatible con Jest/Vitest).

Configuración mínima: **100 iteraciones** por propiedad.

Cada test debe incluir un comentario de trazabilidad:
```
// Feature: ui-ux-redesign, Property {N}: {property_text}
```

**Property 1 — CSS variables para todos los colores:**
```
// Feature: ui-ux-redesign, Property 1: CSS variables para todos los colores
// Para cualquier componente en scope, los colores usan variables CSS
// Genera: lista aleatoria de componentes en scope
// Verifica: ningún className contiene bg-white, bg-gray-*, text-gray-*, border-gray-*
```

**Property 2 — Contraste mínimo en dark mode:**
```
// Feature: ui-ux-redesign, Property 2: Contraste mínimo 7:1 en dark mode
// Para cualquier componente renderizado con .dark, el contraste es >= 7:1
// Genera: componentes aleatorios con clase .dark aplicada
// Verifica: getComputedStyle contraste >= 7:1 para texto primario
```

**Property 3 — Sin Prohibited_Colors:**
```
// Feature: ui-ux-redesign, Property 3: Sin Prohibited_Colors en texto
// Para cualquier componente en scope, no aparecen #333, #444, #555
// Genera: lista de archivos de componentes en scope
// Verifica: ningún archivo contiene text-[#333], text-[#444], text-[#555]
```

**Property 4 — Elementos interactivos:**
```
// Feature: ui-ux-redesign, Property 4: cursor-pointer + transiciones + SVG icons
// Para cualquier elemento interactivo, tiene cursor-pointer y transición 150-300ms
// Genera: elementos interactivos aleatorios del DOM renderizado
// Verifica: cursor === 'pointer', transition-duration entre 150ms y 300ms
```

**Property 9 — Cards y alerts usan design system:**
```
// Feature: ui-ux-redesign, Property 9: Cards y alerts usan colores del design system
// Para cualquier alert de error/success, usa clases opacity-based
// Genera: estados de error/success aleatorios en sub-páginas
// Verifica: className contiene bg-[#ef4444]/10 o bg-[#10b981]/10, no bg-red-50
```

**Property 10 — Sin overflow horizontal:**
```
// Feature: ui-ux-redesign, Property 10: Sin overflow horizontal en ningún breakpoint
// Para cualquier página en scope en cualquier breakpoint, scrollWidth <= clientWidth
// Genera: viewports aleatorios de {375, 768, 1024, 1440}px
// Verifica: document.documentElement.scrollWidth <= window.innerWidth
```

**Property 12 — Alt text en imágenes:**
```
// Feature: ui-ux-redesign, Property 12: Alt text en imágenes
// Para cualquier imagen en scope, tiene alt no vacío
// Genera: componentes aleatorios con imágenes
// Verifica: img.alt !== '' && img.alt !== undefined
```

### Notas de implementación

- Los property tests de contraste (P2) requieren `@testing-library/react` + `jest-environment-jsdom` con `getComputedStyle`
- Los property tests de overflow (P10) son más efectivos como tests de integración con Playwright/Cypress a los breakpoints definidos
- Los property tests de CSS variables (P1, P3) pueden implementarse como análisis estático de archivos (AST scan) además de tests de runtime
- Mínimo 100 iteraciones por propiedad: `fc.assert(fc.property(...), { numRuns: 100 })`
