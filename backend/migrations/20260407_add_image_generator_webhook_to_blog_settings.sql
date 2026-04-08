-- Add image_generator_webhook field to blog_settings for split architecture
ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS image_generator_webhook TEXT DEFAULT NULL;
