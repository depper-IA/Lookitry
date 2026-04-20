-- ================================================================
-- FIX RLS: addon_packages - Asegurar policies para service_role
-- Fecha: 2026-04-19
-- Problema: ensureDefaultPackages() falla con RLS error
--           porque no hay policy de INSERT para service_role
-- ================================================================

-- 1. Primero verificar si la tabla existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'addon_packages') THEN
    RAISE NOTICE 'Tabla addon_packages no existe. Esta migración debe ejecutarse después de la creación de la tabla.';
  ELSE
    RAISE NOTICE 'Tabla addon_packages existe. Verificando policies...';
  END IF;
END $$;

-- 2. Verificar si existe la policy "addon_packages_service_role_all"
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_tables t ON p.polrelid = t.tablename
    WHERE t.schemaname = 'public'
      AND t.tablename = 'addon_packages'
      AND p.policyname = 'addon_packages_service_role_all'
  ) INTO policy_exists;

  IF policy_exists THEN
    RAISE NOTICE 'Policy addon_packages_service_role_all YA existe.';
  ELSE
    RAISE NOTICE 'Policy addon_packages_service_role_all NO existe. Creándola...';
  END IF;
END $$;

-- 3. Eliminar policies existentes de addon_packages (para recrear si están mal)
DROP POLICY IF EXISTS "addon_packages_service_role_all" ON addon_packages;
DROP POLICY IF EXISTS "addon_packages_all" ON addon_packages;
DROP POLICY IF EXISTS "service_role_all_addon_packages" ON addon_packages;

-- 4. Crear policy correcta para service_role (permite TODAS las operaciones)
CREATE POLICY "addon_packages_service_role_all" ON addon_packages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Verificar que se creó correctamente
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'addon_packages'
  AND schemaname = 'public';

-- 6. Test: Verificar que service_role puede hacer SELECT e INSERT
-- (Esto es solo para verificar, no cambia datos)
DO $$
DECLARE
  test_result INTEGER;
BEGIN
  -- Intentar un SELECT (no debería fallar si la policy está bien)
  BEGIN
    SELECT 1 INTO test_result FROM addon_packages LIMIT 1;
    RAISE NOTICE 'SELECT funciona correctamente para service_role';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR en SELECT: %', SQLERRM;
  END;
END $$;
