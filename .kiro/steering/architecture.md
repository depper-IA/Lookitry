---
inclusion: always
---

# Lookitry — Arquitectura Técnica Completa

> Documento de referencia para retomar el proyecto sin leer archivos individuales.
> Actualizar este archivo cada vez que se agregue una tabla, ruta, página o servicio nuevo.
> **LEER SIEMPRE la carpeta `.kiro/steering/` antes de trabajar en el proyecto.**

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT propio (no Supabase Auth) |
| Almacenamiento | MinIO (`minio.wilkiedevs.com`) |
| Pagos | Wompi (Colombia, COP) + PayPal (Internacional, USD) |
| IA / Try-On | n8n + OpenRouter (flujo `wPLypk7KhBcFLicX`) |
| Antispam | Cloudflare Turnstile |
| Email | SMTP Hostinger (`smtp.hostinger.com:465`) |
| Deploy | Docker Compose en VPS Hostinger |
| CI/CD | Script Python `scripts/_deploy_now.py` + GitHub |

---

## URLs del Sistema

| Servicio | URL |
|----------|-----|
| Frontend prod | `https://pruebalo.wilkiedevs.com` |
| API prod | `https://api.pruebalo.wilkiedevs.com` |
| n8n | `https://n8n.wilkiedevs.com` |
| MinIO | `https://minio.wilkiedevs.com` |
| Supabase | `https://vkdooutklowctuudjnkl.supabase.co` |
| Frontend local | `http://localhost:3000` |
| Backend local | `http://localhost:3001` |

---

## Infraestructura

| Recurso | Valor |
|---------|-------|
| VPS IP | `31.220.18.39` |
| VPS user | `root` |
| VPS pass | `Travis18456916#` |
| Docker project | `virtual-tryon` |
| Supabase project ID | `vkdooutklowctuudjnkl` |
| GitHub repo | `https://github.com/depper-IA/virtual-tryon.git` |
| Hostinger VPS ID | `1004711` |

---

## Estructura de Directorios

```
Mostrador_wilkiedevs/
├── frontend/                    # Next.js 14
│   ├── src/app/                 # App Router — páginas y API routes
│   ├── src/components/          # Componentes reutilizables
│   ├── src/services/            # Clientes HTTP (api.ts, subscription.service.ts)
│   ├── src/utils/               # Helpers (currency.ts, etc.)
│   ├── src/types/               # TypeScript types
│   └── public/                  # Assets estáticos (logo.svg, favicon.png)
├── backend/                     # Express API
│   ├── src/controllers/         # Lógica de negocio
│   ├── src/routes/              # Definición de rutas
│   ├── src/middleware/          # Auth, admin, rate limiting
│   ├── src/config/              # supabase.ts (anon + admin clients)
│   ├── src/services/            # Servicios externos (n8n, MinIO, email)
│   └── src/jobs/                # Cron jobs (cleanup, subscription check)
├── scripts/                     # Deploy y utilidades
│   └── _deploy_now.py           # Script de deploy al VPS
└── .kiro/steering/              # ← LEER SIEMPRE. Documentación del proyecto
    ├── architecture.md          # Este archivo — arquitectura completa
    ├── brand.md                 # Identidad visual y marca
    ├── tools-and-credentials.md # Credenciales y accesos
    ├── deploy-workflow.md       # Flujo de deploy paso a paso
    └── REGLAS_IMPORTANTES.md    # Reglas críticas del proyecto
```

---

## Base de Datos — Tablas Supabase

### `brands` (54 registros)
Tabla principal. Cada marca es un cliente del SaaS.

| Campo clave | Tipo | Descripción |
|-------------|------|-------------|
| `id` | uuid PK | ID de la marca |
| `email` | text UNIQUE | Email de login |
| `password` | text | Hash bcrypt |
| `name` | text | Nombre de la marca |
| `slug` | text UNIQUE | URL del widget (`/pruebalo/slug`) |
| `plan` | enum | `BASIC` o `PRO` |
| `subscription_status` | enum | `active`, `expiring_soon`, `expired`, `suspended` |
| `subscription_start_date` | timestamptz | Inicio de suscripción |
| `subscription_end_date` | timestamptz | Fin de suscripción |
| `trial_end_date` | timestamptz | Fin del período de prueba |
| `trial_generations_limit` | int | Límite de generaciones en trial (default 30) |
| `has_landing_page` | bool | Si tiene mini-landing activa |
| `landing_suspended_at` | timestamptz | Fecha de suspensión de landing (NULL = activa) |
| `email_verified` | bool | Si verificó el email |
| `widget_template` | varchar | `minimal`, `modern`, `bold` |
| `landing_template` | text | `classic`, `editorial`, `probador`, `moderno` |
| `primary_color` | text | Color primario del widget (#hex) |
| `logo` | text | URL del logo en MinIO |
| `logo_light` | text | Logo para fondos oscuros |
| `logo_dark` | text | Logo para fondos claros |
| `cover_image_url` | text | Imagen de portada de la landing |
| `social_links` | jsonb | `{instagram, facebook, tiktok, website}` |
| `schedule` | jsonb | Horarios de atención |
| `reset_token` | varchar | Token de reset de contraseña |

RLS: cada marca solo puede leer/editar sus propios datos.
**Backend SIEMPRE usa `supabaseAdmin` (service role) — bypasea RLS completamente.**

---

### `products` (174 registros)
Productos del catálogo de cada marca.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `name` | text | Nombre del producto |
| `description` | text | Descripción |
| `image_url` | text | URL en MinIO |
| `category` | text | Categoría del producto |
| `is_active` | bool | Si está activo en el widget |
| `price` | int | Precio en COP (nullable) |
| `badge` | text | `nuevo`, `top`, `oferta` (nullable) |

Límites por plan: BASIC = 5 productos activos, PRO = 15 productos activos.

---

### `generations` (14 registros)
Historial de pruebas virtuales generadas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `product_id` | uuid FK → products | |
| `selfie_url` | text | URL de la selfie en MinIO |
| `result_image_url` | text | URL del resultado en MinIO |
| `status` | enum | `PENDING`, `SUCCESS`, `FAILED` |
| `error_message` | text | Mensaje de error si falló |
| `processing_time` | int | Tiempo en ms |
| `prompt_used` | text | Prompt enviado a la IA |

Límites por plan: BASIC = 400/mes, PRO = 1200/mes.

---

### `generation_feedback` (0 registros)
Feedback de calidad de las generaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `generation_id` | uuid FK → generations | |
| `brand_id` | uuid FK → brands | |
| `error_type` | enum | `wrong_clothing_removed`, `wrong_clothing_kept`, `body_distortion`, `color_wrong`, `product_not_applied`, `background_changed`, `other` |
| `description` | text | Descripción del problema |
| `embedding` | vector | Embedding para RAG (Gemini) |
| `resolved` | bool | Si fue resuelto |

---

### `subscription_payments` (1 registro)
Historial de pagos de suscripciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `brand_id` | uuid FK → brands | |
| `amount` | numeric | Monto (en COP para Wompi, en USD para PayPal) |
| `currency` | varchar | `COP` (Wompi) o `USD` (PayPal) |
| `payment_method` | varchar | `wompi`, `paypal`, `credit_proration`, `manual` |
| `status` | varchar | `completed`, `pending`, `failed`, `refunded` |
| `months_paid` | int | Meses pagados (1-24) |
| `notes` | text | Notas internas (referencia, plan, etc.) |

---

### `pricing_config` (6 registros)
Configuración dinámica de precios. Editable desde `/admin/pricing`.

| ID | Contenido |
|----|-----------|
| `basic` | `{ precio_mensual_cop: 150000, nombre, descripcion, features[], generaciones_mes, productos_max }` |
| `pro` | `{ precio_mensual_cop: 250000, nombre, descripcion, features[], generaciones_mes, productos_max }` |
| `descuentos_duracion` | `{ meses_1: 0, meses_3: 5, meses_6: 10, meses_12: 15 }` (porcentajes) |
| `metas` | `{ mrr_objetivo, clientes_objetivo, ... }` |
| `costos_operativos` | `{ costo_por_generacion, ... }` |
| `landing` | `{ precio: 650000, precio_original: 900000 }` |

RLS: lectura pública (anon key), escritura solo service role.

---

### `payment_settings` (1 registro, id=1)
Configuración de pasarelas de pago. Editable desde `/admin/payment-settings`.

Campos clave:
- `wompi_enabled`, `wompi_public_key`, `wompi_private_key`, `wompi_events_secret`, `wompi_integrity_secret`, `wompi_test_mode`
- `paypal_enabled`, `paypal_client_id`, `paypal_client_secret`, `paypal_sandbox`
- `manual_enabled`, `manual_whatsapp`, `manual_email`
- `landing_price`, `landing_original_price`
- `trm` — Tasa de cambio COP→USD usada para calcular montos PayPal (ej: 3900)

---

### `coupons` (0 registros)
Cupones de descuento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `code` | text UNIQUE | Código del cupón (uppercase) |
| `discount_type` | enum | `pct` (porcentaje) o `fixed` (monto fijo) |
| `discount_value` | numeric | Valor del descuento |
| `max_uses` | int | Usos máximos (null = ilimitado) |
| `uses_count` | int | Usos actuales |
| `expires_at` | timestamptz | Fecha de expiración (null = sin expiración) |
| `plan_ids` | text[] | Planes aplicables (vacío = todos) |
| `active` | bool | Si está activo |

RLS: solo service role puede CRUD. El backend usa `supabaseAdmin` para todas las operaciones.

---

### `promotions` (0 registros)
Promociones activas en el sitio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `type` | enum | `modal_timer`, `coupon`, `banner`, `plan_override`, `launch_offer` |
| `name` | text | Nombre interno |
| `config` | jsonb | Configuración específica del tipo |
| `active` | bool | Si está activa |
| `starts_at` / `ends_at` | timestamptz | Rango de fechas |

---

### `admins` (2 registros)
Administradores del panel.

| Campo | Tipo |
|-------|------|
| `email` | text UNIQUE |
| `password` | text (bcrypt) |
| `role` | text (default `admin`) |
| `permissions` | text[] |

---

### `admin_notifications` (16 registros)
Notificaciones del sistema para admins. Insertadas por n8n Error Handler.

| Campo | Tipo |
|-------|------|
| `type` | text |
| `title` | text |
| `message` | text |
| `severity` | text (`info`, `warning`, `error`) |
| `brand_id` | uuid FK → brands (nullable) |
| `metadata` | jsonb |

---

### `trial_campaigns` (1 registro)
Campañas de trial activas.

| Campo | Tipo |
|-------|------|
| `name` | text |
| `active` | bool |
| `trial_days` | int (default 7) |
| `trial_generations_limit` | int (1-500, default 50) |
| `require_card_verification` | bool |
| `ends_at` | timestamptz (nullable) |

---

### `trial_registrations` (3 registros)
Registros de trial por IP/fingerprint (anti-abuso).

| Campo | Tipo |
|-------|------|
| `brand_id` | uuid FK → brands |
| `campaign_id` | uuid FK → trial_campaigns |
| `ip_address` | text |
| `fingerprint` | text (nullable) |

---

### `pending_registrations`
Registros de pago pendiente para usuarios sin cuenta (checkout público sin sesión).
Se crea al generar la URL de Wompi/PayPal, se marca como `paid` cuando el webhook confirma el pago.
El usuario luego completa el registro en `/registro-pro?ref=REFERENCIA`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `email` | text | Email del visitante |
| `reference` | text UNIQUE | Referencia de pago |
| `plan` | text | Plan a activar |
| `months` | int | Meses a activar |
| `includes_landing` | bool | Si incluye landing page |
| `amount` | numeric | Monto pagado |
| `status` | text | `pending` → `paid` |
| `payment_id` | text | ID de transacción (Wompi ID o PayPal orderId) |

---

### `admin_notification_preferences` (16 registros)
Preferencias de notificaciones por tipo.

---

## Backend — Rutas API

Base URL: `https://api.pruebalo.wilkiedevs.com/api`

### Auth (`/api/auth/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | Público | Registro con Turnstile |
| POST | `/auth/login` | Público | Login → JWT |
| POST | `/auth/logout` | JWT | Logout |
| POST | `/auth/forgot-password` | Público | Envía email de reset |
| POST | `/auth/reset-password` | Público | Confirma reset con token |
| GET | `/auth/verify-email` | Público | Verifica email con token |

### Brands (`/api/brands/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/brands/me` | JWT | Perfil de la marca |
| PUT | `/brands/me` | JWT | Actualizar perfil |
| GET | `/brands/:slug` | Público | Perfil público por slug |

### Products (`/api/products/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/products` | JWT | Listar productos |
| POST | `/products` | JWT | Crear producto |
| PUT | `/products/:id` | JWT | Actualizar producto |
| DELETE | `/products/:id` | JWT | Eliminar producto |
| POST | `/upload` | JWT | Subir imagen a MinIO |

### Generations (`/api/generations/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/generations` | JWT | Crear generación (→ n8n) |
| GET | `/generations` | JWT | Historial |
| GET | `/generations/:id` | JWT | Detalle |

### Payments — Wompi (`/api/payments/wompi/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/payment-settings/public` | Público | Config pública de pagos |
| GET | `/payments/wompi/config` | JWT | Config Wompi para el plan |
| GET | `/payments/wompi/checkout-url` | JWT/Público | URL de checkout Wompi (COP) |
| GET | `/payments/wompi/upgrade-preview` | JWT | Calcula prorrateo de upgrade |
| POST | `/payments/wompi/apply-free-upgrade` | JWT | Aplica upgrade sin cobro |
| POST | `/payments/wompi/webhook` | HMAC Wompi | Webhook de eventos |

### Payments — PayPal (`/api/payments/paypal/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/payments/paypal/checkout-url` | JWT/Público | URL de checkout PayPal (USD, usa TRM) |
| POST | `/payments/paypal/capture` | Público | Captura el pago aprobado |

### Subscription (`/api/subscription/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/subscription` | JWT | Estado de suscripción |
| POST | `/subscription/activate` | JWT | Activar tras pago |

### Coupons (`/api/coupons/*` y `/api/admin/coupons/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/coupons/validate` | Público | Validar cupón |
| GET | `/admin/coupons` | Admin JWT | Listar cupones |
| POST | `/admin/coupons` | Admin JWT | Crear cupón |
| PUT | `/admin/coupons/:id` | Admin JWT | Actualizar cupón |
| DELETE | `/admin/coupons/:id` | Admin JWT | Eliminar cupón |

### Trial (`/api/trial/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/trial/register` | Público | Registrar trial |
| GET | `/trial/campaign` | Público | Campaña activa |

### Analytics y Usage
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/analytics` | JWT | Métricas de la marca |
| GET | `/usage` | JWT | Uso del mes |
| GET | `/admin/revenue` | Admin JWT | Ingresos globales |
| GET | `/admin/stats` | Admin JWT | Estadísticas globales |
| GET | `/admin/stats/conversion` | Admin JWT | Métricas de conversión |

### Pruebalo (widget público)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/pruebalo/:slug` | Público | Config del widget |
| POST | `/pruebalo/:slug/generate` | Público | Generar try-on |

---

## Frontend — Páginas

### Públicas (indexadas en sitemap)
| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | Server Component | Landing principal (precios hardcodeados para SEO) |
| `/planes` | Page | Página de planes y precios |
| `/register` | Page | Registro de marca |
| `/login` | Page | Login |
| `/sobre-nosotros` | Page | Sobre Lookitry |
| `/terminos` | Page | Términos y condiciones |
| `/politicas-privacidad` | Page | Política de privacidad |

### Públicas (NO indexadas)
| Ruta | Descripción |
|------|-------------|
| `/checkout` | Checkout público (precios dinámicos desde pricing_config). Wompi + PayPal. |
| `/pago-exitoso` | Confirmación de pago |
| `/trial-payment` | Pago de trial |
| `/trial-activado` | Confirmación de trial |
| `/verify-email` | Verificación de email |
| `/registro-pro` | Completa registro post-pago (usa `?ref=REFERENCIA` de pending_registrations) |
| `/pruebalo/[slug]` | Widget público de try-on |
| `/marca/[slug]` | Mini-landing pública de marca (variante) |
| `/sitio/[slug]` | Mini-landing pública de marca (ruta oficial) |
| `/embed/[slug]` | Embed del widget (iframe) |
| `/auth/callback` | Callback de auth |

### Dashboard (requieren JWT)
| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Home — stats y resumen |
| `/dashboard/products` | CRUD de productos |
| `/dashboard/generations` | Historial de generaciones |
| `/dashboard/analytics` | Métricas de uso |
| `/dashboard/usage` | Contador del mes |
| `/dashboard/subscription` | Estado de suscripción |
| `/dashboard/checkout` | Checkout interno — renovar plan, upgrade BASIC→PRO con prorrateo. Wompi + PayPal. |
| `/dashboard/checkout-landing` | Checkout exclusivo para comprar mini-landing. Wompi + PayPal. |
| `/dashboard/settings` | Configuración del widget |
| `/dashboard/embed` | Código de integración |
| `/dashboard/mi-pagina` | Editor de mini-landing |
| `/dashboard/profile` | Perfil de la marca |

### Admin (requieren Admin JWT)
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Login de admin |
| `/admin/dashboard` | Métricas globales |
| `/admin/brands` | Gestión de marcas |
| `/admin/subscriptions` | Gestión de suscripciones |
| `/admin/payments` | Historial de pagos |
| `/admin/revenue` | Ingresos y proyecciones |
| `/admin/pricing` | Editor de precios dinámicos (pricing_config) |
| `/admin/payment-settings` | Configuración de pasarelas (Wompi, PayPal, TRM) |
| `/admin/marketing/promotions` | Cupones y promociones |
| `/admin/mini-landings` | Gestión de mini-landings |
| `/admin/analytics` | Analytics globales |
| `/admin/feedback` | Feedback de generaciones |
| `/admin/notifications` | Notificaciones del sistema |
| `/admin/health` | Estado del sistema |
| `/admin/configuracion` | Configuración general |
| `/admin/admins` | Gestión de administradores |
| `/admin/conversion` | Métricas de conversión |
| `/admin/profile` | Perfil del admin |

### API Routes (Next.js)
| Ruta | Descripción |
|------|-------------|
| `/api/coupons/validate` | Proxy de validación de cupones |
| `/api/promotions` | Obtener promociones activas |
| `/api/pricing` | Obtener config de precios |
| `/api/admin/*` | Rutas admin del frontend |
| `/api/img-proxy` | Proxy de imágenes |
| `/api/download` | Descarga de imágenes generadas |

---

## Frontend — Componentes Clave

| Componente | Ruta | Descripción |
|-----------|------|-------------|
| `UpgradeModal` | `components/dashboard/UpgradeModal.tsx` | Modal de upgrade (precios dinámicos) |
| `WompiButton` | `components/payments/WompiButton.tsx` | Botón de pago Wompi |
| `PromoModal` | `components/landing/PromoModal.tsx` | Modal de promoción en landing |
| `DashboardLayout` | `app/dashboard/layout.tsx` | Layout del dashboard con sidebar |
| `AdminLayout` | `app/admin/layout.tsx` | Layout del panel admin |
| `TryOnWidget` | `components/tryon/TryOnWidget.tsx` | Widget de prueba virtual. Props: `brandSlug`, `isEmbed`. Sin prop `initialProduct`. |
| `TemplateClassic/Editorial/Probador/Moderno` | `components/mini-landing/` | 4 templates de mini-landing |

---

## Flujos Principales

### Flujo de Registro
1. Usuario llena formulario en `/register`
2. Cloudflare Turnstile valida que no es bot
3. `POST /api/auth/register` crea la marca en `brands`
4. Se envía email de verificación via SMTP
5. Usuario verifica email en `/verify-email`
6. Redirige a `/dashboard` con JWT

### Flujo de Pago — Wompi (SOLO COP)
> Wompi solo acepta COP. **No importa qué moneda muestre el frontend — el backend siempre envía COP.**

1. Usuario va a `/checkout?plan=BASIC` o `/dashboard/checkout`
2. Frontend carga precios desde `pricing_config` via Supabase REST
3. Usuario selecciona plan, meses, aplica cupón opcional
4. `GET /api/payments/wompi/checkout-url?amount=150000&months=1&plan=BASIC` genera URL de Wompi
5. Backend crea referencia `WOMPI-{brandId}-M1-PBASIC-{timestamp}`
6. El monto se pasa en COP → Wompi lo convierte a centavos internamente (`amount_in_cents = amount * 100`)
7. Usuario paga en Wompi (tarjeta, PSE, nequi, etc.)
8. Wompi envía webhook a `POST /api/payments/wompi/webhook`
9. Backend verifica firma HMAC SHA-256, extrae plan/meses de la referencia
10. Activa suscripción en `brands`, inserta `subscription_payments` (currency: 'COP')
11. Envía email de confirmación y redirige usuario a `/pago-exitoso`

> ⚠️ **Si el selector de moneda está en USD y el usuario intenta pagar con Wompi:**
> Wompi solo procesa COP. El frontend siempre envía el `amount` en COP al backend. El selector de moneda en el frontend es SOLO visual — convierte la pantalla de COP a USD para que el usuario vea el equivalente, pero el pago se procesa en COP. Si el usuario selecciona USD y luego intenta pagar con Wompi, el frontend **debería** forzar el método a PayPal. **Verificar que esto esté implementado en el checkout.**

### Flujo de Pago — PayPal (USD, con TRM)
> PayPal procesa en USD. El TRM (Tasa Representativa del Mercado) convierte el monto COP a USD.

1. Usuario selecciona PayPal como método de pago
2. Frontend envía `amount` en COP + `trm` (obtenido de `payment_settings.trm`)
3. `GET /api/payments/paypal/checkout-url?amount=150000&plan=BASIC&months=1&trm=3900`
4. Backend: `amountUSD = Math.ceil(150000 / 3900) = 39 USD`
5. PayPal crea orden por $39 USD
6. Usuario da clic en "Pagar con PayPal" → redirigido a PayPal
7. Usuario aprueba el pago en PayPal
8. Frontend llama a `POST /api/payments/paypal/capture { orderId, reference }`
9. Backend captura el pago en PayPal, lee el monto real en USD capturado
10. Activa suscripción, inserta `subscription_payments` (currency: 'USD', amount: 39)

> ⚠️ **Si el usuario paga en USD con PayPal siendo la moneda del checkout en USD:**
> El flujo funciona correctamente. El `amount` siempre se envía en COP internamente y el backend convierte a USD con el TRM. El TRM se actualiza manualmente desde `/admin/payment-settings`.

### Flujo de Upgrade con Prorrateo (BASIC → PRO)
1. Usuario con BASIC activo selecciona PRO en `/dashboard/checkout`
2. Frontend detecta `isUpgrade = true` y llama a `GET /api/payments/wompi/upgrade-preview`
3. Backend calcula:
   - `pricePerDay = precioTotalPagadoPlanActual / díasTotalesDelPlan`
   - `creditAmount = pricePerDay × díasRestantes`
   - `amountToPay = max(0, precioNuevoPlan - creditAmount)`
   - `newEndDate = now() + mesesNuevos` (siempre desde hoy, no acumula sobre fecha anterior)
4. Frontend muestra desglose: precio PRO, crédito descontado, total a pagar
5a. Si `amountToPay = 0` → botón "Activar sin costo" → `POST /api/payments/wompi/apply-free-upgrade` → plan cambia inmediatamente, se registra pago con monto $0 en `subscription_payments`
5b. Si `amountToPay > 0` → se genera URL de Wompi con el monto prorateado → flujo normal de pago
6. Webhook detecta automáticamente si es upgrade comparando `plan` de la referencia vs `brand.plan` actual → llama `renewSubscription(..., isUpgrade: true)`
7. `renewSubscription` con `isUpgrade: true` usa `newStartDate = now()` en lugar de extender desde la fecha de fin anterior

**Reglas clave del prorrateo:**
- La landing page (pago único) no entra en el cálculo del crédito — se suma por separado si el usuario la agrega
- Los límites del nuevo plan (generaciones/mes, productos activos) aplican inmediatamente al cambiar el plan
- Las generaciones ya usadas en el mes en curso no se borran ni se recuperan
- El crédito nunca genera reembolso monetario — solo descuenta del precio del nuevo plan

### Flujo de Try-On
1. Usuario sube selfie en el widget (`/pruebalo/[slug]`)
2. `POST /api/pruebalo/:slug/generate` valida créditos y plan
3. Backend llama al webhook de n8n `wPLypk7KhBcFLicX`
4. n8n procesa con OpenRouter (modelo de imagen)
5. Resultado se guarda en MinIO y en `generations`
6. Frontend hace polling hasta `status = SUCCESS`
7. Muestra imagen resultante

### Flujo de Trial
1. Usuario va a `/register` con campaña activa
2. Se registra, se crea marca con `trial_end_date = now() + trial_days`
3. Se registra IP/fingerprint en `trial_registrations` (anti-abuso)
4. Usuario puede generar hasta `trial_generations_limit` pruebas
5. Al vencer el trial, se muestra `UpgradeModal` para activar plan

---

## Selector de Moneda — Comportamiento con Wompi y PayPal

El checkout (`/checkout` y `/dashboard/checkout`) tiene un selector visual de moneda (COP/USD).

### ¿Qué hace el selector?
- Es **SOLO visual**: muestra precios en la moneda seleccionada para facilitar la comprensión al usuario
- El precio en USD se calcula en el frontend: `precioUSD = Math.ceil(precioCOP / trm)`
- El TRM viene de `payment_settings.trm` (configurable desde `/admin/payment-settings`)

### Flujos por combinación moneda + método de pago:

| Moneda mostrada | Método de pago | Comportamiento real |
|-----------------|----------------|---------------------|
| COP | Wompi | ✅ Normal — `amount` en COP → Wompi procesa en COP |
| USD | Wompi | ⚠️ **Problema potencial** — Wompi **no acepta USD**. El backend siempre recibe `amount` en COP. Si el frontend envía el monto en USD al endpoint de Wompi, el pago será por el equivalente en USD tratado como COP (ej: $39 COP en vez de $150.000 COP). **Verificar que el frontend envíe siempre COP a Wompi independientemente de la moneda mostrada.** |
| COP | PayPal | ✅ Normal — `amount` en COP + `trm` → backend convierte a USD. Usuario paga en USD. |
| USD | PayPal | ✅ Normal — el `trm` del frontend ya se usó para mostrar el precio. Backend toma el `amount` original en COP + `trm` para calcular USD de PayPal. |

### Riesgo detectado:
Si el usuario ve el precio en USD y el frontend envía ese monto USD como `amount` a Wompi (en vez del monto COP original), el pago sería **incorrecto** (factor ~4000x menor). Ver sección de verificación pendiente.

---

## Variables de Entorno

### Backend (`backend/.env`)
```
PORT=3001
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...   # NUNCA exponer en frontend
JWT_SECRET=...
N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/tryon
N8N_API_KEY=eyJ...
N8N_BEARER_TOKEN=Travis2305**
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_EVENTS_SECRET=test_events_...
WOMPI_INTEGRITY_SECRET=test_integrity_...
WOMPI_ENABLED=true
TURNSTILE_SECRET_KEY=0x4AAAA...
TURNSTILE_ENABLED=true
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@pruebalo.wilkiedevs.com
SMTP_PASS=Travis2305*
MINIO_ENDPOINT=https://minio.wilkiedevs.com
MINIO_BUCKET=images
MINIO_ACCESS_KEY=Wilkiedevs
MINIO_SECRET_KEY=Travis2305*
FRONTEND_URL=https://pruebalo.wilkiedevs.com
VPS_HOST=31.220.18.39
VPS_USER=root
VPS_PASS=Travis18456916#
GITHUB_TOKEN=ghp_...
```

### Frontend (`frontend/.env.local` — local, no se sube a git)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # Solo anon key, nunca service key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACsmy7e_yL9iyAXM
```

---

## Reglas de Negocio Clave

### Planes
- `TRIAL`: período de prueba temporal, badge violeta `#6366f1`, independiente de BASIC/PRO
- `BASIC`: $150.000 COP/mes, 5 productos activos, 400 generaciones/mes
- `PRO`: $250.000 COP/mes, 15 productos activos, 1.200 generaciones/mes
- `LANDING`: pago único $650.000 COP, requiere plan BASIC o PRO activo

### Descuentos por duración
- 1 mes: 0%
- 3 meses: 5%
- 6 meses: 10%
- 12 meses: 15%

### Lógica de upgrade con prorrateo (BASIC → PRO)

Implementada en `SubscriptionService` (`backend/src/services/subscription.service.ts`):

- `calculateUpgradeProration(brandId, newPlan, newMonths, newPlanPricePerMonth, currentPlanPriceTotal)` — calcula crédito proporcional y monto a cobrar
- `applyFreeUpgrade(brandId, newPlan, newMonths, creditAmount, newPlanTotal, reference)` — aplica upgrade sin cobro, registra en `subscription_payments` con `amount=0` y `payment_method='credit_proration'`
- `renewSubscription(brandId, CreatePaymentDto, months, plan?, isUpgrade?)` — cuando es upgrade, `newStartDate = now()` (no acumula sobre fecha anterior)

Fórmula del crédito:
```
pricePerDay = precioTotalPagado / díasTotalesDelPlan
creditAmount = pricePerDay × díasRestantes
amountToPay = max(0, precioNuevoPlan - creditAmount)
newEndDate = now() + mesesNuevos
```

La landing page (pago único) no entra en el cálculo — se suma por separado al `amountToPay` si el usuario la agrega en el mismo checkout.

### Mini-landing
- `has_landing_page = true` → landing activa
- `landing_suspended_at` no nulo → suspendida por falta de pago
- Después de 90 días suspendida → `has_landing_page = false` (eliminada)

### Precios dinámicos
- Los precios en checkout (público y dashboard) se cargan desde `pricing_config` en Supabase
- Fallback estático si falla la carga: BASIC $150.000, PRO $250.000
- La landing (`/`) mantiene precios hardcodeados intencionalmente para SEO/SSR

---

## Supabase — Clientes en Backend

```typescript
// backend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Anon key — respeta RLS (para operaciones de usuario)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Service role — bypasea RLS (para operaciones admin)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```

**Regla CRÍTICA**: El backend usa JWT propio (no Supabase Auth). El cliente `supabase` anon NUNCA tiene sesión activa — RLS bloquea todo. Por eso **SIEMPRE usar `supabaseAdmin`** en servicios y controllers del backend.

Excepciones permitidas que usan `supabase` anon:
- `health.controller.ts` — ping de salud
- Frontend lee `pricing_config` y `promotions` directo desde Supabase (tablas con RLS público)

---

## n8n — Workflows

| Workflow | ID | Webhook | Descripción |
|----------|-----|---------|-------------|
| Try-On principal | `wPLypk7KhBcFLicX` | `/webhook/tryon` | Genera la prueba virtual |
| Error Handler | `PNri7NdZYkZhpPnm` | errorWorkflow | Maneja errores del Try-On |
| Feedback embedding | `47RcLopJB6M82b0k` | Flujo4 | Embeddings de feedback |
| Descriptor IA | `ZjVTV3QxoPEi60GX` | — | Describe productos con IA |

Todos tienen el tag `SaaS`. Bearer token: `Travis2305**`.

---

## Cloudflare Turnstile

| Clave | Valor |
|-------|-------|
| Site Key (frontend) | `0x4AAAAAACsmy7e_yL9iyAXM` |
| Secret Key (backend) | `0x4AAAAAACsmy2ZsVW10HlNhDRP-ihDmo3o` |

Activar/desactivar sin redeploy: cambiar `TURNSTILE_ENABLED=true/false` en VPS.

---

## Deploy

```bash
# Desde Mostrador_wilkiedevs/
git add -A
git commit -m "descripción"
git pull origin main --rebase
git push origin main

# Solo frontend
python scripts/_deploy_now.py --frontend

# Solo backend
python scripts/_deploy_now.py --backend

# Ambos
python scripts/_deploy_now.py

# Solo reiniciar (sin rebuild, ~5s)
python scripts/_deploy_now.py --restart
```

**IMPORTANTE**: nunca hacer deploy sin que el usuario lo pida explícitamente.

---

## Historial de Cambios Importantes

### Resolución de conflictos de merge Git (21/03/2026)
El archivo `architecture.md` tenía marcadores de conflicto Git (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) sin resolver. Limpiados y fusionados manualmente conservando la versión más completa (HEAD).

### Correcciones de TypeScript (21/03/2026)
| Archivo | Error | Fix |
|---------|-------|-----|
| `paypal.routes.ts` | `captureOrder` no existía | → `capturePayment` |
| `payments.routes.ts` | `brandAuthMiddleware` no exportado | → `authMiddleware` |
| `paypal.controller.ts` | `renewSubscription` firma incorrecta | → `(brandId, CreatePaymentDto, months, plan)` |
| `paypal.service.ts` | Método `getOrder()` faltaba | → Añadido |
| `admin/analytics/page.tsx` | `api.get()` retorna `{data, status}` | → `const { data } = await api.get<T>(...)` |
| `admin/conversion/page.tsx` | Mismo problema | → Mismo fix |
| `TemplateModerno.tsx` | Prop `initialProduct` no existe | → Eliminada |
| `TemplateEditorial.tsx` | Mismo problema | → Eliminada |
| `.eslintrc.json` | `"next/typescript"` no válido en Next.js 14 | → Removida |

### Adición de PayPal (marzo 2026)
- `PaypalService` — OAuth2, `createOrder`, `captureOrder`, `getOrder`
- `PaypalController` — `getCheckoutUrl`, `capturePayment`
- `paypal.routes.ts` + `payments.routes.ts`
- `auth-post-payment.controller.ts` — activa suscripción post-pago PayPal para nuevos registros
- Frontend: selector Wompi/PayPal en los 3 checkouts

### Migración completa `supabase` anon → `supabaseAdmin` en el backend
**Problema raíz:** El backend usa JWT propio (no Supabase Auth). RLS bloquea todas las consultas con anon key.
**Solución:** Todos los servicios y controllers del backend usan `supabaseAdmin`.

### Corrección del servicio de email (SMTP)
- Transporter se crea fresco en cada llamada (no se cachea)
- Puerto 465 fuerza `secure: true` automáticamente
- Timeouts explícitos añadidos

### Email de confirmación de compra en webhook Wompi
Después de `renewSubscription()`, se consulta la marca actualizada y se llama a `notificationService.sendRenewalConfirmation()`.

### Logo en templates de email
El `baseTemplate` muestra el logo de Lookitry (`https://pruebalo.wilkiedevs.com/logo.svg`) en el header de todos los emails.
