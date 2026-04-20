/**
 * Script para ejecutar el fix de RLS en addon_packages
 * Ejecutar con: node scripts/fix-addon-packages-rls.js
 */

const { Pool } = require('pg');

// Connection directly to Supabase Postgres
const pool = new Pool({
  host: 'db.vkdooutklowctuudjnkl.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || '***REMOVED-SECRET***',
  ssl: { rejectUnauthorized: false }
});

async function fixRLS() {
  const client = await pool.connect();

  try {
    console.log('[FIX] Verificando policies actuales de addon_packages...');

    // Verificar policies existentes
    const existingPolicies = await client.query(`
      SELECT policyname, cmd, permissive
      FROM pg_policies
      WHERE tablename = 'addon_packages'
        AND schemaname = 'public'
    `);

    console.log('Policies existentes:', existingPolicies.rows);

    // Eliminar policies problemáticas
    console.log('[FIX] Eliminando policies existentes...');
    await client.query(`DROP POLICY IF EXISTS "addon_packages_service_role_all" ON addon_packages;`);
    await client.query(`DROP POLICY IF EXISTS "addon_packages_all" ON addon_packages;`);
    await client.query(`DROP POLICY IF EXISTS "service_role_all_addon_packages" ON addon_packages;`);

    // Crear policy correcta
    console.log('[FIX] Creando policy correcta para service_role...');
    await client.query(`
      CREATE POLICY "addon_packages_service_role_all" ON addon_packages
        FOR ALL
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role')
    `);

    // Verificar que se creó
    const newPolicies = await client.query(`
      SELECT policyname, cmd, permissive
      FROM pg_policies
      WHERE tablename = 'addon_packages'
        AND schemaname = 'public'
    `);

    console.log('[FIX] Policies después del fix:', newPolicies.rows);

    // Test: intentar INSERT (simulado)
    console.log('[FIX] Verificando que el INSERT funciona...');
    const testResult = await client.query(`
      INSERT INTO addon_packages (id, name, credits_amount, price_cop, is_active)
      VALUES ('credits_500', 'Paquete 500 Generaciones Extra', 500, 50000, true)
      ON CONFLICT (id) DO UPDATE SET updated_at = now()
      RETURNING id, name, credits_amount, price_cop, is_active
    `);

    console.log('[FIX] ✓ INSERT exitoso:', testResult.rows[0]);

  } catch (error) {
    console.error('[FIX] ✗ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixRLS()
  .then(() => {
    console.log('\n[SUCCESS] Fix de RLS completado exitosamente.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n[FAILURE] El fix falló:', err.message);
    process.exit(1);
  });