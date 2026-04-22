/**
 * Verificador simple de leads - sin依赖 information_schema
 */

const https = require('https');

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_SERVICE_KEY = '***REMOVED-SECRET***';

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url, SUPABASE_URL);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(d); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('\n🔍 VERIFICACIÓN DEL SISTEMA DE LEADS\n');

  // Obtener leads de ejemplo
  const leads = await get(`${SUPABASE_URL}/rest/v1/leads?select=*&limit=10`);

  if (!leads || leads.length === 0) {
    console.log('❌ No hay leads en la tabla');
    return;
  }

  console.log(`✅ Hay ${leads.length} leads (muestra de 10)\n`);

  // Obtener los nombres de columnas del primer lead
  const columns = Object.keys(leads[0]);
  console.log('📋 Columnas disponibles:');
  columns.forEach(c => console.log(`   - ${c}`));

  // Contar stats usando aggregate
  console.log('\n\n📊 ESTADÍSTICAS:');

  // Total
  const total = await get(`${SUPABASE_URL}/rest/v1/leads?select=id`);
  console.log(`   Total leads: ${Array.isArray(total) ? total.length : 'error'}`);

  // Con phone ( filtrando)
  const withPhone = await get(`${SUPABASE_URL}/rest/v1/leads?phone=not.is.null&select=id`);
  console.log(`   Con phone: ${Array.isArray(withPhone) ? withPhone.length : 'error'}`);

  // Con website
  const withWeb = await get(`${SUPABASE_URL}/rest/v1/leads?website=not.is.null&select=id`);
  console.log(`   Con website: ${Array.isArray(withWeb) ? withWeb.length : 'error'}`);

  // Con email
  const withEmail = await get(`${SUPABASE_URL}/rest/v1/leads?email=not.is.null&select=id`);
  console.log(`   Con email: ${Array.isArray(withEmail) ? withEmail.length : 'error'}`);

  // Con instagram
  const withIg = await get(`${SUPABASE_URL}/rest/v1/leads?instagram=not.is.null&select=id`);
  console.log(`   Con instagram: ${Array.isArray(withIg) ? withIg.length : 'error'}`);

  // Con tiktok
  const withTk = await get(`${SUPABASE_URL}/rest/v1/leads?tiktok=not.is.null&select=id`);
  console.log(`   Con tiktok: ${Array.isArray(withTk) ? withTk.length : 'error'}`);

  // Con facebook_url
  const withFb = await get(`${SUPABASE_URL}/rest/v1/leads?facebook_url=not.is.null&select=id`);
  console.log(`   Con facebook_url: ${Array.isArray(withFb) ? withFb.length : 'error'}`);

  // Mostrar 3 leads de ejemplo
  console.log('\n\n📋 MUESTRA DE 3 LEADS COMPLETOS:');
  console.log('===========================================');

  for (let i = 0; i < Math.min(3, leads.length); i++) {
    const l = leads[i];
    console.log(`\n--- Lead ${i + 1} ---`);
    console.log(`Nombre:    ${l.name || '❌ SIN NOMBRE'}`);
    console.log(`Email:     ${l.email || '❌'}`);
    console.log(`Phone:     ${l.phone || '❌'}`);
    console.log(`Website:   ${l.website ? '✅' : '❌'}`);
    console.log(`Instagram: ${l.instagram || '❌'}`);
    console.log(`TikTok:    ${l.tiktok || '❌'}`);
    console.log(`Facebook:  ${l.facebook_url || '❌'}`);
    console.log(`Ciudad:    ${l.city || '❌'}`);
    console.log(`País:      ${l.country || '❌'}`);
    console.log(`Status:    ${l.status || '❌'}`);
    console.log(`Source:    ${l.source || '❌'}`);
  }

  console.log('\n===========================================');
}

main().catch(console.error);