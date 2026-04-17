# PRD - Product Requirements Document

## Lookitry

---

## 1. Resumen Ejecutivo

**Lookitry** es una plataforma SaaS de probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica. Permite a las marcas integrar un widget de prueba virtual en su tienda en minutos, sin apps ni desarrollo adicional.

---

## 2. Productos y Planes

### 2.1 Planes de Suscripción

| Plan | Precio | Productos Activos | Generaciones/mes | Badge |
|------|--------|-------------------|-------------------|-------|
| **TRIAL** | $20.000 COP (pago único) | 1 | 15 (configurable por campaña) | `#6366f1` violeta |
| **BASIC** | $150.000 COP/mes | 5 | 400 | N/A |
| **PRO** | $250.000 COP/mes | 15 | 1.200 | N/A |
| **ENTERPRISE** | $800.000 COP/mes | 50 | 2.000 | N/A |

> Nota: Los valores de generaciones del plan PRO pueden variar entre `pricing_config` (1.200) y `plans.ts` (1.000). La fuente de verdad es la tabla `pricing_config`.

### 2.2 Descuentos por Duración

| Meses | Descuento |
|-------|-----------|
| 1 | 0% |
| 3 | 5% |
| 6 | 10% |
| 12 | 15% |

### 2.3 Producto Adicional

| Producto | Precio | Requisito |
|----------|--------|------------|
| **Mini-Landing** | $650.000 COP (pago único, precio original $850.000 con 23% descuento) | Requiere plan BASIC o PRO activo |

### 2.4 Paquetes de Créditos Adicionales (Add-ons)

| Producto | Descripción |
|----------|-------------|
| **Créditos extra** | Paquetes de generaciones adicionales comprables por separado (tabla `addon_packages`). Se descuentan del `extra_credits_balance` de la marca. |

### 2.5 Plan ENTERPRISE

| Característica | Detalle |
|----------------|---------|
| Productos | 50 activos |
| Generaciones | 2.000/mes |
| Sync externo | CSV/API con `enterprise_sync_configs` |
| Integración n8n | Webhook dedicado (`N8N_ENTERPRISE_SYNC_WEBHOOK_URL`) |
| Brand whitelist | Lista de marcas autorizadas |
| Token de sync | `ENTERPRISE_SYNC_TOKEN` |

---

## 3. Funcionalidades Principales

### 3.1 Para Marcas (Usuarios)
- Registro/Login (JWT propio, Turnstile, Google OAuth).
- Dashboard: Stats, CRUD productos, Historial, Subscription, Analytics, Usage.
- Widget (Try-On) con IA.
- Pagos: Wompi (COP), PayPal (USD), cupones de descuento.
- Editor de mini-landing (4 templates: Classic, Editorial, Moderno, Bare).
- Programa de referidos (código único, reward de 500 créditos extra para el referente).
- Gestión de perfil y configuración de notificaciones (email, WhatsApp, alertas de uso).
- Historial de pagos y solicitudes de cambio de plan.
- Solicitudes legales (data deletion, etc.).
- Integraciones (WooCommerce plugin, API key, embed).
- Compra de créditos adicionales (addon packages).

### 3.2 Para Clientes Finales
- **Mini-Landing:** `/sitio/[brandSlug]` - Página pública con catálogo y probador integrado
- **Widget Mostrador:** `/marca/[brandSlug]` - Widget Try-On directo de marca (no requiere iframe ni script externo)
- **Widget Público:** `/pruebalo/[brandSlug]` - Endpoint público del probador
- **Widget Embebido (legacy):** `/embed/[brandSlug]` - Solo para integraciones específicas que el cliente requiera; método principal es `/widget.js`
- **Widget Script:** `/widget.js` - Loader JavaScript autocontenido (método principal y recomendado)

### 3.3 Para Administradores
- Panel Admin: Gestión global de marcas, pagos, precios y promociones.
- Blog Nativo (CRUD completo, categorías, settings, generación vía n8n).
- Dashboard de Revenue (estadísticas de ingresos, historial de pagos).
- Unit Economics (métricas de rentabilidad).
- Risk Dashboard (detección de fraude, abuso).
- Mission Control (dashboard central de métricas).
- Audit Log (registro de acciones administrativas).
- Security Dashboard (monitoreo de seguridad).
- Gestión de cupones (crear, editar, eliminar).
- Gestión de campañas de trial.
- Moderación de reviews/feedback.
- Ficha 360 de marca (perfil completo).
- Gestión de admins con permisos granulares (brands, subscriptions, revenue, conversion, health, notifications, settings, admins).
- Gestión de WooCommerce (brands summary, productos, toggle activo).
- Monitoreo de créditos OpenRouter y Replicate.
- Reprocesamiento de pagos Wompi fallidos.
- Suspensión/restauración de mini-landings.

### 3.4 Plugin WooCommerce
- Plugin WordPress para integración directa.
- Sync de productos WooCommerce → Lookitry.
- Telemetría de errores y latencia.
- Activación/remoción de productos desde admin.

---

## 4. Flujos Principales

### 4.1 Flujo de Registro (Trial Pago)
1. Usuario llena formulario en `/register`.
2. Cloudflare Turnstile valida antispam.
3. `POST /api/auth/register` crea marca.
4. Redirección a `/trial-checkout` para pago ($20.000 COP).
5. Confirmación por webhook y acceso al dashboard.

### 4.2 Flujo de Registro con Google OAuth
1. Usuario inicia sesión con Google en `/register` o `/login`.
2. Backend verifica `google_id` y crea/actualiza marca.
3. Si es nuevo, se marca `needs_onboarding = true`.
4. Redirección a `/register/google-setup` para completar perfil.
5. Acceso al dashboard tras onboarding.

### 4.3 Flujo de Try-On (IA)
1. Usuario sube selfie en el widget.
2. Backend valida la solicitud y encola el trabajo en una **cola de Redis**.
3. Un **Worker de segundo plano** procesa la cola, gestiona la concurrencia y dispara el Webhook `/webhook/tryon` en n8n (ID: `wPLypk7KhBcFLicX`).
4. n8n procesa con IA usando reglas de prompt por categoría (`prompt-rules.ts`).
5. n8n actualiza Supabase con el resultado.
6. Frontend hace **polling** hasta que `status = SUCCESS`.
7. Usuario puede reportar error (feedback con embedding pgvector para RAG).

### 4.4 Flujo de Pago (Wompi)
1. Usuario selecciona plan en checkout.
2. Backend genera URL de pago Wompi (hosted checkout).
3. Wompi notifica al webhook del Backend.
4. Backend valida firma e integra y activa suscripción.

### 4.5 Flujo de Pago (PayPal)
1. Usuario selecciona plan en checkout (USD).
2. Backend genera orden PayPal (sandbox o producción).
3. Usuario completa pago en PayPal.
4. Backend captura orden vía webhook y activa suscripción.

### 4.6 Flujo de Upgrade con Prorrateo
1. Usuario con BASIC selecciona PRO.
2. Backend calcula `creditAmount` (días restantes del plan actual).
3. `amountToPay = max(0, precioNuevoPlan - creditAmount)`.
4. El nuevo plan inicia inmediatamente tras el pago.
5. Preview disponible en `/api/payments/wompi/upgrade-preview`.

### 4.7 Flujo de Campaña de Trial
1. Si hay una campaña activa en `trial_campaigns`, el registro puede omitir el pago inicial.
2. Se asignan días y generaciones de prueba automáticamente.
3. Anti-abuso: IP + fingerprint tracking (`trial_registrations`).
4. Guest trial: pago de trial antes de crear cuenta (`/trial-checkout`, `/trial-payment`).
5. Al finalizar, se requiere upgrade a un plan de pago.

### 4.8 Flujo de Cupones
1. Admin crea cupón con tipo (pct/fixed), valor, usos máximos, planes aplicables, expiración.
2. Usuario ingresa código en checkout.
3. `POST /api/coupons/validate` valida el cupón.
4. `POST /api/coupons/redeem` aplica el descuento.
5. Si cubre 100%, flujo de free upgrade directo (`/api/payments/wompi/apply-free-upgrade`).

### 4.9 Flujo de Referidos
1. Cada marca tiene `referral_code` único.
2. Nuevo usuario valida código en `/api/brands/me/referral/validate`.
3. La marca referida reclama el código una sola vez en `/api/brands/me/referral/claim`.
4. Cuando esa marca completa su primer pago mensual elegible (`BASIC`, `PRO`, `ENTERPRISE`), el referral pasa a `converted`.
5. El referente recibe `500` créditos extra en `extra_credits_balance`.

### 4.10 Flujo de Enterprise Sync
1. Admin configura sync en `/api/admin/enterprise/:brandId/sync-config`.
2. Fuente externa (CSV/API) envía productos a n8n.
3. n8n dispara webhook `/api/enterprise/sync-product` con `ENTERPRISE_SYNC_TOKEN`.
4. Backend crea/actualiza productos automáticamente.
5. Estado visible en dashboard de marca.

### 4.11 Flujo de Feedback + RAG
1. Usuario reporta error en generación (`POST /api/pruebalo/:brandSlug/generation/:id/feedback`).
2. Se guarda en `generation_feedback` con tipo de error y prompt usado.
3. n8n genera embedding pgvector (768-dim) para búsqueda por similitud.
4. Admin puede resolver feedback y ver patrones.
5. Sistema RAG usa feedback similar para mejorar prompts futuros.

### 4.12 Flujo de Blog
1. Admin configura blog settings y categorías.
2. n8n genera contenido y dispara webhook `/api/blog/webhook`.
3. Posts se crean con categorías, imágenes y slug.
4. Público visible en `/blog` y `/blog/[slug]`.
5. Social image generada en `/api/blog/social-image`.

### 4.13 Flujo de Alertas de Uso
1. Cron job ejecuta cada 6h (`usage alerts`).
2. Si marca alcanza 80% o 100% de generaciones, se loguea en `usage_alerts_log`.
3. Notificación enviada según preferencias de la marca (email/WhatsApp).

---

## 5. Reglas de Negocio Clave
- **Mini-landing**: Requiere plan activo. Se suspende si expira. Período de gracia de 90 días (`landing_suspended_at`).
- **Upgrade**: Siempre con prorrateo. Preview disponible antes de pagar.
- **Límites**: Aplican inmediatamente al cambio de plan.
- **Trial**: Configurables por campaña. Anti-abuso con IP + fingerprint. Guest trial permite pagar antes de registrarse.
- **Cupones**: Pueden cubrir 100% del costo (free upgrade directo). Aplicables a planes específicos.
- **Referidos**: Solo el referente recibe `500` créditos extra. La recompensa se aplica una sola vez y solo tras el primer pago mensual elegible del referido.
- **Enterprise**: Sync externo vía CSV/API. Productos se actualizan automáticamente.
- **Add-ons**: Créditos extra comprables. Se descuentan del `extra_credits_balance`.
- **Notificaciones**: Preferencias por marca (email, WhatsApp, recordatorios 7/3 días, alertas de uso).
- **WooCommerce**: Plugin para sync de productos. Telemetría de errores incluida.
- **Blog**: Generado por n8n. Admin puede CRUD completo.
- **Feedback RAG**: Errores de generación se embedden para mejorar IA con el tiempo.
- **Admin permissions**: Sistema granular por rol (brands, subscriptions, revenue, etc.).
- **Pagos PayPal**: Soporta sandbox y producción con credenciales separadas.

---

## 6. APIs Clave

### 6.1 Autenticación
- `/api/auth/register`, `/api/auth/register-post-payment`, `/api/auth/pending-registration/:ref`
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh-session`
- `/api/auth/verify-email`, `/api/auth/resend-verification`
- `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/change-password`
- `/api/auth/google`, `/api/auth/google/onboarding`
- `/api/auth/check-email`

### 6.2 Marcas
- `/api/brands/me` (GET, PATCH), `/api/brands/me/woocommerce-metrics`
- `/api/brands/me/payments`, `/api/brands/me/legal-requests` (GET, POST)
- `/api/brands/me/trial-events`, `/api/brands/me/referral` (GET, POST validate, POST claim)
- `/api/brands/request-plan-change`, `/api/brands/request-upgrade`
- `/api/brands/notification-preferences` (GET, PATCH)
- `/api/brands/subscription` (GET)

### 6.3 Productos
- `/api/products` (GET, POST), `/api/products/:id` (PUT, DELETE)
- `/api/products/upload`, `/api/products/describe-ai`

### 6.4 Generaciones
- `/api/generations` (GET, DELETE), `/api/generations/:id` (DELETE)

### 6.5 Analytics y Usage
- `/api/analytics/overview`, `/api/analytics/generations`, `/api/analytics/products/most-used`
- `/api/usage/stats`

### 6.6 Pagos
- `/api/payments/wompi/webhook`, `/api/payments/wompi/checkout-url`, `/api/payments/wompi/config`
- `/api/payments/wompi/upgrade-preview`, `/api/payments/wompi/apply-free-upgrade`, `/api/payments/wompi/free-checkout`
- `/api/payments/wompi/transaction/:id`
- `/api/payments/paypal/checkout-url`, `/api/payments/paypal/capture`, `/api/payments/paypal/webhook`
- `/api/payments/checkout-addon`, `/api/payments/verify-addon`

### 6.7 Cupones y Promociones
- `/api/coupons/validate`, `/api/coupons/redeem`
- `/api/promotions`, `/api/admin/promotions` (GET, POST, PUT, DELETE)

### 6.8 Trial
- `/api/trial/status`, `/api/trial/initiate-guest`

### 6.9 Reviews
- `/api/reviews` (POST), `/api/reviews/me` (GET), `/api/reviews/public` (GET), `/api/reviews/mark-prompted`

### 6.10 Blog
- `/api/blog/webhook`, `/api/blog/upload`, `/api/blog/execution-status`
- `/api/blog/admin` (GET, POST), `/api/blog/admin/:id` (GET, PUT, DELETE)
- `/api/blog/admin/categories`, `/api/blog/settings` (GET, PUT), `/api/blog/settings/trigger`

### 6.11 Embed y Plugin
- `/api/embed/wordpress/init`
- `/api/pruebalo/resolve-domain`, `/api/pruebalo/allowed-origins`, `/api/pruebalo/session-token`
- `/api/pruebalo/validate-api-key`, `/api/pruebalo/synced-products`
- `/api/pruebalo/sync-woocommerce`, `/api/pruebalo/unsync-woocommerce`
- `/api/pruebalo/plugin-telemetry`, `/api/pruebalo/app-uninstalled`
- `/api/pruebalo/img-proxy`, `/api/pruebalo/:brandSlug` (GET, POST generate, POST feedback)

### 6.12 Admin
- `/api/admin/auth/*` (login, logout, forgot/reset password)
- `/api/admin/verify`, `/api/admin/stats`, `/api/admin/stats/conversion`, `/api/admin/stats/top-brands`
- `/api/admin/stats/mission-control`, `/api/admin/risk`, `/api/admin/economics`
- `/api/admin/alerts`, `/api/admin/notifications`, `/api/admin/notification-preferences`
- `/api/admin/brands` (GET, POST), `/api/admin/brands/:id` (DELETE, PATCH plan, activate, landing, notes, modal, full profile)
- `/api/admin/brands/:id/products` (GET, DELETE), `/api/admin/brands/:id/send-reset-email`
- `/api/admin/subscriptions` (GET), `/api/admin/subscriptions/:id` (renew, suspend, reactivate, payment)
- `/api/admin/mini-landings` (GET), `/api/admin/mini-landings/:id` (suspend, restore)
- `/api/admin/admins` (GET, POST), `/api/admin/admins/:id` (permissions, password, send-credentials, DELETE)
- `/api/admin/admins/me/password`
- `/api/admin/trial-campaign` (GET, POST, PATCH)
- `/api/admin/feedback` (GET), `/api/admin/feedback/:id` (resolve, DELETE), `/api/admin/feedback/count-unresolved`, `/api/admin/feedback/stats`
- `/api/admin/openrouter-credits`, `/api/admin/replicate-credits`
- `/api/admin/system/stats`, `/api/admin/audit-log`
- `/api/admin/revenue/stats`, `/api/admin/revenue/payments`
- `/api/admin/reprocess-wompi/:reference`
- `/api/admin/pricing` (GET, PUT), `/api/admin/payment-settings` (GET, PUT)
- `/api/admin/coupons` (GET, POST), `/api/admin/coupons/:id` (PUT, DELETE)
- `/api/admin/reviews` (GET, PATCH, DELETE)
- `/api/admin/enterprise/*` (create-client, sync-config, trigger-sync, sync-status, sync-product)
- `/api/admin/woocommerce/*` (brands-summary, products, toggle active)

### 6.13 Utilidades
- `/api/upload`, `/api/upload/selfie`, `/api/upload/cleanup-temp`
- `/api/cleanup/run`, `/api/cleanup/stats`
- `/api/images/look`
- `/api/sitemap/landings`
- `/api/payment-settings/public`
- `/health`

---

##不走

## Issues Conocidos (Abril 2026)

| Issue | Severidad | Estado |
|-------|-----------|--------|
| Secretos en docker-compose | CRÍTICO | ✅ Arreglado |
| Precios inconsistentes /terminos vs /planes | CRÍTICO | ✅ Arreglado |
| URLs 404 en sitemap | ALTO | ✅ Arreglado (redirecciones) |
| Trial confundidor ($20.000 vs gratis) | ALTO | ✅ Arreglado |
| Sin skeleton loaders | MEDIO | ⚠️ Pendiente |
| Testimoniales mock | MEDIO | ⚠️ Pendiente |

---

**Última actualización:** Abril 2026.
