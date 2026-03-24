-- Migración: Añadir api_key a brands y external_id a products
-- Propósito: Soporte para integración con plugins externos (WooCommerce) y API Keys.

-- 1. Añadir api_key a brands
-- Usamos uuid_generate_v4() para que cada marca tenga un token único de inmediato.
ALTER TABLE brands ADD COLUMN IF NOT EXISTS api_key UUID DEFAULT gen_random_uuid();

-- 2. Asegurarnos de que el api_key sea único
CREATE UNIQUE INDEX IF NOT EXISTS brands_api_key_idx ON brands (api_key);

-- 3. Añadir external_id a products
-- Lo ponemos como TEXT para ser flexible con IDs de diferentes plataformas (WP suele usar Integer, pero otros usan UUID).
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 4. Índice para búsquedas rápidas por ID externo
CREATE INDEX IF NOT EXISTS products_external_id_idx ON products (brand_id, external_id);

-- COMENTARIOS DE SEGURIDAD:
-- El api_key NUNCA debe ser expuesto en el frontend público de Lookitry.
-- Solo debe ser visible para el dueño de la marca en el Dashboard (Ajustes de Desarrollador).
