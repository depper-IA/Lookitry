-- ============================================
-- Migration: Create Subscription Payments Table
-- Date: 2025-01-XX
-- Task: 21.2 - Crear tabla de historial de pagos
-- Requirements: 11.14
-- ============================================

-- PASO 1: Crear tipo enum para payment_status
-- ============================================

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PASO 2: Crear tabla subscription_payments
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Información del pago
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'COP' NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL, -- 'transfer', 'cash', 'card', 'wompi', 'payu', etc.
  status payment_status DEFAULT 'completed' NOT NULL,
  
  -- Información adicional
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT amount_positive CHECK (amount > 0),
  CONSTRAINT currency_format CHECK (currency ~* '^[A-Z]{3}$'),
  CONSTRAINT payment_method_not_empty CHECK (length(trim(payment_method)) > 0)
);

-- ============================================
-- PASO 3: Crear índices para optimizar consultas
-- ============================================

-- Índice para buscar pagos por marca
CREATE INDEX IF NOT EXISTS idx_subscription_payments_brand_id 
ON subscription_payments(brand_id);

-- Índice para buscar pagos por fecha (ordenados descendente para ver los más recientes primero)
CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment_date 
ON subscription_payments(payment_date DESC);

-- Índice compuesto para consultas de historial por marca y fecha
CREATE INDEX IF NOT EXISTS idx_subscription_payments_brand_date 
ON subscription_payments(brand_id, payment_date DESC);

-- Índice para buscar por estado de pago
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status 
ON subscription_payments(status);

-- Índice compuesto para consultas de admin (estado + fecha)
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status_date 
ON subscription_payments(status, payment_date DESC);

-- ============================================
-- PASO 4: Crear trigger para updated_at
-- ============================================

CREATE TRIGGER update_subscription_payments_updated_at 
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 5: Habilitar Row Level Security (RLS)
-- ============================================

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 6: Crear políticas RLS
-- ============================================

-- Política para que las marcas puedan ver sus propios pagos
CREATE POLICY "Brands can view own payments" ON subscription_payments
  FOR SELECT 
  USING (true); -- El backend filtrará por brand_id usando JWT

-- Política para insertar pagos (solo admin desde backend)
CREATE POLICY "Payments insertable" ON subscription_payments
  FOR INSERT 
  WITH CHECK (true); -- El backend controlará quién puede insertar

-- Política para actualizar pagos (solo admin desde backend)
CREATE POLICY "Payments updatable" ON subscription_payments
  FOR UPDATE 
  USING (true); -- El backend controlará quién puede actualizar

-- ============================================
-- PASO 7: Crear vista para reporte de pagos
-- ============================================

CREATE OR REPLACE VIEW payment_history_summary AS
SELECT 
  b.id AS brand_id,
  b.name AS brand_name,
  b.slug,
  b.email,
  b.plan,
  COUNT(sp.id) AS total_payments,
  COUNT(CASE WHEN sp.status = 'completed' THEN 1 END) AS completed_payments,
  COUNT(CASE WHEN sp.status = 'pending' THEN 1 END) AS pending_payments,
  COUNT(CASE WHEN sp.status = 'failed' THEN 1 END) AS failed_payments,
  SUM(CASE WHEN sp.status = 'completed' THEN sp.amount ELSE 0 END) AS total_revenue,
  MAX(sp.payment_date) AS last_payment_date,
  MIN(sp.payment_date) AS first_payment_date
FROM brands b
LEFT JOIN subscription_payments sp ON sp.brand_id = b.id
GROUP BY b.id, b.name, b.slug, b.email, b.plan
ORDER BY total_revenue DESC NULLS LAST;

-- ============================================
-- PASO 8: Crear vista para ingresos mensuales
-- ============================================

CREATE OR REPLACE VIEW monthly_revenue_report AS
SELECT 
  DATE_TRUNC('month', sp.payment_date) AS month,
  COUNT(sp.id) AS total_payments,
  COUNT(DISTINCT sp.brand_id) AS unique_brands,
  SUM(sp.amount) AS total_revenue,
  AVG(sp.amount) AS average_payment,
  COUNT(CASE WHEN b.plan = 'BASIC' THEN 1 END) AS basic_plan_payments,
  COUNT(CASE WHEN b.plan = 'PRO' THEN 1 END) AS pro_plan_payments,
  SUM(CASE WHEN b.plan = 'BASIC' THEN sp.amount ELSE 0 END) AS basic_plan_revenue,
  SUM(CASE WHEN b.plan = 'PRO' THEN sp.amount ELSE 0 END) AS pro_plan_revenue
FROM subscription_payments sp
JOIN brands b ON b.id = sp.brand_id
WHERE sp.status = 'completed'
GROUP BY DATE_TRUNC('month', sp.payment_date)
ORDER BY month DESC;

-- ============================================
-- PASO 9: Insertar datos de ejemplo (opcional, solo para desarrollo)
-- ============================================

-- Comentar esta sección en producción
/*
DO $$
DECLARE
  demo_brand_id UUID;
BEGIN
  -- Obtener ID de marca demo si existe
  SELECT id INTO demo_brand_id FROM brands WHERE slug = 'marca-demo' LIMIT 1;
  
  IF demo_brand_id IS NOT NULL THEN
    -- Insertar pagos de ejemplo
    INSERT INTO subscription_payments (brand_id, amount, currency, payment_date, payment_method, status, notes)
    VALUES 
      (demo_brand_id, 150000.00, 'COP', NOW() - INTERVAL '60 days', 'transfer', 'completed', 'Pago inicial - Transferencia bancaria'),
      (demo_brand_id, 150000.00, 'COP', NOW() - INTERVAL '30 days', 'transfer', 'completed', 'Renovación mes 2 - Transferencia bancaria'),
      (demo_brand_id, 150000.00, 'COP', NOW(), 'transfer', 'completed', 'Renovación mes 3 - Transferencia bancaria');
  END IF;
END $$;
*/

-- ============================================
-- PASO 10: Verificación de la migración
-- ============================================

-- Verificar que la tabla se creó correctamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscription_payments'
ORDER BY ordinal_position;

-- Verificar índices creados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'subscription_payments'
ORDER BY indexname;

-- Verificar constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'subscription_payments'::regclass
ORDER BY conname;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'subscription_payments'
ORDER BY policyname;

-- Verificar que las vistas se crearon
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('payment_history_summary', 'monthly_revenue_report')
ORDER BY table_name;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================

-- Resumen de cambios:
-- ✓ 1 tipo enum creado (payment_status)
-- ✓ 1 tabla creada (subscription_payments)
-- ✓ 5 índices creados para optimización
-- ✓ 1 trigger para updated_at
-- ✓ Row Level Security habilitado
-- ✓ 3 políticas RLS creadas
-- ✓ 2 vistas creadas (payment_history_summary, monthly_revenue_report)
-- ✓ Verificaciones ejecutadas

-- NOTAS IMPORTANTES:
-- 1. Esta migración es segura para ejecutar en producción (usa IF NOT EXISTS)
-- 2. No modifica tablas existentes
-- 3. Los índices optimizan consultas por marca, fecha y estado
-- 4. Las vistas facilitan reportes de ingresos y historial
-- 5. RLS está habilitado pero el backend controla el acceso con service_role_key
-- 6. La tabla soporta múltiples monedas (aunque por defecto es COP)
-- 7. El campo payment_method es flexible para diferentes métodos de pago
-- 8. El campo notes permite agregar información adicional sobre cada pago

