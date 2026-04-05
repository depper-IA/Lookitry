-- Migration: Create email campaigns tables for Brevo marketing
-- Created: 2026-04-05
-- Purpose: Store email marketing campaigns and track recipient delivery status

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_template TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'processing', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  filter_type VARCHAR(20) DEFAULT 'all' CHECK (filter_type IN ('all', 'trial', 'paid', 'plan')),
  filter_plan VARCHAR(50),
  filter_created_after TIMESTAMPTZ,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'opened', 'clicked')),
  message_id VARCHAR(255),
  sent_at TIMESTAMPTZ,
  error TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email_campaigns
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Indexes for email_campaign_recipients
CREATE INDEX idx_email_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX idx_email_recipients_status ON email_campaign_recipients(status);
CREATE INDEX idx_email_recipients_brand ON email_campaign_recipients(brand_id);
CREATE UNIQUE INDEX idx_email_recipients_unique ON email_campaign_recipients(campaign_id, brand_id);
