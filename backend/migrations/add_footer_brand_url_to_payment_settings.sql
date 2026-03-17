-- Migración: agregar columna footer_brand_url a payment_settings
-- Esta URL se muestra en el footer de todas las mini-landings

ALTER TABLE payment_settings
  ADD COLUMN IF NOT EXISTS footer_brand_url TEXT NOT NULL DEFAULT 'https://pruebalo.wilkiedevs.com';

-- Actualizar la fila existente si ya existe
UPDATE payment_settings
SET footer_brand_url = 'https://pruebalo.wilkiedevs.com'
WHERE footer_brand_url IS NULL OR footer_brand_url = '';
