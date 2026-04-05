-- Migration: Create payment_logs table for webhook debugging
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  gateway TEXT NOT NULL CHECK (gateway IN ('wompi', 'paypal', 'manual')),
  reference TEXT,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  transaction_id TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'COP',
  status TEXT NOT NULL,
  payload JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  ip_address TEXT
);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_payment_logs_reference ON payment_logs(reference);
CREATE INDEX IF NOT EXISTS idx_payment_logs_brand_id ON payment_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_gateway_status ON payment_logs(gateway, status);

-- Enable RLS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert (for webhooks)
DROP POLICY IF EXISTS "Service role can insert payment_logs" ON payment_logs;
CREATE POLICY "Service role can insert payment_logs"
  ON payment_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to read all
DROP POLICY IF EXISTS "Service role can read payment_logs" ON payment_logs;
CREATE POLICY "Service role can read payment_logs"
  ON payment_logs FOR SELECT
  TO service_role
  USING (true);

COMMENT ON TABLE payment_logs IS 'Log de todos los eventos de pago para debugging y auditoría';