/**
 * Verificar leads con website especificamente
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
  console.log('\n🌐 VERIFICANDO LEADS CON WEBSITE\n');

  // Leads CON website
  const withWeb = await get(`${SUPABASE_URL}/rest/v1/leads?website=not.is.null&select=id,name,phone,website,instagram,tiktok,facebook_url&limit=20`);

  console.log(`Leads con website: ${Array.isArray(withWeb) ? withWeb.length : 'error'}\n`);

  if (withWeb && withWeb.length > 0) {
    console.log('Muestra de leads con website:');
    console.log('===========================================');
    for (let i = 0; i < Math.min(10, withWeb.length); i++) {
      const l = withWeb[i];
      console.log(`\n${i + 1}. ${l.name}`);
      console.log(`   Phone: ${l.phone || 'sin phone'}`);
      console.log(`   Website: ${l.website ? '✅ ' + l.website.substring(0, 50) + '...' : '❌'}`);
      console.log(`   Instagram: ${l.instagram || '❌'}`);
      console.log(`   TikTok: ${l.tiktok || '❌'}`);
      console.log(`   Facebook: ${l.facebook_url || '❌'}`);
    }
  }

  console.log('\n\n📱 VERIFICANDO LEADS CON PHONE\n');

  // Leads CON phone
  const withPhone = await get(`${SUPABASE_URL}/rest/v1/leads?phone=not.is.null&select=id,name,phone&limit=10`);

  console.log(`Leads con phone: ${Array.isArray(withPhone) ? withPhone.length : 'error'}\n`);

  if (withPhone && withPhone.length > 0) {
    console.log('Muestra de leads con phone:');
    for (let i = 0; i < Math.min(5, withPhone.length); i++) {
      const l = withPhone[i];
      console.log(`  ${l.name}: ${l.phone}`);
    }
  }

  console.log('\n\n📊 RESUMEN TOTAL:\n');

  const total = await get(`${SUPABASE_URL}/rest/v1/leads?select=id`);
  const totalArray = Array.isArray(total) ? total.length : 0;

  const webCount = Array.isArray(withWeb) ? withWeb.length : 0;
  const phoneCount = Array.isArray(withPhone) ? withPhone.length : 0;

  console.log(`  Total leads: ${totalArray}`);
  console.log(`  Con phone: ${phoneCount} (${totalArray > 0 ? Math.round(phoneCount/totalArray*100) : 0}%)`);
  console.log(`  Con website: ${webCount} (${totalArray > 0 ? Math.round(webCount/totalArray*100) : 0}%)`);
  console.log(`  Con instagram: necesitan enriquecimiento`);
  console.log(`  Con tiktok: necesitan enriquecimiento`);
  console.log(`  Con facebook_url: necesitan enriquecimiento`);
  console.log(`  Con email: NO DISPONIBLE via Google Places`);
}

main().catch(console.error);