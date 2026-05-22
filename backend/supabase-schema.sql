-- ============================================
-- Lookitry SaaS - Full Supabase Schema
-- Generated: 2026-04-04
-- Tables: 26 (excluding views)
-- ============================================

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE plan_type AS ENUM ('BASIC', 'PRO', 'TRIAL', 'ENTERPRISE', 'LANDING');
CREATE TYPE generation_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE subscription_status AS ENUM ('active', 'expiring_soon', 'expired', 'suspended', 'trial');
CREATE TYPE discount_type AS ENUM ('pct', 'fixed');
CREATE TYPE promotion_type AS ENUM ('modal_timer', 'coupon', 'banner', 'plan_override', 'launch_offer');
CREATE TYPE generation_error_type AS ENUM ('wrong_clothing_removed', 'wrong_clothing_kept', 'body_distortion', 'color_wrong', 'product_not_applied', 'background_changed', 'other');

-- ============================================
-- TABLES (Alphabetical Order)
-- ============================================

-- admin_notification_preferences
CREATE TABLE admin_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- admin_notifications
CREATE TABLE admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  brand_id uuid,
  brand_name text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- admins
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  permissions text[] DEFAULT '{}',
  google_id text UNIQUE,
  auth_provider text DEFAULT 'password'
);

-- addon_packages
CREATE TABLE addon_packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  credits_amount integer NOT NULL CHECK (credits_amount > 0),
  price_cop integer NOT NULL CHECK (price_cop > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- blog_categories
CREATE TABLE blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- blog_settings
CREATE TABLE blog_settings (
  id bigint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY['daily', 'weekly', 'monthly'])),
  is_enabled boolean NOT NULL DEFAULT true,
  next_run timestamptz NOT NULL DEFAULT now(),
  last_run timestamptz,
  webhook_url text,
  webhook_secret text NOT NULL DEFAULT 'CHANGE_ME_IN_ENV',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  openrouter_article_model text,
  image_generation_provider text,
  openrouter_image_model text
);

-- blog_topics
CREATE TABLE blog_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text UNIQUE NOT NULL,
  category_slug text,
  keywords text,
  meta_description text,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'generating', 'published', 'archived'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  source_url text
);

-- blogs
CREATE TABLE blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  meta_description text,
  featured_image text,
  category_id uuid,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft', 'published'])),
  author_id uuid,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  topic_id uuid
);

-- blog_draft_articles
-- Almacena artículos en proceso de generación (JSON estructurado + HTML legacy)
CREATE TABLE blog_draft_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES blog_topics(id) ON DELETE CASCADE,
  title text,
  slug text,
  html_content text, -- legacy: HTML completo sin imágenes
  excerpt text,
  meta_description text,
  tags text[] DEFAULT '{}',
  category_slug text,
  sections jsonb DEFAULT '[]', -- Array de secciones estructuradas
  faqs jsonb DEFAULT '[]', -- Array de preguntas y respuestas
  cta_context jsonb, -- Contexto para CTA final
  image_prompts jsonb DEFAULT '[]', -- Prompts para generar imágenes
  toc_items jsonb DEFAULT '[]', -- Tabla de contenidos
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- blog_topic_images
-- Almacena URLs de imágenes generadas para artículos
CREATE TABLE blog_topic_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES blog_topics(id) ON DELETE CASCADE UNIQUE,
  imagen_hero_url text,
  imagen_body1_url text,
  imagen_body2_url text,
  imagen_body3_url text,
  imagen_body4_url text,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'generating', 'completed', 'failed'])),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- brand_reviews
CREATE TABLE brand_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL UNIQUE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL CHECK (char_length(comment) >= 10 AND char_length(comment) <= 500),
  reviewer_name text NOT NULL,
  reviewer_plan text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected'])),
  is_featured boolean NOT NULL DEFAULT false,
  admin_note text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- brands
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password text NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL CHECK (slug ~* '^[a-z0-9-]+$'),
  plan plan_type NOT NULL DEFAULT 'BASIC',
  logo text,
  primary_color text DEFAULT '#000000' NOT NULL CHECK (primary_color ~* '^#[0-9A-Fa-f]{6}$'),
  secondary_color text DEFAULT '#ffffff' NOT NULL CHECK (secondary_color ~* '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  phone text,
  address text,
  city varchar,
  country varchar,
  contact_name varchar NOT NULL,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  subscription_status subscription_status,
  last_payment_date timestamptz,
  next_payment_date timestamptz,
  widget_template varchar DEFAULT 'minimal',
  button_text varchar DEFAULT 'Probarme esto',
  welcome_message text DEFAULT '',
  trial_end_date timestamptz,
  trial_generations_limit integer DEFAULT 30,
  nit text,
  website text,
  trial_payment_status text,
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token text,
  brand_description text,
  whatsapp_contact text,
  cover_image_url text,
  social_links jsonb DEFAULT '{}',
  has_landing_page boolean DEFAULT false,
  city_display text,
  national_shipping boolean DEFAULT false,
  whatsapp_message text,
  cta_button_text text DEFAULT 'Probarme esto',
  rating numeric CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  total_reviews integer DEFAULT 0,
  landing_template text DEFAULT 'classic' CHECK (landing_template = ANY (ARRAY['classic', 'editorial', 'probador', 'moderno'])),
  schedule jsonb,
  slogan text,
  landing_suspended_at timestamptz,
  logo_light text,
  logo_dark text,
  reset_token varchar,
  reset_token_expires_at timestamptz,
  cover_bg_color text,
  cover_overlay_opacity numeric DEFAULT 0.55 CHECK (cover_overlay_opacity >= 0 AND cover_overlay_opacity <= 1),
  show_brand_name boolean DEFAULT true,
  upgrade_requested_at timestamptz,
  landing_font text DEFAULT 'font-jakarta',
  widget_bg_color text DEFAULT '#0a0a0a',
  api_key uuid DEFAULT gen_random_uuid(),
  state_province text,
  postal_code text,
  billing_email text,
  extra_credits_balance integer NOT NULL DEFAULT 0,
  review_prompt_shown_at timestamptz,
  internal_notes text,
  google_id text UNIQUE,
  auth_provider text DEFAULT 'email',
  needs_onboarding boolean DEFAULT false,
  referral_code varchar UNIQUE,
  referral_count integer DEFAULT 0
);

-- coupons
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type discount_type NOT NULL DEFAULT 'pct',
  discount_value numeric NOT NULL,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  plan_ids text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- enterprise_sync_configs
CREATE TABLE enterprise_sync_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid UNIQUE,
  sync_type text NOT NULL DEFAULT 'csv',
  source_url text NOT NULL,
  api_key text,
  field_map jsonb DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_message text,
  products_synced_count integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- generation_feedback
CREATE TABLE generation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid,
  brand_id uuid,
  error_type generation_error_type NOT NULL DEFAULT 'other',
  description text,
  product_category text,
  prompt_used text,
  embedding vector,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  content text,
  metadata jsonb DEFAULT '{}'
);

-- generations
CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  product_id uuid NOT NULL,
  selfie_url text NOT NULL,
  selfie_url_anonymized text, -- hashed reference sin URL real después de eliminación
  selfie_deleted_at timestamptz, -- timestamp de eliminación del dato biométrico
  result_image_url text,
  result_image_deleted_at timestamptz, -- timestamp de eliminación de resultado (48h después)
  status generation_status NOT NULL DEFAULT 'PENDING',
  error_message text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  processing_time integer,
  prompt_used text,
  input_fingerprint text,
  engine_used text CHECK (engine_used IN ('vertex', 'n8n'))
);

-- biometric_cleanup_log
-- Registro de auditoría de todas las eliminaciones de datos biométricos
CREATE TABLE biometric_cleanup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES generations(id),
  selfie_path text NOT NULL, -- path original en MinIO/GCS
  minio_deleted boolean NOT NULL DEFAULT false,
  gcs_deleted boolean NOT NULL DEFAULT false,
  selfie_url_anonymized text, -- valor que quedó en selfie_url después de anonimizar
  cleanup_error text, -- mensaje de error si falló la eliminación
  deleted_at timestamptz NOT NULL DEFAULT now()
);

-- payment_logs
CREATE TABLE payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  gateway text NOT NULL CHECK (gateway = ANY (ARRAY['wompi', 'paypal', 'manual'])),
  reference text,
  brand_id uuid,
  transaction_id text,
  amount_cents integer,
  currency text DEFAULT 'COP',
  status text NOT NULL,
  payload jsonb,
  error_message text,
  processed_at timestamptz,
  ip_address text
);

-- payment_settings
CREATE TABLE payment_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  wompi_enabled boolean NOT NULL DEFAULT false,
  wompi_public_key text NOT NULL DEFAULT '',
  wompi_private_key text NOT NULL DEFAULT '',
  wompi_events_secret text NOT NULL DEFAULT '',
  wompi_integrity_secret text NOT NULL DEFAULT '',
  wompi_test_mode boolean NOT NULL DEFAULT true,
  paypal_enabled boolean NOT NULL DEFAULT false,
  paypal_email text NOT NULL DEFAULT '',
  paypal_client_id text NOT NULL DEFAULT '',
  paypal_client_secret text NOT NULL DEFAULT '',
  paypal_sandbox boolean NOT NULL DEFAULT true,
  manual_enabled boolean NOT NULL DEFAULT true,
  manual_instructions text NOT NULL DEFAULT 'Realiza el pago y envía el comprobante por WhatsApp o email.',
  manual_bank_name text NOT NULL DEFAULT '',
  manual_account_number text NOT NULL DEFAULT '',
  manual_account_holder text NOT NULL DEFAULT '',
  manual_whatsapp text NOT NULL DEFAULT '',
  manual_email text NOT NULL DEFAULT '',
  transfer_enabled boolean NOT NULL DEFAULT false,
  transfer_bank_name text NOT NULL DEFAULT '',
  transfer_account_number text NOT NULL DEFAULT '',
  transfer_account_type text NOT NULL DEFAULT 'Ahorros',
  transfer_account_holder text NOT NULL DEFAULT '',
  transfer_nit text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'COP',
  updated_at timestamptz NOT NULL DEFAULT now(),
  landing_price integer NOT NULL DEFAULT 650000,
  landing_original_price integer NOT NULL DEFAULT 900000,
  bypass_ip_protection boolean NOT NULL DEFAULT false,
  ip_whitelist text NOT NULL DEFAULT '',
  wompi_prod_public_key text NOT NULL DEFAULT '',
  wompi_prod_private_key text NOT NULL DEFAULT '',
  wompi_prod_events_secret text NOT NULL DEFAULT '',
  wompi_prod_integrity_secret text NOT NULL DEFAULT '',
  modal_promo_config jsonb DEFAULT '{}',
  modal_title text,
  modal_description text,
  modal_image_url text,
  mini_landing_preview_seconds integer DEFAULT 15,
  maintenance_mode boolean DEFAULT false,
  maintenance_message text DEFAULT 'Estamos realizando mejoras en nuestra plataforma. Volveremos pronto.',
  paypal_prod_client_id text,
  paypal_prod_client_secret text
);

-- paypal_orders
CREATE TABLE paypal_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  brand_id uuid,
  email text,
  plan text NOT NULL,
  months integer NOT NULL,
  amount_cop numeric NOT NULL,
  trm numeric NOT NULL,
  amount_usd_expected numeric NOT NULL,
  order_id text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- pending_registrations
CREATE TABLE pending_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  reference text UNIQUE NOT NULL,
  plan text NOT NULL,
  months integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  includes_landing boolean NOT NULL DEFAULT false,
  status text DEFAULT 'pending',
  payment_id text,
  updated_at timestamptz DEFAULT now(),
  brand_name text,
  amount numeric NOT NULL DEFAULT 0,
  reminder_sent_at timestamptz
);

-- plugin_telemetry_events
CREATE TABLE plugin_telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'woocommerce-plugin',
  event_name text NOT NULL,
  endpoint text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  status_code integer,
  duration_ms integer NOT NULL DEFAULT 0,
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  store_domain text,
  product_external_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- pricing_config
CREATE TABLE pricing_config (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  description text,
  image_url text NOT NULL,
  category text NOT NULL CHECK (length(trim(category)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  price integer,
  badge text CHECK (badge IS NULL OR badge = ANY (ARRAY['nuevo', 'top', 'oferta'])),
  external_id varchar
);

-- promotions
CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type promotion_type NOT NULL,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- referrals
CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_brand_id uuid NOT NULL,
  referred_brand_id uuid NOT NULL,
  referral_code varchar NOT NULL,
  bonus_months integer DEFAULT 1,
  bonus_credited boolean DEFAULT false,
  bonus_credited_at timestamptz,
  referrer_claimed boolean DEFAULT false,
  referred_claimed boolean DEFAULT false,
  referrer_claimed_at timestamptz,
  referred_claimed_at timestamptz,
  status varchar DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reward_credits integer NOT NULL DEFAULT 500,
  converted_at timestamptz,
  conversion_payment_reference varchar
);

-- subscription_payments
CREATE TABLE subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency varchar NOT NULL DEFAULT 'COP',
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_method varchar,
  status varchar NOT NULL DEFAULT 'completed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  months_paid integer NOT NULL DEFAULT 1 CHECK (months_paid >= 1 AND months_paid <= 24),
  reference text UNIQUE
);

-- trial_campaigns
CREATE TABLE trial_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  trial_days integer NOT NULL DEFAULT 7,
  ends_at timestamptz,
  require_card_verification boolean NOT NULL DEFAULT true,
  created_by text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  trial_generations_limit integer NOT NULL DEFAULT 50 CHECK (trial_generations_limit >= 1 AND trial_generations_limit <= 500),
  price_cop integer
);

-- trial_registrations
CREATE TABLE trial_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  ip_address text NOT NULL,
  fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE admin_notifications ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE admins ADD FOREIGN KEY (id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE blog_categories ADD FOREIGN KEY (id) REFERENCES blogs(category_id) ON DELETE SET NULL;
ALTER TABLE blogs ADD FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL;
ALTER TABLE blogs ADD FOREIGN KEY (author_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE blogs ADD FOREIGN KEY (topic_id) REFERENCES blog_topics(id) ON DELETE SET NULL;
ALTER TABLE brand_reviews ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE enterprise_sync_configs ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE generation_feedback ADD FOREIGN KEY (generation_id) REFERENCES generations(id) ON DELETE SET NULL;
ALTER TABLE generation_feedback ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE generations ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE generations ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE payment_logs ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE paypal_orders ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE plugin_telemetry_events ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE products ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE referrals ADD FOREIGN KEY (referrer_brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE referrals ADD FOREIGN KEY (referred_brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE subscription_payments ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE trial_registrations ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE trial_registrations ADD FOREIGN KEY (campaign_id) REFERENCES trial_campaigns(id) ON DELETE CASCADE;

-- ============================================
-- INDEXES (Key performance indexes)
-- ============================================

-- brands
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_email ON brands(email);
CREATE INDEX idx_brands_plan ON brands(plan);
CREATE INDEX idx_brands_subscription_status ON brands(subscription_status);
CREATE INDEX idx_brands_subscription_end_date ON brands(subscription_end_date) WHERE subscription_status = ANY (ARRAY['active', 'expiring_soon']);
CREATE INDEX idx_brands_landing_suspended_at ON brands(landing_suspended_at) WHERE landing_suspended_at IS NOT NULL;
CREATE INDEX idx_brands_google_id ON brands(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_brands_email_verification_token ON brands(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_brands_api_key_key ON brands(api_key);
CREATE INDEX idx_brands_referral_code_key ON brands(referral_code);
CREATE INDEX idx_brands_auth_provider ON brands(auth_provider);
CREATE INDEX idx_brands_status_end_date ON brands(subscription_status, subscription_end_date);
CREATE INDEX idx_brands_trial_payment_status ON brands(trial_payment_status) WHERE trial_payment_status IS NOT NULL;

-- products
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_brand_active ON products(brand_id, is_active);
CREATE INDEX idx_products_category ON products(category);

-- generations
CREATE INDEX idx_generations_brand_id ON generations(brand_id);
CREATE INDEX idx_generations_engine_used ON generations(engine_used);
CREATE INDEX idx_generations_generated_at ON generations(generated_at DESC);
CREATE INDEX idx_generations_product_id ON generations(product_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_brand_date ON generations(brand_id, generated_at DESC);
CREATE INDEX idx_generations_brand_status_date ON generations(brand_id, status, generated_at DESC);

-- subscription_payments
CREATE INDEX idx_subscription_payments_brand_id ON subscription_payments(brand_id);

-- payment_logs
CREATE INDEX idx_payment_logs_reference ON payment_logs(reference);
CREATE INDEX idx_payment_logs_brand_id ON payment_logs(brand_id);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at);
CREATE INDEX idx_payment_logs_gateway_status ON payment_logs(gateway, status);

-- pending_registrations
CREATE UNIQUE INDEX pending_registrations_reference_key ON pending_registrations(reference);

-- blog_topics
CREATE UNIQUE INDEX blog_topics_title_key ON blog_topics(title);

-- blogs
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_author_id ON blogs(author_id);
CREATE INDEX idx_blogs_category_id ON blogs(category_id);
CREATE INDEX idx_blogs_topic_id ON blogs(topic_id);

-- referrals
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- generation_feedback
CREATE INDEX idx_gf_resolved ON generation_feedback(resolved);

-- coupons
CREATE INDEX idx_coupons_active ON coupons(active) WHERE active = true;

-- promotions
CREATE INDEX idx_promotions_type ON promotions(type);
CREATE INDEX idx_promotions_ends_at ON promotions(ends_at);

-- plugin_telemetry_events
CREATE INDEX idx_plugin_telemetry_events_endpoint_created ON plugin_telemetry_events(endpoint, created_at);

-- brand_reviews
CREATE INDEX idx_brand_reviews_rating ON brand_reviews(rating);
CREATE INDEX idx_brand_reviews_is_featured ON brand_reviews(is_featured);

-- trial_registrations
CREATE INDEX idx_trial_registrations_brand_id ON trial_registrations(brand_id);
CREATE INDEX idx_trial_registrations_campaign_id ON trial_registrations(campaign_id);

-- ============================================
-- TRIGGERS (updated_at)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addon_packages_updated_at BEFORE UPDATE ON addon_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_settings_updated_at BEFORE UPDATE ON blog_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_topics_updated_at BEFORE UPDATE ON blog_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_reviews_updated_at BEFORE UPDATE ON brand_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enterprise_sync_configs_updated_at BEFORE UPDATE ON enterprise_sync_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generation_feedback_updated_at BEFORE UPDATE ON generation_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON generations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_settings_updated_at BEFORE UPDATE ON payment_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_payments_updated_at BEFORE UPDATE ON subscription_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trial_campaigns_updated_at BEFORE UPDATE ON trial_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE admin_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE paypal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- admin_notification_preferences
CREATE POLICY "service_role_all" ON admin_notification_preferences FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- admin_notifications
CREATE POLICY "service_role_delete_admin_notifications" ON admin_notifications FOR DELETE USING (auth.role() = 'service_role');
CREATE POLICY "service_role_insert_admin_notifications" ON admin_notifications FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_role_read_admin_notifications" ON admin_notifications FOR SELECT USING (auth.role() = 'service_role');

-- admins
CREATE POLICY "service_role_delete_admins" ON admins FOR DELETE USING (auth.role() = 'service_role');
CREATE POLICY "service_role_read_admins" ON admins FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "service_role_update_admins" ON admins FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_role_write_admins" ON admins FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- addon_packages
CREATE POLICY "addon_packages_service_role_all" ON addon_packages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- blog_categories
CREATE POLICY "Allow public read-only access to categories" ON blog_categories FOR SELECT USING (true);

-- blog_settings
CREATE POLICY "Solo service_role puede CRUD" ON blog_settings FOR ALL USING (auth.role() = 'service_role' OR true) WITH CHECK (auth.role() = 'service_role');

-- blog_topics
CREATE POLICY "Admins can do everything on blog_topics" ON blog_topics FOR ALL USING ((auth.jwt() ->> 'email') IN (SELECT admins.email FROM admins));
CREATE POLICY "Allow anon to select pending topics" ON blog_topics FOR SELECT USING (status = 'pending');
CREATE POLICY "Admins can update blog topics status" ON blog_topics FOR UPDATE USING ((auth.jwt() ->> 'email') IN (SELECT admins.email FROM admins)) WITH CHECK ((auth.jwt() ->> 'email') IN (SELECT admins.email FROM admins) AND status = ANY (ARRAY['pending', 'published', 'archived']));

-- blogs
CREATE POLICY "Allow public read access to published blogs" ON blogs FOR SELECT USING (status = 'published');

-- blog_draft_articles
-- Solo service_role puede acceder a drafts (proceso interno)
CREATE POLICY "blog_draft_articles_service_role_all" ON blog_draft_articles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- blog_topic_images
-- Solo service_role puede acceder (proceso interno de generación de imágenes)
CREATE POLICY "blog_topic_images_service_role_all" ON blog_topic_images FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- brand_reviews
CREATE POLICY "brand_reviews_service_role_all" ON brand_reviews FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- brands
CREATE POLICY "Brands can update own data" ON brands FOR UPDATE USING ((id)::text = ((current_setting('request.jwt.claims', true))::json ->> 'brandId'));
CREATE POLICY "Brands can view own data" ON brands FOR SELECT USING (true);
CREATE POLICY "Public brand data readable by anon" ON brands FOR SELECT USING (true);

-- coupons
CREATE POLICY "coupons_anon_read" ON coupons FOR SELECT USING (active = true) WITH CHECK (active = true);
CREATE POLICY "coupons_service_write" ON coupons FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- enterprise_sync_configs
CREATE POLICY "Service role only" ON enterprise_sync_configs FOR ALL USING (false) WITH CHECK (false);

-- generation_feedback
CREATE POLICY "service_role_full_access" ON generation_feedback FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- generations
CREATE POLICY "generations_own_brand" ON generations FOR SELECT USING ((brand_id)::text = ((current_setting('request.jwt.claims', true))::json ->> 'brandId'));
CREATE POLICY "generations_service_role" ON generations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- payment_logs
CREATE POLICY "Service role can insert payment_logs" ON payment_logs FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can read payment_logs" ON payment_logs FOR SELECT USING (auth.role() = 'service_role');

-- payment_settings
CREATE POLICY "service_role_read_payment_settings" ON payment_settings FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "service_role_update_payment_settings" ON payment_settings FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_role_write_payment_settings" ON payment_settings FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- paypal_orders
CREATE POLICY "paypal_orders_service_role_all" ON paypal_orders FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- pending_registrations
CREATE POLICY "pending_registrations_service_role_all" ON pending_registrations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- plugin_telemetry_events
CREATE POLICY "service_role_all_plugin_telemetry_events" ON plugin_telemetry_events FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- pricing_config
CREATE POLICY "pricing_config_public_read" ON pricing_config FOR SELECT USING (true);
CREATE POLICY "pricing_config_service_write" ON pricing_config FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- products
CREATE POLICY "Active products readable by anon" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Products manageable by brand" ON products FOR ALL USING ((brand_id)::text = ((current_setting('request.jwt.claims', true))::json ->> 'brandId')) WITH CHECK ((brand_id)::text = ((current_setting('request.jwt.claims', true))::json ->> 'brandId'));
CREATE POLICY "Products viewable by all" ON products FOR SELECT USING (true);

-- promotions
CREATE POLICY "promotions_anon_read" ON promotions FOR SELECT USING (active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "promotions_service_write" ON promotions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- referrals
CREATE POLICY "referrals_service_role_all" ON referrals FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- subscription_payments
CREATE POLICY "service_role_insert_payments" ON subscription_payments FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_role_select_payments" ON subscription_payments FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "service_role_update_payments" ON subscription_payments FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- trial_campaigns
CREATE POLICY "trial_campaigns_public_read" ON trial_campaigns FOR SELECT USING (true);
CREATE POLICY "trial_campaigns_service_write" ON trial_campaigns FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- trial_registrations
CREATE POLICY "trial_registrations_service_role" ON trial_registrations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- NOTES
-- ============================================
-- This schema reflects the current production database with 28 tables.
-- All tables have RLS enabled except where noted.
-- Service role policies are in place for all admin/sensitive tables.
-- Public read policies exist for: blog_categories, blog_settings, blogs (published only), brands (limited), coupons (active), pricing_config, promotions (active), trial_campaigns
-- Internal tables (service_role only): blog_draft_articles, blog_topic_images, blog_topics (write)

-- ============================================
-- NEW TABLES FOR DYNAMIC ATTRIBUTES (2026-04-13)
-- ============================================

-- category_attributes
-- Define qué atributos tiene cada categoría de producto
CREATE TABLE category_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL, -- clave única: 'vestido', 'rines', 'zapatos', 'camisa', etc.
  category_label text NOT NULL, -- label para mostrar: 'Vestido', 'Rines', etc.
  attributes jsonb NOT NULL DEFAULT '[]', -- array de definiciones de atributos
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_key)
);

-- ============================================
-- NEW COLUMNS FOR PRODUCTS TABLE (2026-04-13)
-- ============================================

-- short_description: descripción corta visible para clientes (max 500 chars)
ALTER TABLE products ADD COLUMN short_description varchar(500);

-- attributes: JSONB para atributos dinámicos por categoría
-- Ejemplo: {"tallas": ["S", "M", "L"], "color": "Rojo", "marca": "Nike", "tipo_tela": "Algodón"}
ALTER TABLE products ADD COLUMN attributes jsonb DEFAULT '{}'::jsonb;

-- ============================================
-- SEED: Default category attributes (2026-04-13)
-- ============================================

INSERT INTO category_attributes (category_key, category_label, attributes) VALUES
(
  'vestido',
  'Vestido',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "tipo_tela", "label": "Tipo de tela", "type": "text"}]'
),
(
  'rines',
  'Rines',
  '[{"key": "medida_pulgadas", "label": "Medida (pulgadas)", "type": "text"}, {"key": "finish", "label": "Finish", "type": "select", "options": ["Mate", "Cromo", "Diamond", "Brillante", "Negro"]}, {"key": "material", "label": "Material", "type": "select", "options": ["Aleación", "Acero"]}, {"key": "peso", "label": "Peso (kg)", "type": "number"}]'
),
(
  'zapatos',
  'Zapatos',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'camisa',
  'Camisa',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}, {"key": "manga", "label": "Tipo de manga", "type": "select", "options": ["Corta", "Larga", "Sin mangas"]}]'
),
(
  'tshirt',
  'Camiseta',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'hoodie',
  'Hoodie',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'jacket',
  'Chaqueta',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'pants',
  'Pantalones',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["26", "28", "30", "32", "34", "36", "38"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'accessories',
  'Accesorios',
  '[{"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'general',
  'General',
  '[{"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
);

-- ============================================
-- HOME TRYON TRIALS (IP-based limiting)
-- ============================================

CREATE TABLE home_tryon_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  product_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  CONSTRAINT fk_home_tryon_trials_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE INDEX idx_home_tryon_trials_ip ON home_tryon_trials(ip_address);
CREATE INDEX idx_home_tryon_trials_ip_created ON home_tryon_trials(ip_address, created_at);
