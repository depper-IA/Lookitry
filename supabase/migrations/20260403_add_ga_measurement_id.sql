-- Agregar columna ga_measurement_id a payment_settings
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT DEFAULT '';