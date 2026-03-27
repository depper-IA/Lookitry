-- Migración: Plan Enterprise + Corrección de Plan Pro + Enterprise Sync
-- Ejecutar en SQL Editor de Supabase o Vía API

BEGIN;

-- 1. Insertar o actualizar el Plan Enterprise en pricing_config
INSERT INTO pricing_config (id, data)
VALUES (
  'enterprise',
  '{
    "precio_mensual_cop": 800000,
    "productos_max": 50,
    "generaciones_mensuales": 2000,
    "subtitulo": "Para grandes retailers y operaciones a escala",
    "boton_texto": "Hablar con ventas",
    "features": [
      "+50 productos en el probador",
      "Volumen a medida (>2000 gens)",
      "SLA < 5 segundos",
      "Marca Blanca (Sin logo Lookitry)",
      "Panel de Analítica Avanzado",
      "Acceso a API"
    ],
    "features_excluidas": []
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE 
SET data = EXCLUDED.data;


-- 2. Actualizar Plan Pro para incluir Plugin de WooCommerce
UPDATE pricing_config
SET data = data || '{
  "features": [
    "15 productos en el probador",
    "1.200 generaciones por mes",
    "Logo y colores de marca",
    "Template Bare (widget limpio)",
    "Widget embebible (iframe)",
    "Analytics de uso",
    "Templates Minimal, Modern y Bold",
    "Texto del botón personalizado",
    "Mensaje de bienvenida en widget",
    "Modificación del slug del probador",
    "Integración con sistemas externos",
    "Plugin de WooCommerce",
    "Soporte prioritario"
  ]
}'::jsonb
WHERE id = 'pro';


-- 3. Tabla de configuración de sincronización de catálogos (The Sync - Enterprise)
CREATE TABLE IF NOT EXISTS enterprise_sync_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  sync_type text NOT NULL DEFAULT 'csv',          -- 'csv' | 'api' | 'woocommerce'
  source_url text NOT NULL,                        -- URL del CSV o endpoint de la API del cliente
  api_key text,                                    -- API key del cliente (para fuentes tipo API)
  field_map jsonb DEFAULT '{}'::jsonb,             -- Mapeo de campos: { "name": "title", "image": "image_url" }
  active boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_status text,                           -- 'success' | 'partial' | 'failed'
  last_sync_message text,                          -- Mensaje de error o confirmación del último sync
  products_synced_count int DEFAULT 0,
  notes text,                                      -- Notas internas del admin
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(brand_id)
);

ALTER TABLE enterprise_sync_configs ENABLE ROW LEVEL SECURITY;

-- Solo el service role puede leer y escribir en esta tabla
CREATE POLICY "Service role only" ON enterprise_sync_configs
  FOR ALL USING (false);


COMMIT;

-- Fin de migración
