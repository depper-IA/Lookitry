-- Migration: Add landing_steps and header_color to brands table
-- Date: 2026-04-12
-- Purpose: Support dynamic landing step labels in mini-landing templates

ALTER TABLE brands ADD COLUMN IF NOT EXISTS landing_steps jsonb DEFAULT jsonb_build_object(
  'select_label', 'Selecciona un estilo',
  'select_desc', 'Elige el look que más te guste',
  'photo_label', 'Sube tu foto',
  'photo_desc', 'Una foto clara funciona mejor',
  'result_label', '¡Tu resultado!',
  'result_desc', 'Así te verías con esta prenda'
);

ALTER TABLE brands ADD COLUMN IF NOT EXISTS header_color text DEFAULT '#ffffff';

-- Add comment for documentation
COMMENT ON COLUMN brands.landing_steps IS 'JSON containing step labels: select_label, select_desc, photo_label, photo_desc, result_label, result_desc';
COMMENT ON COLUMN brands.header_color IS 'Header background color for mini-landing templates';
