-- Add share_message column to brands for PRO/ENTERPRISE custom share text
ALTER TABLE brands ADD COLUMN IF NOT EXISTS share_message TEXT DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN brands.share_message IS 'Custom share message for social media (PRO/ENTERPRISE). Supports {producto} and {marca} as variables.';