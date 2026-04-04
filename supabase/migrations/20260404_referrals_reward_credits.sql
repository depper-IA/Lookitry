-- Migration: Switch referral rewards from bonus months to extra credits
-- Created: 2026-04-04

ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS reward_credits INTEGER NOT NULL DEFAULT 500,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS conversion_payment_reference VARCHAR(255);

UPDATE referrals
SET reward_credits = 500
WHERE reward_credits IS NULL OR reward_credits <= 0;

CREATE INDEX IF NOT EXISTS idx_referrals_referred_status
ON referrals(referred_brand_id, status);
