/**
 * Script para corregir la vista public.db_security_audit agregando security_invoker = true
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { Client } = require('pg');

const projectRef = 'vkdooutklowctuudjnkl';
const client = new Client({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 5432,
  user: `postgres.${projectRef}`,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('🔌 Conectado a la base de datos de Supabase...');

  try {
    // 1. Obtener la definición actual de la vista
    const checkQuery = `
      SELECT pg_get_viewdef('public.db_security_audit'::regclass, true) AS view_def;
    `;
    
    console.log('🔍 Obteniendo definición de la vista public.db_security_audit...');
    const res = await client.query(checkQuery);
    
    if (res.rows.length === 0 || !res.rows[0].view_def) {
      console.log('❌ No se encontró la definición de la vista o no existe.');
      await client.end();
      return;
    }

    const viewDef = res.rows[0].view_def;
    console.log('✅ Definición encontrada:\n', viewDef);

    // 2. Recrear la vista con security_invoker = true
    console.log('🛠️ Recreando la vista con WITH (security_invoker = true)...');
    
    // Primero hacemos DROP
    await client.query('DROP VIEW IF EXISTS public.db_security_audit;');
    console.log('🗑️ Vista antigua eliminada.');

    // Luego hacemos CREATE
    const createQuery = `
      CREATE VIEW public.db_security_audit 
      WITH (security_invoker = true) 
      AS 
      ${viewDef}
    `;
    
    await client.query(createQuery);
    console.log('🎉 Vista recreada exitosamente con security_invoker = true!');

  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada.');
  }
}

main();
