-- Migration: Create referrals table for early adopter program
-- Created: 2026-04-03
-- Purpose: Track referral bonuses for early adopters

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  referred_brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  bonus_months INTEGER DEFAULT 1,
  bonus_credited BOOLEAN DEFAULT false,
  bonus_credited_at TIMESTAMPTZ,
  referrer_claimed BOOLEAN DEFAULT false,
  referred_claimed BOOLEAN DEFAULT false,
  referrer_claimed_at TIMESTAMPTZ,
  referred_claimed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to prevent duplicate referrals
CREATE UNIQUE INDEX idx_referrals_unique ON referrals(referrer_brand_id, referred_brand_id);

-- Index for looking up by referral code
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- Index for referrer lookup
CREATE INDEX idx_referrals_referrer ON referrals(referrer_brand_id);

-- Add referral_code to brands table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brands' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE brands ADD COLUMN referral_code VARCHAR(50) UNIQUE;
  END IF;
END $$;

-- Add referral_count to brands for tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brands' AND column_name = 'referral_count'
  ) THEN
    ALTER TABLE brands ADD COLUMN referral_count INTEGER DEFAULT 0;
  END IF;
END $$;