-- Migración: agregar footer_brand_url a la tabla payment_settings
-- Esta columna almacena la URL que aparece en el footer de todas las mini-landings.
-- Valor por defecto: https://lookitry.com

ALTER TABLE payment_settings
  ADD COLUMN IF NOT EXISTS footer_brand_url TEXT NOT NULL DEFAULT 'https://lookitry.com';

-- Actualizar la fila existente (singleton id=1) si ya existe
UPDATE payment_settings
  SET footer_brand_url = 'https://lookitry.com'
  WHERE id = 1 AND (footer_brand_url IS NULL OR footer_brand_url = '');
