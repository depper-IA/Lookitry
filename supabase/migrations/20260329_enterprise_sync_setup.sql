BEGIN;

INSERT INTO pricing_config (id, data)
VALUES (
  'enterprise',
  '{
    "precio_mensual_cop": 800000,
    "productos_max": 50,
    "generaciones_max": 2000,
    "generaciones_mensuales": 2000,
    "subtitulo": "Para grandes retailers y operaciones a escala",
    "boton_texto": "Hablar con ventas",
    "features": [
      "+50 productos",
      "Volumen a medida",
      "Marca Blanca",
      "Panel de Analitica Avanzado",
      "Acceso a API"
    ],
    "features_excluidas": []
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET data = EXCLUDED.data;

CREATE TABLE IF NOT EXISTS enterprise_sync_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  sync_type text NOT NULL DEFAULT 'csv',
  source_url text NOT NULL,
  api_key text,
  field_map jsonb DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_message text,
  products_synced_count int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id)
);

ALTER TABLE enterprise_sync_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'enterprise_sync_configs'
      AND policyname = 'Service role only'
  ) THEN
    CREATE POLICY "Service role only" ON enterprise_sync_configs
      FOR ALL
      USING (false);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION increment_sync_count(p_brand_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE enterprise_sync_configs
  SET
    products_synced_count = COALESCE(products_synced_count, 0) + 1,
    updated_at = now()
  WHERE brand_id = p_brand_id;
END;
$$;

COMMIT;
