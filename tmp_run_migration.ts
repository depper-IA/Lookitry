
import { Client } from 'pg';

async function run() {
  const client = new Client({
    host: 'db.vkdooutklowctuudjnkl.supabase.co',
    port: 5432,
    user: 'postgres',
    password: '3G9TJHZSShva2rXq',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado a PostgreSQL');

    const sql = `
      ALTER TABLE brands
        ADD COLUMN IF NOT EXISTS api_key UUID UNIQUE DEFAULT gen_random_uuid();

      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS external_id VARCHAR;
    `;

    console.log('Ejecutando migración...');
    await client.query(sql);
    console.log('Migración completada exitosamente.');

    const { rows } = await client.query('SELECT slug, api_key FROM brands LIMIT 5');
    console.log('Marcas actualizadas (muestra):', JSON.stringify(rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
