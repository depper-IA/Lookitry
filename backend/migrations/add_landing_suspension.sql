-- Migración: agregar campo landing_suspended_at a tabla brands
-- Se setea cuando la suscripción vence y la marca tiene has_landing_page = true
-- Se limpia cuando la marca renueva (si han pasado menos de 90 días)
-- A los 90 días se elimina definitivamente la mini-landing

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS landing_suspended_at TIMESTAMPTZ DEFAULT NULL;

-- Índice para acelerar las consultas del job diario
CREATE INDEX IF NOT EXISTS idx_brands_landing_suspended_at
  ON brands (landing_suspended_at)
  WHERE landing_suspended_at IS NOT NULL;

COMMENT ON COLUMN brands.landing_suspended_at IS
  'Fecha en que se suspendió la mini-landing por falta de pago. NULL = activa o nunca suspendida. Después de 90 días se elimina definitivamente (has_landing_page = false).';
