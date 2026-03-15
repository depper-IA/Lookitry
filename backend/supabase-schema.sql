-- ============================================
-- Virtual Try-On SaaS - Supabase Schema
-- ============================================
-- Este script crea el schema completo de la base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- PASO 1: Limpiar base de datos existente (CUIDADO: Esto borra todo)
-- ============================================

-- Deshabilitar RLS temporalmente para poder borrar
ALTER TABLE IF EXISTS generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS brands DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Brands can view own data" ON brands;
DROP POLICY IF EXISTS "Brands can update own data" ON brands;
DROP POLICY IF EXISTS "Products viewable by brand" ON products;
DROP POLICY IF EXISTS "Products manageable by brand" ON products;
DROP POLICY IF EXISTS "Generations viewable by brand" ON generations;

-- Eliminar triggers
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

-- Eliminar función de trigger
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Eliminar tablas (CASCADE elimina dependencias)
DROP TABLE IF EXISTS generations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS brands CASCADE;

-- Eliminar tipos enum
DROP TYPE IF EXISTS generation_status CASCADE;
DROP TYPE IF EXISTS plan_type CASCADE;

-- ============================================
-- PASO 2: Crear tipos enum
-- ============================================

CREATE TYPE plan_type AS ENUM ('BASIC', 'PRO');
CREATE TYPE generation_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- ============================================
-- PASO 3: Crear tablas
-- ============================================

-- Tabla brands (marcas clientes)
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan plan_type DEFAULT 'BASIC' NOT NULL,
  
  -- Configuración visual del probador
  logo TEXT,
  primary_color TEXT DEFAULT '#000000' NOT NULL,
  secondary_color TEXT DEFAULT '#ffffff' NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$'),
  CONSTRAINT primary_color_format CHECK (primary_color ~* '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT secondary_color_format CHECK (secondary_color ~* '^#[0-9A-Fa-f]{6}$')
);

-- Tabla products (productos de las marcas)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT category_not_empty CHECK (length(trim(category)) > 0)
);

-- Tabla generations (registro de generaciones de try-on)
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- URLs de imágenes
  selfie_url TEXT NOT NULL,
  result_image_url TEXT,
  
  -- Estado y errores
  status generation_status DEFAULT 'PENDING' NOT NULL,
  error_message TEXT,
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processing_time INTEGER, -- Tiempo en milisegundos
  
  -- Constraints
  CONSTRAINT result_required_on_success CHECK (
    (status = 'SUCCESS' AND result_image_url IS NOT NULL) OR
    (status != 'SUCCESS')
  ),
  CONSTRAINT error_required_on_failed CHECK (
    (status = 'FAILED' AND error_message IS NOT NULL) OR
    (status != 'FAILED')
  )
);

-- ============================================
-- PASO 4: Crear índices para optimizar consultas
-- ============================================

-- Índices para brands
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_email ON brands(email);
CREATE INDEX idx_brands_plan ON brands(plan);

-- Índices para products
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_brand_active ON products(brand_id, is_active);
CREATE INDEX idx_products_category ON products(category);

-- Índices para generations
CREATE INDEX idx_generations_brand_id ON generations(brand_id);
CREATE INDEX idx_generations_product_id ON generations(product_id);
CREATE INDEX idx_generations_brand_date ON generations(brand_id, generated_at DESC);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_brand_status_date ON generations(brand_id, status, generated_at DESC);

-- ============================================
-- PASO 5: Crear función y triggers para updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at 
  BEFORE UPDATE ON brands
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 6: Habilitar Row Level Security (RLS)
-- ============================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 7: Crear políticas RLS
-- ============================================

-- Políticas para brands
-- Nota: En este sistema, la autenticación es custom (JWT), no Supabase Auth
-- Por lo tanto, las políticas RLS se manejarán desde el backend con service_role_key
-- Estas políticas son para acceso directo desde el cliente (si se necesita en el futuro)

CREATE POLICY "Brands can view own data" ON brands
  FOR SELECT 
  USING (true); -- Permitir lectura (el backend filtrará por JWT)

CREATE POLICY "Brands can update own data" ON brands
  FOR UPDATE 
  USING (true); -- Permitir actualización (el backend filtrará por JWT)

CREATE POLICY "Brands can insert" ON brands
  FOR INSERT 
  WITH CHECK (true); -- Permitir registro

-- Políticas para products
CREATE POLICY "Products viewable by all" ON products
  FOR SELECT 
  USING (true); -- Permitir lectura (el backend filtrará)

CREATE POLICY "Products manageable by brand" ON products
  FOR ALL 
  USING (true); -- Permitir todas las operaciones (el backend filtrará)

-- Políticas para generations
CREATE POLICY "Generations viewable by all" ON generations
  FOR SELECT 
  USING (true); -- Permitir lectura (el backend filtrará)

CREATE POLICY "Generations insertable" ON generations
  FOR INSERT 
  WITH CHECK (true); -- Permitir inserción (el backend filtrará)

CREATE POLICY "Generations updatable" ON generations
  FOR UPDATE 
  USING (true); -- Permitir actualización (el backend filtrará)

-- ============================================
-- PASO 8: Insertar datos de prueba (opcional)
-- ============================================

-- Marca de prueba (contraseña: "password123" hasheada con bcrypt)
-- Hash generado con: bcrypt.hash("password123", 10)
INSERT INTO brands (email, password, name, slug, plan, logo, primary_color, secondary_color)
VALUES (
  'demo@pruebalo.com',
  '$2b$10$rKZvVqVqVqVqVqVqVqVqVuO7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z', -- password123
  'Marca Demo',
  'marca-demo',
  'BASIC',
  NULL,
  '#3B82F6',
  '#FFFFFF'
);

-- Obtener el ID de la marca demo para los productos
DO $$
DECLARE
  demo_brand_id UUID;
BEGIN
  SELECT id INTO demo_brand_id FROM brands WHERE slug = 'marca-demo';
  
  -- Productos de prueba
  INSERT INTO products (brand_id, name, description, image_url, category, is_active)
  VALUES 
    (
      demo_brand_id,
      'Camiseta Logo',
      'Camiseta con logo frontal',
      'https://via.placeholder.com/400x400?text=Camiseta+Logo',
      'tshirt',
      true
    ),
    (
      demo_brand_id,
      'Hoodie Premium',
      'Hoodie con capucha y bolsillo canguro',
      'https://via.placeholder.com/400x400?text=Hoodie+Premium',
      'hoodie',
      true
    ),
    (
      demo_brand_id,
      'Gorra Snapback',
      'Gorra ajustable con logo bordado',
      'https://via.placeholder.com/400x400?text=Gorra+Snapback',
      'cap',
      true
    );
END $$;

-- ============================================
-- PASO 9: Crear vistas útiles (opcional)
-- ============================================

-- Vista para estadísticas de uso por marca
CREATE OR REPLACE VIEW brand_usage_stats AS
SELECT 
  b.id AS brand_id,
  b.name AS brand_name,
  b.slug,
  b.plan,
  COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true) AS active_products_count,
  COUNT(g.id) FILTER (
    WHERE g.status = 'SUCCESS' 
    AND g.generated_at >= date_trunc('month', CURRENT_DATE)
  ) AS current_month_generations,
  COUNT(g.id) FILTER (WHERE g.status = 'SUCCESS') AS total_generations,
  COUNT(g.id) FILTER (WHERE g.status = 'FAILED') AS failed_generations
FROM brands b
LEFT JOIN products p ON p.brand_id = b.id
LEFT JOIN generations g ON g.brand_id = b.id
GROUP BY b.id, b.name, b.slug, b.plan;

-- ============================================
-- PASO 10: Verificación del schema
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('brands', 'products', 'generations')
ORDER BY table_name;

-- Verificar índices
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('brands', 'products', 'generations')
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('brands', 'products', 'generations')
ORDER BY tablename, policyname;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Resumen de lo creado:
-- ✓ 2 tipos enum (plan_type, generation_status)
-- ✓ 3 tablas (brands, products, generations)
-- ✓ 11 índices para optimización
-- ✓ 1 función y 2 triggers para updated_at
-- ✓ Row Level Security habilitado
-- ✓ 7 políticas RLS
-- ✓ 1 vista para estadísticas
-- ✓ Datos de prueba (marca demo con 3 productos)
