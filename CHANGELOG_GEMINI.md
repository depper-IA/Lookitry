# Registro de Cambios — Lookitry (IA Gemini)

## 23 de Marzo, 2026 — Fix migración dominio: backend/.env

**Archivos modificados:**
- `backend/.env`

**Descripción:**
- `SMTP_USER`: `info@pruebalo.wilkiedevs.com` → `info@lookitry.com`
- `FRONTEND_URL`: `https://pruebalo.wilkiedevs.com` → `https://lookitry.com`

**Motivo:** Completar la migración al nuevo dominio lookitry.com. El código fuente (frontend/src, backend/src, docker-compose) ya estaba migrado correctamente. Solo quedaban estas 2 variables de entorno sin actualizar.

---

## 23 de Marzo, 2026 — Migración a lookitry.com y Health Check MinIO

**Archivos modificados:**
- Multiples archivos (script de búsqueda y reemplazo)
- `docker-compose.frontend.yml` y `docker-compose.backend.yml`
- `backend/src/controllers/health.controller.ts`
- `frontend/src/app/admin/health/page.tsx`
- `frontend/src/app/admin/configuracion/page.tsx`
- `frontend/package.json` y `backend/package.json`

**Descripción:**
- **Rebranding de Dominio**: Migrados todos los endpoints públicos y de API de `pruebalo.wilkiedevs.com` y `api.pruebalo.wilkiedevs.com` a `lookitry.com` y `api.lookitry.com` respectivamente, sin alterar la infraestructura para n8n o MinIO original.
- **SSL y Traefik**: Limpiadas etiquetas de ruteo de Traefik para forzar la emisión de los nuevos certificados SSL bajo los nuevos dominios.
- **Service Tags**: Los nombres de los paquetes de node fueron actualizados a `lookitry-frontend` y `lookitry-backend`.
- **Health Checks Panel Administrativo**: Añadida la verificación del estado y latencia del servicio MinIO en tiempo real. Ahora el panel de administración (/admin/health y configuracion general) muestra si el servicio de almacenamiento de imágenes está operativo (`ok`, `degraded` o `down`).

---
## 22 de Marzo, 2026 — Fix código duplicado en subscription/page.tsx + precios dinámicos + borde sidebar

**Archivos modificados:**
- `frontend/src/app/dashboard/subscription/page.tsx`
- `frontend/src/components/dashboard/DashboardLayout.tsx`

**Descripción:**
- Eliminado bloque JSX duplicado (~200 líneas) que quedó colgando después del cierre de la función `SubscriptionPage`, causando ~49 errores de TypeScript. El archivo fue reescrito limpiamente.
- Los cards de planes ahora muestran precios dinámicos desde `pricing_config` (campo `data.precio_mensual_cop`), igual que el checkout.
- Unificado el color del borde del logo del sidebar (`#1f1f1f` → `var(--border-color)`) para que coincida visualmente con el borde del header y eliminar el desajuste visual entre sidebar y header.


**Archivos modificados:**
- `frontend/src/components/dashboard/DashboardLayout.tsx`

**Descripción:**
- Eliminado `overflow-x-hidden` del contenedor `lg:pl-60` — estaba rompiendo el `sticky` del header (CSS: `overflow: hidden` en un ancestro cancela `position: sticky` en hijos).
- El `overflow-x-hidden` se mantiene solo en el `<main>` para contener el desbordamiento del contenido sin afectar el navbar.

**Motivo:** El header del dashboard dejaba de ser sticky al hacer scroll porque el contenedor padre tenía `overflow-x-hidden`.

---

## 22 de Marzo, 2026 — Fix overflow horizontal: DashboardLayout

**Archivos modificados:**
- `frontend/src/components/dashboard/DashboardLayout.tsx`

**Descripción:**
- Agregado `overflow-x-hidden` al contenedor principal `lg:pl-60` y al `<main>` del layout del dashboard.
- Esto corta cualquier contenido que se desborde horizontalmente (como las plan cards de la página de suscripción que salían por la izquierda del viewport).

**Motivo:** Fix de desbordamiento horizontal en el dashboard — contenido salía fuera del viewport por la izquierda.

---

## 22 de Marzo, 2026 — Fix Responsive: Dashboard Subscription — Layout y solapamiento

**Archivos modificados:**
- `frontend/src/app/dashboard/subscription/page.tsx`

**Descripción:**
- Grid principal: `lg:grid-cols-12` con `xl:col-span-7/5` → `lg:grid-cols-2` (más simple y estable en tablets)
- Columna derecha: eliminado `lg:sticky lg:top-[80px]` que causaba solapamiento al hacer scroll
- Plan cards: eliminado `scale-[1.02]` en la card activa (causaba overflow en mobile); `rounded-[2.5rem]` → `rounded-[2rem]`; `p-8` → `p-6`
- Métodos de pago: `ml-14` → `pl-12` (evita overflow en pantallas pequeñas)
- Tabla historial: typo `tracking-widesttext-right` → `tracking-widest text-right` en `<th>`
- Badge de estado en tabla: reemplazado `bg-current bg-opacity-10 border-current border-opacity-20` por `style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}` (compatible con CSS variables del design system)

**Motivo:** Fix de problemas responsive — solapamiento al hacer scroll, overflow en mobile y typo en clase CSS.

## 22 de Marzo, 2026 — Tarea 33: Admin Marketing/Promotions — Upgrade Visual

**Archivos modificados:**
- `frontend/src/app/admin/marketing/promotions/page.tsx`

**Descripción:**
- 33.1: `font-syne` ya no existía (corregido en sesión anterior). Sin cambios.
- 33.2: H1 "Promociones" ya tenía `font-jakarta font-black uppercase italic tracking-tight text-2xl`. Sin cambios.
- 33.3: Cards de formularios de promo/cupón: `rounded-xl` → `rounded-[2rem]`. Tablas de listado: `rounded-xl` → `rounded-[2rem]`. Estados vacíos: `rounded-xl` → `rounded-[2rem]`.
- 33.4: Botón "Nueva promoción": `rounded-lg font-semibold` → `rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20`. Botón "Nuevo cupón": mismo upgrade. Botones "Guardar" en formularios: mismo upgrade.

**Motivo:** Upgrade visual premium — alineación con el sistema de diseño Lookitry: bordes grandes, tipografía bold uppercase, sombras accent.

---

## 22 de Marzo, 2026 — Fix visual: Dashboard Subscription — Hero sin morado/azul/verde

**Archivos modificados:**
- `frontend/src/app/dashboard/subscription/page.tsx`

**Descripción:**
- Reemplazados los gradientes y colores de acento por plan: BASIC (azul `#4f8ef7`) y PRO (violeta `#a78bfa`) y TRIAL (verde `#34d399`) → todos unificados a naranja `#FF5C3A` con gradiente negro `#0a0a0a → #141414`.
- Botones primarios del hero: `color: '#08051e'` → `color: '#ffffff'` (texto blanco sobre naranja).
- El hero card ahora es consistente con la identidad de marca Lookitry en todos los planes.

**Motivo:** El usuario solicitó eliminar los colores morado/azul/verde del hero de suscripción y unificar con naranja y negro de la marca.

---

## 22 de Marzo, 2026 — Tarea 30: Admin Analytics — Upgrade Visual

**Archivos modificados:**
- `frontend/src/app/admin/analytics/page.tsx`

**Descripción:**
- 30.1: Verificado — no existía `font-syne` en el archivo (sin cambios necesarios).
- 30.2: H1 "Analíticas Globales" actualizado a `font-jakarta font-black uppercase italic tracking-tight text-2xl`.
- 30.3: Secciones de charts (`rounded-2xl` → `rounded-[2rem]`); h3 "Uso de IA por Mes" y "Suscripciones" con `uppercase italic` añadidos.
- 30.4: `StatCard` actualizado de `rounded-2xl` → `rounded-[1.5rem]`; padding `p-5` ya estaba correcto.

**Motivo:** Upgrade visual premium — complemento al task 12 ya completado. Alineación con el sistema de diseño Lookitry: bordes grandes, tipografía bold uppercase italic en headers.

---

## 22 de Marzo, 2026 — Tarea 26: Admin Revenue — Upgrade Visual

**Archivos modificados:**
- `frontend/src/app/admin/revenue/page.tsx`

**Descripción:**
- 26.1: Reemplazado `font-syne` → `font-jakarta` en todo el archivo: `KpiCard` (valor principal), `ClientesCard` (número grande), `TabROI` (porcentaje meta, valores ROI, margen, proyecciones), `TabIngresos`.
- 26.2: H1 "Ingresos y ROI" actualizado a `font-jakarta font-black uppercase italic tracking-tight text-2xl`.
- 26.3: Tabs de navegación (Ingresos / ROI / Configuración) migrados al patrón pill: contenedor `flex gap-4 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-fit` con `overflow-x-auto` para mobile; tab activo `bg-[#FF5C3A] text-white rounded-xl shadow-lg font-black uppercase tracking-widest`; tab inactivo `text-gray-500 hover:text-gray-300 font-medium`.
- 26.4: `KpiCard`: `rounded-2xl` → `rounded-[2rem]`, valor principal usa `font-jakarta font-bold`.
- 26.5: Secciones de contenido (ingresos mensuales, desglose de gastos, estado vs meta, proyecciones): `rounded-2xl` → `rounded-[2rem]`; h3 con `font-jakarta font-bold uppercase italic`.
- 26.6: `ClientesCard`: `rounded-2xl` → `rounded-[2rem]`, número grande usa `font-jakarta font-bold`.
- 26.7: Botones "Guardar" en `TabConfig`: `rounded-lg` → `rounded-2xl`, agregado `font-black uppercase tracking-widest`.
- Responsive: KPI cards actualizados a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`; tabs con `overflow-x-auto` para scroll horizontal en mobile.

**Motivo:** Upgrade visual premium alineado con el sistema de diseño Lookitry — bordes grandes `rounded-[2rem]`, tipografía bold uppercase italic en headers, patrón pill en tabs de navegación.

---

## 22 de Marzo, 2026 — Tarea 25: Admin Subscriptions — Upgrade Visual

**Archivos modificados:**
- `frontend/src/app/admin/subscriptions/page.tsx`

**Descripción:**
- 25.1: Verificado — no existía `font-syne` en el archivo (sin cambios necesarios).
- 25.2: H1 "Suscripciones" actualizado a `font-jakarta font-black uppercase italic tracking-tight text-2xl`.
- 25.3: Tabla wrapper: `rounded-2xl` → `rounded-[2rem]`.
- 25.4: Panel de filtros: `rounded-2xl` → `rounded-[2rem]`.
- 25.5: Filtros de estado (botones pill): ya usaban `bg-[#FF5C3A]` para el activo — sin cambios necesarios.
- 25.6: Modales internos (RenewModal, ChangePlanModal, ConfirmModal): paneles `rounded-2xl` → `rounded-[2rem]`; headers con `font-jakarta font-bold uppercase italic`.
- Paginación: `rounded-2xl` → `rounded-[2rem]`.
- Responsive: `overflow-x-auto` ya presente en tabla; agregado `flex-wrap` a botones de acción masiva para mobile.

**Motivo:** Upgrade visual premium alineado con el sistema de diseño Lookitry — bordes grandes `rounded-[2rem]`, tipografía bold uppercase italic en headers y modales.

---

## [Fecha actual] — Tarea 23: Admin Dashboard — Upgrade Visual Premium

**Archivos modificados:**
- `frontend/src/app/admin/dashboard/page.tsx`

**Descripción:**
- 23.1: Verificado — no existía `font-syne` en el archivo (sin cambios necesarios).
- 23.2: H1 "Dashboard" actualizado a `font-jakarta font-black uppercase italic tracking-tight text-2xl`.
- 23.3: Stat cards: `rounded-xl` → `rounded-[1.5rem]`, padding `p-4` → `p-5`.
- 23.4: Secciones "Distribución por plan", "Conversiones por mes" y "Mini-landings": `rounded-xl` → `rounded-[2rem]`; h2 de cada sección con `font-jakarta font-bold uppercase italic`.
- 23.5: Tabla "Detalle mensual de conversiones": wrapper `rounded-xl` → `rounded-[2rem]`; h2 del header con `font-jakarta font-bold uppercase italic`. Los `<th>` ya tenían `uppercase` — sin cambios adicionales.

**Motivo:** Upgrade visual premium alineado con el estilo editorial de `dashboard/mi-pagina/page.tsx` — bordes grandes, tipografía bold uppercase italic, consistencia con el sistema de diseño Lookitry.

---

## 22 de Marzo, 2026 — Sort en Mini-Landings y Pagos + Fix OpenRouter

**Archivos modificados:**
- `frontend/src/app/admin/mini-landings/page.tsx`
- `frontend/src/app/admin/payments/page.tsx`
- `backend/.env`

**Descripción:**
- Mini-Landings: agregado sort por Marca (A-Z), Plan, Estado landing y Días para eliminación. Headers de tabla clickeables con `ArrowUpDown` de lucide-react, mismo patrón que `subscriptions/page.tsx`. Filtrado migrado a `useMemo` para incluir el sort.
- Pagos: agregado sort por Marca, Monto, Fecha (default desc) y Estado. Headers clickeables con `ArrowUpDown`. Sort aplicado antes de paginar con `useMemo`.
- `backend/.env`: agregada variable `OPENROUTER_API_KEY=` (vacía, pendiente de completar con la key real de openrouter.ai/keys para que funcione la pestaña Créditos IA).

**Motivo:** Mejora de UX en tablas admin — consistencia con el patrón de sort ya existente en Marcas y Suscripciones. Fix del endpoint `/api/admin/openrouter-credits` que fallaba por variable de entorno faltante.

---

## 22 de Marzo, 2026 — Tasks 15–22: Admin Pages — Correcciones CSS Variables (Checkpoint)

**Archivos modificados:**
- `frontend/src/app/admin/payment-settings/page.tsx`
- `frontend/src/app/admin/notifications/page.tsx`
- `frontend/src/app/admin/brands/page.tsx`
- `frontend/src/app/admin/mini-landings/page.tsx`
- `frontend/src/app/admin/analytics/page.tsx`
- `.kiro/specs/ui-ux-redesign/tasks.md`

**Descripción:**
- Task 16.1: Badges de métodos inactivos en `payment-settings` — `bg-gray-500/10 text-gray-400 border-gray-500/20` → inline style con `rgba(255,255,255,0.05)`, `var(--text-muted)`, `var(--border-color)`. Dot inactivo `bg-gray-400` → `backgroundColor: 'var(--text-muted)'`
- Task 17.2: Botón cerrar modal en `notifications` — `hover:bg-white/10` → `hover:bg-[#ffffff]/10`
- Task 18.2: Iconos de sort en `brands` — `text-gray-400` → `style={{ color: 'var(--text-muted)' }}` (condicional con `#FF5C3A` cuando activo)
- Fix `mini-landings`: `IconGlobe` extendido con prop `style?: React.CSSProperties` para aceptar color via inline style
- Fix `analytics`: `</div>` extra eliminado en `StatCard` que causaba error JSX (TS2657)
- Tasks 19, 20, 21: Auditadas — ya usaban CSS variables correctamente, marcadas como completadas sin cambios
- TypeScript: `npx tsc --noEmit` → 0 errores

**Motivo:** Completar el checkpoint admin (task 22) del spec UI/UX redesign. Todas las páginas admin ahora usan el design system de variables CSS sin colores Tailwind hardcodeados.

---

## 22 de Marzo, 2026 — Task 13: Admin Conversion — Rediseño Visual

**Archivos modificados:**
- `frontend/src/app/admin/conversion/page.tsx`

**Descripción:**
- 13.1: Error state `bg-red-50 border-red-200 text-red-700` → `bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]`
- 13.2: Cards del funnel (Step 1, 2, 3 y conectores de flecha) `bg-white dark:bg-zinc-900` → `style={{ backgroundColor: 'var(--bg-card)' }}`; `text-gray-300` en ArrowRight → `style={{ color: 'var(--text-muted)' }}`
- 13.3: KPI rows `bg-gray-50 dark:bg-white/5` → `style={{ backgroundColor: 'var(--bg-hover)' }}` (3 filas: Tasa de Conversión, Drop-off Rate, LTV)

**Motivo:** UI/UX redesign spec task 13 — alineación con design system admin usando CSS variables en lugar de clases Tailwind hardcodeadas.

---

## 22 de Marzo, 2026 — Task 12: Admin Analytics — Rediseño Visual

**Archivos modificados:**
- `frontend/src/app/admin/analytics/page.tsx`

**Descripción:**
- 12.1: Error state `bg-red-50 border-red-200 text-red-700` → `bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]`
- 12.2: Barras del chart `bg-gray-100 dark:bg-gray-800/50` → `style={{ backgroundColor: 'var(--bg-hover)' }}`
- 12.3: Barras de progreso `bg-gray-100 dark:bg-gray-800` → `style={{ backgroundColor: 'var(--bg-hover)' }}`
- 12.4: H1 principal: agregado `font-jakarta`
- 12.5: H3/H4 de sección: agregado `font-jakarta`
- 12.6: StatCard — eliminado fondo `${color}15` del icono, color directo al icono, `borderLeft: 3px solid <accent>` en la card

**Motivo:** Alineación con design system admin (CSS variables, tipografía Jakarta en headings, stat cards con borderLeft según dirección estética establecida en `admin/dashboard/page.tsx`).

---

## 22 de Marzo, 2026 — Actualización tasks.md: Tareas Admin Rediseño

**Archivos modificados:**
- `.kiro/specs/ui-ux-redesign/tasks.md`

**Descripción:**
Reescritura completa del `tasks.md` para incluir las tareas de rediseño de todas las páginas del panel admin. Se mantuvieron las tareas anteriores (1–11) como completadas y se agregaron las tareas 12–22 cubriendo:
- Task 12: `admin/analytics/page.tsx` — error state, barras chart, barras progreso, headings, stat cards con icono de fondo
- Task 13: `admin/conversion/page.tsx` — error state, cards funnel, KPI rows
- Task 14: `admin/subscriptions/page.tsx` — checkboxes, iconos sort, botón suspender
- Task 15: `admin/mini-landings/page.tsx` — error state, icono vacío
- Task 16: `admin/payment-settings/page.tsx` — badges métodos inactivos
- Task 17: `admin/notifications/page.tsx` — toggle inactivo, botón cerrar modal
- Task 18: `admin/brands/page.tsx` — error state, iconos sort
- Task 19: `admin/marketing/promotions/page.tsx` — toggle track
- Task 20: `admin/revenue/page.tsx` — auditoría (ya correcto)
- Task 21: `admin/payments/page.tsx` — auditoría (ya correcto)
- Task 22: Checkpoint final admin

**Motivo:** Continuar el rediseño visual del panel admin con dirección estética consistente (borde izquierdo de color en cards, sin fondos de color en iconos, variables CSS en todo, `font-jakarta` en headings).

---

## 22 de Marzo, 2026 — Rediseño Estético del Panel Admin

**Archivos modificados:**
- `frontend/src/app/admin/layout.tsx`
- `frontend/src/app/admin/dashboard/page.tsx`

**Admin Layout (`layout.tsx`):**
- Sidebar refinado: altura de header unificada a 60px, badge pill "Admin" con borde naranja sutil, etiquetas de grupo con mayor contraste (`#3a3a3a`), hover states más definidos (`#161616`), user footer con card de fondo `#111`.
- Nuevo componente `PageTitle` en el header que muestra el nombre de la sección activa dinámicamente según el pathname.
- Estado de carga mejorado: spinner con label "Cargando" en uppercase tracking.
- Ancho del sidebar ajustado a 220px (antes 240px) para mayor densidad visual.
- Todos los elementos interactivos tienen `cursor-pointer` explícito.
- Fuente `font-jakarta` aplicada al logo y título de página según brand guidelines.

**Dashboard (`dashboard/page.tsx`):**
- Stat cards rediseñadas: borde izquierdo de color por categoría (`borderLeft: 3px solid accent`) en lugar de icon backgrounds planos — patrón más limpio y profesional.
- Icono de cada card alineado a la derecha con color del acento, sin fondo de color.
- Mini-landing cards con el mismo patrón de borde izquierdo de color.
- Barras del gráfico de conversiones con `opacity: 0` cuando el valor es 0 (evita barras fantasma).
- Todos los valores numéricos usan `tabular-nums` para alineación consistente.
- Cabeceras de tabla con color `var(--text-muted)` en lugar de `var(--text-secondary)` para mayor jerarquía visual.
- Fuente `font-jakarta` en todos los títulos de sección y valores numéricos grandes.

**Commit:** `38bf169` — pusheado a `main`.

## 22 de Marzo, 2026 — Fix Crítico: Auto-vinculación de Landing + Email de Activación

**Problema 1 — Plan sobreescrito con `NONE` al vincular landing a cuenta existente:**
- Al entrar a `/registro-pro?ref=TRYON-visitor_...` con sesión activa (plan BASIC/PRO), el backend tomaba `pending.plan = 'NONE'` y lo guardaba directamente en la cuenta, rompiendo el plan del usuario.
- **Fix en `backend/src/controllers/auth-post-payment.controller.ts`:** Si `pending.plan` es `NONE` o está vacío, se conserva el plan actual del usuario (`req.brand.plan`) en lugar de sobreescribirlo.

**Problema 2 — Bucle de auto-vinculación para usuarios con plan activo:**
- El `useEffect` de auto-link en `/registro-pro` se disparaba para cualquier usuario autenticado con un `ref` pagado, sin importar si el pending era de otra persona o de un flujo de visitante con plan distinto.
- **Fix en `frontend/src/app/registro-pro/page.tsx`:** El auto-link ahora solo se ejecuta si el pending es tipo landing-only (`plan = NONE`) o si el usuario no tiene plan activo. Si tiene plan activo y el pending quiere cambiar el plan, se muestra el formulario normal.

**Nuevo email — Activación de Mini-landing:**
- **`backend/src/templates/email-templates.ts`:** Nuevo template `landingActivatedEmail` con diseño premium, enlace directo a la mini-landing publicada y botones "Ver mi página" / "Personalizar".
- **`backend/src/services/notification.service.ts`:** Nuevo método `sendLandingActivatedEmail(brand)` que se dispara automáticamente cuando `has_landing_page` se activa en el flujo post-pago. No bloquea el flujo (catch silencioso).
- El email se envía tanto para cuentas nuevas como para usuarios existentes que compran la landing por separado.

Este archivo documenta las mejoras técnicas, correcciones y tareas pendientes realizadas por la IA para mantener la continuidad del desarrollo.

## 22 de Marzo, 2026 — Política de Cookies (GDPR/CCPA) y Precios Dinámicos

**Precios Dinámicos en Notificaciones:**
- **Problema:** El módulo de correos `notification.service.ts` utilizaba valores en formato "duro" (`150000` y `250000`) para cobrar en los correos de bienvenida, suspensión y recordatorio. Estaban desincronizados del panel Admin.
- **Correcciones:** `getPlanAmount()` fue reestructurada para ser asíncrona y leer dinámicamente el precio estipulado en la base de datos `pricing_config`. Todos los emails automatizados reflejan ahora el valor fiel guardado en el backend.

**Cumplimiento Legal (Manejo de Cookies):**
- **Implementación:** Se incluyó un nuevo Global Banner (Componente `CookieConsent` en `layout.tsx`) con diseño premium responsivo y adaptativo. 
- **Privacidad y Auditoría:** Este banner informa clara y concisamente a los visitantes y usuarios sobre la naturaleza de las cookies empleadas durante la sesión y ofrece botones funcionales para aprobar y/o rechazar cookies no esenciales sin bloquear las JWT principales de autenticación (cumpliendo GDPR de Europa y CCPA de California).
- **Backend Analytics:** En el backend no existen interceptores de third-party cookies ocultos o sin autorizar (el servicio se basaba principalmente en la JWT en `localStorage`). Las cookies aceptadas son delegadas al frontend mediante despachos de eventos DOM.

- **Estatus VPS:** Despliegue completado con éxito. El sitio `https://lookitry.com` ya cuenta con el nuevo banner de consentimiento de cookies y está operando con la lógica de precios y suscripciones sincronizada.

---

## 22 de Marzo, 2026 — Activación de Cron Job de Suspensión de Cuentas

**Problema:** La lógica de suspensión de cuentas y caducidad de planes (`updateSubscriptionStatuses`) estaba desarrollada en los servicios, pero descubrí que faltaba anexarla al ciclo del motor maestro de Cron Jobs (`cleanup.job.ts`). Estaban corriendo todos los procesos de limpieza de imágenes y advertencias de landings, pero ninguna cuenta era marcada como inactiva ni suspendida de forma automatizada cuando pasaban sus límites.

**Corrección:**
- Se integró la función `subscriptionService.updateSubscriptionStatuses()` programada para las **2:00 AM** de todos los días. 
- La cascada de dependencias automáticas ahora es sólida:
  1. **2:00 AM**: Las suscripciones vencidas cambian de `active` a `expired` a `suspended`.
  2. **3:30 AM**: Las cuentas que ya cumplieron el periodo máximo de suspensión (90 días) son "soft-deleted" (sus datos cambian a `[ELIMINADA]`).
  3. **3:45 AM**: Se cancelan en internet y se suspenden las integraciones Mini Landing de todas las cuentas recientemente suspendidas.
  4. **4:15 AM**: Se eliminan definitivamente aquellas Landing suspendidas por más de 90 días, alertando y purificando la base de datos de MinIO.

---

## 22 de Marzo, 2026 — Corrección Crítica en Monto de Wompi/PayPal (Aborto de Código)

**Problema:** Al procesar usuarios nuevos tras un pago, el endpoint `register-post-payment` enviaba un registro forzado de `amount: 0` al historial de pagos en DB. La base de datos rechazaba `$0` (o Wompi crasheaba internamente) lanzando una excepción. Como esta excepción ocurría **antes** de marcar la "Landing activa" en la base de datos (y afectaba el historial de meses de pago), el sistema atrapaba el error y abortaba silenciosamente. El usuario quedaba con Plan PRO (actualizado previamente) pero sin los meses en el recibo y sin su landing activa.

**Correcciones:**
- `backend/src/controllers/auth-post-payment.controller.ts`: Se refactorizó la validación de transacciones Wompi y PayPal para extraer dinámicamente el monto real cobrado al cliente (ej. `transaction.amount_in_cents / 100`).
- Se introdujo la variable `paymentAmount` a lo largo del proceso.
- En `subscriptionService.renewSubscription`, se reemplazó el `amount: 0` quemado en el `paymentData` por `paymentAmount`.
- **Efecto logrado:** El historial de pagos ahora registra correctamente los montos abonados de Wompi/PayPal, lo que previene que la aplicación arroje errores invisibles y asegura que se cumpla de forma ininterrumpida todo el código subsiguiente (Landing = true, actualización de meses comprados visibles).

---

## 22 de Marzo, 2026 — Soporte Cupones 100% para Visitantes en Checkout Público

**Problema:** El checkout público (`/checkout/page.tsx`) obligaba a los visitantes sin cuenta a procesar el pago de monto $0 con Wompi (lo que causaba error) e ignoraba la funcionalidad de activar planes gratis. Además, la creación de cuenta post-pago fallaba porque verificaba en Wompi el estado de transacciones gratuitas, que sólo existían localmente.

**Correcciones:**
- `frontend/src/app/checkout/page.tsx`: Si `totalPrice === 0` y no hay sesión, en lugar de mostrar error asume que el usuario quiere crear la cuenta. Envía el email del input al endpoint `free-checkout`. Al recibir la bandera `isVisitor: true` con la referencia única, redirecciona directo a `/registro-pro?ref=XYZ`.
- `backend/src/controllers/wompi.controller.ts`: El endpoint `/api/payments/wompi/free-checkout` ahora permite operaciones sin JWT (visitantes). Guarda un "pedido fantasma" (`pending_registration`) en base de datos pre-marcado con `status: 'paid'` y con ID de pago `coupon_100_free_checkout`.
- `backend/src/controllers/auth-post-payment.controller.ts`: En el endpoint `register-post-payment` de `/registro-pro`, la validación de finalización de pago ahora comprueba primero si el estado del `pending_registration` local ya es `'paid'`. Si es así, **omite la consulta REST a Wompi** y crea la cuenta automáticamente, finalizando existosamente el onboarding gratuito validando los cupones.

---

## 22 de Marzo, 2026 — Fix Email de Bienvenida + Sincronización Landing en Checkout Público

### Email de Bienvenida (nunca llegaba)
**Root cause:** `sendWelcomeEmail` verificaba preferencias en la tabla `notification_preferences` antes de enviar. Para marcas recién creadas esta tabla está vacía, y el error al consultarla se propagaba silenciosamente abortando el envío.

**Correcciones:**
- `backend/src/services/notification.service.ts`: Se agregó el parámetro `skipPreferenceCheck = false` al método `sendWelcomeEmail`. Para registros nuevos se pasa `true` y la función omite la verificación de preferencias.
- `getDaysRemaining` también puede fallar en Trial sin suscripción activa — se agregó un try/catch interno con fallback de 7 días para que no aborte el envío del email.
- El `catch` final ya **no relanza** el error (`throw error` eliminado) — el email de bienvenida nunca debe bloquear el flujo de registro.
- `backend/src/controllers/auth.controller.ts`: Llamada en `verifyEmail` actualizada a `sendWelcomeEmail(brand, true)`.
- `backend/src/controllers/auth-post-payment.controller.ts`: Llamada en flujo post-pago actualizada a `sendWelcomeEmail(brand, true)`.

### Checkout Público (plan + landing + meses)
**Root cause:** El controlador `auth-post-payment.controller.ts` sí guardaba `has_landing_page = true` en Supabase, pero **no lo incluía en el objeto `brand` retornado**. Al guardar la sesión en `localStorage`, el frontend inicializaba con `has_landing_page = false`.

**Corrección:** El controlador ahora mutáta `(result.brand as any).has_landing_page = true` y `landing_suspended_at = null` antes de enviar la respuesta, sincronizando la sesión del frontend inmediatamente.

---

## [2026-03-22] - Corrección de Flujo de Checkout y Autenticación

### Fixed
- **Frontend**: Se añadió el header `Authorization` en el checkout de la mini-landing para que el backend detecte correctamente al usuario logueado.
- **Frontend**: En `/registro-pro`, se implementó la auto-vinculación de pagos para usuarios con sesión activa, evitando formularios innecesarios.
- **Backend**: Se cambió la prioridad del `authMiddleware` para dar precedencia al header `Authorization` sobre las cookies, eliminando el bucle de "login requerido" tras registros exitosos.
- **Backend**: Se unificó el middleware `optionalAuth` en todas las rutas de pago y se actualizó el controlador de registro post-pago para soportar vinculación a cuentas existentes sin errores de duplicidad.
- **Backend**: Corregida la inconsistencia en `wompi.routes.ts` donde un middleware local ignoraba las cookies de sesión.

---

## 22 de Marzo, 2026 — Solución a Desconexión de Registro Post-Pago (Landing Page)

- **Sincronización de Sesión Frontend/Backend:**
  - Se modificó `backend/src/controllers/auth-post-payment.controller.ts` para que, en caso de incluir mini-landing, actualice el flag `has_landing_page = true` directamente sobre el objeto `brand` retornado, en lugar de mutar solo la base de datos de Supabase de fondo. Esto asegura que el `localStorage` del frontend cargue la sesión con la landing activa inmediatamente.
- **Transparencia en UI de /registro-pro:**
  - Se agregó el endpoint `GET /api/auth/pending-registration/:ref` en el backend para permitir la consulta desprotegida (pública, por referencia) del contenido de un carrito de compra pagado.
  - El frontend (`RegistroProContent`) ahora hace polling a ese endpoint para adaptar su UI dinámicamente con base en los ítems adquiridos, mostrando la duración real, el plan respectivo (Básico/Pro) y añadiendo el sufijo `+ Mini-landing` si estuvo incluida en el paquete original de Wompi o PayPal.
  - Se generalizó el texto del formulario de "Activar Plan Pro" a "Activar Cuenta".

---

## 22 de Marzo, 2026 — Mejora de Persistencia de Memoria y Normas de Registro

- **Reglas de Persistencia (LOOKITRY_MASTER_MEMORY.md):**
  - Se ha añadido la **Regla de Oro**: lectura obligatoria del archivo de memoria maestra al inicio de cualquier sesión.
  - Se formalizó el requerimiento de registro de cambios en `CHANGELOG_GEMINI.md` sin excepciones.
  - Prohibición estricta de placeholders o comentarios `// TODO`.
- **Registro de Continuidad:**
  - Este cambio asegura que las IAs futuras (incluyendo este asistente) sigan el flujo de trabajo correcto sin perder contexto del proyecto.

## 22 de Marzo, 2026 — Refactorización del Checkout Interno de Mini-landing

- **Lógica de Cobro Dinámica:**
  - Los usuarios con planes activos (`BASIC`/`PRO`) ahora solo pagan el cargo único de la mini-landing ($650.000 COP). Se oculta la selección de planes y se envía `plan=NONE` a la pasarela.
  - Los usuarios en `TRIAL` tienen la selección de plan obligatoria, permitiendo elegir entre `BASIC` y `PRO` y la duración (1-12 meses) para aplicar descuentos.
- **Detección de Planes:**
  - Implementada comparación insensible a mayúsculas para los estados de plan (`TRIAL`, `BASIC`, `PRO`).
  - Sincronización automática de la selección del plan basada en la suscripción actual del usuario.
- **Experiencia de Usuario:**
  - Añadido manejo de estados de carga (`isLoading`) para evitar saltos visuales en la UI mientras se verifica la sesión.
  - El resumen del pedido ahora desglosa correctamente los descuentos por duración de suscripción solo cuando corresponde.

## 21 de Marzo, 2026 — Corrección Integral de Identidad Visual y Errores Técnicos

- **Identidad de Marca y Tipografía:**
  - Restauradas fuentes oficiales en la landing principal: **Plus Jakarta Sans** (títulos) y **DM Sans** (cuerpo).
  - Eliminadas clases de fuentes no deseadas (`font-syne`, `font-sans`) que sobreescribían el diseño original.
  - Actualizado `tailwind.config.ts` con soporte para todas las tipografías del dashboard (**Jakarta, Playfair, Tech, Syne**).
  - Implementada herencia forzada de fuentes en `globals.css` para asegurar que los títulos cambien dinámicamente con el selector.

- **Estabilidad y Errores de Consola:**
  - Corregido error 500 de `favicon.ico` mediante la implementación nativa de `icon.png` en Next.js.
  - Silenciados errores de hidratación (`Extra attributes from server`) mediante `suppressHydrationWarning` en la etiqueta `<html>`.
  - Reparados errores de sintaxis y etiquetas mal cerradas en `layout.tsx` y `LandingClient.tsx`.

- **Refuerzo de UI en Templates:**
  - Corregido layout del template **Editorial**: encabezado ahora es totalmente opaco con sombra para evitar que el contenido se trasluzca.
  - Reintegrado `LandingNav` en `LandingClient` para mantener consistencia estructural.

## 21 de Marzo, 2026 — Restauración Estructural de Landing Principal

- **Corrección de Estructura (Landing Principal):**
  - Reintegrado `LandingNav` dentro de `LandingClient` para mantener la jerarquía original y asegurar el comportamiento `sticky`.
  - Restaurado el contenedor `main` con las clases `min-h-screen` y `overflow-x-hidden` en `LandingClient.tsx`.
  - Eliminado el envoltorio `div` redundante en `LandingClient.tsx` que causaba inconsistencias de fondo.
  - Limpieza de importaciones no utilizadas en `src/app/page.tsx`.
  - Corregido error de etiquetas mal cerradas tras el cambio de contenedor.

## 21 de Marzo, 2026 — Rediseño Premium Editorial y Correcciones de Estabilidad

### ✅ Cambios Aplicados
1. **Rediseño del Template Editorial:**
   - **Prioridad de Conversión:** Catálogo y Probador Virtual ahora son los protagonistas absolutos.
   - **Optimización de Espacio:** Sección de Información y Horarios reubicada debajo del catálogo en un formato **side-by-side** (izquierda/derecha) para eliminar espacio negativo.
   - **Footer Estético:** Nuevo pie de página premium con fondo dinámico (`widget_bg_color`), branding destacado y logos sociales reales.
   - **Grid Refinado:** Ajuste del tamaño de productos a 3 columnas en desktop para una apariencia más elegante.
2. **Correcciones Técnicas Críticas:**
   - **Fix `shared.tsx`:** Restauración completa del archivo para eliminar corrupción de caracteres y asegurar la exportación de todos los iconos premium.
   - **Eliminación de Error de Renderizado:** Resuelto el error "Element type is invalid" en el componente Editorial al asegurar que todos los sub-componentes e iconos estén definidos.
3. **Responsive Pro Max:**
   - Verificado el comportamiento de los encabezados y pies de página en móviles, asegurando que los iconos sociales y el nombre de la marca se ajusten dinámicamente.

### ⏳ Tareas en Proceso / Pendientes
- **Ejecución SQL:** Pendiente ejecutar `ALTER TABLE brands ADD COLUMN landing_font TEXT DEFAULT 'font-jakarta';` y `ALTER TABLE brands ADD COLUMN widget_bg_color TEXT DEFAULT '#0a0a0a';` en Supabase.
- **Pruebas de PayPal:** Verificar el flujo completo de checkout con PayPal en producción.

---

## 19 de Marzo, 2026

### ✅ Cambios Aplicados
1. **Restauración de Landing Principal:** 
   - Se fusionó el diseño y copy original de `templates-webs/LandingClient.tsx` con la lógica dinámica de precios.
   - La landing vuelve a tener la identidad visual de Lookitry pero con datos de base de datos.
2. **Mejora del Panel Admin Pricing:**
   - Implementada la edición de **Días de Trial** y **Límite de Generaciones**.
   - Sincronizados los cálculos de ROI para que usen costos y metas reales de la base de datos.
   - Añadido **Cálculo Automático de Descuentos** en los planes Básico y Pro (al cambiar precio original vs actual).
3. **Corrección Multimoneda en Planes:**
   - La página `/planes` ahora responde correctamente al selector COP/USD.
   - Todos los precios, totales y comparativas se formatean dinámicamente.
4. **Navegación (Breadcrumbs):**
   - Creado componente reutilizable `src/components/ui/Breadcrumbs.tsx`.
   - Añadidos breadcrumbs a la página de **Sobre Nosotros**.

---
*Nota para la IA: Antes de empezar, lee este archivo y actualízalo al finalizar cada tarea.*

## 22 de Marzo, 2026 — UI/UX Redesign: Tareas 1–4 (Shared Components + Layouts)

**Spec:** `.kiro/specs/ui-ux-redesign/` — Rediseño visual incremental del frontend de Lookitry.

### Tarea 1 — Shared UI Components (correcciones base)

**`frontend/src/components/ui/Button.tsx`**
- Confirmado: `cursor-pointer` y `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A]/50` ya presentes en la clase `base`.
- Confirmado: `focus:outline-none` genérico eliminado, reemplazado por `focus-visible`.
- Requirements: 1.3, 1.8, 7.1, 7.2, 7.8

**`frontend/src/components/ui/Input.tsx`**
- Confirmado: `backgroundColor` cambiado de `var(--bg-card)` → `var(--bg-input)` en el `style` del `<input>`.
- Confirmado: `cursor-text` presente en el className del `<input>`.
- Requirements: 1.1, 2.3, 8.3

**`frontend/src/components/ui/Card.tsx`**
- Confirmado: prop `interactive?: boolean` agregada a `CardProps`.
- Confirmado: cuando `interactive=true`, aplica `cursor-pointer hover:border-[#FF5C3A]/40 hover:shadow-md transition-all duration-200 motion-safe:hover:scale-[1.01]`.
- Requirements: 1.8, 7.1, 7.3, 7.7, 7.8

### Tarea 2 — Checkpoint componentes base

- `npx tsc --noEmit` en `frontend/` → sin errores de TypeScript.

### Tarea 3 — DashboardLayout (correcciones de layout)

**`frontend/src/components/dashboard/DashboardLayout.tsx`**
- **3.1** Email verification banner: `bg-[#0a0a0a] border-[#1a1a1a]` → `style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}`. Requirements: 3.8, 8.1, 8.2
- **3.2** Nav Links del sidebar: agregado `cursor-pointer` al className de cada `<Link>` en `sidebarContent`. Requirements: 3.13, 7.1
- **3.3** Body scroll lock: agregado `useEffect` que aplica `document.body.style.overflow = 'hidden'` cuando `sidebarOpen = true` y lo limpia al cerrar o desmontar. Requirements: 3.12, 6.8

### Tarea 4 — AdminLayout (cursor-pointer en nav items)

**`frontend/src/app/admin/layout.tsx`**
- **4.1** Agregado `cursor-pointer` al className del `<Link>` dentro de `group.items.map(...)` en el nav del sidebar. Requirements: 5.7, 7.1

**Verificación:** `getDiagnostics` en ambos archivos → sin errores.

## 22 de Marzo, 2026 — Task 14: Admin Subscriptions — Correcciones visuales

**Archivos modificados:**
- `frontend/src/app/admin/subscriptions/page.tsx`

**Descripción:**
- 14.1: Checkboxes (select-all en thead y por fila en tbody) — eliminado `border-gray-300`, agregado `style={{ borderColor: 'var(--border-color)' }}`
- 14.2: Iconos `ArrowUpDown` de sort en columnas Marca, Plan y Vencimiento — reemplazado `text-gray-400` por `style={{ color: 'var(--text-muted)' }}` (activo sigue usando `#FF5C3A` via style inline)
- 14.3: Botón suspender — `bg-red-500/10 text-red-500 hover:bg-red-500/20` → `bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20`

**Motivo:** UI/UX redesign spec task 14 — alineación con design system admin usando CSS variables y colores de estado definidos.

---

## 22 de Marzo, 2026 — Reescritura tasks 23–39: Upgrade Visual Admin Premium

**Archivos modificados:**
- `.kiro/specs/ui-ux-redesign/tasks.md`

**Descripción:**
Reescritura completa del bloque de tareas 23–39 en el spec de UI/UX redesign. Los cambios principales respecto a la versión anterior:

1. **Doble fuente de referencia visual:** Se agregó `dashboard/settings/page.tsx` como segunda referencia junto a `dashboard/mi-pagina/page.tsx`. Settings aporta el estilo limpio/funcional (alertas con `rounded-lg`, espaciado `space-y-5`), mientras mi-pagina aporta el estilo bold/editorial (bordes grandes, tipografía uppercase italic, tabs pill).

2. **Corrección crítica de fuente (`font-syne` → `font-jakarta`):** Se detectó que varias páginas admin usan `font-syne` que NO existe en el design system del proyecto. La fuente correcta para headings es `font-jakarta` (Plus Jakarta Sans). Se agregó una subtarea de corrección de fuente como primer paso en CADA página (23.1, 24.1, 25.1, 26.1, 27.1, 28.1, 29.1, 30.1, 31.1, 32.1, 33.1, 34.1, 35.1, 36.1, 37.1, 38.1). Afectados confirmados: `brands/page.tsx`, `subscriptions/page.tsx`, `revenue/page.tsx` (KpiCard, ClientesCard, valores ROI).

3. **Tokens de diseño más precisos:** Se especificaron las clases exactas para H1 (`font-jakarta font-black uppercase italic tracking-tight text-2xl`), H2/H3 (`font-jakarta font-bold uppercase italic`), tabs, botones y toasts, referenciando el código real de ambas páginas fuente.

4. **Task 39 ampliado:** Se agregó subtarea 39.1 de búsqueda global de `font-syne` en `/admin/` para confirmar cero ocurrencias antes del checkpoint final.

**Motivo:** El usuario señaló que las tareas anteriores solo referenciaban `mi-pagina` y no incluían la corrección de fuentes incorrectas.


---

## 22 de Marzo, 2026 — Tarea 24: Admin Brands — Upgrade Visual Premium

**Archivos modificados:**
- `frontend/src/app/admin/brands/page.tsx`

**Descripción:**
- 24.1: Reemplazadas todas las ocurrencias de `font-syne` → `font-jakarta` en el archivo (6 ocurrencias: h3 "Estadísticas", valor numérico en stat cards del modal detalles, h2 modal productos, h2 modal crear marca, h2 modal activar plan, h2 modal configuración de modal).
- 24.2: H1 "Gestión de Marcas" ya tenía `font-jakarta font-black uppercase italic tracking-tight text-2xl` — sin cambios adicionales.
- 24.3: Panel de filtros ya tenía `rounded-[2rem]` — sin cambios adicionales.
- 24.4: Tabla wrapper ya tenía `rounded-[2rem]` — sin cambios adicionales.
- 24.5: Botón "Nueva Marca" ya tenía `rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20` — sin cambios adicionales.
- 24.6: Modales actualizados — `rounded-2xl` → `rounded-[2rem]` en paneles de: modal productos, modal crear marca, modal activar plan, modal confirmación masiva, modal configuración de modal. Headers de todos los modales actualizados a `font-jakarta font-black uppercase italic`.

**Verificación:** `getDiagnostics` → sin errores TypeScript.

**Motivo:** Upgrade visual premium alineado con el estilo editorial de `dashboard/mi-pagina/page.tsx` — bordes grandes `rounded-[2rem]`, tipografía bold uppercase italic en todos los modales, eliminación de `font-syne` (fuente inexistente en el proyecto).

## 22 de Marzo, 2026 — Fix definitivo navbar siempre visible: DashboardLayout

**Archivos modificados:**
- `frontend/src/components/dashboard/DashboardLayout.tsx`

**Descripción:**
- Cambio de arquitectura de scroll: el contenedor `lg:pl-60` ahora tiene `h-screen overflow-hidden` en lugar de `min-h-screen`.
- El `<main>` ahora tiene `overflow-y-auto overflow-x-hidden` — el scroll ocurre dentro del main, no en el body.
- El header ya no necesita `sticky top-0 z-10` — al estar fuera del área scrolleable, queda naturalmente fijo. Se cambió a `flex-shrink-0`.
- Esto elimina definitivamente el problema de solapamiento y el header que se ocultaba al hacer scroll.

**Motivo:** Con `sticky` en el body, el header podía ser desplazado por componentes con `z-index` alto o `transform`. Al mover el scroll al `<main>`, el header siempre permanece visible sin depender de z-index.

---

## 22 de Marzo, 2026 — Fix header height + precios dinámicos en subscription

**Archivos modificados:**
- `frontend/src/components/dashboard/DashboardLayout.tsx`
- `frontend/src/app/dashboard/subscription/page.tsx`

**Descripción:**
- `DashboardLayout`: header `h-14` → `h-16` para coincidir con la altura del logo del sidebar (`h-16`). Ahora sidebar y navbar están alineados visualmente.
- `subscription/page.tsx`: corregido el fetch de `pricing_config` — el campo era `config` pero la tabla usa `data` (igual que en `checkout/page.tsx`). También corregido `select=id,config` → `select=id,data`.
- Limpiados imports no usados: `ShoppingBag`, `api`, `PlanType`, variables `heroGlow` y `heroSubtitle`.

**Motivo:** Las cards de planes mostraban precios estáticos ($150.000/$250.000 hardcodeados) porque el fetch fallaba silenciosamente al usar el campo incorrecto `config` en lugar de `data`. El header tenía 56px de alto vs 64px del sidebar, causando desalineación visual.

---
