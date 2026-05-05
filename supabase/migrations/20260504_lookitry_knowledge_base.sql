-- Migration: Create lookitry_knowledge table for WhatsApp agent RAG
-- Date: 2026-05-04
-- Purpose: Single source of truth for Rebecca (WhatsApp agent) product knowledge
--          with semantic search via pgvector (Gemini gemini-embedding-001, 768 dims)
-- Update this table to keep Rebecca's answers accurate — no need to change n8n prompts

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS lookitry_knowledge (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL,  -- 'planes', 'features', 'faq', 'contacto', 'proceso'
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  embedding   vector(768),    -- Gemini gemini-embedding-001 — generado automáticamente por el backend
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_lookitry_knowledge_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lookitry_knowledge_updated_at ON lookitry_knowledge;
CREATE TRIGGER trg_lookitry_knowledge_updated_at
  BEFORE UPDATE ON lookitry_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_lookitry_knowledge_timestamp();

-- Índice IVFFlat para búsqueda semántica por coseno
-- lists=50 es apropiado para tablas pequeñas (<1000 filas)
CREATE INDEX IF NOT EXISTS idx_lookitry_knowledge_embedding
  ON lookitry_knowledge
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- RLS: solo service_role puede escribir, lectura pública
ALTER TABLE lookitry_knowledge ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON lookitry_knowledge;
DROP POLICY IF EXISTS "service_write" ON lookitry_knowledge;
CREATE POLICY "public_read" ON lookitry_knowledge FOR SELECT USING (true);
CREATE POLICY "service_write" ON lookitry_knowledge FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Función RPC: búsqueda semántica para Rebecca
-- Llamar desde n8n o el backend con el embedding de la pregunta del usuario
CREATE OR REPLACE FUNCTION search_lookitry_knowledge(
  p_query_embedding vector(768),
  p_match_count      INT     DEFAULT 5,
  p_category_filter  TEXT    DEFAULT NULL,
  p_min_similarity   FLOAT   DEFAULT 0.3
)
RETURNS TABLE (
  id          TEXT,
  category    TEXT,
  title       TEXT,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lk.id,
    lk.category,
    lk.title,
    lk.content,
    1 - (lk.embedding <=> p_query_embedding) AS similarity
  FROM lookitry_knowledge lk
  WHERE lk.embedding IS NOT NULL
    AND lk.is_active = true
    AND (p_category_filter IS NULL OR lk.category = p_category_filter)
    AND 1 - (lk.embedding <=> p_query_embedding) >= p_min_similarity
  ORDER BY lk.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION search_lookitry_knowledge TO service_role;

COMMENT ON TABLE lookitry_knowledge IS
  'Knowledge base de Rebecca (agente WhatsApp). Editar desde el panel admin — los embeddings se regeneran automáticamente.';
COMMENT ON COLUMN lookitry_knowledge.embedding IS
  'Gemini gemini-embedding-001, 768 dimensiones. Generado automáticamente por el backend al crear/actualizar un item.';

-- ============================================================
-- DATOS INICIALES — Actualizar desde el panel admin
-- ============================================================

INSERT INTO lookitry_knowledge (id, category, title, content) VALUES

('plan_trial', 'planes',
'Plan Trial',
'Precio: $20.000 COP/mes (precio original $29.000, 93% descuento).
Incluye: 1 producto en el probador, 15 generaciones activas, 7 días de acceso, logo y colores de marca, widget embebible (iframe).
Ideal para: probar el servicio antes de contratar un plan pago.'),

('plan_basic', 'planes',
'Plan BASIC',
'Precio: $180.000 COP/mes (precio original $220.000).
Incluye: 5 productos en el probador, 400 generaciones/mes, logo y colores de marca, template Bare (widget limpio), widget embebible (script), analytics de uso.
NO incluye: templates Minimal/Modern/Bold, texto del botón personalizado, mensaje de bienvenida, modificación del slug, integración con sistemas externos, soporte prioritario.
Ideal para: marcas pequeñas en Instagram y WhatsApp.'),

('plan_pro', 'planes',
'Plan PRO',
'Precio: $350.000 COP/mes (precio original $420.000).
Incluye: 15 productos en el probador, 1.000 generaciones/mes, logo y colores de marca, todos los templates (Bare, Minimal, Modern, Bold), widget embebible (script), analytics de uso, texto del botón personalizado, modificación del slug del probador, integración con sistemas externos, sin marcas de agua, soporte prioritario, plugin de WooCommerce.
Ideal para: tiendas online con mayor volumen.'),

('plan_enterprise', 'planes',
'Plan ENTERPRISE',
'Precio: a medida (contactar ventas).
Incluye: +50 productos, volumen de generaciones a medida, marca blanca, panel de analítica avanzado, acceso a API.
Ideal para: grandes retailers y operaciones a escala.'),

('plan_mini_landing', 'planes',
'Mini-Landing',
'Precio: $650.000 COP pago único (precio original $850.000, 23% descuento).
Incluye: página pública activa con probador IA integrado, 3 templates a elegir, WhatsApp flotante, dominio personalizable, entrega en 48 horas.
Ideal para: marcas sin sitio web propio que quieren una página de venta lista.'),

('descuentos_duracion', 'planes',
'Descuentos por duración de contrato',
'Al contratar por más meses se aplica descuento sobre el precio mensual:
- 1 mes: sin descuento
- 3 meses: 5% de descuento
- 6 meses: 10% de descuento
- 12 meses: 15% de descuento'),

('trial_gratuito', 'proceso',
'Trial gratuito de 7 días',
'Todas las marcas nuevas pueden iniciar un trial gratuito de 7 días sin tarjeta de crédito. El trial incluye acceso completo al plan BASIC. Para activarlo: https://lookitry.com/registro'),

('como_funciona', 'features',
'Cómo funciona la prueba virtual',
'El cliente de la tienda sube una foto suya, selecciona una prenda del catálogo y la IA genera una imagen realista mostrando cómo le quedaría la ropa. Todo desde el navegador, sin app ni descarga. El proceso toma menos de 30 segundos.'),

('instalacion', 'features',
'Cómo se instala en una tienda',
'Lookitry se instala de dos formas:
1. Script embebible (iframe/script): funciona en cualquier plataforma — Shopify, Tiendanube, Wix, sitio propio, etc. Solo copiar y pegar el código.
2. Plugin oficial de WooCommerce: instalación en 1 clic desde el panel de WordPress.
La instalación toma menos de 10 minutos.'),

('compatibilidad', 'features',
'Compatibilidad con plataformas',
'Lookitry funciona con cualquier plataforma que permita HTML/iframe: Shopify, WooCommerce, Tiendanube, Wix, Squarespace, sitio propio, etc. Tiene plugin oficial para WooCommerce.'),

('tipos_ropa', 'features',
'Tipos de ropa compatibles',
'Funciona con: camisas, camisetas, vestidos, pantalones, faldas, chaquetas, abrigos, accesorios. Funciona mejor con prendas de cuerpo completo. No funciona con: zapatos, ropa interior, sombreros.'),

('generaciones_agotadas', 'features',
'Qué pasa si se agotan las generaciones',
'Cuando se agotan las generaciones del mes, la marca puede: 1) Comprar créditos adicionales desde el dashboard, 2) Hacer upgrade de plan en cualquier momento. Los créditos no vencen.'),

('personalizacion', 'features',
'Personalización del widget',
'Cada marca puede configurar: colores del widget (primario y secundario), logo, texto del botón de acción, mensaje de bienvenida, slug personalizado del probador (plan PRO+). El widget se adapta a la identidad visual de la marca.'),

('soporte', 'features',
'Soporte técnico',
'Todos los planes incluyen soporte por email y WhatsApp. Los planes PRO y ENTERPRISE tienen soporte prioritario con tiempo de respuesta garantizado. Horario: lunes a viernes 9am-6pm (hora Colombia).'),

('beneficios', 'features',
'Beneficios principales de Lookitry',
'1. Reduce devoluciones hasta un 40% — los clientes compran con más confianza al ver cómo les queda la ropa.
2. Aumenta conversiones — la prueba virtual reduce la duda de compra.
3. Diferenciación competitiva — pocas tiendas en LATAM tienen esta tecnología.
4. Fácil de instalar — menos de 10 minutos, sin conocimientos técnicos.
5. Sin app — funciona directo en el navegador del cliente.'),

('contacto', 'contacto',
'Información de contacto Lookitry',
'Email: info@lookitry.com
Sitio web: https://lookitry.com
Registro/Trial: https://lookitry.com/registro
Instagram: @look.itry_
TikTok: @lookitry
Soporte: disponible por WhatsApp para clientes activos.'),

('proceso_venta', 'proceso',
'Proceso para contratar Lookitry',
'1. Registro gratuito en https://lookitry.com/registro
2. Trial de 7 días sin tarjeta — explorar el dashboard y configurar el widget
3. Al finalizar el trial, elegir plan y método de pago (Wompi para Colombia, PayPal para internacional)
4. El widget queda activo inmediatamente después del pago.'),

('pagos', 'proceso',
'Métodos de pago',
'Colombia: Wompi (tarjeta débito/crédito, PSE, Nequi, Bancolombia).
Internacional: PayPal.
Los pagos son mensuales o por el período contratado (3, 6 o 12 meses con descuento).'),

('faq_sistema_bancario', 'faq',
'¿Necesito conocimientos técnicos para instalar Lookitry?',
'No. La instalación es copiar y pegar un script en tu sitio web. Para WooCommerce hay un plugin oficial que se instala en 1 clic. Si tienes dudas, el equipo de soporte te ayuda en la instalación.'),

('faq_prueba_gratis', 'faq',
'¿Puedo probar Lookitry gratis?',
'Sí. Todas las marcas nuevas tienen acceso a un trial gratuito de 7 días sin tarjeta de crédito. Incluye acceso completo al plan BASIC. Regístrate en https://lookitry.com/registro'),

('faq_cuantas_fotos', 'faq',
'¿Cuántas fotos puede subir cada cliente?',
'Cada cliente puede hacer pruebas virtuales con cualquier producto del catálogo. El límite es el número de generaciones del plan de la marca (400/mes en BASIC, 1.000/mes en PRO). Cada prueba virtual consume 1 generación.'),

('faq_calidad_imagen', 'faq',
'¿Qué tan realistas son las imágenes generadas?',
'Las imágenes son generadas por IA y muestran la prenda sobre la foto del cliente de forma realista. La calidad depende de la foto del cliente (buena iluminación, fondo neutro) y de la imagen del producto (fondo blanco, buena resolución). El resultado es suficientemente realista para dar confianza de compra.')

ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  updated_at = now();
