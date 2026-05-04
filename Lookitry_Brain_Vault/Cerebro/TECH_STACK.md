# Tech Stack — Lookitry

Este documento es la **fuente de verdad técnica** y arquitectura del sistema. Debe actualizarse obligatoriamente ante cambios estructurales sin eliminar información previa funcional.

---

## 1. Stack Técnico Principal

| Capa | Tecnología | Versión | Uso |
|------|------------|---------|-----|
| **Frontend** | Next.js (App Router) | 16.2.4 | UI y renderizado |
| **Backend** | Node.js + Express | 4.18.2 | API de Negocio |
| **Base de datos** | Supabase (PostgreSQL + pgvector) | — | Persistencia de datos + RAG embeddings |
| **Autenticación** | Dual JWT propio (HTTP-only) | — | Seguridad de sesión con Key Rotation |
| **OAuth** | Google Sign-In | — | Login alternativo |
| **IA / Try-On** | n8n + OpenRouter | — | Orquestación de IA |
| **Styling** | Tailwind CSS | 3.4.0 | Diseño y UI |
| **Almacenamiento** | MinIO (S3 compatible) | — | Assets e imágenes generadas |
| **Cache & Queue** | Redis (ioredis) | 5.10.1 | Brand config cache y Job Queue (Try-On) |
| **Reverse Proxy** | Traefik | — | Routing Docker |
| **Anti-spam** | Cloudflare Turnstile | — | Protección de formularios |
| **Analytics** | Google Analytics (GA4) | — | Métricas de tráfico |
| **Testing** | Vitest (FE) + Jest (BE) + fast-check | — | Testing + property-based |

---

## 2. Servicios y Librerías

### 2.1 Frontend

| Librería | Versión | Uso |
|----------|---------|-----|
| `next` | 14.0.4 | Framework |
| `react` | 18.2.0 | UI |
| `react-dom` | 18.2.0 | React DOM |
| `typescript` | 5.3.3 | Tipado |
| `tailwindcss` | 3.4.0 | Estilos |
| `@supabase/supabase-js` | 2.39.0 | Cliente Supabase |
| `framer-motion` | 12.38.0 | Animaciones |
| `gsap` | 3.14.2 | Animaciones |
| `@gsap/react` | 2.1.2 | GSAP React |
| `lucide-react` | 0.577.0 | Iconos |
| `sharp` | 0.33.1 | Procesamiento de imágenes |
| `@fingerprintjs/fingerprintjs` | 4.6.2 | Fingerprinting anti-abuso |
| `country-state-city` | 3.2.1 | Datos de países/ciudades |

**Dev Dependencies (Frontend):**
| Librería | Versión | Uso |
|----------|---------|-----|
| `@next/bundle-analyzer` | ^14.2.0 | Análisis de bundle |
| `@testing-library/react` | ^16.3.2 | Testing de componentes |
| `@testing-library/jest-dom` | ^6.9.1 | Matchers de testing |
| `@vitejs/plugin-react` | ^6.0.1 | Plugin Vitest |
| `vitest` | ^4.1.0 | Test runner |
| `jsdom` | ^29.0.1 | DOM simulado |
| `fast-check` | ^4.6.0 | Property-based testing |
| `eslint` | ^8.56.0 | Linting |
| `prettier` | ^3.1.1 | Formateo |

### 2.2 Backend

| Librería | Versión | Uso |
|----------|---------|-----|
| `express` | 4.18.2 | Servidor HTTP |
| `@supabase/supabase-js` | 2.39.0 | Cliente Supabase |
| `jsonwebtoken` | 9.0.2 | JWT |
| `bcryptjs` | 2.4.3 | Hash de contraseñas |
| `cors` | 2.8.5 | CORS |
| `helmet` | 8.1.0 | Seguridad headers |
| `express-rate-limit` | 8.3.1 | Rate limiting |
| `multer` | 1.4.5-lts.1 | Upload de archivos |
| `nodemailer` | 8.0.2 | Email SMTP |
| `node-cron` | 4.2.1 | Cron jobs |
| `ioredis` | 5.10.1 | Redis client |
| `sharp` | 0.34.5 | Procesamiento imágenes |
| `axios` | 1.6.2 | HTTP client |
| `dotenv` | 16.3.1 | Variables de entorno |
| `cookie-parser` | ^1.4.7 | Parseo de cookies JWT |
| `uuid` | ^13.0.0 | Generación de UUIDs |

**Dev Dependencies (Backend):**
| Librería | Versión | Uso |
|----------|---------|-----|
| `jest` | ^30.3.0 | Test runner |
| `ts-jest` | ^29.4.6 | TypeScript + Jest |
| `@types/jest` | ^30.0.0 | Tipos Jest |
| `fast-check` | ^4.6.0 | Property-based testing |
| `supabase` | ^2.78.1 | CLI de Supabase |
| `pg` | ^8.20.0 | Driver PostgreSQL |
| `eslint` | ^8.56.0 | Linting |
| `prettier` | ^3.1.1 | Formateo |
| `ts-node-dev` | ^2.0.0 | Hot-reload desarrollo |

---

## 3. Endpoints y URLs del Sistema

| Servicio | URL Producción | URL Local |
|----------|----------------|-----------|
| **Frontend** | `https://lookitry.com` | `http://localhost:3000` |
| **API Backend** | `https://api.lookitry.com` | `http://localhost:3001` |
| **n8n Panel** | `https://n8n.wilkiedevs.com` | — |
| **MinIO Panel** | `https://minio.wilkiedevs.com` | — |
| **Supabase Project** | `https://vkdooutklowctuudjnkl.supabase.co` | — |

---

## 4. Infraestructura y Despliegue

### 4.1 Servidor VPS (Hostinger)
- **IP:** `31.220.18.39`
- **Usuario:** `root`
- **ID VPS:** `1004711`
- **SO:** Ubuntu con Docker Engine

### 4.2 Contenedores Docker
| Contenedor | Imagen | Propósito |
|------------|--------|-----------|
| `lookitry-frontend` | `nextjs:custom` (Node 20 Alpine) | Aplicación Next.js |
| `lookitry-backend` | `node:20-alpine` | API Express |
| `root-n8n-1` | `n8nio/n8n` | Orquestador de flujos |
| `minio` | `quay.io/minio/minio` | Almacenamiento local S3 |
| `lookitry-sammy` | `node:20-alpine` (custom build) | Agente orquestador Sammy (Telegram bot + LLM) |

### 4.3 Reverse Proxy (Traefik)
- **Frontend:** `lookitry.com` y `www.lookitry.com`
- **Backend:** `api.lookitry.com`
- **Red externa:** `proxy`

### 4.4 Dockerfiles
- **Frontend:** Multi-stage build con Node 20 Alpine, standalone output
- **Backend:** Multi-stage build con Node 20 Alpine

### 4.5 Build Args (Frontend)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_N8N_DESCRIPTOR_URL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

---

## 5. Base de Datos — Esquema Detallado

### 5.1 `brands` (Clientes SaaS)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | Identificador único de la marca |
| `email` | text UNIQUE | Email de login |
| `password` | text | Nullable para Google auth |
| `name` | text | Nombre de la marca |
| `slug` | text UNIQUE | Para URL pública: `/pruebalo/[slug]` |
| `plan` | enum | `BASIC`, `PRO`, `TRIAL`, `ENTERPRISE` |
| `subscription_status` | enum | `active`, `expiring_soon`, `expired`, `suspended`, `trial` |
| `subscription_end_date` | timestamptz | Fecha de expiración |
| `logo` | text | URL del logo |
| `primary_color` | text DEFAULT '#000000' | Color primario |
| `secondary_color` | text DEFAULT '#ffffff' | Color secundario |
| `api_key` | uuid UNIQUE | Para integración plugin/API |
| `external_id` | text | ID de plataforma externa |
| `contact_name`, `phone`, `address`, `city`, `country` | text | Datos de contacto |
| `brand_description` | text | Descripción para mini-landing |
| `whatsapp_contact` | text | WhatsApp de contacto |
| `cover_image_url` | text | Imagen de portada |
| `cover_bg_color` | text | Color fallback para hero |
| `social_links` | jsonb DEFAULT '{}' | Redes sociales |
| `has_landing_page` | boolean DEFAULT false | Tiene mini-landing |
| `landing_template` | varchar(20) DEFAULT 'classic' | classic, editorial, moderno |
| `landing_suspended_at` | timestamptz | NULL = activa |
| `email_verified` | boolean DEFAULT false | |
| `email_verification_token` | text | |
| `trial_end_date` | timestamptz | |
| `trial_generations_limit` | integer DEFAULT 0 | |
| `trial_payment_status` | text | NULL, 'pending_payment', 'active', 'expired' |
| `referral_code` | varchar(50) UNIQUE | Código de referido |
| `referral_count` | integer DEFAULT 0 | |
| `extra_credits_balance` | integer DEFAULT 0 | Créditos extra comprados |
| `google_id` | text UNIQUE | Google OAuth ID |
| `auth_provider` | text DEFAULT 'email' | 'email' o 'google' |
| `needs_onboarding` | boolean DEFAULT false | Google onboarding flag |
| `internal_notes` | text | Notas solo para admin |
| `internal_notes_updated_at` | timestamptz | |
| `internal_notes_updated_by` | uuid | Admin que actualizó |
| `created_at`, `updated_at` | timestamptz | |

### 5.2 `products` (Catálogo)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `name` | text | |
| `description` | text | |
| `image_url` | text | Imagen original del producto |
| `category` | text | Categoría de ropa |
| `is_active` | boolean DEFAULT true | Visibilidad en el widget |
| `external_id` | text | ID WooCommerce/externo |
| `created_at`, `updated_at` | timestamptz | |

### 5.3 `generations` (Try-On)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `product_id` | uuid FK → products | |
| `selfie_url` | text | URL de la selfie |
| `result_image_url` | text | Imagen generada |
| `status` | enum | PENDING, SUCCESS, FAILED |
| `error_message` | text | |
| `generated_at` | timestamptz | |
| `processing_time` | integer | Milisegundos |
| `input_fingerprint` | text | Hash anti-duplicados |
| `created_at` | timestamptz | |

### 5.4 `admins`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `email` | text UNIQUE | |
| `password` | text | |
| `name` | text | |
| `role` | text DEFAULT 'admin' | |
| `reset_token`, `reset_token_expires_at` | text/timestamptz | |
| `created_at`, `updated_at` | timestamptz | |

### 5.5 `subscription_payments`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `amount` | decimal(10,2) | |
| `currency` | varchar(3) DEFAULT 'COP' | |
| `payment_date` | timestamptz | |
| `payment_method` | varchar(50) | wompi, paypal, transfer, etc. |
| `status` | enum | pending, completed, failed, refunded |
| `months_paid` | integer | |
| `reference`, `transaction_id` | text | |
| `notes` | text | |
| `created_at`, `updated_at` | timestamptz | |

### 5.6 `pending_registrations`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `email` | text | |
| `reference` | text UNIQUE | |
| `plan` | text | |
| `months` | integer | |
| `amount` | numeric DEFAULT 0 | |
| `status` | text DEFAULT 'pending' | |
| `payment_id` | text | |
| `includes_landing` | boolean DEFAULT false | |
| `reminder_sent_at` | timestamptz | |
| `created_at`, `updated_at` | timestamptz | |

### 5.7 `trial_campaigns`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `name` | text | |
| `active` | boolean DEFAULT false | |
| `trial_days` | integer DEFAULT 7 | |
| `ends_at` | timestamptz | NULL = sin límite |
| `require_card_verification` | boolean DEFAULT true | |
| `price_cop` | integer | Precio del trial |
| `created_by` | text | |
| `created_at`, `updated_at` | timestamptz | |

### 5.8 `trial_registrations`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `campaign_id` | uuid FK → trial_campaigns | |
| `ip_address` | text | Anti-abuso |
| `fingerprint` | text | Anti-abuso |
| `created_at` | timestamptz | |

### 5.9 `promotions`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `type` | enum | modal_timer, coupon, banner, plan_override, launch_offer |
| `name` | text | |
| `config` | jsonb DEFAULT '{}' | |
| `active` | boolean DEFAULT false | |
| `starts_at`, `ends_at` | timestamptz | |
| `created_at` | timestamptz | |

### 5.10 `coupons`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `code` | text UNIQUE | |
| `discount_type` | enum | pct, fixed |
| `discount_value` | numeric(10,2) | |
| `max_uses` | integer | |
| `uses_count` | integer DEFAULT 0 | |
| `expires_at` | timestamptz | |
| `plan_ids` | text[] DEFAULT '{}' | Planes aplicables |
| `active` | boolean DEFAULT true | |
| `created_at` | timestamptz | |

### 5.11 `pricing_config`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | text PK | basic, pro, mini_landing, meta, costs, descuentos_duracion, enterprise |
| `data` | jsonb | Configuración completa del plan |
| `updated_at` | timestamptz | |

### 5.12 `referrals`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `referrer_brand_id` | uuid FK → brands | |
| `referred_brand_id` | uuid FK → brands | |
| `referral_code` | varchar(50) | |
| `bonus_months` | integer DEFAULT 1 | |
| `reward_credits` | integer DEFAULT 500 | Reward real aplicado al referente |
| `bonus_credited` | boolean DEFAULT false | |
| `bonus_credited_at` | timestamptz | |
| `referrer_claimed`, `referred_claimed` | boolean DEFAULT false | |
| `status` | varchar(20) DEFAULT 'pending' | |
| `converted_at` | timestamptz | Fecha de conversión automática |
| `conversion_payment_reference` | varchar(255) | Referencia del primer pago elegible |
| `created_at`, `updated_at` | timestamptz | |

### 5.13 `notification_preferences`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands UNIQUE | |
| `email_enabled` | boolean DEFAULT true | |
| `whatsapp_enabled` | boolean DEFAULT false | |
| `reminder_7days`, `reminder_3days` | boolean DEFAULT true | |
| `usage_alerts` | boolean DEFAULT true | |
| `created_at`, `updated_at` | timestamptz | |

### 5.14 `addon_packages`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | text PK | e.g. 'credits_500' |
| `name` | text | |
| `credits_amount` | integer | |
| `price_cop` | integer | |
| `is_active` | boolean DEFAULT true | |
| `created_at`, `updated_at` | timestamptz | |

### 5.15 `plan_change_requests`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `reference` | text UNIQUE | |
| `source` | text | wompi, paypal, free_upgrade |
| `from_plan`, `to_plan` | text | |
| `months` | integer | |
| `amount_expected`, `amount_paid` | numeric(12,2) | |
| `status` | text | pending, processing, completed, failed |
| `error_message` | text | |
| `metadata` | jsonb | |
| `created_at`, `updated_at` | timestamptz | |

### 5.16 `generation_feedback` (RAG)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `generation_id` | uuid FK → generations | |
| `brand_id` | uuid FK → brands | |
| `error_type` | enum | wrong_clothing_removed, wrong_clothing_kept, body_distortion, color_wrong, product_not_applied, background_changed, other |
| `description` | text | |
| `product_category` | text | |
| `prompt_used` | text | Para RAG |
| `embedding` | vector(768) | pgvector para similitud |
| `resolved` | boolean DEFAULT false | |
| `resolved_at`, `resolved_by` | timestamptz/text | |
| `created_at`, `updated_at` | timestamptz | |

### 5.17 `enterprise_sync_configs`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands UNIQUE | |
| `sync_type` | text DEFAULT 'csv' | |
| `source_url` | text | |
| `api_key` | text | |
| `field_map` | jsonb DEFAULT '{}' | |
| `active` | boolean DEFAULT true | |
| `last_sync_at`, `last_sync_status`, `last_sync_message` | timestamptz/text | |
| `products_synced_count` | int DEFAULT 0 | |
| `notes` | text | |
| `created_at`, `updated_at` | timestamptz | |

### 5.18 `plugin_telemetry_events`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `source` | text DEFAULT 'woocommerce-plugin' | |
| `event_name`, `endpoint` | text | |
| `success` | boolean DEFAULT false | |
| `status_code` | integer | |
| `duration_ms` | integer DEFAULT 0 | |
| `retry_count` | integer DEFAULT 0 | |
| `error_message` | text | |
| `store_domain`, `product_external_id` | text | |
| `metadata` | jsonb DEFAULT '{}' | |
| `created_at` | timestamptz | |

### 5.19 `usage_alerts_log`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `threshold` | int | 80 o 100 |
| `created_at` | timestamptz | |

### 5.20 `paypal_orders`
| Campo | Tipo | Notas |
|-------|------|-------|
| (existe por migración `20260325_create_paypal_orders.sql`) | | |

### 5.21 `payment_settings` (singleton, id=1)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | integer PK | Singleton |
| `wompi_public_key`, `wompi_private_key`, `wompi_integrity_secret` | text | |
| `wompi_enabled` | boolean | |
| `paypal_client_id`, `paypal_client_secret` | text | Sandbox |
| `paypal_prod_client_id`, `paypal_prod_client_secret` | text | Producción |
| `paypal_sandbox` | boolean | |
| `paypal_webhook_id` | text | |
| `modal_promo_config` | jsonb | |
| `modal_title`, `modal_description`, `modal_image_url` | text | |
| `mini_landing_preview_seconds` | int DEFAULT 15 | |
| `bypass_ip_protection` | boolean DEFAULT false | |
| `footer_brand_url` | text DEFAULT 'https://lookitry.com' | |
| `ga_measurement_id` | text | Google Analytics |

### 5.22 `admin_notifications`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `type` | text | |
| `title` | text | |
| `message` | text | |
| `severity` | text | `info`, `warning`, `error` |
| `brand_id` | uuid FK → brands | Nullable |
| `metadata` | jsonb | |
| `read` | boolean DEFAULT false | |
| `created_at` | timestamptz | |

### 5.23 `admin_notification_preferences`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `admin_id` | uuid FK → admins | |
| `email_alerts` | boolean DEFAULT true | |
| `system_errors` | boolean DEFAULT true | |
| `new_brands` | boolean DEFAULT false | |
| `payments` | boolean DEFAULT false | |
| `created_at`, `updated_at` | timestamptz | |

### 5.24 `leads` (Lead Generation CRM)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `name` | varchar(255) | Nombre del negocio |
| `business_type` | varchar(100) | Categoría/nicho |
| `description` | text | |
| `email` | varchar(255) | Email del lead |
| `phone` | varchar(50) | Teléfono |
| `website` | varchar(500) | Sitio web |
| `instagram` | varchar(255) | Handle de Instagram (sin @) |
| `tiktok` | varchar(255) | Handle de TikTok (sin @) |
| `facebook_url` | varchar(500) | URL de página de Facebook |
| `address` | text | Dirección física |
| `city` | varchar(100) | Ciudad |
| `state` | varchar(100) | |
| `country` | varchar(100) NOT NULL | País (CO, US, ES) |
| `postal_code` | varchar(20) | |
| `latitude`, `longitude` | double precision | Coordenadas |
| `source` | varchar(50) DEFAULT 'google_places' | google_places, manual, crm_import |
| `source_id` | varchar(255) | Google Place ID |
| `search_id` | uuid FK → lead_searches | Nullable |
| `status` | varchar(30) | new, qualified, contacted, interested, not_interested, client |
| `notes` | text | Notas internas |
| `internal_notes` | text | Notas solo para admin |
| `assigned_to` | varchar(255) | |
| `email_sent_at` | timestamptz | |
| `email_campaign_id` | uuid | |
| `dm_sent_at` | timestamptz | |
| `dm_platform` | varchar(20) | |
| `is_fashion_relevant` | boolean | Clasificación de nicho fashion |
| `enrichment_source` | text | keyword_classification, web_verification, ai_classification, pending_verification |
| `website_verified` | boolean | |
| `business_type_confirmed` | text | |
| `last_enriched_at` | timestamptz | |
| `website_content` | text | Keywords encontrados en website |
| `enrichment_score` | integer | Score de enriquecimiento |
| `social_verification_status` | text | verified, partial, unverified |
| `social_verification_score` | integer | Score de presencia social |
| `created_at`, `updated_at` | timestamptz | |

### 5.25 `lead_searches` (Búsquedas Guardadas)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `name` | text | Nombre de la búsqueda |
| `query` | text | Término de búsqueda |
| `city` | text | Ciudad |
| `country` | text | País |
| `radius_km` | integer DEFAULT 10 | Radio en km |
| `min_rating` | numeric DEFAULT 0 | Rating mínimo |
| `has_website` | boolean DEFAULT false | Solo con website |
| `has_social` | boolean DEFAULT false | Solo con redes sociales |
| `status` | enum | ACTIVE, PAUSED, COMPLETED |
| `leads_found` | integer DEFAULT 0 | Contador |
| `created_by` | uuid FK → admins | |
| `created_at`, `updated_at` | timestamptz | |

### 5.26 `lead_outreach_log` (Historial de Outreach)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `lead_id` | uuid FK → leads | |
| `type` | enum | EMAIL, FACEBOOK_DM, INSTAGRAM_DM, TIKTOK_DM, CALL, NOTE |
| `subject` | text | Asunto (para emails) |
| `content` | text | Contenido del mensaje |
| `status` | enum | PENDING, SENT, DELIVERED, OPENED, REPLIED, FAILED |
| `sent_at` | timestamptz | |
| `opened_at`, `replied_at` | timestamptz | |
| `error_message` | text | |
| `created_by` | uuid FK → admins | |
| `created_at` | timestamptz | |

### 5.27 `social_api_configs` (Credenciales Social Media)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `platform` | enum | META, TIKTOK |
| `app_id` | text | App ID de la plataforma |
| `app_secret` | text | App Secret |
| `access_token` | text | Access token activo |
| `access_token_expires_at` | timestamptz | |
| `refresh_token` | text | |
| `account_id` | text | ID de la cuenta de negocio |
| `account_name` | text | Nombre de la cuenta |
| `status` | enum | ACTIVE, EXPIRED, INVALID, PENDING |
| `last_test_at` | timestamptz | |
| `last_error` | text | |
| `created_at`, `updated_at` | timestamptz | |

### 5.28 `google_places_quota` (Rate Limiting)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | integer PK | Singleton (id=1) |
| `daily_used` | integer DEFAULT 0 | Requests hoy |
| `daily_limit` | integer DEFAULT 500 | Límite diario |
| `monthly_used` | integer DEFAULT 0 | Requests este mes |
| `monthly_limit` | integer DEFAULT 28000 | Límite mensual |
| `last_reset_daily` | date | Último reset diario |
| `last_reset_monthly` | date | Último reset mensual |
| `updated_at` | timestamptz | |

### 5.30 `admin_support_tickets`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `subject` | text | |
| `description` | text | |
| `status` | enum | OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| `priority` | enum | LOW, MEDIUM, HIGH, URGENT |
| `category` | text | billing, technical, bug, feature_request, other |
| `assigned_to` | uuid FK → admins | |
| `created_at`, `updated_at` | timestamptz | |

### 5.31 `widget_ip_whitelist`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | Nullable (global whitelist) |
| `ip_address` | text | |
| `description` | text | |
| `active` | boolean DEFAULT true | |
| `created_at` | timestamptz | |

---

## 6. Arquitectura n8n — El Motor de IA

### 6.1 Flujos y Webhooks
| Función | Webhook Path | ID Workflow | Variable de entorno |
|---------|--------------|-------------|---------------------|
| **Try-On Principal** | `/webhook/tryon` | `wPLypk7KhBcFLicX` | `N8N_WEBHOOK_URL` |
| **Descriptor IA (productos)** | `/api/ai/describe-product` | Vertex AI (Sin n8n) | — |
| **Error Handling** | (Automático como errorWorkflow) | `PNri7NdZYkZhpPnm` | — |
| **Enterprise Sync** | `/webhook/enterprise-sync` | — | `N8N_ENTERPRISE_SYNC_WEBHOOK_URL` |
| **Blog Topic Generator** | `/webhook/trigger-topic-generator` | `ryoA7wq7WhXYUckC` | — |
| **Blog Article Producer** | `/webhook/trigger-article-producer` | `VMAu93Zx4k5qgzdm` | — |
| **Blog Image Generator** | `/webhook/lookitry-blog-images` | `l4Mb3wMfHUnsbEXH` | — |
| **Blog Post Creation** | `/api/blog/webhook` (backend) | — | `N8N_BLOG_WEBHOOK_URL` |
| **Blog Image Upload** | `/api/blog/upload` (backend) | — | — |
| **Blog Assemble** | `/api/blog/assemble-article` (backend) | — | — |
| **Feedback Embedding** | Asíncrono vía n8n | — | — |
| **Project Knowledge RAG** | `/webhook/project-knowledge-rag` | — | — |
| **NotebookLM Drive Sync** | `/webhook/notebooklm-sync` | — | — |

### 6.2 Prompt Rules Engine (`prompt-rules.ts`)
Motor de reglas de prompt por categoría de producto con 15+ categorías:
- vestidos, camisas, pantalones, faldas, zapatos, conjuntos, chaquetas, accesorios, etc.
- Cada categoría tiene reglas de `replacement` (reemplazar prenda) o `keep` (mantener prenda existente).

### 6.3 RAG (Retrieval-Augmented Generation)
- **Feedback de usuarios** se almacena con embeddings pgvector (1536-dim) en tabla `generation_feedback`.
- **Workflow**: `j5EG0OcxMMSpzxVu` → `/webhook/feedback-embedding` (n8n → OpenRouter → Supabase)
- **Project Knowledge (Segundo Cerebro)**: Documentación core indexada en `project_knowledge` con embeddings pgvector (768-dim).
- **Archivos indexados**: PRD.md, DESIGN.md, TECH_STACK.md, REGLAS_IMPORTANTES.md, CHANGELOG.md (recientes).
- **Flujo de indexación**: n8n detecta cambios en commits → genera embeddings → upsert a Supabase.
- **Flujo de búsqueda**: Agentes consultan `/api/agent/rag/search` con query en lenguaje natural → embedding → búsqueda vectorial → resultados ranked.
- **Sincronización NotebookLM**: En cada push, script `sync_project_knowledge.py` sincroniza archivos .md a Google Drive para research manual.

---

## 7. Arquitectura de Flujos de Negocio

### 7.1 Flujo de Registro y Trial
- Registro -> Turnstile -> Creación en DB -> Email Verificación.
- `TRIAL` automático configurable en `trial_campaigns`.
- Google OAuth: registro con Google -> onboarding -> dashboard.
- Guest trial: pago de trial antes de crear cuenta.

### 7.2 Flujo de Pago y Prorrateo (Wompi + PayPal)
- **Upgrade (BASIC → PRO):** Se aplica crédito proporcional del tiempo no usado.
- **Webhook:** Valida firma e inicia `renewSubscription`.
- **PayPal:** Soporta sandbox y producción con credenciales separadas.
- **Cupones:** Pueden cubrir 100% (free upgrade directo).
- **Add-on credits:** Compra de generaciones extra.

### 7.3 Flujo de Generación (Try-On Asíncrono)
1. Usuario sube selfie en el widget -> `POST /api/pruebalo/:slug/generate`.
2. Backend valida créditos y **encola el trabajo** en Redis usando `generation-queue.service`.
3. El **Queue Worker** (`setInterval` en `queue.routes.ts`) procesa el siguiente trabajo disponible.
4. El Worker adquiere un slot de concurrencia (`generation-concurrency.service`) y llama al Webhook n8n.
5. n8n procesa con IA y actualiza Supabase con el resultado.
6. Frontend hace **Polling** a `/api/generations/:id` hasta que `status = SUCCESS`.
7. Usuario puede reportar error (feedback con embedding RAG).

### 7.4 Sistema de Blog Automation (Arquitectura de 3 Workflows)

El sistema de blog automatizado está refactorizado en **3 workflows independientes** en n8n:

#### Arquitectura General
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BLOG AUTOMATIZATION ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│   TOPIC GENERATOR            │  Workflow: ryoA7wq7WhXYUckC
│   "Lookitry - Topic         │  Schedule: Lunes 8am
│    Generator"               │  Webhook: trigger-topic-generator
│                             │
│  Google Noticias (RSS)        │
│         ↓                    │
│  AI Trend Hunter (LLM)       │→ Genera 3 temas únicos
│         ↓                    │
│  Deduplicar vs Supabase      │
│         ↓                    │
│  INSERT blog_topics          │→ status = 'pending'
└──────────────────────────────┘
              ↓ (cuando hay topics pending)
┌──────────────────────────────┐
│   ARTICLE PRODUCER           │  Workflow: VMAu93Zx4k5qgzdm
│   "Lookitry - Article       │  Webhook: trigger-article-producer
│    Producer"                │
│                             │
│  GET Topic Pending (1)       │
│         ↓                   │
│  Marcar 'processing'        │
│         ↓                   │
│  Jina Lector (source_url)   │→ Investigación del tema
│         ↓                   │
│  Redactor IA (Gemini)       │→ Genera artículo JSON
│         ↓                   │
│  POST Article Content        │→ Guarda draft en blog_draft_articles
│         ↓                   │
│  Llamar Image Generator     │→ Fire-and-forget (async)
│         ↓                   │
│  Marcar 'published'         │
└──────────────────────────────┘
              ↓ (async, no espera respuesta)
┌──────────────────────────────┐
│   IMAGE GENERATOR            │  Workflow: l4Mb3wMfHUnsbEXH
│   "Lookitry Blog Images     │  Webhook: lookitry-blog-images
│    - FIXED Native Polling"   │
│                             │
│  Preparar Prompts (4)        │→ hero, body1, body2, body3
│         ↓                   │
│  Loop × 4 imágenes          │
│  ┌──────────────────────┐   │
│  │ Replicate API (FLUX) │   │
│  │ Esperar 15s          │   │
│  │ Verificar/Listo?     │   │──→ [No] → Esperar más
│  │ Descargar             │   │──→ [Sí] → Continuar
│  │ POST /upload          │   │→ blog_topic_images
│  └──────────────────────┘   │
│         ↓                   │
│  Ensamblar Artículo          │→ GET draft → Genera HTML → Publica en blogs
└──────────────────────────────┘
```

#### Tabla: Workflows de Blog
| Workflow | ID n8n | Trigger | Schedule | Webhook |
|----------|---------|---------|----------|---------|
| **Topic Generator** | `ryoA7wq7WhXYUckC` | Manual + Schedule | Lunes 8am | `trigger-topic-generator` |
| **Article Producer** | `VMAu93Zx4k5qgzdm` | Manual | — | `trigger-article-producer` |
| **Image Generator** | `l4Mb3wMfHUnsbEXH` | Por Article Producer | — | `lookitry-blog-images` |

#### Flujo de Ejecución

1. **Topic Generator** (automático Lunes 8am o manual):
   - Google Noticias → AI Trend Hunter → Deduplicar → INSERT blog_topics
   - Crea topics con `status = 'pending'`

2. **Article Producer** (manual desde Admin):
   - Obtiene 1 topic pending → Lo marca `processing`
   - Investiga con Jina → Redacta con Gemini → Guarda draft
   - Dispara Image Generator (fire-and-forget) → Marca `published`

3. **Image Generator** (automático, llamado por Article Producer):
   - Genera 4 imágenes con Replicate (FLUX Schnell)
   - Sube a MinIO → Actualiza `blog_topic_images`
   - Ensambla HTML → Publica en `blogs`

#### Tablas DB Involucradas
| Tabla | Uso |
|-------|-----|
| `blog_topics` | Topics pendientes/processing/published |
| `blog_draft_articles` | Draft de artículos antes de publicar |
| `blog_topic_images` | URLs de imágenes generadas (hero, body1-4) |
| `blogs` | Artículos publicados en el blog |

#### Endpoints Backend de Blog
| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/blog/article-content` | POST | Guarda draft de artículo |
| `/api/blog/upload` | POST | Upload imagen a MinIO |
| `/api/blog/assemble-article` | POST | Ensambla y publica artículo |

### 7.5 Scheduler (Cron Jobs)
| Job | Frecuencia | Función |
|-----|------------|---------|
| Subscription check | Diario 08:00 | Verifica suscripciones expiradas |
| Usage alerts | Cada 6h | Alertas de uso al 80%/100% |
| Temp cleanup | Diario 03:00 | Limpieza de selfies temporales |

### 7.6 Servicios del Backend
| Servicio | Función |
|----------|---------|
| `wompi.service` | Pagos Wompi (COP) |
| `paypal.service` | Pagos PayPal (USD) |
| `pricing.service` | Configuración dinámica de precios |
| `subscription.service` | Gestión de suscripciones |
| `feedback.service` | Feedback + RAG embeddings |
| `prompt-rag.service` | Motor de prompts con RAG |
| `prompt-rules.ts` | Reglas de prompt por categoría |
| `audit.service` | Sistema de auditoría |
| `email.service` | Envío de emails SMTP (622 líneas de templates) |
| `notification.service` | Notificaciones (email/WhatsApp) |
| `adminNotifications.ts` | Alertas para admins |
| `brandLifecycle.ts` | Transiciones de estado de suscripción |
| `paymentLedger.ts` | Tracking de pagos |
| `paymentNormalization.ts` | Normalización de pagos |
| `brandConfigCache.ts` | Cache de configuración de marcas (Redis) |
| `blogWebhook.ts` | Autenticación de webhook de blog |
| `trm.ts` | Fetch de tasa de cambio COP |
| `wooTelemetry.ts` | Telemetría de WooCommerce |
| `cleanup.service` | Limpieza de archivos temporales |
| `generation-queue.service` | Gestión de cola de trabajos Redis |
| `generation-concurrency.service` | Control de concurrencia por marca |
| `enterprise.service` | Sync de productos enterprise |
| `coupon.service` | Validación y redención de cupones |
| `referral.service` | Conversión automática de referidos |
| `addonCredits.service` | Paquetes de créditos extra |
| `review.service` | Gestión de reviews |
| `brevo-campaign.service` | Wrapper Brevo API |
| `email-campaign.service` | Lógica de campañas marketing |
| `lead.service` | CRM de prospectos |
| `lead-search.service` | Búsquedas guardadas Google Places |
| `lead-generation.service` | Cliente Google Places API |
| `social-api-config.service`| Credenciales Meta/TikTok |
| `ticket.service` | Gestión de tickets de soporte |
| `widget-ip-whitelist.service`| Whitelist de IPs para seguridad |

### 7.6 Subsistema de Auditoría (`auditor/`)
- Payments audit
- Subscriptions audit
- AI audit
- Security audit
- Health audit

### 7.7 Sistema de Email
- Templates HTML brandeados (622 líneas).
- Verificación de email, recovery, notificaciones de pago, alertas de uso.

### 7.8 Sistema de Email Marketing (Campañas Brevo)
- **Tablas:** `email_campaigns`, `email_campaign_recipients`
- **Arquitectura:**
  - `brevo-campaign.service.ts`: Wrapper Brevo SMTP + API de tracking
  - `email-campaign.service.ts`: Batching, rate limiting (50 emails/10 min), scheduling
  - `email-campaign.job.ts`: Cron job cada 5 min para procesar campaigns programadas
- **Admin UI:** `/admin/email-campaigns` para crear, previsualizar, programar y monitorear
- **Variables de template:** `{{firstName}}`, `{{brandName}}`, `{{email}}`, `{{plan}}`
- **Límite:** 300 emails/día (free tier Brevo)

### 7.9 Sistema de Lead Generation & CRM
- **Propósito:** Buscar potenciales clientes (tiendas de moda, accesorios, boutiques) y gestionar su ciclo de vida
- **Fuente:** Google Places API
- **Scope geográfico:** Colombia (Cali visitas, Medellín/Bogotá marketing), USA (ciudades hispanas), España (Madrid/Barcelona)
- **Filtro:** Solo negocios con presencia online (website o redes sociales verificadas)
- **Rate limiting:** 500 requests/día, 28k/mes (free tier Google Places)
- **Tablas:**
  - `leads`: Datos del lead (empresa, contacto, ubicación, status, score)
  - `lead_searches`: Búsquedas guardadas con configuración de ubicación/categoría
  - `lead_outreach_log`: Historial de outreach (emails, DMs, notas)
  - `social_api_configs`: Credenciales Meta/TikTok (pendiente activación)
  - `google_places_quota`: Tracking de uso de quota Google Places
- **Servicios backend:**
  - `lead.service.ts`: CRUD leads, stats, outreach logging
  - `lead-search.service.ts`: Gestión búsquedas guardadas
  - `lead-generation.service.ts`: Google Places con rate limiting
  - `social-api-config.service.ts`: Gestión credenciales Meta/TikTok
- **Admin UI:**
  - `/admin/leads`: Panel de leads con filtros por status, país, score
  - `/admin/lead-searches`: Búsquedas guardadas + dashboard de quota Google
  - `/admin/social-api-config`: Configuración de APIs sociales (Meta/TikTok)
- **Lead Statuses:** NEW, CONTACTED, QUALIFIED, INTERESTED, CONVERTED, LOST
- **Integraciones pendientes (requiere usuario):**
  - Meta Business SDK: Aplicar en https://developers.facebook.com
  - TikTok Marketing API: Aplicar en https://developers.tiktok.com
  - Ambas pueden tomar semanas en aprobación

### 7.10 Sistema de Agentes IA (v3.0)
- **Arquitectura:** Pool de agentes bajo demanda controlados por Sammantha
- **Modelo default:** MiniMax-M2.7 (Groq/DeepSeek removidos)
- **Tracking:** `active_agents.json` actualizado en cada spawn/completación
- **Dashboard:** `/mission-control/agents` con polling de 30s
- **Archivos de tracking:**
  - `Cerebro/Estado/active_agents.json` - Estado en tiempo real
  - `Cerebro/Protocolos/AGENT_STATUS_DASHBOARD.md` - Dashboard
  - `Cerebro/Protocolos/DELEGATION_PROTOCOL.md` - Protocolo de delegación
- **Agentes:** Sammantha (orquestadora), Pixel (frontend), Kira (quality), Nadia (DB/IA), Marlo (growth), Zephyr (infra), Lina (docs), Cipher (security)

---

## 8. Estructura del Proyecto

```
LOOKITRY/
├── frontend/                    # Next.js 14 (App Router)
├── backend/                     # Express API
├── scripts/                     # Deploy y scripts actuales
│   └── archive/                 # Scripts temporales obsoletos
├── docker/                      # Docker configurations
│   └── archive/                 # Docker-compose antiguos
├── lookitry-woocommerce/        # Plugin WordPress/WooCommerce
├── Lookitry_Brain_Vault/        # Cerebro y Documentación
│   ├── Cerebro/
│   │   ├── Archive/             # Backups antiguos de Cerebro (JSON)
│   │   └── Docs/design/         # Documentación de diseño
│   │       └── archive/         # RunPod y docs obsoletas
├── DATABASE_MIGRATIONS.md       # Migraciones de DB
└── REGLAS_IMPORTANTES.md        # Reglas operativas
```
LOOKITRY/
├── frontend/                    # Next.js 14 (App Router)
│   ├── src/app/                # Páginas y API routes
│   │   ├── (public routes)     # /, /login, /register, /planes, /blog, etc.
│   │   ├── dashboard/          # Dashboard de marca
│   │   ├── admin/              # Panel admin
│   │   ├── api/                # API routes internas
│   │   └── pruebalo/, sitio/, embed/, marca/  # Páginas públicas
│   ├── src/components/         # Componentes reutilizables (40+)
│   ├── src/lib/seo/            # Generadores de esquemas JSON-LD (Auditoría SEO 2026)
│   └── src/services/           # Clientes HTTP
├── backend/                     # Express API
│   ├── src/controllers/        # Lógica de negocio
│   │   └── admin/              # Controladores modulares por dominio (Brands, Stats, Payments, etc.)
│   ├── src/routes/             # 24 archivos de rutas (100+ endpoints)
│   ├── src/services/           # 23 servicios (wompi, paypal, pricing, etc.)
│   ├── src/auditor/            # Subsistema de auditoría
│   ├── src/middleware/         # Auth, rate limiting, CORS
│   ├── src/utils/              # Utilidades (lifecycle, ledger, trm, etc.)
│   ├── src/scheduler/          # Cron jobs
│   ├── src/config/             # Config (redis, supabase, etc.)
│   └── src/email-templates/    # Templates HTML
├── scripts/                    # Deploy (_deploy_now.py)
├── lookitry-woocommerce/       # Plugin WordPress/WooCommerce
│   ├── lookitry-woocommerce.php
│   ├── includes/               # admin-settings, frontend-hooks
│   └── assets/                 # JS, CSS, logo
├── docker-compose.*.yml        # Docker compose files
├── DATABASE_MIGRATIONS.md      # Migraciones de DB
└── REGLAS_IMPORTANTES.md       # Reglas operativas
```

---

## 9. Scripts de Desarrollo

### Frontend
- `npm run dev`: Desarrollo local.
- `npm run build`: Generar build de producción.

### Backend
- `npm run dev`: Hot-reload con ts-node-dev.
- `python scripts/_deploy_now.py`: Deploy al VPS.

---

## 10. Variables de Entorno Críticas

### 10.1 Frontend (`.env.example`)
| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL del backend |
| `NEXT_PUBLIC_APP_URL` | URL base del frontend |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key anon de Supabase |
| `NEXT_PUBLIC_N8N_DESCRIPTOR_URL` | Webhook descriptor n8n |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

### 10.2 Backend (`.env.example`)
| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default 3001) |
| `NODE_ENV` | development/production |
| `SUPABASE_URL` | URL de Supabase |
| `SUPABASE_ANON_KEY` | Key anon de Supabase |
| `SUPABASE_SERVICE_KEY` | Key service role (acceso admin DB) |
| `JWT_SECRET` | Secret para firmar JWT |
| `JWT_EXPIRES_IN` | Expiración del JWT (default 7d) |
| `N8N_WEBHOOK_URL` | Webhook try-on principal |
| `N8N_API_KEY` | API key de n8n |
| `N8N_TIMEOUT` | Timeout de n8n (default 90000ms) |
| `N8N_BEARER_TOKEN` | Bearer token para n8n |
| `N8N_HEADER_NAME` | Nombre del header de auth n8n |
| `N8N_DESCRIPTOR_URL` | Webhook descriptor IA |
| `N8N_ENTERPRISE_SYNC_WEBHOOK_URL` | Webhook enterprise sync |
| `OPENROUTER_API_KEY` | API key de OpenRouter |
| `JULES_API_KEY` | API key de Jules |
| `MAX_FILE_SIZE` | Tamaño máximo de upload (default 5242880) |
| `ALLOWED_FILE_TYPES` | MIME types permitidos |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Configuración email |
| `FRONTEND_URL` | URL del frontend para links en emails |
| `CORS_ORIGIN` | Orígenes permitidos |
| `ENTERPRISE_SYNC_TOKEN` | Token para enterprise sync webhook |
| `MINIO_ENDPOINT` | URL de MinIO S3 |
| `COOKIE_DOMAIN` | Dominio de cookies (producción) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_ENABLED` | Configuración Wompi |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_SANDBOX`, `PAYPAL_WEBHOOK_ID` | PayPal sandbox |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GOOGLE_PLACES_API_KEY` | API key Google Places (Lead Generation) |
| `BREVO_API_KEY` | API key Brevo SMTP |

---

## 11. Seguridad Reforzada (Abril 2026)

| Área | Cambio | Estado |
|------|--------|--------|
| Docker Compose | Secretos en variables de entorno | ✅ Implementado |
| Account Lockout | 5 intentos fallidos = 15 min bloqueo (`locked_until`) | ✅ Implementado |
| Login Audit | Logging de intentos de login (success/failed) | ✅ Implementado |
| Session TTL | Reducido a 7 días | ✅ Implementado |
| Admin Rate Limit | Rate limit más estricto para admin | ✅ Implementado |
| JWT Logout | Blacklist en Redis | ⚠️ Pendiente |
| CSRF Protection | Tokens en formularios | ⚠️ Pendiente |
| HSTS Frontend | Header Strict-Transport-Security | ⚠️ Pendiente |

### Campos de Seguridad en `brands`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `failed_login_attempts` | integer DEFAULT 0 | Contador de intentos fallidos |
| `locked_until` | timestamptz | Timestamp hasta el cual la cuenta está bloqueada |

---

## 12. SEO & Crawlers (Auditoría 2026)

### 12.1 Crawlers y Sitemaps
- **robots.txt**: Configurado en `frontend/public/robots.txt`. Permite indexación general pero bloquea rutas internas (`/api`, `/admin`, `/dashboard`, etc.).
- **sitemap.xml**: Generado dinámicamente vía Route Handler en `frontend/src/app/sitemap.xml/route.ts`. Extrae slugs de blogs y landing pages activas de Supabase con `changefreq` y `priority` optimizados.
- **llms.txt**: Archivo de contexto optimizado para IA/LLMs en `frontend/src/app/llms.txt/route.ts`, siguiendo el estándar de llamaindex.

### 12.2 Datos Estructurados (JSON-LD)
- Sistema tipado ubicado en `frontend/src/lib/seo/`.
- Generadores de esquemas implementados y exportados para inyección en `<script type="application/ld+json">`:
  - `OrganizationSchema` y `WebSiteSchema` (Home)
  - `ProductSchema` o `ServiceSchema` (Try-on Product)
  - `ArticleSchema` (Blogs)
  - `ProfessionalServiceSchema` (Brand Pages)

---

##不走

**Última actualización:** Abril 2026.
Toda modificación en los flujos de n8n debe ser documentada inmediatamente aquí.
