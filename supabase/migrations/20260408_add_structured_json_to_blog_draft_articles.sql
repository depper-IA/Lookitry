-- Migration: add_structured_json_columns_to_blog_draft_articles
-- Date: 2026-04-08
-- Purpose: Agregar columnas para recibir JSON estructurado desde n8n

ALTER TABLE blog_draft_articles 
ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cta_context jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS image_prompts jsonb DEFAULT '[]'::jsonb;

-- Add index for topic_id lookups (already primary, but let's ensure performance)
CREATE INDEX IF NOT EXISTS idx_blog_draft_articles_topic_id ON blog_draft_articles(topic_id);

COMMENT ON COLUMN blog_draft_articles.sections IS 'Array of section objects with id, title, paragraphs, callout, image_position';
COMMENT ON COLUMN blog_draft_articles.faq is 'Array of FAQ objects with question and answer';
COMMENT ON COLUMN blog_draft_articles.cta_context IS 'Object with type (trial/features/pricing/lead_magnet) for final CTA';
COMMENT ON COLUMN blog_draft_articles.image_prompts IS 'Array of image prompts with position and after_section references';