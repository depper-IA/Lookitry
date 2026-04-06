-- Migration: Lead Enrichment Fields
-- Date: 2026-04-06
-- Purpose: Add fields for tracking lead enrichment and fashion classification

-- Add enrichment tracking columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_fashion_relevant BOOLEAN DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_source VARCHAR(50) DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_type_confirmed VARCHAR(255) DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website_content TEXT DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_score INTEGER DEFAULT 0;

-- Add index for faster queries on enrichment status
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_status ON leads(is_fashion_relevant) WHERE is_fashion_relevant IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_source ON leads(enrichment_source) WHERE enrichment_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source_id ON leads(source_id) WHERE source_id IS NOT NULL;

-- Add check constraint for valid enrichment sources
ALTER TABLE leads DROP CONSTRAINT IF EXISTS valid_enrichment_source;
ALTER TABLE leads ADD CONSTRAINT valid_enrichment_source 
  CHECK (enrichment_source IS NULL OR enrichment_source IN (
    'keyword_classification',
    'web_verification', 
    'ai_classification',
    'manual',
    'pending_verification'
  ));

-- Add check constraint for valid enrichment scores
ALTER TABLE leads DROP CONSTRAINT IF EXISTS valid_enrichment_score;
ALTER TABLE leads ADD CONSTRAINT valid_enrichment_score 
  CHECK (enrichment_score >= 0 AND enrichment_score <= 100);

-- Add comments for documentation
COMMENT ON COLUMN leads.is_fashion_relevant IS 'NULL = not classified, TRUE = fashion relevant, FALSE = not fashion';
COMMENT ON COLUMN leads.enrichment_source IS 'How the lead was enriched: keyword_classification, web_verification, ai_classification, manual';
COMMENT ON COLUMN leads.website_verified IS 'Whether the website was scraped and verified';
COMMENT ON COLUMN leads.business_type_confirmed IS 'Confirmed business type after enrichment';
COMMENT ON COLUMN leads.last_enriched_at IS 'Timestamp of last enrichment update';
COMMENT ON COLUMN leads.website_content IS 'Keywords found during website scraping';
COMMENT ON COLUMN leads.enrichment_score IS 'Score 0-100 indicating enrichment quality';

-- Migration rollback (if needed)
-- ALTER TABLE leads DROP COLUMN IF EXISTS is_fashion_relevant;
-- ALTER TABLE leads DROP COLUMN IF EXISTS enrichment_source;
-- ALTER TABLE leads DROP COLUMN IF EXISTS website_verified;
-- ALTER TABLE leads DROP COLUMN IF EXISTS business_type_confirmed;
-- ALTER TABLE leads DROP COLUMN IF EXISTS last_enriched_at;
-- ALTER TABLE leads DROP COLUMN IF EXISTS website_content;
-- ALTER TABLE leads DROP COLUMN IF EXISTS enrichment_score;
