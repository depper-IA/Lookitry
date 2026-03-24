-- Migración: agregar campos del modal promocional global a payment_settings
-- Ejecutar en Supabase SQL Editor

ALTER TABLE payment_settings
  ADD COLUMN IF NOT EXISTS modal_promo_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS modal_title       TEXT,
  ADD COLUMN IF NOT EXISTS modal_description TEXT,
  ADD COLUMN IF NOT EXISTS modal_image_url   TEXT,
  ADD COLUMN IF NOT EXISTS mini_landing_preview_seconds INT DEFAULT 15;

-- Poblar valores iniciales si es necesario
UPDATE payment_settings
SET 
  modal_title = '¡Oferta Especial!',
  modal_description = 'Obtén un descuento exclusivo registrándote hoy.',
  mini_landing_preview_seconds = 15
WHERE modal_title IS NULL;
