/**
 * Script para revisar las URLs de las imágenes en la tabla blogs
 */
require('dotenv').config({ path: 'C:/Users/Matt/Lookitry/backend/.env' });
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
  console.log('🔌 Conectado a Supabase...');

  try {
    const res = await client.query(`
      SELECT id, title, slug, featured_image, status 
      FROM blogs 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);
    
    console.log('\n=== ÚLTIMOS 10 ARTÍCULOS DEL BLOG ===');
    for (const row of res.rows) {
      console.log(`\nID: ${row.id}`);
      console.log(`Título: ${row.title}`);
      console.log(`Slug: ${row.slug}`);
      console.log(`Estado: ${row.status}`);
      console.log(`Featured Image: ${row.featured_image}`);
    }

  } catch (error) {
    console.error('❌ Error consultando la tabla blogs:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada.');
  }
}

main();
