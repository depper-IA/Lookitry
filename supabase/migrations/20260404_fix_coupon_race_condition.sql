-- Migration: Atomic coupon increment RPC
-- Purpose: Fix race condition (TOCTOU) in coupon redemption
-- Date: 2026-04-04

-- Create function that atomically increments uses_count only if max_uses not reached
CREATE OR REPLACE FUNCTION increment_coupon_uses(coupon_id_input UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE coupons 
  SET uses_count = uses_count + 1 
  WHERE id = coupon_id_input 
    AND (max_uses IS NULL OR uses_count < max_uses)
  RETURNING uses_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION increment_coupon_uses(UUID) TO service_role;
