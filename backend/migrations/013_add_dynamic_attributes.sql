-- Migration: Add dynamic attributes and short_description to products
-- Date: 2026-04-13
-- Description: Adds short_description field, attributes JSONB field, and category_attributes table

-- ============================================
-- NEW COLUMNS FOR PRODUCTS TABLE
-- ============================================

-- short_description: descripción corta visible para clientes (max 500 chars)
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description varchar(500);

-- attributes: JSONB para atributos dinámicos por categoría
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb;

-- ============================================
-- NEW TABLE: category_attributes
-- ============================================

CREATE TABLE IF NOT EXISTS category_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL UNIQUE,
  category_label text NOT NULL,
  attributes jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- SEED: Default category attributes
-- ============================================

INSERT INTO category_attributes (category_key, category_label, attributes) VALUES
(
  'vestido',
  'Vestido',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "tipo_tela", "label": "Tipo de tela", "type": "text"}]'
),
(
  'rines',
  'Rines',
  '[{"key": "medida_pulgadas", "label": "Medida (pulgadas)", "type": "text"}, {"key": "finish", "label": "Finish", "type": "select", "options": ["Mate", "Cromo", "Diamond", "Brillante", "Negro"]}, {"key": "material", "label": "Material", "type": "select", "options": ["Aleación", "Acero"]}, {"key": "peso", "label": "Peso (kg)", "type": "number"}]'
),
(
  'zapatos',
  'Zapatos',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'camisa',
  'Camisa',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}, {"key": "manga", "label": "Tipo de manga", "type": "select", "options": ["Corta", "Larga", "Sin mangas"]}]'
),
(
  'tshirt',
  'Camiseta',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'hoodie',
  'Hoodie',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'jacket',
  'Chaqueta',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["XS", "S", "M", "L", "XL", "XXL"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'pants',
  'Pantalones',
  '[{"key": "tallas", "label": "Tallas disponibles", "type": "tags", "options": ["26", "28", "30", "32", "34", "36", "38"]}, {"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'accessories',
  'Accesorios',
  '[{"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
),
(
  'general',
  'General',
  '[{"key": "color", "label": "Color", "type": "text"}, {"key": "marca", "label": "Marca", "type": "text"}, {"key": "material", "label": "Material", "type": "text"}]'
)
ON CONFLICT (category_key) DO NOTHING;

-- ============================================
-- INDEXES (optional, for performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_short_description ON products(short_description);
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING GIN (attributes);
CREATE INDEX IF NOT EXISTS idx_category_attributes_key ON category_attributes(category_key);
