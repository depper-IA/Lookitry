-- Migración: Sistema de promociones y cupones
-- Fecha: 2026-03-18

-- ── Tabla promotions ──────────────────────────────────────────────────────────

CREATE TYPE promotion_type AS ENUM (
  'modal_timer',
  'coupon',
  'banner',
  'plan_override',
  'launch_offer'
);

CREATE TABLE IF NOT EXISTS promotions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        promotion_type NOT NULL,
  name        TEXT NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}',
  active      BOOLEAN NOT NULL DEFAULT false,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promotions_type    ON promotions(type);
CREATE INDEX idx_promotions_active  ON promotions(active);
CREATE INDEX idx_promotions_ends_at ON promotions(ends_at);

-- RLS: solo service_role puede escribir; anon/authenticated puede leer activas
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_service_write" ON promotions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "promotions_anon_read" ON promotions
  FOR SELECT TO anon, authenticated
  USING (
    active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >= now())
  );

-- ── Tabla coupons ─────────────────────────────────────────────────────────────

CREATE TYPE discount_type AS ENUM ('pct', 'fixed');

CREATE TABLE IF NOT EXISTS coupons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  discount_type  discount_type NOT NULL DEFAULT 'pct',
  discount_value NUMERIC(10,2) NOT NULL,
  max_uses       INTEGER,
  uses_count     INTEGER NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  plan_ids       TEXT[] NOT NULL DEFAULT '{}',
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupons_code   ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_service_write" ON coupons
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- anon/authenticated puede leer cupones activos (para validar en checkout)
CREATE POLICY "coupons_anon_read" ON coupons
  FOR SELECT TO anon, authenticated
  USING (active = true);
