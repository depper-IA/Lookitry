-- Agregar campo includes_landing a pending_registrations
-- Indica si la compra incluye activación de mini-landing (pago único)
ALTER TABLE pending_registrations
  ADD COLUMN IF NOT EXISTS includes_landing boolean NOT NULL DEFAULT false;
