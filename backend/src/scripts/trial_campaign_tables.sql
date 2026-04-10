-- ── Campañas de trial ────────────────────────────────────────────────────────
-- Una campaña activa habilita el período de prueba gratuito en el registro.
-- Sin campaña activa, el registro crea la cuenta sin trial.

CREATE TABLE IF NOT EXISTS trial_campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT false,
  trial_days  INTEGER NOT NULL DEFAULT 7,
  ends_at     TIMESTAMPTZ,           -- NULL = sin fecha límite
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Registros de trial (anti-abuso) ──────────────────────────────────────────
-- Guarda IP + fingerprint de cada registro que recibió trial.
-- Se consulta para bloquear múltiples trials desde el mismo dispositivo/red.

CREATE TABLE IF NOT EXISTS trial_registrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id     UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id  UUID NOT NULL REFERENCES trial_campaigns(id) ON DELETE CASCADE,
  ip_address   TEXT NOT NULL,
  fingerprint  TEXT,                 -- hash del dispositivo (opcional)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_registrations_ip        ON trial_registrations(ip_address);
CREATE INDEX IF NOT EXISTS idx_trial_registrations_fp        ON trial_registrations(fingerprint);
CREATE INDEX IF NOT EXISTS idx_trial_registrations_created   ON trial_registrations(created_at);
