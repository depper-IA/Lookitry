/**
 * Verificacion FINAL del sistema de leads
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

async function count(field) {
  const res = await get(`${SUPABASE_URL}/rest/v1/leads?${field}=not.is.null&select=id`);
  return Array.isArray(res) ? res.length : 0;
}

async function main() {
  console.log('\n===========================================');
  console.log('   VERIFICACIÓN FINAL DEL SISTEMA DE LEADS');
  console.log('===========================================\n');

  const total = await count('id');
  const withPhone = await count('phone');
  const withWebsite = await count('website');
  const withEmail = await count('email');
  const withInstagram = await count('instagram');
  const withTiktok = await count('tiktok');
  const withFacebook = await count('facebook_url');

  console.log('📊 ESTADO DE DATOS:');
  console.log('-------------------------------------------');
  console.log(`  Total leads:          ${total}`);
  console.log(`  📞 Con phone:         ${withPhone} (${total > 0 ? Math.round(withPhone/total*100) : 0}%)`);
  console.log(`  🌐 Con website:       ${withWebsite} (${total > 0 ? Math.round(withWebsite/total*100) : 0}%)`);
  console.log(`  📧 Con email:        ${withEmail} (${total > 0 ? Math.round(withEmail/total*100) : 0}%)`);
  console.log(`  📸 Con Instagram:    ${withInstagram} (${total > 0 ? Math.round(withInstagram/total*100) : 0}%)`);
  console.log(`  🎵 Con TikTok:       ${withTiktok} (${total > 0 ? Math.round(withTiktok/total*100) : 0}%)`);
  console.log(`  📘 Con Facebook:      ${withFacebook} (${total > 0 ? Math.round(withFacebook/total*100) : 0}%)`);

  console.log('\n\n✅ LO QUE FUNCIONA:');
  console.log('-------------------------------------------');
  if (withPhone > 0) console.log('  ✅ Sistema de enriquecimiento con phone funciona');
  if (withWebsite > 0) console.log('  ✅ Sistema de enriquecimiento con website funciona');
  if (withInstagram > 0) console.log('  ✅ Instagram enriquecido');
  if (withTiktok > 0) console.log('  ✅ TikTok enriquecido');
  if (withFacebook > 0) console.log('  ✅ Facebook enriquecido');

  console.log('\n\n⚠️ LO QUE NECESITA ENRIQUECIMIENTO:');
  console.log('-------------------------------------------');
  if (withInstagram === 0 && withWebsite > 0) console.log('  📸 Instagram - necesita scraping de websites');
  if (withTiktok === 0 && withWebsite > 0) console.log('  🎵 TikTok - necesita scraping de websites');
  if (withFacebook === 0 && withWebsite > 0) console.log('  📘 Facebook - necesita scraping de websites');
  if (withEmail === 0) console.log('  📧 Email - NO disponible via Google Places');

  console.log('\n\n📋 MUESTRA DE 5 LEADS COMPLETOS:');
  console.log('-------------------------------------------');

  const leads = await get(`${SUPABASE_URL}/rest/v1/leads?select=*&limit=5`);
  if (leads && leads.length > 0) {
    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];
      console.log(`\n  Lead ${i + 1}: ${l.name}`);
      console.log(`    📞 Phone: ${l.phone || '❌'}`);
      console.log(`    🌐 Website: ${l.website ? '✅' : '❌'}`);
      console.log(`    📸 IG: ${l.instagram || '❌'} | 🎵 TT: ${l.tiktok || '❌'} | 📘 FB: ${l.facebook_url || '❌'}`);
      console.log(`    📍 ${l.city}, ${l.country}`);
    }
  }

  console.log('\n\n===========================================');
  console.log('   RESUMEN');
  console.log('===========================================');

  if (withPhone >= 100 && withWebsite >= 50) {
    console.log('\n  ✅ SISTEMA DE LEADS FUNCIONANDO');
    console.log(`     ${withPhone} leads con teléfono`);
    console.log(`     ${withWebsite} leads con website`);
    console.log('\n  📌 SIGUIENTE PASO RECOMENDADO:');
    console.log('     Enriquecer redes sociales (Instagram/TikTok)');
    console.log('     desde los websites de los negocios');
  } else {
    console.log('\n  ⚠️ Sistema necesita más enriquecimiento');
  }

  console.log('\n');
}

main().catch(console.error);