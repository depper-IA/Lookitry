-- Migración: crear tabla trial_campaigns y trial_registrations
-- Ejecutar en Supabase SQL Editor

-- ── Tabla trial_campaigns ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trial_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  trial_days INTEGER NOT NULL DEFAULT 7,
  ends_at TIMESTAMPTZ DEFAULT NULL,
  require_card_verification BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para búsqueda de campaña activa
CREATE INDEX IF NOT EXISTS idx_trial_campaigns_active
  ON trial_campaigns (active, ends_at)
  WHERE active = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_trial_campaigns_updated_at ON trial_campaigns;
CREATE TRIGGER update_trial_campaigns_updated_at
  BEFORE UPDATE ON trial_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Tabla trial_registrations ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trial_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES trial_campaigns(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  fingerprint TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trial_registrations_ip
  ON trial_registrations (ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trial_registrations_fingerprint
  ON trial_registrations (fingerprint, created_at DESC)
  WHERE fingerprint IS NOT NULL;

-- ── Campos adicionales en brands ─────────────────────────────────────────────
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_generations_limit INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_payment_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT DEFAULT NULL;

-- Marcar usuarios existentes como verificados para no romper accesos actuales
UPDATE brands SET email_verified = true WHERE email_verified = false;

-- Índices
CREATE INDEX IF NOT EXISTS idx_brands_email_verification_token
  ON brands (email_verification_token)
  WHERE email_verification_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_brands_trial_payment_status
  ON brands (trial_payment_status)
  WHERE trial_payment_status IS NOT NULL;

-- RLS para nuevas tablas
ALTER TABLE trial_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "trial_campaigns_all" ON trial_campaigns FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "trial_registrations_all" ON trial_registrations FOR ALL USING (true);
