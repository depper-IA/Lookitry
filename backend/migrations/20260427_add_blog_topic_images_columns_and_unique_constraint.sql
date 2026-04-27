-- Migration: 20260427_add_blog_topic_images_columns_and_unique_constraint.sql
-- Description: Adds body3/body4 image URLs and unique constraint to blog_topic_images

-- Add missing columns for body3 and body4 images
ALTER TABLE blog_topic_images ADD COLUMN IF NOT EXISTS imagen_body3_url text;
ALTER TABLE blog_topic_images ADD COLUMN IF NOT EXISTS imagen_body4_url text;

-- Add unique constraint on topic_id to prevent duplicates
-- This ensures only one row per topic in blog_topic_images
ALTER TABLE blog_topic_images ADD CONSTRAINT blog_topic_images_topic_id_unique UNIQUE (topic_id);

-- Add index for topic_id lookups
CREATE INDEX IF NOT EXISTS idx_blog_topic_images_topic_id ON blog_topic_images(topic_id);