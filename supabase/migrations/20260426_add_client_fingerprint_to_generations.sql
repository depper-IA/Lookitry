-- Migration: Add client_fingerprint to generations for per-client attempt limiting
-- Purpose: Track which client (browser/device) made each generation attempt
-- Date: 2026-04-26

-- Add client_fingerprint column to track client identity
ALTER TABLE generations ADD COLUMN client_fingerprint TEXT;

-- Create index for efficient lookups when checking client attempts
CREATE INDEX idx_generations_client_fingerprint ON generations(client_fingerprint);

-- Create composite index for the main query pattern:
-- "count attempts for this brand + product + client in last month"
CREATE INDEX idx_generations_brand_product_client ON generations(brand_id, product_id, client_fingerprint);

-- Add comment for documentation
COMMENT ON COLUMN generations.client_fingerprint IS 'FingerprintJS visitor ID to identify the end client making the try-on request';

-- Create RPC function to check client attempts for a specific product
-- Returns the count of SUCCESS generations for this client + product in the last 30 days
CREATE OR REPLACE FUNCTION check_client_product_attempts(
  p_brand_id UUID,
  p_product_id UUID,
  p_client_fingerprint TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_30_days_ago TIMESTAMPTZ;
BEGIN
  v_30_days_ago := NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_count
  FROM generations
  WHERE brand_id = p_brand_id
    AND product_id = p_product_id
    AND client_fingerprint = p_client_fingerprint
    AND status = 'SUCCESS'
    AND generated_at >= v_30_days_ago;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION check_client_product_attempts(UUID, UUID, TEXT) TO service_role;