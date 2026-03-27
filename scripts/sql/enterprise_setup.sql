-- Migración: Plan Enterprise + Corrección de Plan Pro
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


-- 2. Limpiar Plan Básico de features estáticas (opcional pero recomendado) y Plan Pro
-- Modificamos Pro para incluir el Plugin de WooCommerce obligatoriamente
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


COMMIT;

-- Fin de migración
