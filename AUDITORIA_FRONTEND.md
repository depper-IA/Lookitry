# Auditoría Frontend — Lookitry
**Fecha:** 2025-07-07  
**Alcance:** `frontend/src/app/` — páginas públicas, dashboard y panel admin  
**Tipo:** Solo lectura — sin cambios al código

---

## Resumen ejecutivo

| Área                          | OK      | Problemas | Faltantes |
|------|----|-----------|-----------|
| Páginas públicas (existencia) | 13      | 0 | 0 (rutas usan `[brandSlug]` no `[slug]`) |
| Páginas públicas (branding)   | Todas   | 0 | — |
| Dashboard (auth + límites)    | Parcial | 2 | 0 |
| Panel admin (existencia)      | 15      | 0 | 2 |
| Panel admin (variables CSS)   | Parcial | 8 archivos | — |
| Sistema de temas light/dark   | Parcial | 2 | — |

---

## 62.1 — Páginas Públicas

### Existencia de archivos

| Ruta esperada | Ruta real | Estado |
|---------------|-----------|--------|
| `/pruebalo/[slug]/page.tsx` | `/pruebalo/[brandSlug]/page.tsx` | OK (nombre de param distinto) |
| `/marca/[slug]/page.tsx` | `/marca/[brandSlug]/page.tsx` | OK (nombre de param distinto) |
| `/sitio/[slug]/page.tsx` | `/sitio/[brandSlug]/page.tsx` | OK (nombre de param distinto) |
| `/embed/[slug]/page.tsx` | `/embed/[brandSlug]/page.tsx` | OK (nombre de param distinto) |
| Resto de páginas | Coinciden exactamente | OK |

> Nota: El parámetro dinámico se llama `[brandSlug]` en lugar de `[slug]`. No es un problema funcional, pero la tarea de auditoría lo listaba como `[slug]`. Todas las páginas existen.

### Logo (logo.svg vs logo.png)

**Estado: OK**  
No se encontró ninguna referencia a `logo.png` en ninguna página del frontend. Todas usan `/logo.svg`.

### Nombre de marca

**Estado: OK**  
No se encontraron referencias a "VirtualTryOn", "Virtual Try On" ni "Mostrador" en ninguna página.

### Colores hardcodeados en páginas públicas

**Estado: OK**  
No se auditaron colores hardcodeados en páginas públicas (la tarea indica que esto aplica solo a páginas admin).

---

## 62.2 — Dashboard (rutas privadas)

### Protección de autenticación

**Estado: OK**  
El archivo `frontend/src/app/dashboard/layout.tsx` implementa protección correcta:
- Usa `useAuth()` hook
- Si `!isAuthenticated && !isLoading` → `router.push('/login')`
- Todas las páginas del dashboard heredan esta protección del layout

### Precios hardcodeados en checkout

**Estado: PROBLEMA PARCIAL**

#### `dashboard/checkout/page.tsx` — OK con fallback correcto
- Tiene `PLAN_INFO_FALLBACK` con precios hardcodeados (150000 / 250000) como fallback estático
- Carga precios dinámicos desde `pricing_config` de Supabase en `useEffect`
- Si la carga falla, usa el fallback — comportamiento correcto según arquitectura

#### `dashboard/subscription/page.tsx` — PROBLEMA
- **Archivo:** `frontend/src/app/dashboard/subscription/page.tsx`
- **Líneas:** 16-31
- **Problema:** Precios hardcodeados (`price: 150000`, `price: 250000`) en constante `PLAN_INFO` sin carga dinámica desde `pricing_config`
- **Impacto:** Si el admin cambia precios desde `/admin/pricing`, la página de suscripción del dashboard mostrará precios desactualizados
- **Corrección:** Agregar carga dinámica desde Supabase igual que en `dashboard/checkout/page.tsx`

```tsx
// Líneas 15-31 — precios hardcodeados sin carga dinámica
const PLAN_INFO = {
  BASIC: { name: 'Plan Básico', price: 150000, ... },
  PRO:   { name: 'Plan Pro',    price: 250000, ... },
};
```

### Límites de plan

**Estado: OK**  
Los límites correctos están presentes en los componentes relevantes:
- `UpgradeModal.tsx`: "Hasta 5 productos activos", "400 generaciones por mes", "Hasta 15 productos activos", "1.200 generaciones por mes"
- `dashboard/subscription/page.tsx`: Límites correctos en features de cada plan
- `dashboard/checkout/page.tsx`: Límites correctos en `PLAN_INFO_FALLBACK`

---

## 62.3 — Panel Admin

### Existencia de archivos

| Página | Estado |
|--------|--------|
| `admin/dashboard/page.tsx` | OK |
| `admin/brands/page.tsx` | OK |
| `admin/subscriptions/page.tsx` | OK |
| `admin/payments/page.tsx` | OK |
| `admin/revenue/page.tsx` | OK |
| `admin/pricing/page.tsx` | OK |
| `admin/payment-settings/page.tsx` | OK |
| `admin/marketing/promotions/page.tsx` | OK |
| `admin/mini-landings/page.tsx` | OK |
| `admin/analytics/page.tsx` | **FALTANTE** |
| `admin/feedback/page.tsx` | OK |
| `admin/notifications/page.tsx` | OK |
| `admin/health/page.tsx` | OK |
| `admin/configuracion/page.tsx` | OK |
| `admin/admins/page.tsx` | OK |
| `admin/conversion/page.tsx` | **FALTANTE** (carpeta existe pero vacía) |
| `admin/profile/page.tsx` | OK |

### Colores hardcodeados en páginas admin

A continuación se listan los archivos con colores Tailwind hardcodeados que deberían usar variables CSS del sistema de temas.

---

#### `admin/brands/page.tsx` — PROBLEMA GRAVE
Modal "Nueva Marca" (líneas ~778-790) usa clases completamente hardcodeadas sin variables CSS:

```tsx
// Línea 779 — modal con bg-white hardcodeado (rompe modo dark)
<div className="bg-white rounded-lg p-6 max-w-lg ...">

// Línea 781 — texto hardcodeado
<h2 className="text-xl font-bold text-gray-900">Nueva Marca</h2>

// Línea 782 — botón hardcodeado
<button className="text-gray-400 hover:text-gray-600">

// Línea 786 — texto hardcodeado
<p className="text-sm text-gray-600 mb-4">
```

Modal "Ver Detalles" (líneas ~652-660) también usa clases hardcodeadas:
```tsx
// Línea 653 — labels y valores con colores hardcodeados
<p className="text-sm text-gray-600">{label}</p>
<p className="text-sm font-medium text-gray-900">{value}</p>

// Línea 657 — label hardcodeado
<p className="text-sm text-gray-600">Estado de prueba</p>
```

Botón "Cerrar" en modal de productos (línea 770):
```tsx
<button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cerrar</button>
```

**Corrección:** Reemplazar con `style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}` y `style={{ color: 'var(--text-secondary)' }}`.

---

#### `admin/payment-settings/page.tsx` — PROBLEMA
Botón "Guardar" usa `bg-blue-600` en lugar del color de acento del sistema:

```tsx
// Línea 145 — botón con bg-blue-600 hardcodeado
className="... bg-blue-600 text-white ... hover:bg-blue-700 ..."
```

Toggle switch (línea 352) usa `bg-blue-600` activo en lugar de `bg-[#FF5C3A]`:
```tsx
enabled ? 'bg-blue-600' : 'bg-gray-400'
```

**Corrección:** Cambiar `bg-blue-600` → `bg-[#FF5C3A]` y `hover:bg-blue-700` → `hover:bg-[#e04e30]`.

---

#### `admin/subscriptions/page.tsx` — PROBLEMA MENOR
Badges de estado usan clases Tailwind light (`bg-gray-100 text-gray-700`) que no respetan el tema dark:

```tsx
// Línea 93 — badge "suspended" con colores light hardcodeados
suspended: 'bg-gray-100 text-gray-700',

// Línea 99 — fallback con colores light hardcodeados
${map[status] ?? 'bg-gray-100 text-gray-700'}
```

**Nota:** Los badges de estado (active, expiring_soon, expired) también usan `bg-amber-100 text-amber-800` y `bg-red-100 text-red-800` que son colores light. En modo dark se verán con fondo claro sobre fondo oscuro.

---

#### `admin/payments/page.tsx` — PROBLEMA MENOR
Badge "Reembolsado" usa colores light hardcodeados:

```tsx
// Línea 52 — badge con colores light
refunded: { cls: 'bg-gray-100 text-gray-700', ... }

// Línea 226 — fallback con colores light
cls: 'bg-gray-100 text-gray-700'
```

---

#### `admin/health/page.tsx` — PROBLEMA MENOR
Badge "loading" usa colores light hardcodeados:

```tsx
// Línea 28 — estado loading con colores light
loading: 'bg-gray-100 text-gray-500 border-gray-200',
```

---

#### `admin/configuracion/page.tsx` — PROBLEMA MENOR
Badge de campaña usa colores light hardcodeados:

```tsx
// Línea 105 — badge inactiva con colores light
active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
```

---

#### `admin/mini-landings/page.tsx` — PROBLEMA MENOR
Punto de estado "inactiva" usa `bg-gray-400` hardcodeado:

```tsx
// Línea 333 — punto de estado hardcodeado
<span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
```

---

#### `admin/layout.tsx` — PROBLEMA MENOR
El sidebar usa `text-white` hardcodeado en el nombre del usuario y el logo, en lugar de `var(--text-sidebar-active)`:

```tsx
// Línea 113 — nombre de marca en sidebar
<span className="... text-white ...">Look<span>itry</span></span>

// Línea 119 — botón cerrar menú móvil
className="lg:hidden p-1 rounded text-gray-400 hover:text-white"

// Línea 191 — nombre del admin en sidebar
className="block text-sm font-medium text-white truncate ..."
```

> Nota: El sidebar siempre tiene fondo oscuro (`var(--bg-sidebar)` = `#0a0a0a` en ambos temas), por lo que `text-white` es técnicamente correcto aquí. Sin embargo, debería usar `var(--text-sidebar-active)` para consistencia con el sistema de diseño.

---

## 62.4 — Sistema de Temas Light/Dark

### Layout admin (`admin/layout.tsx`)

**Estado: OK**  
- Importa y renderiza `<ThemeToggle />` en el header
- El layout usa `var(--bg-base)`, `var(--bg-header)`, `var(--border-color)`, `var(--shadow-header)` correctamente
- El toggle está disponible en todos los paneles admin

### Variables CSS en `globals.css`

**Estado: PROBLEMA CRÍTICO**

Las variables `--bg-hover` y `--bg-input` se usan en múltiples páginas admin pero **NO están definidas** en `globals.css`:

```css
/* globals.css — variables FALTANTES */
/* --bg-hover  → usada en: subscriptions, payments, notifications, marketing/promotions, health, profile */
/* --bg-input  → usada en: admin/profile/page.tsx */
```

Páginas que usan `var(--bg-hover)`:
- `admin/subscriptions/page.tsx` (líneas 230, 322, 521, 560)
- `admin/payments/page.tsx` (línea 213)
- `admin/notifications/page.tsx` (líneas 417, 466, 477, 529)
- `admin/marketing/promotions/page.tsx` (líneas 174, 291, 486, 569)
- `admin/health/page.tsx` (línea 209)

Páginas que usan `var(--bg-input)`:
- `admin/profile/page.tsx` (línea 58): `background: 'var(--bg-input, var(--bg-hover))'` — tiene fallback a `--bg-hover` pero ambas están sin definir

**Corrección:** Agregar en `globals.css`:

```css
:root {
  /* ... variables existentes ... */
  --bg-hover: #ede9e4;   /* light mode */
  --bg-input: #ffffff;   /* light mode */
}

.dark {
  /* ... variables existentes ... */
  --bg-hover: #1a1a1a;   /* dark mode */
  --bg-input: #0f0f0f;   /* dark mode */
}
```

### ThemeToggle (`components/ui/ThemeToggle.tsx`)

**Estado: OK**  
- Persiste preferencia en `localStorage` con clave `'theme'`
- Aplica/quita clase `dark` en `document.documentElement`
- Funciona correctamente con el sistema de variables CSS de `globals.css`

### Páginas admin que NO respetan el tema (colores hardcodeados críticos)

| Archivo | Problema | Impacto en modo light |
|---------|----------|----------------------|
| `admin/brands/page.tsx` | Modal "Nueva Marca" con `bg-white`, `text-gray-900`, `text-gray-600` | Modal se ve correcto en light pero roto en dark |
| `admin/payment-settings/page.tsx` | Botón guardar `bg-blue-600`, toggle `bg-blue-600` | Color de acento incorrecto en ambos temas |
| `admin/subscriptions/page.tsx` | Badges con `bg-gray-100 text-gray-700` | Fondo claro visible sobre card oscuro en dark |
| `admin/payments/page.tsx` | Badge "Reembolsado" con `bg-gray-100 text-gray-700` | Igual que arriba |
| `admin/health/page.tsx` | Badge "loading" con `bg-gray-100 text-gray-500` | Igual que arriba |
| `admin/configuracion/page.tsx` | Badge inactiva con `bg-gray-100 text-gray-500` | Igual que arriba |

---

## Resumen de acciones requeridas (por prioridad)

### Prioridad ALTA

1. **`globals.css`** — Agregar variables `--bg-hover` y `--bg-input` para ambos temas. Sin esto, múltiples páginas admin tienen fondos `undefined` (se renderizan como transparente).

2. **`admin/brands/page.tsx`** — Modal "Nueva Marca" (línea ~779) usa `bg-white` hardcodeado. En modo dark el modal aparece con fondo blanco sobre overlay oscuro — completamente roto visualmente.

### Prioridad MEDIA

3. **`dashboard/subscription/page.tsx`** — Precios hardcodeados sin carga dinámica desde `pricing_config`. Si el admin cambia precios, esta página no se actualiza.

4. **`admin/payment-settings/page.tsx`** — Botón guardar y toggle usan `bg-blue-600` en lugar del color de acento `#FF5C3A`.

5. **`admin/conversion/page.tsx`** — Página faltante. La carpeta existe pero está vacía.

6. **`admin/analytics/page.tsx`** — Página faltante. No existe la carpeta ni el archivo.

### Prioridad BAJA

7. **Badges de estado** en `subscriptions`, `payments`, `health`, `configuracion` — Usan clases Tailwind light (`bg-gray-100`, `bg-amber-100`, `bg-red-100`) que se ven con fondo claro en modo dark. Reemplazar con variantes con opacidad: `bg-gray-500/15 text-gray-400`, `bg-amber-500/15 text-amber-400`, etc.

8. **`admin/layout.tsx`** — `text-gray-400` en botón cerrar menú móvil. Reemplazar con `style={{ color: 'var(--text-muted)' }}`.

---

## Lo que está bien (no requiere acción)

- Todas las páginas públicas existen y usan `logo.svg`
- No hay referencias a "VirtualTryOn" ni nombres de marca incorrectos
- El nombre de marca `Look<span>itry</span>` se usa correctamente
- El layout del dashboard tiene protección de auth correcta
- `dashboard/checkout/page.tsx` carga precios dinámicos correctamente con fallback
- `UpgradeModal.tsx` carga precios dinámicos correctamente con fallback
- Los límites de plan (BASIC=5/400, PRO=15/1200) son correctos en todos los componentes
- El `ThemeToggle` funciona correctamente
- El layout admin tiene el toggle de tema disponible en todos los paneles
- La mayoría de páginas admin usan variables CSS correctamente para fondos y textos principales
