/**
 * Script para ejecutar migración de facebook_url
 */

const https = require('https');

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';

function supabaseRPC(functionName, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ function_name: functionName, function_params: params });

    const req = https.request({
      hostname: 'vkdooutklowctuudjnkl.supabase.co',
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function checkColumn() {
  const { data } = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/information_schema.columns?table_name=eq.leads&column_name=eq.facebook_url`,
    { method: 'GET' }
  );
  return data && data.length > 0;
}

function supabaseRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const headers = {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function main() {
  console.log('\n🔧 VERIFICANDO MIGRACIÓN DE facebook_url...\n');

  const exists = await checkColumn();

  if (exists) {
    console.log('✅ Columna facebook_url YA existe en la tabla leads');
  } else {
    console.log('⚠️ Columna facebook_url NO existe');
    console.log('\n📝 Para agregar la columna, ejecuta en Supabase SQL Editor:');
    console.log(`
ALTER TABLE leads ADD COLUMN facebook_url VARCHAR(500);
CREATE INDEX IF NOT EXISTS idx_leads_facebook_url ON leads(facebook_url);
    `);
  }

  // Verificar tiktok
  const tiktokExists = await checkColumn('tiktok');
  console.log(tiktokExists ? '✅ Columna tiktok existe' : '⚠️ Columna tiktok NO existe');

  console.log('\n💡 Puedes agregar las columnas manualmente en Supabase Dashboard → SQL Editor');
}

main().catch(console.error);