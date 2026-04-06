-- Migration: 002_admin_generations_log_and_support_tickets
-- Date: 2026-04-06
-- Description: Tablas para historial de Try-Ons y módulo de Tickets/Soporte

-- =============================================
-- TABLA 1: admin_generations_log
-- Historial completo de generaciones para admin
-- =============================================
CREATE TABLE admin_generations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  product_id UUID,
  customer_id UUID,
  selfie_url TEXT,
  result_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  model_used TEXT, -- 'openrouter' o 'replicate'
  processing_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  original_generation_id UUID, -- si es retry, referencia la original
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Índices para queries eficientes
CREATE INDEX idx_generations_log_brand_id ON admin_generations_log(brand_id);
CREATE INDEX idx_generations_log_status ON admin_generations_log(status);
CREATE INDEX idx_generations_log_created_at ON admin_generations_log(created_at DESC);
CREATE INDEX idx_generations_log_original_id ON admin_generations_log(original_generation_id) WHERE original_generation_id IS NOT NULL;

-- =============================================
-- TABLA 2: admin_support_tickets
-- Sistema de tickets/soporte para admins
-- =============================================
CREATE TABLE admin_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  admin_id UUID REFERENCES admins(id), -- quien lo creó
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT, -- 'technical', 'billing', 'feature_request', 'other'
  assigned_to UUID REFERENCES admins(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Índices para queries eficientes
CREATE INDEX idx_tickets_brand_id ON admin_support_tickets(brand_id);
CREATE INDEX idx_tickets_status ON admin_support_tickets(status);
CREATE INDEX idx_tickets_priority ON admin_support_tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON admin_support_tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON admin_support_tickets(created_at DESC);

-- RLS: deshabilitado (solo acceso desde service role via supabaseAdmin)
ALTER TABLE admin_generations_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_support_tickets DISABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCIÓN: Actualizar updated_at en tickets
-- =============================================
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ticket_updated_at
  BEFORE UPDATE ON admin_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();
