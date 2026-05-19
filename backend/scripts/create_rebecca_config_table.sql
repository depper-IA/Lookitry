-- Migration: create rebecca_config table
-- Purpose: Admin-configurable settings for Rebecca AI agent (model, tokens, prompts, rate limits)
-- Run with: psql $SUPABASE_DB_URL -f backend/scripts/create_rebecca_config_table.sql

BEGIN;

CREATE TABLE IF NOT EXISTS rebecca_config (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key   varchar(255) UNIQUE NOT NULL,
  config_value text        NOT NULL,
  description  varchar(500),
  updated_at    timestamp   DEFAULT now(),
  updated_by   varchar(255)
);

CREATE INDEX IF NOT EXISTS idx_rebecca_config_key ON rebecca_config(config_key);

INSERT INTO rebecca_config (config_key, config_value, description, updated_by) VALUES
  ('model',              'gemini-2.5-flash', 'Modelo de IA para Rebecca',          'system'),
  ('max_output_tokens',  '600',              'Máximo de tokens en respuesta',     'system'),
  ('temperature',       '0.7',              'Temperatura de creatividad (0-1)',  'system'),
  ('is_enabled',        'true',             'Si Rebecca está activa o no',        'system'),
  ('rate_limit_max',    '20',              'Máximo requests por ventana',       'system'),
  ('rate_limit_window_ms', '3600000',       'Ventana de rate limit en ms (1h)',   'system'),
  ('web_instructions',  'Respuestas completas pero concisas. Máximo 3 párrafos.', 'Channel-specific instructions for web widget', 'system'),
  ('whatsapp_instructions', 'Máximo 200 caracteres por mensaje. Si necesitás más, dividí en varios mensajes cortos.', 'Channel-specific instructions for WhatsApp', 'system'),
  ('system_prompt_extra', '', 'Additional instructions appended to the base system prompt', 'system'),
  ('max_history', '10', 'Max conversation history messages to send', 'system')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at   = now(),
  updated_by   = EXCLUDED.updated_by,
  description  = COALESCE(EXCLUDED.description, rebecca_config.description);

COMMIT;