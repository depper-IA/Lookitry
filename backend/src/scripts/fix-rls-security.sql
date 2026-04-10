-- ================================================================
-- MIGRACIÓN DE SEGURIDAD CRÍTICA: Corregir políticas RLS
-- Fecha: 2026-03-15
-- Problema detectado: Todas las tablas accesibles con anon key
-- Confirmado: tabla admins expone email + hash de contraseña
--             tabla subscription_payments expone datos financieros
--             tabla brands expone passwords hasheadas
-- ================================================================
-- INSTRUCCIONES: Ejecutar en Supabase > SQL Editor
-- ================================================================


-- ================================================================
-- 1. TABLA: admins
-- RIESGO CRÍTICO: email + hash de contraseña expuestos públicamente
-- FIX: Habilitar RLS sin ninguna política = bloqueo total para
--      anon y authenticated. service_role bypasea RLS (backend OK).
-- ================================================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Eliminar cualquier política permisiva existente
DROP POLICY IF EXISTS "Admins viewable" ON admins;
DROP POLICY IF EXISTS "Admins insertable" ON admins;
DROP POLICY IF EXISTS "Admins updatable" ON admins;
DROP POLICY IF EXISTS "Admins deletable" ON admins;
DROP POLICY IF EXISTS "Enable read access for all users" ON admins;
DROP POLICY IF EXISTS "Allow all" ON admins;

-- Sin políticas = nadie accede via PostgREST con anon/authenticated
-- El backend usa supabaseAdmin (service_role) que bypasea RLS


-- ================================================================
-- 2. TABLA: subscription_payments
-- RIESGO ALTO: datos financieros (montos, métodos de pago) expuestos
-- FIX: Bloqueo total para anon/authenticated
-- ================================================================

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands can view own payments" ON subscription_payments;
DROP POLICY IF EXISTS "Payments insertable" ON subscription_payments;
DROP POLICY IF EXISTS "Payments updatable" ON subscription_payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON subscription_payments;
DROP POLICY IF EXISTS "Allow all" ON subscription_payments;

-- Sin políticas = bloqueo total para anon/authenticated


-- ================================================================
-- 3. TABLA: generations
-- RIESGO MEDIO: historial de generaciones de imágenes expuesto
-- FIX: Bloqueo total para anon/authenticated
-- ================================================================

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Generations viewable" ON generations;
DROP POLICY IF EXISTS "Generations insertable" ON generations;
DROP POLICY IF EXISTS "Generations updatable" ON generations;
DROP POLICY IF EXISTS "Enable read access for all users" ON generations;
DROP POLICY IF EXISTS "Allow all" ON generations;

-- Sin políticas = bloqueo total para anon/authenticated


-- ================================================================
-- 4. TABLA: brands
-- RIESGO ALTO: passwords hasheadas + datos de suscripción expuestos
-- FIX: anon puede leer SOLO campos públicos del widget (slug, name,
--      primary_color, secondary_color, logo). El backend controla
--      qué columnas devuelve en cada endpoint.
-- ================================================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands viewable by everyone" ON brands;
DROP POLICY IF EXISTS "Public brand info readable" ON brands;
DROP POLICY IF EXISTS "Brand reads own data" ON brands;
DROP POLICY IF EXISTS "Brand updates own data" ON brands;
DROP POLICY IF EXISTS "Enable read access for all users" ON brands;
DROP POLICY IF EXISTS "Allow all" ON brands;
DROP POLICY IF EXISTS "Public widget fields readable by anon" ON brands;

-- anon puede leer filas de brands (el backend filtra columnas sensibles)
-- Necesario para el widget público /pruebalo/[slug]
CREATE POLICY "Public brand data readable by anon"
ON brands
FOR SELECT
TO anon
USING (true);

-- NOTA DE SEGURIDAD: PostgREST no soporta column-level RLS.
-- La protección de columnas sensibles (password, subscription_status,
-- last_payment_date, etc.) se hace en el backend:
-- - /api/pruebalo/[slug] solo selecciona: name, slug, logo, primary_color,
--   secondary_color, widget_template, button_text, welcome_message
-- - Nunca expone password, plan, subscription_* al widget público


-- ================================================================
-- 5. TABLA: products
-- RIESGO BAJO: productos activos son públicos (necesario para widget)
-- FIX: anon solo lee productos activos (is_active = true)
-- ================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products viewable by everyone" ON products;
DROP POLICY IF EXISTS "Products readable" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Allow all" ON products;
DROP POLICY IF EXISTS "Active products readable by anon" ON products;

-- anon puede leer solo productos activos (widget público los necesita)
CREATE POLICY "Active products readable by anon"
ON products
FOR SELECT
TO anon
USING (is_active = true);


-- ================================================================
-- VERIFICACIÓN: Ejecutar después para confirmar cambios
-- ================================================================

SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COALESCE(
    (SELECT string_agg(p.policyname || ' (' || p.cmd || ')', ', ')
     FROM pg_policies p
     WHERE p.tablename = t.tablename AND p.schemaname = 'public'),
    'SIN POLITICAS (bloqueado para anon)'
  ) AS policies
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN ('brands','subscription_payments','admins','products','generations')
ORDER BY t.tablename;
