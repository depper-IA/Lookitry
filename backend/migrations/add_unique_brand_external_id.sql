-- Hardening WooCommerce sync
-- Garantiza que el upsert por (brand_id, external_id) funcione de forma segura.

CREATE UNIQUE INDEX IF NOT EXISTS products_brand_external_id_unique_idx
ON products (brand_id, external_id)
WHERE external_id IS NOT NULL;
