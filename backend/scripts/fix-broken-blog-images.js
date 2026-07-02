/**
 * Script para actualizar las imágenes rotas del blog
 * apuntándolas al placeholder local.
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

  const PLACEHOLDER_URL = '/images/blog-placeholder.webp';
  const MINIO_BROKEN_PREFIX = '%minio.wilkiedevs.com/images/web/%';

  try {
    // 1. Count how many rows will be affected
    const countRes = await client.query(`
      SELECT COUNT(*) 
      FROM public.blogs 
      WHERE featured_image LIKE $1 
        AND status = 'published';
    `, [MINIO_BROKEN_PREFIX]);
    
    const count = parseInt(countRes.rows[0].count, 10);
    console.log(`\n📊 Se actualizarán ${count} artículos con imágenes rotas.`);

    if (count === 0) {
      console.log('⚠️ No hay imágenes rotas que coincidan con el patrón. Nada que hacer.');
      await client.end();
      return;
    }

    // 2. Execute the update
    console.log(`\n🚀 Ejecutando UPDATE bulk en public.blogs...`);
    console.log(`   Destino: ${PLACEHOLDER_URL}`);
    
    const updateRes = await client.query(`
      UPDATE public.blogs 
      SET featured_image = $1
      WHERE featured_image LIKE $2 
        AND status = 'published'
      RETURNING id, title, featured_image;
    `, [PLACEHOLDER_URL, MINIO_BROKEN_PREFIX]);

    console.log(`\n✅ Se actualizaron ${updateRes.rowCount} filas.`);
    console.log('\n=== PRIMEROS 5 RESULTADOS ===');
    for (const row of updateRes.rows.slice(0, 5)) {
      console.log(`ID: ${row.id}`);
      console.log(`Título: ${row.title}`);
      console.log(`Nueva URL: ${row.featured_image}`);
      console.log('---');
    }

    if (updateRes.rowCount > 5) {
      console.log(`(y ${updateRes.rowCount - 5} más...)`);
    }

  } catch (error) {
    console.error('❌ Error ejecutando UPDATE:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada.');
  }
}

main();
