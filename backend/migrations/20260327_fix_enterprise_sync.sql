ALTER TABLE enterprise_sync_configs
  ADD COLUMN IF NOT EXISTS field_map jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_sync_message text,
  ADD COLUMN IF NOT EXISTS products_synced_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION increment_sync_count(p_brand_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE enterprise_sync_configs
  SET
    products_synced_count = COALESCE(products_synced_count, 0) + 1,
    updated_at = now()
  WHERE brand_id = p_brand_id;
END;
$$;
