/**
 * Verify authors migration
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

  console.log('=== Authors creados ===');
  const authors = await client.query(`
    SELECT slug, name, role, expertise, is_active
    FROM public.authors ORDER BY slug;
  `);
  console.table(authors.rows);

  console.log('\n=== Distribución de artículos por autor ===');
  const dist = await client.query(`
    SELECT a.name AS author, COUNT(b.id) AS article_count
    FROM public.authors a
    LEFT JOIN public.blogs b ON b.author_id = a.id AND b.status = 'published'
    GROUP BY a.id, a.name
    ORDER BY a.name;
  `);
  console.table(dist.rows);

  console.log('\n=== Artículos sin autor (debería ser 0) ===');
  const orphan = await client.query(`
    SELECT COUNT(*) as count FROM public.blogs WHERE author_id IS NULL AND status = 'published';
  `);
  console.log(`Sin autor: ${orphan.rows[0].count}`);

  console.log('\n=== Muestra de 5 artículos con autor asignado ===');
  const sample = await client.query(`
    SELECT b.title, a.name AS author, b.published_at
    FROM public.blogs b
    JOIN public.authors a ON a.id = b.author_id
    WHERE b.status = 'published'
    ORDER BY b.published_at DESC
    LIMIT 5;
  `);
  console.table(sample.rows);

  await client.end();
}

main();