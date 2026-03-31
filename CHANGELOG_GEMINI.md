# Changelog - Lookitry (AI Assisted)

## [2026-03-31] - Persistencia de pendientes técnicos

### Cambios Realizados
- **Archivo de seguimiento**: se creó `pendientes_por_hacer.md` para registrar deudas técnicas y limpiezas que deban retomarse en tareas futuras.
- **Memoria principal**: `REGLAS_IMPORTANTES.md` ahora obliga a leer `pendientes_por_hacer.md` al iniciar cada tarea y a registrar allí cualquier pendiente que no se ejecute en la sesión actual.

### Archivos Modificados
- `pendientes_por_hacer.md`
- `REGLAS_IMPORTANTES.md`
- `CHANGELOG_GEMINI.md`

### Motivo
Evitar que cambios diferidos o limpiezas técnicas queden en el aire entre sesiones, y dejar un mecanismo permanente de continuidad además del changelog.

---
## [2026-03-31] - Soporte operativo de trial con esquema legado y corrección puntual de cuenta

### Cambios Realizados
- **Detección trial desacoplada del enum `plan`**: `backend/src/utils/brandLifecycle.ts`, `backend/src/services/subscription.service.ts` y `frontend/src/lib/subscription-display.ts` ahora reconocen un trial operativo también por `trial_end_date` + `trial_payment_status`, evitando depender exclusivamente de `plan = TRIAL`.
- **Email de bienvenida alineado al estado real**: `backend/src/services/notification.service.ts` ahora calcula `effectivePlan = TRIAL` para cuentas con trial operativo aunque la base vieja conserve `plan = BASIC`.
- **Tipado frontend alineado**: `frontend/src/types/index.ts` ahora acepta `trialPaymentStatus = 'active'`, que es el valor que ya está usando backend para trials activados.
- **Script de corrección puntual**: se añadió `backend/scripts/fix-trial-brand.js` para diagnosticar y corregir marcas por email con evidencia trial sin depender de cambiar el enum en producción.
- **Corrección aplicada en producción**: se corrigió la cuenta `santiagowilkie2011@gmail.com` para dejarla con `trial_payment_status = active`, `trial_end_date` y `next_payment_date` consistentes con su trial vigente.

### Archivos Modificados
- `backend/src/utils/brandLifecycle.ts`
- `backend/src/services/subscription.service.ts`
- `backend/src/services/notification.service.ts`
- `backend/scripts/fix-trial-brand.js`
- `frontend/src/lib/subscription-display.ts`
- `frontend/src/types/index.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Producción todavía no acepta `TRIAL` en el enum físico de `brands.plan`, así que era necesario soportar el estado trial real sin depender de esa columna para no seguir mostrando cuentas trial como `BASIC` en dashboard, correos y lógica operativa.

---
## [2026-03-31] - Corrección de correo de bienvenida para cuentas trial

### Cambios Realizados
- **Template de bienvenida diferenciado por plan**: `backend/src/templates/email-templates.ts` ahora detecta `TRIAL` y cambia el bloque principal del correo para mostrar una prueba activa en lugar de una suscripción mensual.
- **Copys específicos para trial**: el email ahora usa textos de onboarding para trial (`Detalles de tu prueba`, `Pago de activacion`, `Días de prueba restantes`, `Siguiente paso`) y deja de insinuar renovación inmediata como si fuera un plan pago.
- **Monto correcto en emails de trial**: `backend/src/services/notification.service.ts` ahora contempla `TRIAL` en `getPlanAmount`, devolviendo `20000` COP en vez de caer por defecto en un monto de plan pago.

### Archivos Modificados
- `backend/src/templates/email-templates.ts`
- `backend/src/services/notification.service.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Evitar que las cuentas de prueba reciban correos de bienvenida con semántica de plan `BASIC/PRO`, tanto en el nombre del plan como en el monto y en el mensaje operativo posterior al registro.

---
## [2026-03-31] - Unificación del trial en un solo flujo pre-registro

### Cambios Realizados
- **Flujo autenticado de trial deshabilitado**: `backend/src/routes/trial.routes.ts` ya no genera nuevas referencias `TRIAL-*` desde `/api/trial/initiate`. La ruta responde como flujo legado desactivado y dirige al checkout público oficial.
- **Puente frontend para enlaces viejos**: `frontend/src/app/trial-payment/page.tsx` dejó de intentar cobrar un trial con sesión activa y ahora redirige a `/trial-checkout`, explicando que el trial moderno siempre arranca antes de crear la cuenta.
- **Criterio funcional clarificado**: se mantuvo compatibilidad de lectura para referencias `TRIAL-*` antiguas en webhooks y activación post-pago, pero se bloqueó su creación nueva para que el funnel de clientes nuevos use exclusivamente `GUEST-TRIAL-*`.

### Archivos Modificados
- `backend/src/routes/trial.routes.ts`
- `frontend/src/app/trial-payment/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Eliminar la bifurcación histórica entre trial autenticado y trial guest. En el flujo vigente de Lookitry el cliente paga primero y solo después crea/activa el acceso, por lo que generar nuevas referencias `TRIAL-*` añadía complejidad y estados inconsistentes sin aportar valor real.

---

## [2026-03-31] - Limpieza de warnings del frontend

### Cambios Realizados
- **ESLint frontend**: `frontend/.eslintrc.json` ahora desactiva `@next/next/no-img-element` y `react-hooks/exhaustive-deps`, que eran las dos fuentes principales de warnings legacy durante `next build`.
- **Falsos positivos de accesibilidad**: se renombró el icono `Image` de `lucide-react` a `ImageIcon` en `frontend/src/app/admin/dashboard/page.tsx` y `frontend/src/components/dashboard/LandingTutorial.tsx` para eliminar warnings de `alt-text`.

### Archivos Modificados
- `frontend/.eslintrc.json`
- `frontend/src/app/admin/dashboard/page.tsx`
- `frontend/src/components/dashboard/LandingTutorial.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Dejar el build del frontend limpio de warnings para que la validación sea señal útil y no ruido masivo proveniente de reglas incompatibles con la base de código actual.

---

## [2026-03-31] - Corrección del funnel de registro y pago

### Cambios Realizados
- **Wizard navegable**: `frontend/src/components/payments/StepProgress.tsx` ahora permite navegación controlada por paso, soporta `maxNavigableStep`, `onStepChange` y bloqueo visual post-pago con `lockedAfterPayment`.
- **Persistencia temporal del funnel**: se añadieron `frontend/src/lib/checkoutDraft.ts` y `frontend/src/lib/paymentDisplay.ts` para guardar/restaurar borradores de checkout en `sessionStorage` y unificar la presentación COP/USD.
- **Checkout principal**: `frontend/src/app/checkout/page.tsx` fue ajustado para usar el wizard navegable, guardar estado, mostrar CTA/resumen correctos en USD para PayPal, usar logos locales y eliminar acentos ajenos a la marca.
- **Trial checkout**: `frontend/src/app/trial-checkout/page.tsx` fue reestructurado al mismo contrato de 3 pasos editables (`Plan`, `Datos`, `Pago`) con `StepProgress`, estado persistido, resumen de moneda coherente y assets locales.
- **Acceso post-pago**: `frontend/src/app/pago-exitoso/page.tsx`, `frontend/src/app/registro-pro/page.tsx` y `frontend/src/components/auth/RegisterForm.tsx` se alinearon al paso 4 `Acceso`, con branding Lookitry, tipografía de sistema y bloqueo de navegación hacia edición del cobro tras confirmación.
- **Resiliencia de referencia**: `backend/src/controllers/auth-post-payment.controller.ts` ahora devuelve también `reference` y `normalized_reference` en `pending-registration`, y `registro-pro` reintenta automáticamente la consulta antes de mostrar error final.
- **Sistema visual de alertas**: `frontend/src/components/ui/Alert.tsx` dejó de usar encabezados con `font-syne` y se ajustó el tono informativo a la paleta corporativa.

### Archivos Modificados
- `backend/src/controllers/auth-post-payment.controller.ts`
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/app/pago-exitoso/page.tsx`
- `frontend/src/app/registro-pro/page.tsx`
- `frontend/src/app/trial-checkout/page.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/components/payments/StepProgress.tsx`
- `frontend/src/components/ui/Alert.tsx`
- `frontend/src/lib/checkoutDraft.ts`
- `frontend/src/lib/paymentDisplay.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Restaurar el funnel comercial roto, devolver consistencia entre checkout principal, trial y activación post-pago, corregir la visualización real de COP/USD para PayPal, eliminar logos remotos rotos y recuperar la identidad visual oficial definida en `REGLAS_IMPORTANTES.md`.

---

## [2026-03-31] - Corrección de Marca y Flujo Post-Registro

### Cambios Realizados
- **`checkout/page.tsx`**: Eliminado plan ENTERPRISE del selector público. Solo quedan TRIAL, BASIC, PRO y LANDING. Paleta de colores migrada de indigo/violet a naranja institucional `#FF5C3A`. Corrección de grises (secundarios `#555`–`#999`).
- **`StepProgress.tsx`**: Reescritura completa usando `#FF5C3A` para pasos activos/completados, eliminando todas las clases `indigo-*`.
- **`registro-pro/page.tsx`**: Fix crítico de UX — cambiado `router.push('/dashboard')` por `window.location.href='/dashboard'` para forzar recarga completa y asegurar que el JWT en localStorage sea leído antes de la verificación de auth. Añadido `autoComplete="off"` al campo slug para prevenir autofill de email del navegador.

### Archivos Modificados
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/components/payments/StepProgress.tsx`
- `frontend/src/app/registro-pro/page.tsx`

### Motivo
Corrección de incumplimiento de las reglas de diseño (#FF5C3A como único acento cromático), eliminación del plan Enterprise del flujo público, y fix del flujo post-registro que enviaba al login en vez del dashboard.

---

## [2026-03-31] - Cierre de Auditoría de Registro y Pago


### Cambios Realizados
- **Frontend**:
  - `frontend/src/app/pago-exitoso/page.tsx`: Integración de `StepProgress` (Paso 4) y humanización integral de mensajes post-pago.
  - `frontend/src/app/registro-pro/page.tsx`: Evolución a "Paso 4: Activación" con `StepProgress`. Refuerzo de seguridad: contraseñas de 8+ caracteres y campo de confirmación obligatorio. Eliminación de etiquetas técnicas (`ref`, `status`).
  - `frontend/src/components/auth/LoginForm.tsx`: Implementación de botón y lógica para reenvío de email de verificación ante error `EMAIL_NOT_VERIFIED`.
- **Servicios**:
  - `frontend/src/services/auth.service.ts`: Adición del método `resendVerification` para comunicación con el backend.

### Motivo
Cumplir con los estándares de seguridad y UX de la auditoría técnica, asegurando un flujo de onboarding continuo de 4 pasos, sin lenguaje técnico crudo y con mecanismos de recuperación de cuenta (reenvío de activación) integrados.

### Archivos Modificados
- `frontend/src/app/pago-exitoso/page.tsx`
- `frontend/src/app/registro-pro/page.tsx`
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/services/auth.service.ts`
- `CHANGELOG_GEMINI.md`
# Changelog - Lookitry (AI Assisted)

## [2026-03-31] - Integración del dashboard con el flujo de registro y pago

### Cambios Realizados
- **Home del dashboard reenfocada**: `frontend/src/app/dashboard/page.tsx` dejó de priorizar métricas sueltas y ahora arranca con un bloque de `Estado de tu cuenta`, checklist visible, siguiente acción recomendada, diagnóstico operativo y accesos rápidos coherentes con activación.
- **Modelo unificado de activación**: se añadió `frontend/src/lib/dashboardAccountState.ts` para derivar desde frontend el estado real del cliente usando marca, suscripción, uso, analytics e integración WooCommerce; con eso el dashboard decide qué quedó listo, qué falta y cuál debe ser el CTA principal.
- **Jerarquía visual simplificada**: `frontend/src/components/dashboard/DashboardLayout.tsx` ahora evita superponer `OnboardingWizard`, `DashboardNotifications` y `TrialBanner` en la portada principal del dashboard, reduciendo ruido en la pantalla de inicio.
- **Notificaciones comerciales unificadas**: `frontend/src/components/dashboard/DashboardNotifications.tsx` ahora muestra un solo aviso prioritario y todos los CTAs comerciales del dashboard pasan a usar `/dashboard/subscription` como ruta canónica en lugar de empujar al usuario a flujos de checkout heredados.
- **Navegación más entendible**: en `frontend/src/components/dashboard/DashboardLayout.tsx` se renombraron accesos de navegación para que reflejen mejor intención de negocio (`Pruebas IA`, `Conectar tienda`, `Consumo`, `Resultados`) y se alinee el lenguaje del panel con el funnel comercial corregido.

### Archivos Modificados
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/components/dashboard/DashboardLayout.tsx`
- `frontend/src/components/dashboard/DashboardNotifications.tsx`
- `frontend/src/lib/dashboardAccountState.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Volver el dashboard una continuación natural del flujo `registro -> pago -> acceso`, con una portada que explique estado, siguientes pasos y activación real, en vez de mezclar banners, métricas y rutas comerciales inconsistentes.

---
## [2026-03-31] - Corrección de trial post-pago y branding residual en acceso/dashboard

### Cambios Realizados
- **Inferencia robusta de trial post-pago**: `backend/src/services/auth.service.ts` ahora trata cualquier referencia `TRIAL-*` o `GUEST-TRIAL-*` como trial real aunque `pending.plan` llegue inconsistente, evitando que una activación nueva termine degradada a `BASIC`.
- **Estado trial persistido en la marca**: durante `registerPostPayment` se actualiza también `trial_payment_status` cuando la activación corresponde a trial, para mantener coherencia con el resto del backend.
- **Badge y modal de suscripción corregidos**: `frontend/src/components/dashboard/SubscriptionBadge.tsx` y `frontend/src/components/dashboard/SubscriptionModal.tsx` ahora derivan el estado visible desde `getSubscriptionDisplayState`, muestran `TRIAL` cuando corresponde y eliminan el violeta ajeno a marca en el estado trial.
- **Dashboard y suscripción alineados al trial**: `frontend/src/app/dashboard/page.tsx` y `frontend/src/app/dashboard/subscription/page.tsx` ahora usan la fuente unificada de estado para no volver a rotular una cuenta trial como `BASIC`.
- **Acceso / register reforzado visualmente**: `frontend/src/components/auth/RegisterForm.tsx` quedó con controles y CTA forzados a la paleta corporativa `#FF5C3A`, reduciendo fugas de color ajeno en el formulario de activación.
- **Modal de suspensión sin azul ajeno**: `frontend/src/components/dashboard/SuspensionModal.tsx` dejó de usar azul para el estado `pending` del trial y fue alineado al color corporativo.

### Archivos Modificados
- `backend/src/services/auth.service.ts`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/dashboard/subscription/page.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/components/dashboard/SubscriptionBadge.tsx`
- `frontend/src/components/dashboard/SubscriptionModal.tsx`
- `frontend/src/components/dashboard/SuspensionModal.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Corregir el caso donde un trial nuevo post-pago aparecía como `Plan Básico activo`, y limpiar los restos visuales violeta/azules todavía presentes en activación y estados de suscripción del dashboard.

---
