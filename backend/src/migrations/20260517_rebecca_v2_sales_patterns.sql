-- Migration: Rebecca 2.0 Sales Patterns
-- Created: 2026-05-17
-- Status: Phase 1 - Sales patterns table and views

-- Tabla principal de patrones de venta
CREATE TABLE IF NOT EXISTS sales_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_phrase text NOT NULL,
  rebecca_response text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('converted', 'abandoned', 'escalated')),
  lead_session_id text,
  lead_email text,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  plan_purchased text,
  revenue_cents integer,
  intent_detected text,
  created_at timestamptz DEFAULT now(),
  analyzed_at timestamptz
);

-- Índices para optimize queries
CREATE INDEX IF NOT EXISTS idx_sales_patterns_trigger ON sales_patterns(trigger_phrase);
CREATE INDEX IF NOT EXISTS idx_sales_patterns_outcome ON sales_patterns(outcome);
CREATE INDEX IF NOT EXISTS idx_sales_patterns_created ON sales_patterns(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_patterns_analyzed ON sales_patterns(analyzed_at) WHERE analyzed_at IS NULL;

-- View para patrones exitosos (conversiones)
CREATE OR REPLACE VIEW successful_sales_patterns AS
SELECT
  trigger_phrase,
  rebecca_response,
  COUNT(*) as total_conversions,
  AVG(revenue_cents) as avg_revenue,
  STRING_AGG(DISTINCT plan_purchased, ', ') as plans_sold
FROM sales_patterns
WHERE outcome = 'converted' AND analyzed_at IS NULL
GROUP BY trigger_phrase, rebecca_response
HAVING COUNT(*) >= 3;

-- Índices adicionales en tablas existentes para performance

-- Índice para buscar conversaciones recientes en lead_messages
CREATE INDEX IF NOT EXISTS idx_lead_messages_recent
ON lead_messages(created_at DESC)
WHERE created_at > now() - interval '30 days';

-- Índice para categoría ventas_exitosas en lookitry_knowledge
CREATE INDEX IF NOT EXISTS idx_lookitry_knowledge_category
ON lookitry_knowledge(category)
WHERE is_active = true;