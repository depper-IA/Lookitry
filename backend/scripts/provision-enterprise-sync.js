require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function getProjectRef() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const match = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/i);
  if (!match) {
    throw new Error('No se pudo inferir el project ref desde SUPABASE_URL.');
  }
  return match[1];
}

async function main() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbPassword) {
    throw new Error('Falta SUPABASE_DB_PASSWORD en backend/.env');
  }

  const projectRef = getProjectRef();
  const sqlPath = path.resolve(__dirname, '..', '..', 'supabase', 'migrations', '20260329_enterprise_sync_setup.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    host: `aws-0-us-west-2.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${projectRef}`,
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query(sql);
    const { rows } = await client.query(`
      select
        to_regclass('public.enterprise_sync_configs') as table_name,
        exists(select 1 from pg_proc where proname = 'increment_sync_count') as has_increment_sync_count
    `);
    console.log(JSON.stringify(rows[0], null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
