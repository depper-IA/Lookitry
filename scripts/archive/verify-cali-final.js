/**
 * Verificacion FINAL del sistema de leads de Cali
 */

const https = require('https');

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SB_KEY = '***REMOVED-SECRET***';

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url, SUPABASE_URL);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.end();
  });
}

function patch(id, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'vkdooutklowctuudjnkl.supabase.co',
      path: `/rest/v1/leads?id=eq.${id}`,
      method: 'PATCH',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('\n===========================================');
  console.log('   VERIFICACION FINAL - LEADS DE CALI');
  console.log('===========================================\n');

  // Obtener todos los leads de Cali
  const leads = await get(
    `${SUPABASE_URL}/rest/v1/leads?city=ilike.*Cali*&source=eq.google_places&select=*&limit=50`
  );

  if (!leads || leads.length === 0) {
    console.log('❌ No se encontraron leads');
    return;
  }

  console.log(`📊 Total leads de Cali: ${leads.length}\n`);

  // Leads con datos completos
  const withPhone = leads.filter(l => l.phone).length;
  const withWebsite = leads.filter(l => l.website).length;
  const withInstagram = leads.filter(l => l.instagram && l.instagram.length > 3).length;
  const withTiktok = leads.filter(l => l.tiktok && l.tiktok.length > 3).length;
  const withFacebook = leads.filter(l => l.facebook_url && !l.facebook_url.includes('profile.php')).length;

  console.log('📈 COBERTURA DE DATOS:');
  console.log('-------------------------------------------');
  console.log(`  📞 Con phone: ${withPhone}/${leads.length} (${Math.round(withPhone/leads.length*100)}%)`);
  console.log(`  🌐 Con website: ${withWebsite}/${leads.length} (${Math.round(withWebsite/leads.length*100)}%)`);
  console.log(`  📸 Con Instagram: ${withInstagram}/${leads.length} (${Math.round(withInstagram/leads.length*100)}%)`);
  console.log(`  🎵 Con TikTok: ${withTiktok}/${leads.length} (${Math.round(withTiktok/leads.length*100)}%)`);
  console.log(`  📘 Con Facebook: ${withFacebook}/${leads.length} (${Math.round(withFacebook/leads.length*100)}%)`);

  console.log('\n\n📋 LEADS CON REDES SOCIALES:');
  console.log('===========================================');

  const withSocial = leads.filter(l => l.instagram || l.tiktok || l.facebook_url);

  for (const lead of withSocial) {
    console.log(`\n  📍 ${lead.name}`);
    console.log(`     📞 ${lead.phone || 'sin phone'}`);
    if (lead.instagram) console.log(`     📸 @${lead.instagram}`);
    if (lead.tiktok) console.log(`     🎵 @${lead.tiktok}`);
    if (lead.facebook_url) console.log(`     📘 ${lead.facebook_url}`);
  }

  console.log('\n\n===========================================');
  console.log('   RESUMEN');
  console.log('===========================================');

  if (withPhone >= leads.length * 0.8 && withWebsite >= leads.length * 0.5) {
    console.log('\n  ✅ Sistema de CALI funcionando correctamente');
    console.log(`     ${withPhone} leads con phone`);
    console.log(`     ${withWebsite} leads con website`);
    console.log(`     ${withInstagram} leads con Instagram`);
    console.log(`     ${withTiktok} leads con TikTok`);
    console.log(`     ${withFacebook} leads con Facebook`);
  }

  console.log('\n');
}

main().catch(console.error);