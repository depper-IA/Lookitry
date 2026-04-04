-- Tabla para registrar alertas de uso enviadas y evitar duplicados
CREATE TABLE IF NOT EXISTS usage_alerts_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  threshold INT NOT NULL CHECK (threshold IN (80, 100)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_alerts_brand_threshold
  ON usage_alerts_log (brand_id, threshold, created_at);
