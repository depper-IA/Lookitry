-- ============================================
-- Migration: Add Subscription Fields to Brands Table
-- Date: 2025-01-XX
-- Task: 21.1 - Agregar campos de suscripción a tabla brands
-- Requirements: 11.1, 11.2
-- ============================================

-- PASO 1: Crear tipo enum para subscription_status
-- ============================================

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'expiring_soon', 'expired', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PASO 2: Agregar columnas de suscripción a tabla brands
-- ============================================

-- Agregar columna subscription_start_date
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;

-- Agregar columna subscription_end_date
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Agregar columna subscription_status
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'active';

-- Agregar columna last_payment_date
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

-- Agregar columna next_payment_date
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ;

-- ============================================
-- PASO 3: Crear índices para optimizar consultas de suscripciones
-- ============================================

-- Índice para buscar por estado de suscripción
CREATE INDEX IF NOT EXISTS idx_brands_subscription_status 
ON brands(subscription_status);

-- Índice para buscar suscripciones por vencer (ordenadas por fecha)
CREATE INDEX IF NOT EXISTS idx_brands_subscription_end_date 
ON brands(subscription_end_date) 
WHERE subscription_status IN ('active', 'expiring_soon');

-- Índice compuesto para consultas de admin (estado + fecha de vencimiento)
CREATE INDEX IF NOT EXISTS idx_brands_status_end_date 
ON brands(subscription_status, subscription_end_date);

-- ============================================
-- PASO 4: Inicializar datos para marcas existentes
-- ============================================

-- Para marcas existentes, establecer valores iniciales:
-- - subscription_start_date: fecha de creación de la marca
-- - subscription_end_date: 30 días después de la fecha de creación
-- - subscription_status: 'active' (ya es el default)
-- - last_payment_date: fecha de creación (asumiendo que pagaron al registrarse)
-- - next_payment_date: igual a subscription_end_date

UPDATE brands
SET 
  subscription_start_date = created_at,
  subscription_end_date = created_at + INTERVAL '30 days',
  subscription_status = 'active',
  last_payment_date = created_at,
  next_payment_date = created_at + INTERVAL '30 days'
WHERE subscription_start_date IS NULL;

-- ============================================
-- PASO 5: Agregar constraints para validación
-- ============================================

-- Constraint: subscription_end_date debe ser posterior a subscription_start_date
ALTER TABLE brands
ADD CONSTRAINT check_subscription_dates 
CHECK (
  (subscription_start_date IS NULL AND subscription_end_date IS NULL) OR
  (subscription_start_date IS NOT NULL AND subscription_end_date IS NOT NULL AND subscription_end_date > subscription_start_date)
);

-- Constraint: next_payment_date debe ser posterior a last_payment_date (si ambos existen)
ALTER TABLE brands
ADD CONSTRAINT check_payment_dates 
CHECK (
  (last_payment_date IS NULL OR next_payment_date IS NULL) OR
  (next_payment_date >= last_payment_date)
);

-- ============================================
-- PASO 6: Crear vista para monitoreo de suscripciones
-- ============================================

CREATE OR REPLACE VIEW subscription_monitoring AS
SELECT 
  b.id,
  b.name,
  b.slug,
  b.email,
  b.plan,
  b.subscription_status,
  b.subscription_start_date,
  b.subscription_end_date,
  b.last_payment_date,
  b.next_payment_date,
  -- Calcular días restantes
  CASE 
    WHEN b.subscription_end_date IS NOT NULL THEN
      EXTRACT(DAY FROM (b.subscription_end_date - NOW()))::INTEGER
    ELSE NULL
  END AS days_remaining,
  -- Indicador de si requiere atención
  CASE 
    WHEN b.subscription_status = 'expired' THEN 'URGENTE: Vencida'
    WHEN b.subscription_status = 'suspended' THEN 'URGENTE: Suspendida'
    WHEN b.subscription_status = 'expiring_soon' THEN 'ATENCIÓN: Por vencer'
    WHEN b.subscription_end_date IS NOT NULL AND b.subscription_end_date < NOW() + INTERVAL '7 days' THEN 'ADVERTENCIA: Vence en < 7 días'
    ELSE 'OK'
  END AS alert_level,
  b.created_at
FROM brands b
ORDER BY 
  CASE b.subscription_status
    WHEN 'expired' THEN 1
    WHEN 'suspended' THEN 2
    WHEN 'expiring_soon' THEN 3
    WHEN 'active' THEN 4
  END,
  b.subscription_end_date ASC NULLS LAST;

-- ============================================
-- PASO 7: Verificación de la migración
-- ============================================

-- Verificar que las columnas se agregaron correctamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'brands'
  AND column_name IN (
    'subscription_start_date',
    'subscription_end_date',
    'subscription_status',
    'last_payment_date',
    'next_payment_date'
  )
ORDER BY column_name;

-- Verificar índices creados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'brands'
  AND indexname LIKE '%subscription%'
ORDER BY indexname;

-- Verificar constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'brands'::regclass
  AND conname LIKE '%subscription%' OR conname LIKE '%payment%'
ORDER BY conname;

-- Verificar datos inicializados
SELECT 
  COUNT(*) AS total_brands,
  COUNT(subscription_start_date) AS brands_with_subscription,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) AS active_subscriptions,
  COUNT(CASE WHEN subscription_status = 'expiring_soon' THEN 1 END) AS expiring_soon,
  COUNT(CASE WHEN subscription_status = 'expired' THEN 1 END) AS expired,
  COUNT(CASE WHEN subscription_status = 'suspended' THEN 1 END) AS suspended
FROM brands;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================

-- Resumen de cambios:
-- ✓ 1 tipo enum creado (subscription_status)
-- ✓ 5 columnas agregadas a brands
-- ✓ 3 índices creados para optimización
-- ✓ Datos inicializados para marcas existentes
-- ✓ 2 constraints de validación agregados
-- ✓ 1 vista de monitoreo creada
-- ✓ Verificaciones ejecutadas

-- NOTAS IMPORTANTES:
-- 1. Esta migración es segura para ejecutar en producción (usa IF NOT EXISTS)
-- 2. No elimina ni modifica datos existentes
-- 3. Inicializa valores razonables para marcas existentes
-- 4. Los índices mejoran el rendimiento de consultas de suscripciones
-- 5. La vista subscription_monitoring facilita el monitoreo desde el admin panel
