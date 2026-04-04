-- Migration: Add internal notes to brands
-- Created: 2026-04-04
-- Purpose: Allow admins to add internal notes to brands for communication

ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS internal_notes_updated_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS internal_notes_updated_by UUID DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN brands.internal_notes IS 'Notas internas del equipo administrativo (no visible para el cliente)';
COMMENT ON COLUMN brands.internal_notes_updated_at IS 'Última fecha de actualización de notas internas';
COMMENT ON COLUMN brands.internal_notes_updated_by IS 'Admin que actualizó las notas';
