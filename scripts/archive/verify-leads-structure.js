/**
 * Verificador de estructura de leads
 */

const https = require('https');

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';

function supabaseRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const headers = {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    };

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
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
    req.end();
  });
}

async function main() {
  console.log('\n🔍 VERIFICANDO ESTRUCTURA DE LA TABLA LEADS\n');

  // Obtener estructura de columnas
  const columns = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/information_schema.columns?table_name=eq.leads&select=column_name,data_type`
  );

  console.log('Columnas en tabla leads:');
  console.log('========================');

  const columnNames = [];
  if (columns && Array.isArray(columns)) {
    for (const col of columns) {
      console.log(`  ${col.column_name} (${col.data_type})`);
      columnNames.push(col.column_name);
    }
  } else {
    console.log('  (No se pudieron obtener las columnas)');
  }

  console.log('\nVerificando columnas necesarias:');
  console.log('========================');

  const needed = ['facebook_url', 'tiktok', 'instagram', 'email', 'phone', 'website', 'name'];
  for (const col of needed) {
    const exists = columnNames.includes(col);
    console.log(`  ${exists ? '✅' : '❌'} ${col}`);
  }

  // Verificar datos
  console.log('\n\n📊 ESTADO ACTUAL DE DATOS');
  console.log('========================');

  const leadsRes = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?select=id,phone,website,instagram,tiktok,facebook_url&limit=5`
  );

  if (leadsRes && leadsRes.length > 0) {
    console.log('\nMuestra de 5 leads:');
    for (const lead of leadsRes) {
      console.log(`\n  📍 ${lead.name || 'Sin nombre'}`);
      console.log(`     Phone: ${lead.phone || '❌ sin phone'}`);
      console.log(`     Website: ${lead.website ? '✅ tiene' : '❌ sin website'}`);
      console.log(`     Instagram: ${lead.instagram || '❌ sin instagram'}`);
      console.log(`     TikTok: ${lead.tiktok || '❌ sin tiktok'}`);
      console.log(`     Facebook: ${lead.facebook_url || '❌ sin facebook'}`);
    }
  }

  // Contar con phone
  const countPhone = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?phone=not.is.null&select=id`
  );
  console.log(`\n📞 Leads con phone: ${countPhone?.length || 0}`);

  // Contar con website
  const countWeb = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?website=not.is.null&select=id`
  );
  console.log(`🌐 Leads con website: ${countWeb?.length || 0}`);

  // Contar con instagram
  const countIg = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?instagram=not.is.null&select=id`
  );
  console.log(`📸 Leads con Instagram: ${countIg?.length || 0}`);

  // Total
  const total = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?select=id`
  );
  console.log(`📊 Total leads: ${total?.length || 0}`);
}

main().catch(console.error);