-- Migration: Add facebook_url and tiktok columns to leads table
-- Created: 2026-04-22
-- Purpose: Add missing social media fields for marketing outreach

ALTER TABLE leads ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tiktok VARCHAR(255);

-- Add indexes for social fields
CREATE INDEX IF NOT EXISTS idx_leads_facebook_url ON leads(facebook_url);
CREATE INDEX IF NOT EXISTS idx_leads_tiktok ON leads(tiktok);

-- Add unique constraint on email for better deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_unique ON leads(email) WHERE email IS NOT NULL;