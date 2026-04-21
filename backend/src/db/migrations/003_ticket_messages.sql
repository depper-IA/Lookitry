-- Migration: 003_ticket_messages
-- Date: 2026-04-21
-- Description: Tabla para mensajes de tickets y mejoras en funcionalidad de soporte

-- =============================================
-- TABLA: ticket_messages
-- Mensajes/conversaciones de tickets de soporte
-- =============================================
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES admin_support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'brand', 'system')),
  sender_id UUID, -- admin_id o brand_id dependiendo del sender_type
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_messages_created_at ON ticket_messages(created_at DESC);

-- RLS deshabilitado
ALTER TABLE ticket_messages DISABLE ROW LEVEL SECURITY;

-- =============================================
-- MEJORA: Campo resolved_at en admin_support_tickets
-- Ya existe en la migración 002, pero verificamos que esté
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_support_tickets' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE admin_support_tickets ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================
-- FUNCIÓN: Actualizar resolved_at cuando cambia status a resolved
-- =============================================
CREATE OR REPLACE FUNCTION auto_set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = COALESCE(NEW.resolved_at, NOW());
  END IF;
  IF NEW.status != 'resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_resolved_at ON admin_support_tickets;
CREATE TRIGGER trigger_auto_resolved_at
  BEFORE UPDATE ON admin_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_resolved_at();
