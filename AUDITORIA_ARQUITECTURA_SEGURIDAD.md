# Arquitectura Técnica — Lookitry (Virtual Try-On SaaS)

**Última actualización:** 21 Marzo 2026  
**Estado del build:** ✅ Backend `tsc` — EXIT 0 | ✅ Frontend `next build` — EXIT 0 (61 páginas)

---

## 🏗️ 1. Stack Técnico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT propio (no Supabase Auth) |
| Almacenamiento | MinIO (`minio.wilkiedevs.com`) |
| Pagos | Wompi (Colombia) + PayPal (USD internacional) |
| IA / Try-On | n8n + OpenRouter (flujo `wPLypk7KhBcFLicX`) |
| Antispam | Cloudflare Turnstile |
| Email | SMTP Hostinger (`smtp.hostinger.com:465`) |
| Deploy | Docker Compose en VPS Hostinger |
| CI/CD | Script Python `scripts/_deploy_now.py` + GitHub |

---

## 🗂️ 2. Estructura de Directorios

```
Mostrador_wilkiedevs/
├── frontend/                    # Next.js 14 App Router
│   ├── src/app/                 # Páginas y API Routes
│   │   ├── (public)/            # Landing, planes, registro, login
│   │   ├── dashboard/           # Área privada de la marca (JWT)
│   │   ├── admin/               # Panel administrativo (Admin JWT)
│   │   ├── pruebalo/[slug]/     # Widget público de try-on
│   │   ├── sitio/[slug]/        # Mini-landing pública (ruta oficial)
│   │   ├── marca/[slug]/        # Variante de mini-landing
│   │   └── embed/[slug]/        # Embed iFrame del widget
│   ├── src/components/
│   │   ├── tryon/               # TryOnWidget, SelfieUploader, ResultDisplay
│   │   ├── mini-landing/        # Templates: Classic, Editorial, Probador, Moderno
│   │   ├── dashboard/           # UpgradeModal, ProductForm, stats
│   │   ├── payments/            # WompiButton
│   │   └── ui/                  # Spinner, componentes base
│   ├── src/services/            # api.ts, auth.service.ts, subscription.service.ts
│   ├── src/hooks/               # useAuth (JWT decode + brand data)
│   ├── src/types/               # index.ts — types globales
│   └── src/utils/               # currency.ts, formatters
│
├── backend/                     # Express API (TypeScript)
│   ├── src/controllers/         # Lógica HTTP por dominio
│   ├── src/routes/              # Definición de rutas Express
│   ├── src/middleware/          # auth.ts, adminAuth.ts, rateLimiter.ts
│   ├── src/config/              # supabase.ts (anon + admin clients)
│   ├── src/services/            # SubscriptionService, WompiService, PaypalService, n8n, MinIO, Email
│   └── src/jobs/                # Cron jobs (cleanup, subscription check)
│
└── scripts/                     # Deploy Python: _deploy_now.py
```

---

## 🔄 3. Flujo de Datos — Backend a Frontend

### 3.1 Autenticación
```
[Browser] POST /api/auth/login
   → auth.controller → AuthService.login()
   → Supabase query brands → bcrypt compare
   → JWT sign (7 días)
   ← { token, brand }

[Frontend] localStorage.setItem('token', ...)
   → useAuth hook (JWT decode en cliente)
   → authMiddleware en cada request (Authorization: Bearer)
```

### 3.2 Flujo de Try-On (Widget Público)
```
[Widget /pruebalo/:slug]
   GET /api/pruebalo/:slug
   → brands + products (solo activos, is_active=true)
   ← { brand: {...}, products: [{id, name, imageUrl, category}] }

[Usuario sube selfie]
   POST /api/pruebalo/:slug/generate (multipart/form-data)
   → Valida límites de plan/trial
   → Sube selfie a MinIO: /temp/selfie-{uuid}.jpg
   → POST n8n webhook (Authorization: Bearer Travis2305**)
      { brand_id, product_id, selfie_url, product_image_url, prompt }
   → n8n: Gemini procesa → resultado MinIO: /results/tryon-{uuid}.jpg
   → n8n responde { success, imageUrl }
   → Guarda en tabla generations (status: SUCCESS)
   ← { generationId, imageUrl, processingTime }
```

### 3.3 Flujo de Pago Wompi
```
[/checkout o /dashboard/checkout]
   GET /api/payments/wompi/checkout-url?plan=PRO&months=1
   → WompiService.generateCheckoutUrl()
   → Construye URL: https://checkout.wompi.co/p/?...
      (public-key, amount-in-cents, currency, reference, integrity-hash)
   ← { checkoutUrl }

[Usuario paga en Wompi]
   POST /api/payments/wompi/webhook
   → Verifica HMAC SHA256 (x-event-checksum header + express.raw)
   → wompi.controller → SubscriptionService.renewSubscription()
   → Actualiza brands: plan, subscription_status, subscription_end_date
   → Inserta subscription_payments
```

### 3.4 Flujo de Pago PayPal
```
[/checkout o /dashboard/checkout]
   GET /api/payments/paypal/checkout-url?amount=150000&plan=BASIC&trm=3900
   → PaypalService.getAccessToken() (OAuth2 PayPal)
   → PaypalService.createOrder() → POST PayPal /v2/checkout/orders
      { amount: { currency_code: 'USD', value: '39' } }
   ← { checkoutUrl } → link "approve" de PayPal

[Usuario aprueba en PayPal]
   POST /api/payments/paypal/capture { orderId }
   → PaypalService.captureOrder(orderId)
   → POST PayPal /v2/checkout/orders/:id/capture
   → SubscriptionService.renewSubscription(brandId, CreatePaymentDto, months, plan)
   → Inserta subscription_payments (currency: 'USD')
```

### 3.5 Flujo de Upgrade con Prorrateo (BASIC → PRO)
```
[/dashboard/checkout?upgrade=true]
   GET /api/payments/wompi/upgrade-preview
   → pricePerDay = precioTotalPagado / díasTotales
   → creditAmount = pricePerDay × díasRestantes
   → amountToPay = max(0, precioNuevoPlan - creditAmount)
   ← { creditAmount, amountToPay, newEndDate }

SI amountToPay = 0:
   POST /api/payments/wompi/apply-free-upgrade
   → Activa PRO inmediatamente
   → subscription_payments: amount=0, payment_method='credit_proration'

SI amountToPay > 0:
   → URL Wompi con monto prorateado → flujo normal
```

---

## 💳 4. Checkouts — Cobertura Wompi + PayPal

| Página | Ruta | Wompi | PayPal | Características |
|--------|------|-------|--------|-----------------|
| Checkout público | `/checkout` | ✅ | ✅ | Cupones, promociones, email visitante, plan selector |
| Checkout dashboard | `/dashboard/checkout` | ✅ | ✅ | Prorrateo upgrade, free-upgrade automático |
| Checkout landing | `/dashboard/checkout-landing` | ✅ | ✅ | Pago único por mini-landing, requiere plan activo |

---

## 🖥️ 5. Mini-Landings — Templates Disponibles

| Template | Slug | Descripción |
|----------|------|-------------|
| `classic` | `TemplateClassic` | Hero + sección pasos + catálogo | 
| `editorial` | `TemplateEditorial` | Estilo revista dark, fullscreen, grayscale hover |
| `probador` | `TemplateProbador` | Enfocado en el widget, sin catálogo adicional |
| `moderno` | `TemplateModerno` | Cards redondas, fondo claro, header sticky |

**Rutas:** `/sitio/[slug]` (oficial) · `/marca/[slug]` · `/pruebalo/[slug]` (legacy)

**Widget en templates:** `<TryOnWidget brandSlug={slug} isEmbed={true} />` — sin prop `initialProduct` (no existe en el componente)

---

## 🗄️ 6. Base de Datos — Tablas Principales

| Tabla | Registros aprox. | Descripción |
|-------|-----------------|-------------|
| `brands` | 54 | Marcas (clientes del SaaS) |
| `products` | 174 | Catálogo de productos por marca |
| `generations` | 14 | Historial de try-ons generados |
| `generation_feedback` | 0 | Feedback de calidad |
| `subscription_payments` | 1+ | Historial de pagos |
| `pricing_config` | 6 | Precios dinámicos (BASIC, PRO, descuentos, landing) |
| `payment_settings` | 1 | Config Wompi + PayPal (keys, sandbox mode) |
| `coupons` | 0 | Cupones de descuento |
| `promotions` | 0 | Promociones activas |
| `admins` | 2 | Panel admin |
| `admin_notifications` | 16 | Notificaciones sistema |
| `trial_campaigns` | 1 | Configuración de trials |
| `trial_registrations` | 3 | Anti-abuso por IP/fingerprint |

### Campos clave en `brands`
- `plan`: `TRIAL` / `BASIC` / `PRO`
- `subscription_status`: `active` / `expiring_soon` / `expired` / `suspended`
- `has_landing_page`: bool — si tiene mini-landing
- `landing_suspended_at`: timestamptz — si está suspendida
- `widget_template`: `minimal` / `modern` / `bold`
- `landing_template`: `classic` / `editorial` / `probador` / `moderno`

---

## 🔌 7. API Backend — Endpoints Completos

### Auth
| Método | Ruta | Auth |
|--------|------|------|
| POST | `/api/auth/register` | Público + Turnstile |
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/logout` | JWT |
| POST | `/api/auth/forgot-password` | Público |
| POST | `/api/auth/reset-password` | Público |
| GET | `/api/auth/verify-email` | Público |

### Brands & Products
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/brands/me` | JWT marca |
| PUT | `/api/brands/me` | JWT marca |
| GET | `/api/brands/:slug` | Público |
| GET/POST | `/api/products` | JWT marca |
| PUT/DELETE | `/api/products/:id` | JWT marca |
| POST | `/api/upload` | JWT marca |

### Pagos — Wompi
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/payments/wompi/checkout-url` | JWT/Público |
| GET | `/api/payments/wompi/upgrade-preview` | JWT |
| POST | `/api/payments/wompi/apply-free-upgrade` | JWT |
| POST | `/api/payments/wompi/webhook` | HMAC Wompi |
| GET | `/api/payment-settings/public` | Público |

### Pagos — PayPal
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/payments/paypal/checkout-url` | JWT/Público |
| POST | `/api/payments/paypal/capture` | Público |

### Widget Público
| Método | Ruta |
|--------|------|
| GET | `/api/pruebalo/:slug` |
| POST | `/api/pruebalo/:slug/generate` |

### Admin
| Método | Ruta |
|--------|------|
| GET | `/api/admin/stats` |
| GET | `/api/admin/stats/conversion` |
| GET | `/api/admin/brands` |
| GET | `/api/admin/revenue` |
| GET/POST/PUT/DELETE | `/api/admin/coupons` |
| GET/POST/PATCH | `/api/admin/trial-campaign` |
| POST | `/api/admin/auth/login` |

---

## 🔒 8. Seguridad

### Autenticación JWT
- Tokens Bearer verificados en `authMiddleware` (backend)
- Validación contra BD en cada request (marca sigue existiendo)
- Frontend: JWT en `localStorage` — leído por `useAuth` hook en cliente
- Punto de mejora: migrar a HTTP-Only Cookies para prevención XSS nativa

### Webhooks Wompi
- Firma HMAC SHA-256 verificada (`x-event-checksum`)
- `express.raw` para parseo sin alterar el body
- Monto de $100 COP de tokenización ignorado (no activa plan)

### PayPal
- OAuth2 con Client ID + Secret (almacenados en `payment_settings.paypal_client_id/secret`)
- Sandbox mode configurable desde panel admin
- `getOrder()` permite verificar estado antes de capturar

### Rate Limiting
| Tipo | Límite |
|------|--------|
| Global | 1000 req / 15 min |
| Auth | 10 req / 15 min (anti brute-force) |
| Generation | 20 req / 15 min (protege costo IA) |
| Trial | Bloqueo por IP + fingerprint + dominio descartable |

---

## ⚡ 9. ESLint — Qué Significa y Estado Actual

### ¿Qué es ESLint?
ESLint es un **analizador estático de código** (linter) que revisa el código TypeScript/JavaScript en busca de:
- Errores de estilo y convenciones
- Patrones que pueden generar bugs (variables no usadas, `any` implícito, etc.)
- Reglas específicas de React/Next.js (hooks mal usados, imágenes sin `alt`, etc.)

### ¿Qué significa "ESLint failed"?
Cuando el build de Next.js muestra `ESLint failed`, significa que algunas reglas del linter no se cumplen en el código. **No siempre es un error de TypeScript** — puede ser solo una advertencia de estilo. En algunos proyectos, el build falla si ESLint detecta errores; en otros, solo imprime advertencias.

### Error encontrado y corregido: `Failed to load config "next/typescript"`
**Causa:** El `.eslintrc.json` extendía `"next/typescript"`, una configuración que **solo existe en `eslint-config-next` v15+**. Este proyecto usa Next.js 14, donde esa config no está disponible.

**Fix aplicado:**
```diff
- "extends": ["next/core-web-vitals", "next/typescript"]
+ "extends": ["next/core-web-vitals"]
```

`"next/core-web-vitals"` incluye las reglas esenciales de React, accesibilidad y performance para Next.js 14. La validación de TypeScript la hace directamente el compilador `tsc` — ESLint no es estrictamente necesario para eso.

---

## 🚀 10. Deploy

### Script recomendado
```bash
python scripts/_deploy_now.py              # detecta cambios, usa caché Docker
python scripts/_deploy_now.py --no-cache   # rebuild completo
python scripts/_deploy_now.py --backend    # solo backend
python scripts/_deploy_now.py --frontend   # solo frontend
```

### Estructura en VPS
```
/root/virtual-tryon/
├── docker-compose.backend.yml    ← API Express en puerto 3001
├── docker-compose.frontend.yml   ← Next.js en puerto 3000
├── backend/
└── frontend/
```

### Contenedores
- `virtual-tryon-backend` — Express API
- `virtual-tryon-frontend` — Next.js

> ⚠️ NUNCA hacer `docker compose down` en `/root/` — bajaría n8n y MinIO

---

## 📋 11. Estado de Correcciones Aplicadas (21/03/2026)

| Archivo | Error | Fix |
|---------|-------|-----|
| `paypal.routes.ts` | `captureOrder` no existía en controller | → `capturePayment` |
| `payments.routes.ts` | `brandAuthMiddleware` no exportado | → `authMiddleware` |
| `paypal.controller.ts` | `renewSubscription` con 6 args posicionales | → `(brandId, CreatePaymentDto, months, plan)` |
| `paypal.service.ts` | Método `getOrder()` faltaba | → Añadido con GET PayPal `/v2/checkout/orders/:id` |
| `admin/analytics/page.tsx` | `api.get()` devuelve `{data, status}` no el raw | → `const { data } = await api.get<T>(...)` |
| `admin/conversion/page.tsx` | Mismo problema | → Mismo fix |
| `TemplateModerno.tsx` | Prop `initialProduct` no existe en `TryOnWidget` | → Prop eliminada |
| `TemplateEditorial.tsx` | Mismo problema | → Prop eliminada |
| `.eslintrc.json` | `"next/typescript"` no válido en Next.js 14 | → Config removida |
