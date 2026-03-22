# Registro de Cambios — Lookitry (IA Gemini)

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
