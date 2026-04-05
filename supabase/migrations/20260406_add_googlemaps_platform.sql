-- Migration: add_googlemaps_to_social_api_configs
-- Add 'googlemaps' as a supported platform in social_api_configs

ALTER TABLE social_api_configs
DROP CONSTRAINT IF EXISTS social_api_configs_platform_check;

ALTER TABLE social_api_configs
ADD CONSTRAINT social_api_configs_platform_check
CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'googlemaps'));

-- Add api_key field specifically for Google Maps (convenience)
ALTER TABLE social_api_configs
ADD COLUMN IF NOT EXISTS api_key TEXT;

COMMENT ON COLUMN social_api_configs.api_key IS 'API Key específica para Google Maps';
