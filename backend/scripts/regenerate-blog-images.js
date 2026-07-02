/**
 * Script para regenerar las imágenes de los artículos del blog
 * haciendo ping al webhook de generación de imágenes de n8n.
 */
require('dotenv').config({ path: 'C:/Users/Matt/Lookitry/backend/.env' });
const { Client } = require('pg');
const axios = require('axios');

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
    // 1. Obtenemos la configuración del webhook de imágenes del blog
    const configRes = await client.query(`SELECT image_generator_webhook, webhook_secret FROM blog_settings WHERE id = 1;`);
    const settings = configRes.rows[0];
    
    if (!settings || !settings.image_generator_webhook) {
      console.error('❌ No se encontró la URL del generador de imágenes (image_generator_webhook) en blog_settings.');
      process.exit(1);
    }

    const imageWebhookUrl = settings.image_generator_webhook;
    const secret = settings.webhook_secret || '';

    console.log(`📡 Webhook de generación encontrado: ${imageWebhookUrl}`);

    // 2. Obtenemos los últimos artículos publicados que tengan imagen en MinIO
    // (Asumiendo que cualquier artículo con URL de MinIO ya tenía imagen antes)
    const articlesRes = await client.query(`
      SELECT id, title, slug, featured_image 
      FROM blogs 
      WHERE status = 'published' AND featured_image LIKE '%minio.wilkiedevs.com%'
      ORDER BY created_at DESC
      LIMIT 20;
    `);

    if (articlesRes.rows.length === 0) {
      console.log('⚠️ No hay artículos con imágenes de MinIO para regenerar.');
      process.exit(0);
    }

    console.log(`\n🚀 Regenerando imágenes para ${articlesRes.rows.length} artículos...`);

    const results = [];
    for (const article of articlesRes.rows) {
      console.log(`\n📷 Procesando: ${article.title} (${article.id})`);
      try {
        const response = await axios.post(
          imageWebhookUrl,
          {
            triggered_by: 'manual_minio_restore',
            article_id: article.id,
            title: article.title,
            slug: article.slug,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(secret ? { 'X-Webhook-Secret': secret } : {}),
            },
            timeout: 30000,
            validateStatus: () => true
          }
        );
        console.log(`   -> Status: ${response.status}`);
        results.push({ id: article.id, status: response.status });
      } catch (err) {
        console.error(`   -> Error: ${err.message}`);
        results.push({ id: article.id, error: err.message });
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('❌ Error crítico:', error.message);
  } finally {
    await client.end();
  }
}

main();
