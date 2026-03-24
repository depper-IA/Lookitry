# Plan de Implementación: UI/UX Redesign

## Overview

Correcciones visuales incrementales ordenadas de menor a mayor riesgo: primero componentes compartidos (impacto global, cambios mínimos), luego layouts, luego páginas individuales. Cada tarea es independiente y ejecutable sin depender de las siguientes.

Stack: Next.js 14, TypeScript, Tailwind CSS. Sin tocar lógica, APIs ni funcionalidad.

## Tasks

- [x] 1. Shared UI Components — correcciones base
  - [x] 1.1 Actualizar `Button.tsx` — cursor-pointer y focus-visible ring
  - [x] 1.2 Property test — Property 4: cursor-pointer en Button
  - [x] 1.3 Actualizar `Input.tsx` — usar `var(--bg-input)`
  - [x] 1.5 Actualizar `Card.tsx` — agregar variante `interactive`

- [x] 2. Checkpoint — componentes base

- [x] 3. DashboardLayout — correcciones de layout
  - [x] 3.1 Corregir email verification banner — variables CSS
  - [x] 3.2 Agregar `cursor-pointer` en nav Links del sidebar
  - [x] 3.3 Bloquear body scroll cuando el drawer móvil está abierto

- [x] 4. AdminLayout — cursor-pointer en nav items
  - [x] 4.1 Agregar `cursor-pointer` en todos los `<Link>` del nav

- [x] 5. Checkpoint — layouts

- [ ] 6. Auth Pages — colores hardcodeados (NO MODIFICAR — usuario prefiere versión actual)
  - [x] 6.1 `login/page.tsx` — SKIP (usuario revirtió cambios)
  - [x] 6.2 `register/page.tsx` — SKIP (usuario revirtió cambios)

- [x] 7. Dashboard sub-páginas — corrección de alerts y cards
  - [x] 7.1 `dashboard/usage/page.tsx` — error alert
  - [x] 7.2 `dashboard/analytics/page.tsx` — cards y charts
  - [x] 7.3 `dashboard/products/page.tsx` — view mode selector y alerts
  - [x] 7.4 `dashboard/settings/page.tsx` — alerts y cards
  - [x] 7.5 `dashboard/subscription/page.tsx` — alerts
  - [x] 7.6 `dashboard/generations/page.tsx` — alerts y cards
  - [x] 7.7 `dashboard/profile/page.tsx` — alerts y cards

- [x] 8. Checkpoint — sub-páginas del dashboard

- [ ] 9. Confirmation Pages — variables CSS
  - [x] 9.1 `pago-exitoso/page.tsx`
  - [x] 9.2 `trial-activado/page.tsx`

- [x] 11. Checkpoint final — TypeScript sin errores


---

## Tareas Admin — Rediseño Visual Completo

> Dirección estética establecida en `admin/layout.tsx` y `admin/dashboard/page.tsx`:
> - Stat cards: `borderLeft: 3px solid <accent>`, icono alineado a la derecha con color accent (sin fondos de color)
> - Tablas: `var(--bg-card)` base, `var(--bg-base)` header, `var(--border-color)` bordes, `var(--text-muted)` headers de columna
> - Alertas error: `bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]`
> - Fuentes: `font-jakarta` en headings (h1/h2/h3), DM Sans en body
> - Todos los colores via variables CSS — sin `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`
> - Sin emojis — solo SVG / lucide-react

- [x] 12. Admin Analytics — `frontend/src/app/admin/analytics/page.tsx`
  - [x] 12.1 Corregir error state
    - Reemplazar `bg-red-50 border-red-200 text-red-700` → `bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]`
    - _Buscar: `bg-red-50`_
  - [x] 12.2 Corregir barras del chart de generaciones
    - Reemplazar `bg-gray-100 dark:bg-gray-800/50` → `style={{ backgroundColor: 'var(--bg-hover)' }}`
    - _Buscar: `bg-gray-100`_
  - [x] 12.3 Corregir barras de progreso de planes
    - Reemplazar `bg-gray-100 dark:bg-gray-800` → `style={{ backgroundColor: 'var(--bg-hover)' }}`
  - [x] 12.4 Corregir heading h1
    - Reemplazar `font-bold` en el h1 principal → agregar `font-jakarta`
  - [x] 12.5 Corregir títulos de sección
    - Reemplazar `font-bold` en h2/h3 → `font-jakarta`
  - [x] 12.6 Corregir stat cards con icono de fondo de color
    - Reemplazar patrón `bg-{color}15` en contenedor de icono → eliminar fondo, aplicar `color: <accent>` directo al icono
    - Agregar `borderLeft: '3px solid <accent>'` a la card
    - _Buscar: `/15` o `bg-.*15`_


- [x] 13. Admin Conversion — `frontend/src/app/admin/conversion/page.tsx`
  - [x] 13.1 Corregir error state
    - Reemplazar `bg-red-50 border-red-200 text-red-700` → `bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]`
  - [x] 13.2 Corregir cards del funnel
    - Reemplazar `bg-white dark:bg-zinc-900` → `style={{ backgroundColor: 'var(--bg-card)' }}`
    - Reemplazar bordes `border-gray-*` → `style={{ borderColor: 'var(--border-color)' }}`
  - [x] 13.3 Corregir KPI rows
    - Reemplazar `bg-gray-50 dark:bg-white/5` → `style={{ backgroundColor: 'var(--bg-hover)' }}`

- [x] 14. Admin Subscriptions — `frontend/src/app/admin/subscriptions/page.tsx`
  - [x] 14.1 Corregir checkboxes
    - Reemplazar `border-gray-300` → `style={{ borderColor: 'var(--border-color)' }}`
  - [x] 14.2 Corregir iconos de sort
    - Reemplazar `text-gray-400` → `style={{ color: 'var(--text-muted)' }}`
  - [x] 14.3 Corregir botón suspender
    - Reemplazar `bg-red-500/10 text-red-500` → `bg-[#ef4444]/10 text-[#ef4444]`
    - Verificar que hover usa `hover:bg-[#ef4444]/20`

- [x] 15. Admin Mini-Landings — `frontend/src/app/admin/mini-landings/page.tsx`
  - [x] 15.1 Corregir error state
    - Reemplazar `border-red-200 bg-red-50 text-red-700` → `bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]`
  - [x] 15.2 Corregir icono de estado vacío
    - Reemplazar `text-gray-400` → `style={{ color: 'var(--text-muted)' }}`

- [x] 16. Admin Payment Settings — `frontend/src/app/admin/payment-settings/page.tsx`
  - [x] 16.1 Corregir badges de métodos inactivos
    - Reemplazar `bg-gray-500/10 text-gray-400` → inline style con `rgba(255,255,255,0.05)` y `var(--text-muted)`

- [x] 17. Admin Notifications — `frontend/src/app/admin/notifications/page.tsx`
  - [x] 17.1 Corregir toggle inactivo
    - Reemplazar `#d1d5db` → `var(--border-color)`
  - [x] 17.2 Corregir botón cerrar modal
    - Reemplazar `hover:bg-white/10` → `hover:bg-[#ffffff]/10`

- [x] 18. Admin Brands — `frontend/src/app/admin/brands/page.tsx`
  - [x] 18.1 Corregir error state
    - Reemplazar `bg-red-50 border-red-200 text-red-700` → inline style con `rgba(239,68,68,0.1)`
  - [x] 18.2 Corregir iconos de sort
    - Reemplazar `text-gray-400` → `style={{ color: 'var(--text-muted)' }}`

- [x] 19. Admin Marketing/Promotions — `frontend/src/app/admin/marketing/promotions/page.tsx`
  - [x] 19.1 Verificar toggle thumb — ya correcto, track inactivo usa `var(--border-color)`. Sin cambios.

- [x] 20. Admin Revenue — `frontend/src/app/admin/revenue/page.tsx`
  - [x] 20.1 Auditoría rápida — ya usa CSS variables correctamente. Sin cambios.

- [x] 21. Admin Payments — `frontend/src/app/admin/payments/page.tsx`
  - [x] 21.1 Auditoría rápida — ya usa CSS variables correctamente. Sin cambios.

- [x] 22. Checkpoint Admin — todas las páginas admin corregidas
  - Verificar visualmente en dark mode que error states, tablas y cards son consistentes
  - Ejecutar `npx tsc --noEmit` en `frontend/` para confirmar sin errores TypeScript
  - Actualizar `CHANGELOG_GEMINI.md` con todas las correcciones aplicadas

## Notes

- Tasks marcadas con `*` son opcionales y pueden saltarse para un MVP más rápido
- El orden de ejecución va de menor a mayor riesgo
- Cada task es independiente — se puede ejecutar sin depender de las siguientes
- PROHIBIDO modificar: landing page (`/`), checkout, mini-landing templates, lógica de negocio o APIs
- Login/Register: NO modificar — usuario prefiere versión actual con colores hardcodeados
- Sidebar admin: mantener negro + naranja — NO cambiar

---

## Tareas Admin — Upgrade Visual Premium (Estilo "Mi Página" + "Settings")

> **Fuentes de referencia visual (AMBAS):**
> - `dashboard/mi-pagina/page.tsx` — estilo bold, editorial, premium: bordes grandes, tipografía uppercase italic, tabs pill naranja, botones con sombra
> - `dashboard/settings/page.tsx` — estilo limpio y funcional: espaciado correcto, alertas con `rounded-lg`, layout de formulario ordenado
>
> **Tokens de diseño a replicar en TODAS las páginas admin:**
>
> De `mi-pagina`:
> - Bordes redondeados grandes: `rounded-[2.5rem]` en secciones principales, `rounded-2xl` en elementos internos
> - H1 de página: `font-jakarta font-black uppercase italic tracking-tight` (tamaño `text-2xl` o `text-3xl`)
> - H2/H3 de sección: `font-jakarta font-bold uppercase italic tracking-tight`
> - Header de sección interno: `flex items-center gap-3 border-b border-[var(--border-color)] pb-5` con icono naranja + título
> - Icono de sección: `w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center` + icono `text-[#FF5C3A]`
> - Tabs de navegación: contenedor `flex gap-4 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-fit`, tab activo `bg-[#FF5C3A] text-white rounded-xl shadow-lg font-black uppercase tracking-widest`, inactivo `text-gray-500 hover:text-gray-300`
> - Botón primario CTA: `rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#FF5C3A]/20 hover:scale-[1.01] active:scale-95`
> - Toasts: `p-5 rounded-2xl border text-xs font-bold uppercase tracking-widest` (success: `bg-emerald-500/10 border-emerald-500/20 text-emerald-500`, error: `bg-red-500/10 border-red-500/20 text-red-500`)
> - Animaciones de entrada en tabs: `animate-in fade-in slide-in-from-left-4 duration-500`
> - Stat cards: mantener `borderLeft: 3px solid <accent>` pero con `rounded-[1.5rem]` y padding `p-5`
> - Tabla wrapper: `rounded-[2rem]`
>
> De `settings`:
> - Alertas de error/éxito: `rounded-lg` (no `rounded-2xl`) — más funcional, menos agresivo
> - Espaciado de sección: `space-y-5` entre bloques principales
> - Subtítulo de página: `text-sm mt-0.5` con `color: var(--text-secondary)`
>
> **CORRECCIÓN CRÍTICA DE FUENTE (aplicar en TODAS las páginas):**
> - `font-syne` NO existe en este proyecto — reemplazar por `font-jakarta` en TODOS los archivos admin
> - Buscar: `font-syne` → reemplazar: `font-jakarta`
> - Afecta confirmado: `brands/page.tsx`, `subscriptions/page.tsx`, `revenue/page.tsx` (KpiCard, ClientesCard, valores ROI)
> - Verificar también en: `dashboard/page.tsx`, `payments/page.tsx`, `analytics/page.tsx`, `conversion/page.tsx`, `pricing/page.tsx`, `payment-settings/page.tsx`, `notifications/page.tsx`, `mini-landings/page.tsx`, `marketing/promotions/page.tsx`, `configuracion/page.tsx`, `admins/page.tsx`, `profile/page.tsx`, `health/page.tsx`
>
> **PROHIBIDO en este bloque:** tocar lógica, APIs, estados, handlers, ni el sidebar/layout del admin.

- [x] 23. Admin Dashboard — upgrade visual
  - [x] 23.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta` en todo el archivo
  - [x] 23.2 H1 de página: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 23.3 Stat cards: `rounded-xl` → `rounded-[1.5rem]`, padding `p-4` → `p-5`
  - [x] 23.4 Secciones de contenido (distribución por plan, conversiones, mini-landings): `rounded-xl` → `rounded-[2rem]`, h2/h3 con `font-jakarta font-bold uppercase italic`
  - [x] 23.5 Tabla "Detalle mensual": wrapper `rounded-[2rem]`, header de columnas con `uppercase`

- [x] 24. Admin Brands — upgrade visual
  - [x] 24.1 Corrección de fuente: reemplazar `font-syne` → `font-jakarta` (confirmado en h1)
  - [x] 24.2 H1 "Gestión de Marcas": cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 24.3 Panel de filtros: `rounded-xl` → `rounded-[2rem]`
  - [x] 24.4 Tabla wrapper: `rounded-xl` → `rounded-[2rem]`
  - [x] 24.5 Botón "Nueva Marca": `rounded-lg` → `rounded-2xl`, agregar `font-black uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20`
  - [x] 24.6 Modales (detalles, productos, activar, crear): `rounded-xl` → `rounded-[2rem]` en el panel, headers con `font-jakarta font-black uppercase italic`

- [x] 25. Admin Subscriptions — upgrade visual
  - [x] 25.1 Corrección de fuente: reemplazar `font-syne` → `font-jakarta` (confirmado en h1 y posibles valores numéricos)
  - [x] 25.2 H1 "Suscripciones": cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 25.3 Tabla wrapper: `rounded-2xl` → `rounded-[2rem]`
  - [x] 25.4 Panel de filtros: `rounded-2xl` → `rounded-[2rem]`
  - [x] 25.5 Filtros de estado (botones pill): `rounded-xl` ya correcto — verificar que activo usa `bg-[#FF5C3A]`
  - [x] 25.6 Modales internos (RenewModal, ChangePlanModal, ConfirmModal): headers con `font-jakarta font-bold uppercase italic`

- [x] 26. Admin Revenue — upgrade visual
  - [x] 26.1 Corrección de fuente: reemplazar `font-syne` → `font-jakarta` en TODO el archivo — afecta `KpiCard` (valor principal), `ClientesCard` (número grande), `TabROI` (porcentaje meta, valores ROI), `TabIngresos` (sin font-syne directo pero verificar)
  - [x] 26.2 H1 de página: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 26.3 Tabs de navegación (Ingresos / ROI / Configuración): aplicar patrón pill de `mi-pagina` — contenedor `flex gap-4 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-fit`, tab activo `bg-[#FF5C3A] text-white rounded-xl shadow-lg font-black uppercase tracking-widest`
  - [x] 26.4 `KpiCard`: `rounded-2xl` → `rounded-[2rem]`, valor principal usa `font-jakarta font-bold` (ya corregido en 26.1)
  - [x] 26.5 Secciones de contenido (ingresos mensuales, desglose de gastos, estado vs meta): `rounded-2xl` → `rounded-[2rem]`, h3 con `font-jakarta font-bold uppercase italic`
  - [x] 26.6 `ClientesCard`: `rounded-2xl` → `rounded-[2rem]`, número grande usa `font-jakarta font-bold` (ya corregido en 26.1)
  - [x] 26.7 Botones "Guardar" en `TabConfig`: `rounded-lg` → `rounded-2xl`, agregar `font-black uppercase tracking-widest`

- [x] 27. Admin Payments — upgrade visual
  - [x] 27.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 27.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 27.3 Panel de filtros: `rounded-xl` → `rounded-[2rem]`
  - [x] 27.4 Tabla wrapper: `rounded-xl` → `rounded-[2rem]`

- [x] 28. Admin Payment Settings — upgrade visual
  - [x] 28.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 28.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 28.3 Cards de métodos de pago (Wompi, PayPal, Manual): `rounded-xl` → `rounded-[2rem]`, agregar header de sección con icono en `rounded-2xl bg-[#FF5C3A]/10` + título `font-jakarta font-bold uppercase italic`
  - [x] 28.4 Botones "Guardar": `rounded-lg` → `rounded-2xl`, agregar `font-black uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20`

- [x] 29. Admin Pricing — upgrade visual
  - [x] 29.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 29.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 29.3 Cards de planes (BASIC, PRO, LANDING): `rounded-xl` → `rounded-[2rem]`, agregar header con icono naranja + título `font-jakarta font-bold uppercase italic`
  - [x] 29.4 Botones "Guardar": `rounded-lg` → `rounded-2xl`, agregar `font-black uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20`

- [x] 30. Admin Analytics — upgrade visual (complemento al task 12 ya completado)
  - [x] 30.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 30.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 30.3 Secciones de charts y tablas: `rounded-xl` → `rounded-[2rem]`, h2/h3 con `font-jakarta font-bold uppercase italic`
  - [x] 30.4 Stat cards: `rounded-xl` → `rounded-[1.5rem]`, padding `p-5`

- [x] 31. Admin Conversion — upgrade visual (complemento al task 13 ya completado)
  - [x] 31.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 31.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 31.3 Cards del funnel: `rounded-xl` → `rounded-[2rem]`
  - [x] 31.4 Tabs de navegación si existen: aplicar patrón pill de `mi-pagina`

- [x] 32. Admin Mini-Landings — upgrade visual
  - [x] 32.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 32.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 32.3 Cards de landing: `rounded-xl` → `rounded-[2rem]`
  - [x] 32.4 Botones de acción: `rounded-lg` → `rounded-2xl`, agregar `font-black uppercase tracking-widest`

- [x] 33. Admin Marketing/Promotions — upgrade visual
  - [x] 33.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 33.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 33.3 Cards de promociones/cupones: `rounded-xl` → `rounded-[2rem]`, header con icono naranja + título `font-jakarta font-bold uppercase italic`
  - [x] 33.4 Botón "Nueva Promoción" / "Nuevo Cupón": `rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20`

- [x] 34. Admin Notifications — upgrade visual
  - [x] 34.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 34.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 34.3 Cards de notificaciones: `rounded-xl` → `rounded-[2rem]`
  - [x] 34.4 Panel de preferencias: `rounded-xl` → `rounded-[2rem]`, header con icono + título `font-jakarta font-bold uppercase italic`

- [x] 35. Admin Configuración (Trial) — upgrade visual
  - [x] 35.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 35.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 35.3 Cards de configuración: `rounded-xl` → `rounded-[2rem]`, headers con icono naranja + título `font-jakarta font-bold uppercase italic`
  - [x] 35.4 Botones "Guardar": `rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20`

- [x] 36. Admin Admins — upgrade visual
  - [x] 36.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 36.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 36.3 Tabla wrapper: `rounded-xl` → `rounded-[2rem]`
  - [x] 36.4 Modal "Nuevo Admin": `rounded-[2rem]`, header con `font-jakarta font-black uppercase italic`

- [x] 37. Admin Profile — upgrade visual
  - [x] 37.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 37.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 37.3 Card de perfil: `rounded-xl` → `rounded-[2rem]`, secciones internas con header icono + título `font-jakarta font-bold uppercase italic`
  - [x] 37.4 Botón "Guardar cambios": full-width, `rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#FF5C3A]/20`

- [x] 38. Admin Health — upgrade visual
  - [x] 38.1 Corrección de fuente: buscar `font-syne` → reemplazar por `font-jakarta`
  - [x] 38.2 H1: cambiar a `font-jakarta font-black uppercase italic tracking-tight text-2xl`
  - [x] 38.3 Cards de estado de servicios: `rounded-xl` → `rounded-[2rem]`, header con icono de color según estado + título `font-jakarta font-bold uppercase italic`

- [x] 39. Checkpoint final — Admin Premium Style
  - [x] 39.1 Búsqueda global de `font-syne` en `frontend/src/app/admin/` — confirmar cero ocurrencias
  - [x] 39.2 Revisión visual rápida en todas las páginas admin — confirmar consistencia de bordes, tipografía y colores
  - [x] 39.3 Ejecutar `npx tsc --noEmit` en `frontend/` — cero errores TypeScript
  - [x] 39.4 Actualizar `CHANGELOG_GEMINI.md` con el upgrade visual completo
