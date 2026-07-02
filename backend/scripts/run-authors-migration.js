/**
 * Run authors migration on production Supabase
 */
require('dotenv').config({ path: 'C:/Users/Matt/Lookitry/backend/.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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
  console.log('Conectado a Supabase production...');

  const migrationPath = 'C:/Users/Matt/Lookitry/backend/migrations/20260702_create_authors_table.sql';
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Ejecutando migración...');
  try {
    await client.query(sql);
    console.log('\nMigración ejecutada exitosamente!\n');
  } catch (err) {
    console.error('Error en migración:', err.message);
    await client.end();
    process.exit(1);
  }

  await client.end();
}

main();