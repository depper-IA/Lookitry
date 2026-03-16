-- Migración: agregar campo trial_payment_status a la tabla brands
-- Ejecutar en Supabase SQL Editor

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS trial_payment_status TEXT DEFAULT NULL;
-- Valores posibles: NULL (sin trial), 'pending_payment', 'active', 'expired'

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_brands_trial_payment_status
  ON brands (trial_payment_status)
  WHERE trial_payment_status IS NOT NULL;
