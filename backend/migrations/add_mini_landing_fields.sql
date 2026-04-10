-- Migración: campos de mini-landing por cliente
-- Task 33.2

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS brand_description TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_contact   TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url    TEXT,
  ADD COLUMN IF NOT EXISTS social_links       JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_landing_page   BOOLEAN DEFAULT false;
