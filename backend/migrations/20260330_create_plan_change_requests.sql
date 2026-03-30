CREATE TABLE IF NOT EXISTS plan_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('wompi', 'paypal', 'free_upgrade')),
  from_plan TEXT,
  to_plan TEXT NOT NULL,
  months INTEGER NOT NULL CHECK (months >= 0),
  amount_expected NUMERIC(12,2),
  amount_paid NUMERIC(12,2),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_change_requests_brand_id
  ON plan_change_requests (brand_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_plan_change_requests_status
  ON plan_change_requests (status, created_at DESC);

CREATE TRIGGER update_plan_change_requests_updated_at
  BEFORE UPDATE ON plan_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
