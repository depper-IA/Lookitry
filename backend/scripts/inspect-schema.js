/**
 * Inspect existing authors/blogs schema
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

  console.log('=== Tablas existentes ===');
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('authors', 'blogs')
    ORDER BY table_name;
  `);
  console.log(tables.rows.map(r => r.table_name).join(', '));

  console.log('\n=== Columnas de blogs ===');
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blogs'
    AND column_name LIKE '%author%' OR column_name = 'id'
    ORDER BY ordinal_position;
  `);
  console.log(cols.rows);

  console.log('\n=== Foreign keys de blogs ===');
  const fks = await client.query(`
    SELECT tc.constraint_name, kcu.column_name,
           ccu.table_schema AS foreign_table_schema,
           ccu.table_name AS foreign_table_name,
           ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'blogs';
  `);
  console.log(fks.rows);

  console.log('\n=== Total de blogs por status ===');
  const stats = await client.query(`
    SELECT status, COUNT(*) as count FROM public.blogs GROUP BY status;
  `);
  console.log(stats.rows);

  console.log('\n=== Blogs con author_id NULL (primeros 10) ===');
  const sample = await client.query(`
    SELECT id, title, status, author_id FROM public.blogs LIMIT 10;
  `);
  console.log(sample.rows);

  await client.end();
}

main();