# Esquema Detallado de Base de Datos - Lookitry

Este documento contiene la estructura exacta y actual de la base de datos de Supabase para Lookitry, obtenida mediante introspección directa del sistema.

**Última actualización:** 22 Abril 2026

---

## Tablas Principales (Core)

### brands
Gestión de marcas, suscripciones y configuración del widget.
- `id`: uuid (PK)
- `email`, `password`: text (password nullable para Google auth)
- `name`, `slug`: text
- `plan`: enum (BASIC, PRO, TRIAL, ENTERPRISE, LANDING)
- `subscription_status`: enum (active, expiring_soon, expired, suspended, trial)
- `subscription_start_date`, `subscription_end_date`: timestamptz
- `logo`, `logo_light`, `logo_dark`: text (URLs MinIO)
- `primary_color`, `secondary_color`: text (Hex, default '#000000' / '#ffffff')
- `api_key`: uuid UNIQUE
- `external_id`: text
- `contact_name`, `phone`, `address`, `city`, `country`: text
- `brand_description`, `whatsapp_contact`: text
- `cover_image_url`, `cover_bg_color`: text
- `social_links`: jsonb DEFAULT '{}'
- `has_landing_page`: boolean DEFAULT false
- `landing_template`: varchar(20) DEFAULT 'classic' (classic, editorial, moderno)
- `landing_suspended_at`: timestamptz (NULL = activa)
- `email_verified`: boolean DEFAULT false
- `email_verification_token`: text
- `trial_end_date`: timestamptz
- `trial_generations_limit`: integer DEFAULT 0
- `trial_payment_status`: text (NULL, 'pending_payment', 'active', 'expired')
- `referral_code`: varchar(50) UNIQUE
- `referral_count`: integer DEFAULT 0
- `extra_credits_balance`: integer DEFAULT 0 (Créditos extra comprados)
- `google_id`: text UNIQUE (Google OAuth ID)
- `auth_provider`: text DEFAULT 'email' ('email' o 'google')
- `needs_onboarding`: boolean DEFAULT false
- `internal_notes`: text
- `internal_notes_updated_at`: timestamptz
- `internal_notes_updated_by`: uuid
- `created_at`, `updated_at`: timestamptz

### products
Catálogo de productos de las marcas.
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands)
- `name`, `description`, `category`, `image_url`: text
- `is_active`: boolean DEFAULT true (Visibilidad en el widget)
- `external_id`: text (ID WooCommerce/externo)
- `created_at`, `updated_at`: timestamptz

### generations
Historial de pruebas virtuales (Try-On).
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands)
- `product_id`: uuid (FK -> products)
- `selfie_url`, `result_image_url`: text
- `status`: enum (PENDING, SUCCESS, FAILED)
- `error_message`: text
- `generated_at`: timestamptz
- `processing_time`: integer (ms)
- `input_fingerprint`: text (Hash anti-duplicados)
- `prompt_used`: text (Prompt final tras enriquecimiento RAG)
- `created_at`: timestamptz

---

## IA y Sistema RAG

### generation_feedback
Base de conocimiento de errores para aprendizaje de la IA.
- `id`: uuid (PK)
- `generation_id`: uuid (FK -> generations)
- `brand_id`: uuid (FK -> brands)
- `error_type`: enum (wrong_clothing_removed, wrong_clothing_kept, body_distortion, color_wrong, product_not_applied, background_changed, other)
- `description`: text
- `product_category`: text
- `prompt_used`: text (Para RAG)
- `embedding`: vector(768) (pgvector para similitud)
- `resolved`: boolean DEFAULT false
- `resolved_at`, `resolved_by`: timestamptz/text
- `created_at`, `updated_at`: timestamptz

### project_knowledge
RAG para documentación del proyecto (Agentes).
- `id`: uuid (PK)
- `file_path`: text UNIQUE
- `content`: text
- `embedding`: vector(768)
- `version`: text
- `updated_at`: timestamptz

---

## Pagos y Suscripciones

### subscription_payments
Historial de transacciones completadas.
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands)
- `amount`: decimal(10,2)
- `currency`: varchar(3) DEFAULT 'COP'
- `payment_date`: timestamptz
- `payment_method`: varchar(50) (wompi, paypal, transfer, etc.)
- `status`: enum (pending, completed, failed, refunded)
- `months_paid`: integer
- `reference`, `transaction_id`: text
- `notes`: text
- `created_at`, `updated_at`: timestamptz

### pending_registrations
Registros pendientes de confirmación de pago.
- `id`: uuid (PK)
- `email`: text
- `reference`: text UNIQUE
- `plan`: text
- `months`: integer
- `amount`: numeric DEFAULT 0
- `status`: text DEFAULT 'pending'
- `payment_id`: text
- `includes_landing`: boolean DEFAULT false
- `reminder_sent_at`: timestamptz
- `created_at`, `updated_at`: timestamptz

### plan_change_requests
Solicitudes de cambio de plan.
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands)
- `reference`: text UNIQUE
- `source`: text (wompi, paypal, free_upgrade)
- `from_plan`, `to_plan`: text
- `months`: integer
- `amount_expected`, `amount_paid`: numeric(12,2)
- `status`: text (pending, processing, completed, failed)
- `error_message`: text
- `metadata`: jsonb
- `created_at`, `updated_at`: timestamptz

### coupons
Cupones de descuento.
- `id`: uuid (PK)
- `code`: text UNIQUE
- `discount_type`: enum (pct, fixed)
- `discount_value`: numeric(10,2)
- `max_uses`: integer
- `uses_count`: integer DEFAULT 0
- `expires_at`: timestamptz
- `plan_ids`: text[] DEFAULT '{}'
- `active`: boolean DEFAULT true
- `created_at`: timestamptz

### referrals
Programa de referidos.
- `id`: uuid (PK)
- `referrer_brand_id`: uuid (FK -> brands)
- `referred_brand_id`: uuid (FK -> brands)
- `referral_code`: varchar(50)
- `bonus_months`: integer DEFAULT 1
- `reward_credits`: integer DEFAULT 500
- `bonus_credited`: boolean DEFAULT false
- `bonus_credited_at`: timestamptz
- `referrer_claimed`, `referred_claimed`: boolean DEFAULT false
- `status`: varchar(20) DEFAULT 'pending'
- `converted_at`: timestamptz
- `conversion_payment_reference`: varchar(255)
- `created_at`, `updated_at`: timestamptz

### trial_campaigns
Campañas de trial.
- `id`: uuid (PK)
- `name`: text
- `active`: boolean DEFAULT false
- `trial_days`: integer DEFAULT 7
- `ends_at`: timestamptz (NULL = sin límite)
- `require_card_verification`: boolean DEFAULT true
- `price_cop`: integer
- `created_by`: text
- `created_at`, `updated_at`: timestamptz

### trial_registrations
Registro de trials (anti-abuso).
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands)
- `campaign_id`: uuid (FK -> trial_campaigns)
- `ip_address`: text
- `fingerprint`: text
- `created_at`: timestamptz

---

## Marketing y Ventas (CRM)

### leads
Prospectos extraídos mediante automatización.
- `id`: uuid (PK)
- `business_name`, `contact_name`, `email`, `phone`: text
- `website`: text
- `facebook_url`, `instagram_handle`, `tiktok_handle`: text
- `address`, `city`, `country`: text
- `latitude`, `longitude`: numeric
- `place_id`: text (Google Place ID)
- `rating`: numeric
- `reviews_count`: integer
- `status`: enum (NEW, CONTACTED, QUALIFIED, INTERESTED, CONVERTED, LOST)
- `score`: integer DEFAULT 0 (0-100)
- `notes`: text
- `last_outreach_at`: timestamptz
- `search_id`: uuid (FK -> lead_searches)
- `source`: text (google_places, manual, import)
- `created_at`, `updated_at`: timestamptz

### lead_searches
Búsquedas guardadas de leads.
- `id`: uuid (PK)
- `name`: text
- `query`: text
- `city`, `country`: text
- `radius_km`: integer DEFAULT 10
- `min_rating`: numeric DEFAULT 0
- `has_website`, `has_social`: boolean DEFAULT false
- `status`: enum (ACTIVE, PAUSED, COMPLETED)
- `leads_found`: integer DEFAULT 0
- `created_by`: uuid (FK -> admins)
- `created_at`, `updated_at`: timestamptz

### lead_outreach_log
Historial de outreach a leads.
- `id`: uuid (PK)
- `lead_id`: uuid (FK -> leads)
- `type`: enum (EMAIL, FACEBOOK_DM, INSTAGRAM_DM, TIKTOK_DM, CALL, NOTE)
- `subject`: text
- `content`: text
- `status`: enum (PENDING, SENT, DELIVERED, OPENED, REPLIED, FAILED)
- `sent_at`: timestamptz
- `opened_at`, `replied_at`: timestamptz
- `error_message`: text
- `created_by`: uuid (FK -> admins)
- `created_at`: timestamptz

### email_campaigns
Gestión de envíos masivos (Brevo).
- `id`: uuid (PK)
- `name`: text
- `subject`: text
- `html_template`: text
- `status`: enum (draft, scheduled, processing, completed)
- `filter_type`: text
- `scheduled_at`: timestamptz
- `sent_count`: integer DEFAULT 0
- `created_by`: uuid (FK -> admins)
- `created_at`, `updated_at`: timestamptz

### promotions
Promociones globales.
- `id`: uuid (PK)
- `type`: enum (modal_timer, coupon, banner, plan_override, launch_offer)
- `name`: text
- `config`: jsonb DEFAULT '{}'
- `active`: boolean DEFAULT false
- `starts_at`, `ends_at`: timestamptz
- `created_at`: timestamptz

### social_api_configs
Credenciales de APIs sociales.
- `id`: uuid (PK)
- `platform`: enum (META, TIKTOK)
- `app_id`, `app_secret`, `access_token`: text
- `access_token_expires_at`: timestamptz
- `refresh_token`: text
- `account_id`, `account_name`: text
- `status`: enum (ACTIVE, EXPIRED, INVALID, PENDING)
- `last_test_at`: timestamptz
- `last_error`: text
- `created_at`, `updated_at`: timestamptz

---

## Administración y Soporte

### admins
- `id`: uuid (PK)
- `email`: text UNIQUE
- `password`: text
- `name`: text
- `role`: text DEFAULT 'admin'
- `reset_token`, `reset_token_expires_at`: text/timestamptz
- `created_at`, `updated_at`: timestamptz

### admin_notifications
- `id`: uuid (PK)
- `type`: text
- `title`, `message`: text
- `severity`: text (info, warning, error)
- `brand_id`: uuid (FK -> brands) NULL
- `metadata`: jsonb
- `created_at`: timestamptz

### admin_notification_preferences
- `id`: uuid (PK)
- `admin_id`: uuid (FK -> admins)
- `email_alerts`: boolean DEFAULT true
- `system_errors`: boolean DEFAULT true
- `new_brands`: boolean DEFAULT false
- `payments`: boolean DEFAULT false
- `created_at`, `updated_at`: timestamptz

### notification_preferences
Preferencias de notificación por marca.
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands) UNIQUE
- `email_enabled`: boolean DEFAULT true
- `whatsapp_enabled`: boolean DEFAULT false
- `reminder_7days`, `reminder_3days`: boolean DEFAULT true
- `usage_alerts`: boolean DEFAULT true
- `created_at`, `updated_at`: timestamptz

---

## Configuración Dinámica

### pricing_config
- `id`: text PK (basic, pro, mini_landing, meta, costs, descuentos_duracion, enterprise)
- `data`: jsonb (Configuración completa del plan)
- `updated_at`: timestamptz

### payment_settings
Singleton (id=1) para configuración de pasarelas.
- `id`: integer PK
- `wompi_public_key`, `wompi_private_key`, `wompi_integrity_secret`: text
- `wompi_enabled`: boolean
- `paypal_client_id`, `paypal_client_secret`: text (Sandbox)
- `paypal_prod_client_id`, `paypal_prod_client_secret`: text (Producción)
- `paypal_sandbox`: boolean
- `paypal_webhook_id`: text
- `modal_promo_config`: jsonb
- `modal_title`, `modal_description`, `modal_image_url`: text
- `mini_landing_preview_seconds`: int DEFAULT 15
- `bypass_ip_protection`: boolean DEFAULT false
- `footer_brand_url`: text DEFAULT 'https://lookitry.com'
- `ga_measurement_id`: text (Google Analytics)

### addon_packages
Paquetes de créditos extra.
- `id`: text PK (e.g. 'credits_500')
- `name`: text
- `credits_amount`: integer
- `price_cop`: integer
- `is_active`: boolean DEFAULT true
- `created_at`, `updated_at`: timestamptz

---

## Enterprise y Plugin

### enterprise_sync_configs
Configuración de sync para clientes enterprise.
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands) UNIQUE
- `sync_type`: text DEFAULT 'csv'
- `source_url`: text
- `api_key`: text
- `field_map`: jsonb DEFAULT '{}'
- `active`: boolean DEFAULT true
- `last_sync_at`, `last_sync_status`, `last_sync_message`: timestamptz/text
- `products_synced_count`: int DEFAULT 0
- `notes`: text
- `created_at`, `updated_at`: timestamptz

### plugin_telemetry_events
Telemetría del plugin WooCommerce.
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands)
- `source`: text DEFAULT 'woocommerce-plugin'
- `event_name`, `endpoint`: text
- `success`: boolean DEFAULT false
- `status_code`: integer
- `duration_ms`: integer DEFAULT 0
- `retry_count`: integer DEFAULT 0
- `error_message`: text
- `store_domain`, `product_external_id`: text
- `metadata`: jsonb DEFAULT '{}'
- `created_at`: timestamptz

---

## Blog Automation

### blog_topics
Topics generados para blog.
- `id`: uuid (PK)
- `title`: text
- `search_query`: text
- `status`: enum (pending, processing, published, failed)
- `published_at`: timestamptz
- `created_at`, `updated_at`: timestamptz

### blog_draft_articles
Drafts de artículos antes de publicar.
- `id`: uuid (PK)
- `topic_id`: uuid (FK -> blog_topics)
- `title`, `content`: text (HTML/Markdown)
- `source_url`: text
- `status`: enum (draft, ready, published, failed)
- `created_at`, `updated_at`: timestamptz

### blog_topic_images
Imágenes generadas para topics.
- `id`: uuid (PK)
- `topic_id`: uuid (FK -> blog_topics)
- `type`: enum (hero, body1, body2, body3)
- `image_url`: text
- `alt_text`: text
- `created_at`: timestamptz

### blogs
Artículos publicados.
- `id`: uuid (PK)
- `topic_id`: uuid (FK -> blog_topics)
- `title`, `slug`, `excerpt`, `content`: text
- `featured_image_url`: text
- `status`: enum (draft, published, archived)
- `published_at`: timestamptz
- `created_at`, `updated_at`: timestamptz

---

## Rate Limiting y Monitoreo

### google_places_quota
Rate limiting para Google Places API.
- `id`: integer PK (singleton, id=1)
- `daily_used`: integer DEFAULT 0
- `daily_limit`: integer DEFAULT 500
- `monthly_used`: integer DEFAULT 0
- `monthly_limit`: integer DEFAULT 28000
- `last_reset_daily`: date
- `last_reset_monthly`: date
- `updated_at`: timestamptz

### usage_alerts_log
Log de alertas de uso.
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands)
- `threshold`: int (80 o 100)
- `created_at`: timestamptz