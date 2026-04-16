# SPEC: Widget Collection (Playlist Destacada)

**Fecha:** 2026-04-16
**Autor:** Sammy (Orquestadora)
** Tipo:** Feature - Catálogo + Control de Widget
**Versión:** 2.0

---

## 1. Concepto & Visión

Sistema dual que separa **"Mi Catálogo"** (todos los productos creados) de **"Mi Widget"** (playlist destacada). El usuario curadora exactamente qué productos aparecen en su probador virtual, con drag & drop para ordenarlos. La sensación es de un "DJ de moda" mezclando su colección — Apple Music meets Nike SNKRS.

---

## 2. Límites de Productos por Plan (CORREGIDO v2)

| Plan | Min Productos | Max Productos | Notas |
|------|---------------|---------------|-------|
| **TRIAL** | 0 | 1 | Solo para testing |
| **BASIC** | 0 | 5 | Plan estándar inicial |
| **PRO** | 0 | 15 | Incluye templates premium |
| **ENTERPRISE** | 50 | ∞ (Ilimitado) | Minimo 50 productos, ilimitado a partir de alli |

> **Nota:** Los límites se leen desde `pricing_config` en Supabase. El backend usa `PLANS` en `backend/src/config/plans.ts` con la misma jerarquía. Enterprise requiere minimo 50 productos como base.

### 2.1 Lógica de Validación

```typescript
function canAddProduct(brand: Brand, productCount: number): boolean {
  const plan = PLANS[brand.plan];
  if (productCount >= plan.maxProducts) return false;
  return true;
}

function getMinProductsMessage(plan: string): string {
  switch (plan) {
    case 'ENTERPRISE':
      return 'El plan Enterprise requiere un minimo de 50 productos';
    default:
      return '';
  }
}
```

---

## 3. Design Language

### 3.1 Tokens de Diseño (Dark Mode por defecto)

```css
:root {
  /* Colors - Dark Mode (default) */
  --accent: #FF5C3A;
  --accent-glow: rgba(255, 92, 58, 0.25);
  --accent-subtle: rgba(255, 92, 58, 0.1);

  --success: #10B981;
  --success-glow: rgba(16, 185, 129, 0.3);
  --danger: #EF4444;

  --bg-primary: #0a0a0a;
  --bg-card: #141414;
  --bg-card-elevated: #1a1a1a;
  --border-color: #262626;
  --overlay-dark: rgba(10, 10, 10, 0.8);

  --text-primary: #ffffff;
  --text-secondary: #999999;
  --text-muted: #666666;

  --card-bg: var(--bg-card);
  --card-border: var(--border-color);
  --table-header-bg: rgba(255, 255, 255, 0.03);
  --btn-bg: rgba(255, 255, 255, 0.05);
  --pill-bg: rgba(255, 255, 255, 0.08);
  --pill-text: var(--text-secondary);
  --pill-border: rgba(255, 255, 255, 0.12);
  --skeleton-bg: #1a1a1a;

  /* Shadows */
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.15);
  --shadow-hover: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 92, 58, 0.2);
  --shadow-accent: 0 20px 40px rgba(255, 92, 58, 0.3);
}
```

### 3.2 Light Mode Tokens

```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-card: #f5f5f5;
  --bg-card-elevated: #ffffff;
  --border-color: #e5e5e5;
  --overlay-dark: rgba(255, 255, 255, 0.8);

  --text-primary: #0a0a0a;
  --text-secondary: #555555;
  --text-muted: #999999;

  --table-header-bg: rgba(0, 0, 0, 0.02);
  --btn-bg: rgba(0, 0, 0, 0.03);
  --pill-bg: rgba(0, 0, 0, 0.05);
  --pill-text: #555555;
  --pill-border: rgba(0, 0, 0, 0.1);
  --skeleton-bg: #e5e5e5;

  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 92, 58, 0.15);
  --shadow-accent: 0 20px 40px rgba(255, 92, 58, 0.2);
}
```

### 3.3 Tipografía

| Elemento | Font | Weight | Size | Tracking |
|----------|------|--------|------|----------|
| Page Title | Plus Jakarta Sans | 950 | 48px | -0.02em |
| Section Header | Plus Jakarta Sans | 950 | 24px | -0.01em |
| Card Title | Plus Jakarta Sans | 700 | 13px | 0 |
| Body | DM Sans | 400 | 14px | 0 |
| Label | DM Sans | 600 | 10px | 0.15em uppercase |
| Badge | DM Sans | 700 | 9px | 0.1em uppercase |

### 3.4 Espaciado Scale

| Token | Value | Uso |
|-------|-------|-----|
| `--space-xs` | 4px | Pill gaps |
| `--space-sm` | 8px | Inner card padding |
| `--space-md` | 16px | Card gaps, list padding |
| `--space-lg` | 24px | Section gaps, card padding |
| `--space-xl` | 40px | Container padding |
| `--space-2xl` | 64px | Section separators |

### 3.5 Border Radius

| Token | Value | Uso |
|-------|-------|-----|
| `--radius-sm` | 8px | Buttons, inputs |
| `--radius-md` | 12px | Cards, modals |
| `--radius-lg` | 16px | Large cards |
| `--radius-xl` | 24px | Containers |
| `--radius-2xl` | 40px | Page containers |

### 3.6 Motion

```css
--transition-fast: 150ms ease;
--transition-normal: 300ms ease;
--transition-slow: 500ms ease-out;

/* Hover states */
.card:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-hover);
  transition: all var(--transition-normal);
}

/* Drag state */
.dragging {
  transform: scale(1.05) rotate(2deg);
  box-shadow: var(--shadow-hover);
  opacity: 0.9;
  z-index: 100;
}

/* Exit animation */
.fade-exit {
  opacity: 0;
  transform: scale(0.96);
  transition: all 200ms ease;
}
```

---

## 4. Layout & Structure

### 4.1 Arquitectura de Dos Paneles (Desktop > 1280px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  MI CATÁLOGO                              [Filtro: Todas ▾] [Grid ▼] [+ Nuevo Producto]  │
├─────────────────────────────────────────────────────┬────────────────────────────────────┤
│                                                     │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  ★ MI WIDGET                       │
│  │ [IMG]       │  │ [IMG]       │  │ [IMG]       │ │  ┌────────────────────────────┐   │
│  │             │  │             │  │             │ │  │ ≡ 1. Camisa Azul  [tshirt] │   │
│  │ Camisa Azul │  │ Vestido Roj │  │ Pantalon Ne │ │  │ ≡ 2. Vestido Rojo [vestido]│   │
│  │ ★ En Widget │  │    ⋮⋮       │  │    ⋮⋮       │ │  │ ≡ 3. Pantalon Neg [pantal]│   │
│  └─────────────┘  └─────────────┘  └─────────────┘ │  └────────────────────────────┘   │
│                                                     │  Arrastra para reordenar            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │                                    │
│  │ [IMG]       │  │ [IMG]       │  │ [IMG]       │ │  [Vista Previa]                   │
│  │             │  │             │  │             │ │  ┌────────────────────────────┐   │
│  │ Falda Clara │  │ Zapato Nike │  │ Chaqueta Gr │ │  │ [1] [2] [3] [□] [+ 2 más]  │   │
│  │    ⋮⋮       │  │    ⋮⋮       │  │    ⋮⋮       │ │  └────────────────────────────┘   │
│  └─────────────┘  └─────────────┘  └─────────────┘ │                                    │
│                                                     │  3/5 productos en widget           │
│ ──────────────[Paginación]──────────────────────────│  [Borrar Todo]                     │
└─────────────────────────────────────────────────────┴────────────────────────────────────┘
```

### 4.2 Responsive Breakpoints

| Breakpoint | Width | Layout | Changes |
|------------|-------|--------|---------|
| **Wide** | > 1440px | 60/40 split | 4 columns grid |
| **Desktop** | 1024-1440px | 60/40 split | 3-4 columns grid |
| **Laptop** | 768-1024px | 55/45 split | 2-3 columns grid |
| **Tablet** | 640-768px | Stacked (catálogo top) | Widget below, collapsible |
| **Mobile** | < 640px | Tabs | Tab switcher: Catálogo / Widget |

### 4.3 Mobile Tab Layout (< 640px)

```
┌────────────────────────────────┐
│ [Catálogo] [Mi Widget]  ← Tabs │
├────────────────────────────────┤
│                                │
│  [Filtro: Todas ▾]            │
│                                │
│  ┌─────────┐ ┌─────────┐      │
│  │ [IMG]   │ │ [IMG]   │      │
│  │ Camisa  │ │ Vestido │      │
│  │    ★   │ │    ⋮⋮   │      │
│  └─────────┘ └─────────┘      │
│                                │
│  ┌─────────┐ ┌─────────┐      │
│  │ [IMG]   │ │ [IMG]   │      │
│  │ Pantalon│ │ Falda   │      │
│  └─────────┘ └─────────┘      │
│                                │
│  ──────[1 of 3]──────        │
└────────────────────────────────┘
```

### 4.4 Visual Pacing

- **Desktop:** Paneles lado a lado con gap generoso (32px), scroll independiente
- **Laptop:** Gap reducido (24px), scroll sincronizado opcional
- **Tablet:** Stack vertical, widget colapsable con badge de contador
- **Mobile:** Full-width cards, tabs sticky en top

---

## 5. Features & Interactions

### 5.1 Catálogo (Panel Izquierdo/Dashboard)

| Acción | Comportamiento |
|--------|-----------------|
| **Ver productos** | Grid/Thumbnails/List con filtros activos |
| **Filtrar por categoría** | Dropdown con categorías existentes + "Todas" |
| **Agregar a Widget** | Botón "＋" en cada card (si hay espacio) |
| **Remover del Widget** | Botón "✕" en la playlist (no afecta catálogo) |
| **Buscar** | Input con debounce 300ms (v2) |

### 5.2 Widget Playlist (Panel Derecho)

| Acción | Comportamiento |
|--------|-----------------|
| **Reordenar** | Drag & drop con grip handle (≡) |
| **Remover producto** | Botón "✕" con animación slide-left |
| **Ver preview** | Mini widget con los primeros 4 productos |
| **Borrar todo** | Botón con confirmación (empty state) |

### 5.3 Lógica de Negocio

| Escenario | Regla |
|-----------|-------|
| **Límite productos** | BASIC=5, PRO=15, ENTERPRISE=∞ |
| **Widget vacío** | Empty state con CTA "Agrega tu primer producto" |
| **Orden** | Posición 1 = primero en widget |
| **Sincronización** | Guardar orden en tiempo real (debounced 500ms) |
| **Persistencia** | API `PUT /api/brands/me/widget-products` |
| **Producto ya en widget** | Botón "＋" cambia a "✓" disabled |

### 5.4 Estados de Error

| Estado | UI |
|---------|-----|
| Límite alcanzado | Toast: "Máximo 5 productos en widget (plan BASIC)" |
| Producto ya en widget | Botón "＋" → "✓" disabled con opacity 0.5 |
| Error al guardar | Toast error con retry automático (3 intentos) |
| Widget vacío | Empty state con icono star + mensaje |

---

## 6. Component Inventory

### 6.1 ProductCard (Catálogo)

| Estado | Descripción |
|--------|-------------|
| **Default** | Image, nombre, categoría badge, price, botón "＋" |
| **Hover** | Scale 1.02, shadow lift, reveal acciones |
| **En Widget** | Botón "✓" disabled, badge "En Widget" overlay |
| **Dragging** | Scale 1.05, opacity 0.8, rotation 2deg |
| **Disabled** | Opacity 0.5, cursor not-allowed |

### 6.2 WidgetItem (Playlist)

| Estado | Descripción |
|--------|-------------|
| **Default** | Grip handle (≡), thumbnail, nombre, categoría, ✕ |
| **Dragging** | Scale 1.05, shadow pronounced, placeholder |
| **Removing** | Slide left + fade out 200ms |
| **Hover** | Background highlight, reveal ✕ |

### 6.3 WidgetPreview

| Estado | Descripción |
|--------|-------------|
| **Con productos** | Grid 2x2 de thumbnails + "+N más" |
| **Empty** | Placeholder con línea punteada |
| **Límite warning** | Borde naranja cuando >80% |
| **Límite lleno** | Borde rojo, badge "Completo" |

### 6.4 CategoryFilter

| Estado | Descripción |
|--------|-------------|
| **Default** | Dropdown con "Todas" seleccionado |
| **Open** | Lista de categorías con checkmarks |
| **Active filter** | Badge con categoría seleccionada |

### 6.5 EmptyState

| Contexto | Descripción |
|----------|-------------|
| **Catálogo vacío** | Package icon + CTA "Añadir Mi Primer Producto" |
| **Widget vacío** | Star icon + "Tu widget está vacío — arrastra productos aquí" |

---

## 7. Technical Approach

### 7.1 Frontend Structure

| Archivo | Cambio |
|---------|--------|
| `dashboard/products/page.tsx` | Split layout, estado widgetProducts |
| `components/dashboard/ProductList.tsx` | Agregar botón "+", props para widget state |
| `components/dashboard/WidgetPlaylist.tsx` | **NUEVO** - Componente playlist |
| `components/dashboard/WidgetPreview.tsx` | **NUEVO** - Mini preview |
| `components/dashboard/CategoryFilter.tsx` | **NUEVO** - Dropdown de categorías |
| `services/products.service.ts` | Métodos `getWidgetProducts()`, `updateWidgetProducts()` |
| `types/index.ts` | Interfaces actualizadas |

### 7.2 Backend API

```
PUT /api/brands/me/widget-products
Body: { productIds: string[] }  // Array ordenado de IDs

GET /api/brands/me/widget-products
Response: { productIds: string[], products: Product[] }

DELETE /api/brands/me/widget-products
Body: { }  // Limpia el widget
```

### 7.3 Database Schema

```sql
-- Nueva columna en brands
ALTER TABLE brands ADD COLUMN widget_product_ids uuid[] DEFAULT '{}';

-- Índice para queries rápidas
CREATE INDEX idx_brands_widget ON brands(id) INCLUDE (widget_product_ids);
```

### 7.4 Drag & Drop Library

Usar `@dnd-kit/core` + `@dnd-kit/sortable`:
- Accesible (keyboard navigation)
- Touch-friendly (mobile)
- Performante (virtualization para listas grandes)

### 7.5 Dependencies

```bash
# En frontend/
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 8. Dark/Light Mode Implementation

### 8.1 CSS Variables Strategy

Todas las variables CSS usan el sistema de tokens (sección 3). El tema se cambia con `data-theme="light"` en el root.

### 8.2 Theme Detection

```typescript
// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');
const theme = savedTheme || (prefersDark ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', theme);
```

---

## 9. Responsive Implementation

### 9.1 Layout Strategy

```css
/* Base: Mobile first */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* Tablet */
@media (min-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

/* Laptop */
@media (min-width: 768px) {
  .split-layout {
    display: grid;
    grid-template-columns: 55% 45%;
    gap: 24px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .split-layout {
    grid-template-columns: 60% 40%;
    gap: 32px;
  }
}

/* Wide */
@media (min-width: 1440px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### 9.2 Mobile Tab Component

```tsx
// Tabs para mobile
const [activeTab, setActiveTab] = useState<'catalog' | 'widget'>('catalog');

// En móvil: solo un panel visible a la vez
// En desktop: ambos paneles lado a lado
```

---

## 10. Métricas de Éxito

- [ ] Usuario puede filtrar productos por categoría
- [ ] Usuario puede agregar/quitar productos del widget
- [ ] Usuario puede reordenar productos del widget via drag & drop
- [ ] Límite de productos se respeta según plan (BASIC=5, PRO=15, ENTERPRISE=∞)
- [ ] Preview del widget muestra productos seleccionados
- [ ] Estado persiste al recargar página
- [ ] Responsive completo: Wide, Desktop, Laptop, Tablet, Mobile
- [ ] Dark/Light mode funciona correctamente

---

## 11. Scope v1 (MVP)

### Incluido
- Filtro de categoría
- Panel dual (catálogo + widget)
- Drag & drop para reordenar
- Límite por plan (BASIC 5, PRO 15, ENTERPRISE ∞)
- Preview mini del widget
- Dark/Light mode
- Responsive (all breakpoints)

### Excluido (v2)
- Búsqueda por texto
- Bulk selection
- Templates de widget
- Analytics de productos en widget
- Paginación del widget

---

**Última actualización:** 2026-04-16
**Cambios:** Límites corregidos (ENTERPRISE = ∞), доба大地 Design Tokens (Dark/Light), Responsive breakpoints