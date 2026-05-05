-- Migration: Add WhatsApp chat columns to leads table
-- Date: 2026-05-04
-- Purpose: Support the Lookitry WhatsApp chatbot flow (n8n)

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS bot_status          TEXT DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS lead_category       TEXT DEFAULT 'NUEVO_LEAD',
  ADD COLUMN IF NOT EXISTS last_message        TEXT,
  ADD COLUMN IF NOT EXISTS last_message_sent   TEXT,
  ADD COLUMN IF NOT EXISTS conversation        TEXT,
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qa_notes            TEXT;

COMMENT ON COLUMN leads.bot_status          IS 'Estado del bot: activo | inactivo';
COMMENT ON COLUMN leads.lead_category       IS 'Etiqueta del clasificador: NUEVO_LEAD, EN_PROCESO, DATOS_COMPLETOS, DEMO_AGENDADA, NO_INTERESADO, DESCONOCIDO';
COMMENT ON COLUMN leads.last_message        IS 'Último mensaje recibido del lead (WhatsApp)';
COMMENT ON COLUMN leads.last_message_sent   IS 'Último mensaje enviado por el agente IA';
COMMENT ON COLUMN leads.conversation        IS 'Historial completo de la conversación WhatsApp';
COMMENT ON COLUMN leads.last_interaction_at IS 'Timestamp de la última interacción vía WhatsApp';
COMMENT ON COLUMN leads.qa_notes            IS 'Preguntas extraídas por el Q&A Classifier de n8n';
