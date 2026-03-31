const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function getProjectRef() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const match = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/i);
  if (!match) {
    throw new Error('No se pudo inferir el project ref desde SUPABASE_URL.');
  }
  return match[1];
}

async function main() {
  const relativeSqlPath = getArg('--file');
  if (!relativeSqlPath) {
    throw new Error('Debes indicar --file <ruta-sql>');
  }

  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbPassword) {
    throw new Error('Falta SUPABASE_DB_PASSWORD en backend/.env');
  }

  const sqlPath = path.resolve(__dirname, '..', '..', relativeSqlPath);
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`No existe el archivo SQL: ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const projectRef = getProjectRef();

  const client = new Client({
    host: 'aws-0-us-west-2.pooler.supabase.com',
    port: 5432,
    user: `postgres.${projectRef}`,
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query(sql);
    console.log(`[apply-sql-migration] SQL aplicado correctamente: ${relativeSqlPath}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[apply-sql-migration] Error:', error.message || error);
  process.exit(1);
});
