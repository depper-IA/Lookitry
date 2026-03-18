-- Migración: tabla pricing_config para precios dinámicos
-- Fecha: 2026-03-18

CREATE TABLE IF NOT EXISTS pricing_config (
  id          text PRIMARY KEY,
  data        jsonb NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_pricing_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pricing_config_timestamp ON pricing_config;
CREATE TRIGGER set_pricing_config_timestamp
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_pricing_config_timestamp();

-- RLS: lectura pública, escritura solo service_role
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_config_public_read" ON pricing_config;
CREATE POLICY "pricing_config_public_read"
  ON pricing_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "pricing_config_service_write" ON pricing_config;
CREATE POLICY "pricing_config_service_write"
  ON pricing_config FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Datos iniciales
INSERT INTO pricing_config (id, data) VALUES
('basic', '{
  "precio_mensual_cop": 150000,
  "productos_max": 5,
  "generaciones_mensuales": 400,
  "subtitulo": "Para marcas pequeñas en Instagram y WhatsApp",
  "boton_texto": "Empezar gratis — 7 días",
  "boton_texto_sin_trial": "Contratar Básico",
  "features": [
    "5 productos en el probador",
    "400 generaciones por mes",
    "Logo y colores de marca",
    "Template Bare (widget limpio)",
    "Widget embebible (iframe)",
    "Analytics de uso"
  ],
  "features_excluidas": [
    "Templates Minimal, Modern y Bold",
    "Texto del botón personalizado",
    "Mensaje de bienvenida en widget",
    "Modificación del slug del probador",
    "Integración con sistemas externos",
    "Soporte prioritario"
  ]
}'),
('pro', '{
  "precio_mensual_cop": 250000,
  "productos_max": 15,
  "generaciones_mensuales": 1200,
  "subtitulo": "Para tiendas online con mayor volumen",
  "boton_texto": "Contratar Pro",
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
    "Soporte prioritario"
  ],
  "features_excluidas": []
}'),
('mini_landing', '{
  "precio_unico_cop": 650000,
  "precio_original_cop": 850000,
  "descuento_porcentaje": 23,
  "subtitulo": "Tu página de venta lista en horas",
  "boton_texto": "Quiero mi mini-landing",
  "features": [
    "Página pública activa",
    "Probador IA integrado",
    "3 templates a elegir",
    "WhatsApp flotante",
    "Dominio personalizable",
    "Entrega en 48 horas"
  ]
}'),
('meta', '{
  "meta_mensual_cop": 1400000,
  "trm_referencia": 3700,
  "trm_auto": true
}'),
('costs', '{
  "costo_vps_cop": 37000,
  "costo_dominio_cop_mensual": 5000,
  "costo_openrouter_por_gen_cop": 25,
  "notas": "Costo OpenRouter estimado: ~$0.039 USD/imagen / 3.7 TRM / 4 gen promedio"
}'),
('descuentos_duracion', '{
  "meses_1": 0,
  "meses_3": 5,
  "meses_6": 10,
  "meses_12": 15
}')
ON CONFLICT (id) DO NOTHING;
