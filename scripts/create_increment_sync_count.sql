CREATE OR REPLACE FUNCTION public.increment_sync_count(p_brand_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE brands
  SET sync_products_count = COALESCE(sync_products_count, 0) + 1
  WHERE id = p_brand_id;
END;
$$;