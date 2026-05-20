-- Migration: Add generation_consents table for legal audit trail
-- Purpose: Track terms & conditions acceptance per generation for compliance/legal defense

CREATE TABLE IF NOT EXISTS generation_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  terms_accepted BOOLEAN NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_ip VARCHAR(45),
  user_agent TEXT,
  terms_version VARCHAR(50) DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for lookups by generation_id
CREATE INDEX IF NOT EXISTS idx_generation_consents_generation_id
  ON generation_consents(generation_id);

-- Index for audit queries by accepted_at
CREATE INDEX IF NOT EXISTS idx_generation_consents_accepted_at
  ON generation_consents(accepted_at DESC);

-- Constraint: Only one consent record per generation
CREATE UNIQUE INDEX IF NOT EXISTS uq_generation_consents_generation_id
  ON generation_consents(generation_id);
