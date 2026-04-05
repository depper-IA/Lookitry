-- Migration: Create leads tables for CRM and lead generation
-- Created: 2026-04-05
-- Purpose: Store leads from Google Places, manage searches and track outreach

-- ── Lead Search Configurations ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  keywords TEXT[] NOT NULL,
  business_types TEXT[] DEFAULT '{}',
  search_radius_km INTEGER DEFAULT 10,
  max_results INTEGER DEFAULT 50,
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_cron VARCHAR(50),
  last_run_at TIMESTAMPTZ,
  last_results_count INTEGER DEFAULT 0,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_searches_country ON lead_searches(country);
CREATE INDEX idx_lead_searches_schedule ON lead_searches(schedule_enabled) WHERE schedule_enabled = true;

-- ── Leads ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business info
  name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  description TEXT,
  
  -- Contact info
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(500),
  instagram VARCHAR(255),
  tiktok VARCHAR(255),
  
  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  -- Source
  source VARCHAR(50) DEFAULT 'google_places',
  source_id VARCHAR(255),
  search_id UUID REFERENCES lead_searches(id) ON DELETE SET NULL,
  
  -- Status (funnel)
  status VARCHAR(30) DEFAULT 'new' CHECK (status IN (
    'new',           -- recién encontrado
    'qualified',     -- verificado y cualificado
    'contacted',     -- primer contacto hecho
    'interested',    -- mostró interés
    'not_interested',-- rechazó
    'client'         -- se volvió cliente
  )),
  
  -- Meta
  notes TEXT,
  internal_notes TEXT,
  assigned_to VARCHAR(255),
  
  -- Outreach tracking
  email_sent_at TIMESTAMPTZ,
  email_campaign_id UUID,
  dm_sent_at TIMESTAMPTZ,
  dm_platform VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_country ON leads(country);
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_search_id ON leads(search_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- ── Outreach Log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  outreach_type VARCHAR(30) NOT NULL CHECK (outreach_type IN (
    'email',      -- email enviado
    'dm_instagram', -- DM por Instagram
    'dm_tiktok',  -- DM por TikTok
    'phone',      -- llamada
    'visit',      -- visita física
    'note'        -- nota internal
  )),
  details JSONB DEFAULT '{}',
  notes TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outreach_lead ON lead_outreach_log(lead_id);
CREATE INDEX idx_outreach_type ON lead_outreach_log(outreach_type);
CREATE INDEX idx_outreach_created ON lead_outreach_log(created_at DESC);

-- ── Social API Configuration ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(30) NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook')),
  
  -- Config (encrypted at rest - API keys, tokens)
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  last_test_at TIMESTAMPTZ,
  last_test_result JSONB,
  
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_social_config_platform ON social_api_configs(platform);

-- ── Google Places Quota Tracking ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS google_places_quota (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  daily_used INTEGER DEFAULT 0,
  monthly_used INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_month_reset DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
);

INSERT INTO google_places_quota (id) VALUES (1) ON CONFLICT DO NOTHING;
