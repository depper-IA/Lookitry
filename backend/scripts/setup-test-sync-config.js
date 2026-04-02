/**
 * Crear configuración de sync de prueba directamente en BD
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { Client } = require('pg');

const projectRef = 'vkdooutklowctuudjnkl';
const client = new Client({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 5432,
  user: `postgres.${projectRef}`,
  password: '3G9TJHZSShva2rXq',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  
  const brandId = 'b387bb52-2456-4aae-bdcc-ae51287c382f'; // Cliente de prueba
  
  // Crear configuración de sync de prueba
  const result = await client.query(`
    INSERT INTO enterprise_sync_configs (
      brand_id, sync_type, source_url, active, notes
    ) VALUES ($1, 'csv', 'https://example.com/test-catalog.csv', true, 'Configuración de prueba creada automáticamente')
    ON CONFLICT (brand_id) DO UPDATE SET
      sync_type = 'csv',
      source_url = 'https://example.com/test-catalog.csv',
      active = true,
      notes = 'Configuración de prueba actualizada'
    RETURNING *
  `, [brandId]);
  
  console.log('✅ Configuración de sync creada/actualizada:');
  console.log(result.rows[0]);
  
  await client.end();
}

main();