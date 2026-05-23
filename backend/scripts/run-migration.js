/**
 * Run database migration using Supabase Management API
 * Usage: node scripts/run-migration.js [migration_name]
 * Requires: SUPABASE_ACCESS_TOKEN env var
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'vkdooutklowctuudjnkl';

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const token = process.env.SUPABASE_ACCESS_TOKEN;
    if (!token) {
      reject(new Error('SUPABASE_ACCESS_TOKEN not set'));
      return;
    }

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': token,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) resolve(JSON.parse(data));
        else reject(new Error(`Status ${res.statusCode}: ${data.substring(0, 500)}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const migrationName = process.argv[2] || 'rebecca_message_ratings';
  const migrationFile = path.join(__dirname, '../migrations', `20260523_add_${migrationName}.sql`);

  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Migration file not found:', migrationFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');
  console.log('🔄 Ejecutando migración:', migrationName);

  try {
    const result = await runSQL(sql);
    console.log('✅ Migración exitosa');
    console.log('Result:', JSON.stringify(result).substring(0, 200));
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    console.log('\n⚠️ Ejecuta manualmente en Supabase Dashboard SQL Editor.');
    process.exit(1);
  }
}

main();