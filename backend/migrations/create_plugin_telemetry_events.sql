-- Telemetria tecnica minima para el plugin de WooCommerce
-- Permite medir errores, retries y latencias reales por tienda/marca.

CREATE TABLE IF NOT EXISTS plugin_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'woocommerce-plugin',
  event_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  status_code INTEGER NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  store_domain TEXT NULL,
  product_external_id TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugin_telemetry_events_brand_created
  ON plugin_telemetry_events (brand_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_plugin_telemetry_events_endpoint_created
  ON plugin_telemetry_events (endpoint, created_at DESC);

ALTER TABLE plugin_telemetry_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_plugin_telemetry_events" ON plugin_telemetry_events;
CREATE POLICY "service_role_all_plugin_telemetry_events" ON plugin_telemetry_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
