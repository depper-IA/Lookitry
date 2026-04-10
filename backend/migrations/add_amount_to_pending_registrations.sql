-- Agregar campo amount a pending_registrations
-- Guarda el monto de la compra para registro en el panel admin post-pago
ALTER TABLE pending_registrations
  ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0;
