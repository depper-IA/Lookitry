/**
 * Limpiar handles inválidos y verificar los válidos
 */

const https = require('https');

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';

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

// Handles inválidos conocidos (falsos positivos)
const INVALID_HANDLES = new Set([
  'whatsapp', 'context', 'media', 'charset', 'mobile', 'theme',
  'ogimage', 'ogtitle', 'ogdescription', 'default', 'none', 'null'
]);

function isInvalid(username) {
  if (!username) return false;
  return INVALID_HANDLES.has(username.toLowerCase());
}

async function main() {
  console.log('\n===========================================');
  console.log('   LIMPIEZA DE HANDLES INVÁLIDOS');
  console.log('   Leads de CALI');
  console.log('===========================================\n');

  // Obtener todos los leads de Cali
  const leads = await get(
    `${SUPABASE_URL}/rest/v1/leads?city=ilike.*Cali*&select=id,name,instagram,tiktok,facebook_url`
  );

  if (!leads || leads.length === 0) {
    console.log('❌ No se encontraron leads');
    return;
  }

  console.log(`📊 Total leads de Cali: ${leads.length}\n`);

  let cleanedIg = 0, cleanedTk = 0;
  let validIg = 0, validTk = 0;

  for (const lead of leads) {
    const updates = {};
    let needsUpdate = false;

    // Limpiar Instagram inválido
    if (lead.instagram) {
      if (isInvalid(lead.instagram)) {
        updates.instagram = null;
        cleanedIg++;
        needsUpdate = true;
      } else {
        validIg++;
      }
    }

    // Limpiar TikTok inválido
    if (lead.tiktok) {
      if (isInvalid(lead.tiktok)) {
        updates.tiktok = null;
        cleanedTk++;
        needsUpdate = true;
      } else {
        validTk++;
      }
    }

    if (needsUpdate) {
      await patch(lead.id, updates);
      console.log(`  🧹 Limpiado: ${lead.name?.substring(0, 30)}`);
      if (updates.instagram === null) console.log(`     📸 Eliminó: @${lead.instagram}`);
      if (updates.tiktok === null) console.log(`     🎵 Eliminó: @${lead.tiktok}`);
    }
  }

  console.log('\n\n===========================================');
  console.log('   RESULTADO DE LIMPIEZA');
  console.log('===========================================');
  console.log(`\n  Instagram válidos: ${validIg}`);
  console.log(`  Instagram limpiados: ${cleanedIg}`);
  console.log(`  TikTok válidos: ${validTk}`);
  console.log(`  TikTok limpiados: ${cleanedTk}`);

  // Mostrar handles válidos
  console.log('\n\n📋 HANDLES VÁLIDOS ENCONTRADOS:');
  console.log('===========================================');

  const withSocials = leads.filter(l => l.instagram || l.tiktok || l.facebook_url);

  for (const lead of withSocials) {
    if (!isInvalid(lead.instagram) || !isInvalid(lead.tiktok)) {
      console.log(`\n  ${lead.name}`);
      if (lead.instagram && !isInvalid(lead.instagram)) console.log(`     📸 @${lead.instagram}`);
      if (lead.tiktok && !isInvalid(lead.tiktok)) console.log(`     🎵 @${lead.tiktok}`);
      if (lead.facebook_url) console.log(`     📘 ${lead.facebook_url}`);
    }
  }

  console.log('\n');
}

main().catch(console.error);