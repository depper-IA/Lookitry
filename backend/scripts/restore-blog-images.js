/**
 * Script para restaurar las URLs reales de las imágenes del blog
 * desde la tabla blog_topic_images a blogs.featured_image.
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
  console.log('🔌 Conectado a la base de datos de Supabase...');

  try {
    // 1. Buscamos los artículos que actualmente tienen la imagen placeholder
    const placeholderUrl = '/images/blog-placeholder.webp';
    const blogsRes = await client.query(`
      SELECT id, title, topic_id, featured_image 
      FROM public.blogs 
      WHERE featured_image = $1 AND status = 'published';
    `, [placeholderUrl]);

    console.log(`\n📊 Encontrados ${blogsRes.rows.length} artículos usando la imagen placeholder.`);

    if (blogsRes.rows.length === 0) {
      console.log('⚠️ No hay artículos con placeholder para restaurar. Nada que hacer.');
      await client.end();
      return;
    }

    console.log('\n🚀 Iniciando restauración de imágenes reales...');
    
    let restoredCount = 0;
    for (const blog of blogsRes.rows) {
      if (!blog.topic_id) {
        console.log(`   ⚠️ El artículo "${blog.title}" no tiene un topic_id asociado. No se puede restaurar.`);
        continue;
      }

      // Buscamos la imagen correspondiente en blog_topic_images
      const imageRes = await client.query(`
        SELECT imagen_hero_url 
        FROM public.blog_topic_images 
        WHERE topic_id = $1 AND status = 'completed';
      `, [blog.topic_id]);

      const imageRecord = imageRes.rows[0];
      if (!imageRecord || !imageRecord.imagen_hero_url) {
        console.log(`   ⚠️ No se encontró una imagen hero completada para el topic ${blog.topic_id} (artículo: "${blog.title}").`);
        continue;
      }

      const realImageUrl = imageRecord.imagen_hero_url;
      
      // Actualizamos la URL en blogs
      await client.query(`
        UPDATE public.blogs 
        SET featured_image = $1 
        WHERE id = $2;
      `, [realImageUrl, blog.id]);

      console.log(`   ✅ Restaurado: "${blog.title}" -> ${realImageUrl}`);
      restoredCount++;
    }

    console.log(`\n🎉 Restauración completa. Se restauraron ${restoredCount} de ${blogsRes.rows.length} artículos.`);

  } catch (error) {
    console.error('❌ Error ejecutando la restauración:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada.');
  }
}

main();