---
inclusion: always
---

# Lookitry — Arquitectura Técnica Completa

> Documento de referencia para retomar el proyecto sin leer archivos individuales.
> Actualizar este archivo cada vez que se agregue una tabla, ruta, página o servicio nuevo.

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT propio (no Supabase Auth) |
| Almacenamiento | MinIO (`minio.wilkiedevs.com`) |
| Pagos | Wompi (Colombia) |
| IA / Try-On | n8n + OpenRouter (flujo `wPLypk7KhBcFLicX`) |
| Antispam | Cloudflare Turnstile |
| Email | SMTP Hostinger (`smtp.hostinger.com:465`) |
| Deploy | Docker Compose en VPS Hostinger |
| CI/CD | Script Python `scripts/_deploy_now.py` + GitHub |

---

## URLs del Sistema

| Servicio | URL |
|----------|-----|
| Frontend prod | `https://lookitry.com` |
| API prod | `https://api.lookitry.com` |
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
| GitHub repo | `https://github.com/depper-IA/lookitry.git` |
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
└── .kiro/steering/              # Documentación del proyecto para Kiro
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
| `amount` | numeric | Monto en COP |
| `currency` | varchar | Default `COP` |
| `payment_method` | varchar | Método de pago |
| `status` | varchar | `completed`, `pending`, `failed`, `refunded` |
| `months_paid` | int | Meses pagados (1-24) |

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

Campos clave: `wompi_enabled`, `wompi_public_key`, `wompi_private_key`, `wompi_events_secret`, `wompi_integrity_secret`, `wompi_test_mode`, `manual_enabled`, `manual_whatsapp`, `manual_email`, `landing_price`, `landing_original_price`.

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

### `admin_notification_preferences` (16 registros)
Preferencias de notificaciones por tipo.

---

## Backend — Rutas API

Base URL: `https://api.lookitry.com/api`

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

### Payments (`/api/payments/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/payment-settings/public` | Público | Config pública de pagos |
| GET | `/payments/wompi/config` | JWT | Config Wompi para el plan |
| GET | `/payments/wompi/checkout-url` | JWT/Público | URL de checkout Wompi |
| GET | `/payments/wompi/upgrade-preview` | JWT | Calcula prorrateo de upgrade (crédito, monto a pagar, nueva fecha fin) |
| POST | `/payments/wompi/apply-free-upgrade` | JWT | Aplica upgrade sin cobro cuando crédito cubre el costo total |
| POST | `/payments/wompi/webhook` | Wompi signature | Webhook de eventos |

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
| `/checkout` | Checkout público (precios dinámicos desde pricing_config) |
| `/pago-exitoso` | Confirmación de pago |
| `/trial-payment` | Pago de trial |
| `/trial-activado` | Confirmación de trial |
| `/verify-email` | Verificación de email |
| `/registro-pro` | Registro directo a PRO |
| `/pruebalo/[slug]` | Widget público de try-on |
| `/marca/[slug]` | Mini-landing pública de marca |
| `/sitio/[slug]` | Variante de mini-landing |
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
| `/dashboard/checkout` | Checkout interno — renovar plan, upgrade BASIC→PRO con prorrateo |
| `/dashboard/checkout-landing` | Checkout exclusivo para comprar mini-landing (solo usuarios con plan activo, sin landing) |
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
| `/admin/payment-settings` | Configuración de pasarelas |
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

---

## Flujos Principales

### Flujo de Registro
1. Usuario llena formulario en `/register`
2. Cloudflare Turnstile valida que no es bot
3. `POST /api/auth/register` crea la marca en `brands`
4. Se envía email de verificación via SMTP
5. Usuario verifica email en `/verify-email`
6. Redirige a `/dashboard` con JWT

### Flujo de Pago (Wompi)
1. Usuario va a `/checkout?plan=BASIC` o `/dashboard/checkout`
2. Frontend carga precios desde `pricing_config` via Supabase REST
3. Usuario selecciona plan, meses, aplica cupón opcional
4. `GET /api/payments/wompi/checkout-url` genera URL de Wompi
5. Usuario paga en Wompi
6. Wompi envía webhook a `POST /api/payments/wompi/webhook`
7. Backend verifica firma, activa suscripción en `brands`
8. Inserta registro en `subscription_payments`
9. Usuario ve `/pago-exitoso`

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
SMTP_USER=info@lookitry.com
SMTP_PASS=Travis2305*
MINIO_ENDPOINT=https://minio.wilkiedevs.com
MINIO_BUCKET=images
MINIO_ACCESS_KEY=Wilkiedevs
MINIO_SECRET_KEY=Travis2305*
FRONTEND_URL=https://lookitry.com
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
- `renewSubscription(..., isUpgrade: true)` — cuando es upgrade, `newStartDate = now()` (no acumula sobre fecha anterior)

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

**Regla**: operaciones admin (cupones, promociones, pricing, payment_settings) SIEMPRE usan `supabaseAdmin`. Operaciones de usuario usan `supabase` con JWT del usuario.

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

### Migración completa `supabase` anon → `supabaseAdmin` en el backend

**Problema raíz:** El backend usa JWT propio (no Supabase Auth). Esto significa que el cliente `supabase` (anon key) nunca tiene una sesión activa de Supabase, por lo que RLS bloquea todas las consultas devolviendo `null` o error silencioso. Esto causaba bugs como login con "Credenciales inválidas", stats en $0, pagos no registrados, etc.

**Solución:** Todos los servicios y controllers del backend deben usar `supabaseAdmin` (service role key) que bypasea RLS completamente.

**Regla definitiva para el backend:**
- SIEMPRE usar `supabaseAdmin` en todos los servicios, controllers y routes del backend
- La única excepción permitida es `health.controller.ts` (hace un ping de salud con anon key intencionalmente)
- Los scripts en `backend/src/scripts/` pueden usar cualquiera (no corren en producción)
- El frontend usa `supabase` anon key directamente para leer `pricing_config` y `promotions` (tablas con RLS de lectura pública)

**Archivos migrados:**
- `services/auth.service.ts` — login, register, verifyEmail, resetPassword, etc.
- `services/subscription.service.ts` — checkSubscriptionStatus, isInTrial, getDaysRemaining, getSubscriptionInfo, getPaymentHistory
- `services/usage.service.ts` — checkGenerationLimit, checkProductLimit, getUsageStats
- `services/products.service.ts` — todos los métodos CRUD
- `services/analytics.service.ts` — getGenerationsByBrand, getMostUsedProducts, getGenerationsByMonth
- `services/brands.service.ts` — getBrandById, updateBrand, getBrandBySlug
- `services/admin.service.ts` — getAllBrandsWithStats, changeBrandPlan, activateBrandPlan, createBrand, etc.
- `services/notificationPreferences.service.ts` — getPreferences, updatePreferences
- `services/cleanup.service.ts` — limpieza de productos eliminados
- `controllers/brands.controller.ts` — requestUpgrade, requestPlanChange
- `controllers/wompi.controller.ts` — handleWebhook
- `controllers/trialCampaign.controller.ts` — getTrialCampaign, createTrialCampaign, updateTrialCampaign
- `controllers/admin.controller.ts` — toggleLandingPage, updateModalConfig
- `routes/trial.routes.ts` — /trial/status, /trial/initiate

---

### Corrección del servicio de email (SMTP)

**Problema:** `email.service.ts` cacheaba el transporter en `this.transporter`. Si fallaba una vez (ej. variables de entorno no cargadas al inicio), todos los envíos siguientes fallaban silenciosamente. Además, el puerto 465 requiere `secure: true` siempre, pero el código dependía de `SMTP_SECURE=true` en el env.

**Solución aplicada en `backend/src/services/email.service.ts`:**
- El transporter se crea fresco en cada llamada a `sendEmail()` (no se cachea)
- Puerto 465 fuerza `secure: true` automáticamente, independiente de la variable de entorno
- Se agregaron timeouts explícitos (connectionTimeout, greetingTimeout, socketTimeout)
- El transporter se cierra con `transporter.close()` en el bloque `finally`
- Logs mejorados con destinatario y messageId

**Configuración SMTP activa:**
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@lookitry.com
SMTP_FROM=LOOKITRY <info@lookitry.com>
```

---

### Email de confirmación de compra en webhook Wompi

**Problema:** El webhook de Wompi (`wompi.controller.ts`) activaba la suscripción correctamente pero nunca enviaba email de confirmación al usuario.

**Solución:** Después de `renewSubscription()`, se consulta la marca actualizada y se llama a `notificationService.sendRenewalConfirmation()` con `.catch()` para no bloquear la respuesta a Wompi.

---

### Logo en templates de email

**Cambio:** El `baseTemplate` en `backend/src/templates/email-templates.ts` ahora muestra el logo de Lookitry (`https://lookitry.com/logo.svg`) en el header de todos los emails, en lugar del texto "Virtual Try-On". El logo se carga como `<img>` con `onerror` para degradar graciosamente si no carga. El footer también fue actualizado de "Virtual Try-On SaaS" a "Lookitry".


## 6. Idioma de Respuesta
- **SIEMPRE responde en ESPAÑOL**, a menos que se solicite explícitamente lo contrario.

---


### Regla: Seguridad y Control de Versiones (Git)
La seguridad de las credenciales y documentos sensibles es prioritaria.

### Regla: Idioma de Respuesta
* **SIEMPRE responde en ESPAÑOL**, independientemente del idioma en que se realice la consulta.

### Regla : Restricción de Directorio
* **ACCESO EXCLUSIVO:** Solo tienes permitido leer, buscar o modificar archivos dentro de la ruta `C:\Users\Matt\Mostrador_wilkiedevs`.
* **PROHIBICIÓN ABSOLUTA:** Tienes prohibido acceder a cualquier otra carpeta del sistema (como OneDrive, Desktop, etc.).



RESPESTO A COLORES Y MARCA 

---
inclusion: always
---

# Lookitry — Identidad de Marca

## Nombre y escritura

- Nombre oficial: **Lookitry**
- En JSX siempre: `Look<span className="text-[#FF5C3A]">itry</span>`
- NUNCA usar "VirtualTryOn", "Virtual Try On", "Mostrador" ni variantes antiguas en UI pública.

## Descripción del producto

Lookitry es un probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica. Permite a las marcas integrar un widget de prueba virtual en su tienda en minutos, sin apps ni desarrollo adicional.

- Mercado objetivo: Colombia, México, Argentina, Chile, Perú
- Idioma principal: Español
- Propuesta de valor: "Pruébalo antes de comprarlo" — reduce devoluciones y aumenta conversión

## Paleta de colores corporativos

| Nombre           | Hex       | Uso principal                                      |
|------------------|-----------|----------------------------------------------------|
| Naranja Lookitry | `#FF5C3A` | Color de marca, CTAs, acentos, ítem activo en nav  |
| Negro base       | `#0a0a0a` | Fondo principal (modo oscuro)                      |
| Negro card       | `#141414` | Fondo de tarjetas y paneles                        |
| Crema / Beige    | `#f5f2ee` | Fondo alternativo claro, secciones landing         |
| Blanco           | `#ffffff` | Texto principal sobre fondos oscuros               |

### Grises (modo oscuro — regla de legibilidad)

| Uso                        | Valor mínimo |
|----------------------------|--------------|
| Texto secundario / ayuda   | `#999`       |
| Texto de features / listas | `#bbb`       |
| Texto muy sutil (mínimo)   | `#666`       |
| PROHIBIDO para texto       | `#333`, `#444`, `#555` |

## Archivos de marca

| Archivo                                    | Estado       | Uso                                         |
|--------------------------------------------|--------------|---------------------------------------------|
| `frontend/public/logo.svg`                 | ✅ Activo    | Logo principal — usar en TODAS las páginas  |
| `frontend/public/favicon.png`              | ✅ Activo    | Favicon del sitio                           |
| `templates-webs/Lookitry-logo - copia.svg` | ✅ Fuente    | Original SVG fuente                         |
| `templates-webs/Lookitry-favicon.png`      | ✅ Fuente    | Original favicon fuente                     |
| `frontend/public/logo.png`                 | ❌ Obsoleto  | NO usar — reemplazado por logo.svg          |
| `templates-webs/Lookitry-logo.png`         | ❌ Obsoleto  | NO usar — reemplazado por SVG               |

## Tipografía

- Títulos / marca: **Plus Jakarta Sans** (`--font-jakarta`) — pesos 400–800
- Cuerpo / UI: **DM Sans** (`--font-dm-sans`) — pesos 300–500

## Variables CSS del sistema de diseño

```css
var(--bg-base)          /* Fondo principal */
var(--bg-card)          /* Fondo de tarjetas */
var(--bg-sidebar)       /* Fondo del sidebar */
var(--bg-sidebar-hover) /* Hover en sidebar */
var(--bg-header)        /* Fondo del header sticky */
var(--bg-hover)         /* Hover genérico */
var(--border-color)     /* Bordes */
var(--text-primary)     /* Texto principal */
var(--text-secondary)   /* Texto secundario */
var(--text-muted)       /* Texto muy sutil */
var(--text-sidebar)     /* Texto en sidebar */
var(--shadow-header)    /* Sombra del header */
```

## Colores de estado / severidad

| Estado  | Color     |
|---------|-----------|
| Info    | `#3b82f6` |
| Warning | `#f59e0b` |
| Error   | `#ef4444` |
| Success | `#10b981` |

## Planes del producto

| Plan    | Precio           | Descripción                                      |
|---------|------------------|--------------------------------------------------|
| TRIAL   | Gratis temporal  | Badge violeta `#6366f1`. Independiente de BASIC. |
| BASIC   | $150.000 COP/mes | 5 productos, 400 generaciones/mes                |
| PRO     | $250.000 COP/mes | 15 productos, 1.200 generaciones/mes             |
| LANDING | Pago único       | Mini-landing personalizada                       |

## Toggle / Switch

- Color activo: `#FF5C3A` (NUNCA `bg-blue-600`)

## URLs del sistema

| Servicio   | URL                                   |
|------------|---------------------------------------|
| Frontend   | `https://lookitry.com`     |
| API        | `https://api.lookitry.com` |
| n8n        | `https://n8n.wilkiedevs.com`          |
| MinIO      | `https://minio.wilkiedevs.com`        |

## Infraestructura — IDs y referencias clave

| Recurso              | ID / Valor                                      |
|----------------------|-------------------------------------------------|
| Supabase Project ID  | `vkdooutklowctuudjnkl`                          |
| Supabase URL         | `https://vkdooutklowctuudjnkl.supabase.co`      |
| VPS ID (Hostinger)   | `1004711`                                       |
| VPS IP               | `31.220.18.39`                                  |
| Docker project       | `virtual-tryon`                                 |
| GitHub repo          | `https://github.com/depper-IA/lookitry.git`|

## Workflows n8n (IDs — no cargar archivos para consultarlos)

| Workflow                        | ID                   | Webhook / Uso                                          |
|---------------------------------|----------------------|--------------------------------------------------------|
| Try-On principal                | `wPLypk7KhBcFLicX`   | `/webhook/tryon`                                       |
| Error Handler (OpenRouter)      | `PNri7NdZYkZhpPnm`   | errorWorkflow del Try-On — escribe en admin_notifications |
| Feedback embedding              | `47RcLopJB6M82b0k`   | Flujo4 — embeddings de feedback                        |
| Describir con IA                | `ZjVTV3QxoPEi60GX`   | Descriptor de productos                                |

Nodo clave en "Describir con IA": `03feeeff-f6bb-4eaf-92f8-4d67d2ba18fe` (Formatear respuesta) — devuelve `{ description, category, enrichedPrompt }`.
Todos los workflows tienen la etiqueta `SaaS`.

### Reglas de gestión de workflows en n8n

- Para buscar o filtrar workflows en n8n, usar siempre el tag `SaaS`.
- Al crear un nuevo workflow bajo consentimiento explícito del usuario, agregar obligatoriamente la etiqueta `SaaS` antes de guardar.
- Si se crea un workflow sin esa etiqueta, corregirlo inmediatamente.

### Error Handler — detalles
- Se activa automáticamente cuando el workflow principal falla en producción
- Clasifica el error: `credits_exhausted` (HTTP 402/429 o keywords "credits"/"insufficient") vs `service_down`
- Inserta directo en tabla `admin_notifications` via Supabase REST API (service role key)
- Recupera `brand_id` y `product_id` del contexto de ejecución fallida si están disponibles
- Archivo de referencia: `templates-webs/flujo5_error_handler_openrouter.json`


## Cloudflare Turnstile — antispam registro

| Clave | Valor |
|-------|-------|
| Site Key (pública, frontend) | `0x4AAAAAACsmy7e_yL9iyAXM` |
| Secret Key (privada, backend) | `0x4AAAAAACsmy2ZsVW10HlNhDRP-ihDmo3o` |
| Dashboard | https://dash.cloudflare.com → Turnstile |

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` va en `docker-compose.frontend.yml` como `build arg`
- `TURNSTILE_SECRET_KEY` y `TURNSTILE_ENABLED` van en `backend/.env`
- Para activar/desactivar sin redeploy: cambiar `TURNSTILE_ENABLED=true/false` en el VPS y hacer `--restart`

---

## Sitemap — Regla obligatoria

**Cada vez que se cree una nueva página pública**, actualizar `frontend/src/app/sitemap.ts`:
- Agregar la URL con `changeFrequency` y `priority` apropiados
- Páginas de contenido público (landing, planes, sobre-nosotros, términos, políticas): incluir
- Páginas privadas (dashboard, admin, checkout, pago-exitoso, trial-payment, etc.): NO incluir
- El archivo `robots.ts` también debe tener la ruta en `disallow` si es privada

Páginas públicas actuales en el sitemap:
| URL | Priority | Frecuencia |
|-----|----------|------------|
| `/` | 1.0 | weekly |
| `/planes` | 0.9 | weekly |
| `/register` | 0.8 | monthly |
| `/login` | 0.5 | monthly |
| `/sobre-nosotros` | 0.6 | monthly |
| `/terminos` | 0.4 | yearly |
| `/politicas-privacidad` | 0.4 | yearly |

---

## Favicon — Regla obligatoria

- El favicon correcto está en `frontend/public/favicon.png` (64x64, PNG válido)
- `frontend/src/app/favicon.ico` debe generarse desde ese PNG con múltiples resoluciones (16, 32, 48, 64px)
- `frontend/src/app/icon.png` debe ser copia de `frontend/public/favicon.png`
- Si el favicon deja de verse, regenerar con: `python -c "from PIL import Image; img=Image.open('frontend/public/favicon.png').convert('RGBA'); img.save('frontend/src/app/favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)])"`

---

## Reglas de branding en nuevas páginas

1. **Logo siempre SVG + nombre de texto** — en TODAS las páginas del frontend sin excepción:
   - Usar `<Image src="/logo.svg" ... />` (nunca `logo.png`)
   - Junto al logo siempre mostrar: `Look<span className="text-[#FF5C3A]">itry</span>`
   - Aplica a: landing, login, register, dashboard, checkout, planes, términos, registro-pro, pago-exitoso, admin, y cualquier página creada a futuro
2. El favicon debe ser `favicon.png` en todos los layouts.
3. El color `#FF5C3A` es el único acento de marca — no introducir otros colores de acento.
4. Fondo oscuro por defecto en dashboards (`#0a0a0a`). Landing puede usar `#f5f2ee` como sección alternativa.
5. No usar emojis en UI — usar iconos SVG o `lucide-react`.
6. NUNCA mostrar solo el logo sin el nombre de texto, ni solo el nombre sin el logo.
7. Tamaños estándar del logo por contexto:
   - Sidebar / header dashboard: `h-7` o `h-8`
   - Páginas de auth (login, register): `h-8` o `h-10`
   - Landing pública (nav): `h-8`
   - Footer: `h-6`
8. En JSX el nombre siempre es: `Look<span className="text-[#FF5C3A]">itry</span>` — nunca texto plano "Lookitry".



## Continuidad y Auditoría

Para asegurar la coherencia en el desarrollo y evitar la pérdida de contexto entre sesiones, se han establecido las siguientes reglas obligatorias:

1. **Lectura de Historial:** Al iniciar cualquier tarea, es OBLIGATORIO leer el archivo `CHANGELOG_GEMINI.md` en la raíz del proyecto. Este archivo contiene el estado real de los cambios aplicados y las tareas pendientes.
2. **Registro de Cambios:** Después de cada modificación significativa, la IA debe actualizar el archivo `CHANGELOG_GEMINI.md` documentando lo realizado y lo que queda pendiente.
3. **Verificación de Escritura:** Debido a posibles inconsistencias en el entorno, tras realizar una escritura (`write_file` o `replace`), se debe verificar físicamente el contenido del archivo con `read_file` antes de confirmar la tarea al usuario.
4. **Acceso Exclusivo:** El trabajo se limita EXCLUSIVAMENTE a la ruta `C:\Users\Matt\Mostrador_wilkiedevs`.

---
*Este archivo debe actualizarse ante cambios estructurales en la base de datos o flujos críticos.*
