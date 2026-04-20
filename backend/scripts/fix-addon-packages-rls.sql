-- ================================================================
-- FIX RLS: addon_packages
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Fecha: 2026-04-20
-- Problema: ensureDefaultPackages() falla con RLS error
-- ================================================================

-- 1. Ver policies actuales
SELECT
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'addon_packages'
  AND schemaname = 'public';

-- 2. Eliminar policies existentes (si las hay)
DROP POLICY IF EXISTS "addon_packages_service_role_all" ON addon_packages;
DROP POLICY IF EXISTS "addon_packages_all" ON addon_packages;
DROP POLICY IF EXISTS "service_role_all_addon_packages" ON addon_packages;

-- 3. Crear policy correcta para service_role (permite TODAS las operaciones)
CREATE POLICY "addon_packages_service_role_all" ON addon_packages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Verificar que se creó correctamente
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'addon_packages'
  AND schemaname = 'public';

-- 5. Test: hacer upsert del paquete por defecto
INSERT INTO addon_packages (id, name, credits_amount, price_cop, is_active)
VALUES ('credits_500', 'Paquete 500 Generaciones Extra', 500, 50000, true)
ON CONFLICT (id) DO UPDATE SET updated_at = now()
RETURNING id, name, credits_amount, price_cop, is_active, updated_at;