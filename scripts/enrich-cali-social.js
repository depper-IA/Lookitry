/**
 * Enriquecimiento de Redes Sociales - Solo Leads de Cali
 *
 * Obtiene leads de Cali con website y ejecuta:
 * - Extracción de Instagram, TikTok, Facebook desde el website
 */

const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';

// Patrones para extraer redes sociales
const SOCIAL_PATTERNS = {
  instagram: {
    url: [/instagram\.com\/([a-zA-Z0-9._]+)/gi, /@([a-zA-Z0-9._]+)/gi],
    validate: (u) => u.length >= 3 && u.length <= 30 && !u.includes('.')
  },
  tiktok: {
    url: [/tiktok\.com\/@([a-zA-Z0-9._]+)/gi, /@([a-zA-Z0-9._]+)/gi],
    validate: (u) => u.length >= 3 && u.length <= 24 && !u.includes('.')
  },
  facebook: {
    url: [/facebook\.com\/([a-zA-Z0-9.-]+)/gi, /fb\.com\/([a-zA-Z0-9.-]+)/gi],
    validate: () => true
  }
};

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

function patch(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
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
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Fetch website content and extract social handles
 */
async function extractSocialHandles(website) {
  if (!website || !website.startsWith('http')) {
    return { instagram: null, tiktok: null, facebook: null };
  }

  return new Promise((resolve) => {
    try {
      const urlObj = new URL(website);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.get({
        hostname: urlObj.hostname,
        path: urlObj.pathname || '/',
        timeout: 10000
      }, res => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            req.destroy();
            extractSocialHandles(location).then(resolve);
            return;
          }
        }

        if (res.statusCode !== 200) {
          resolve({ instagram: null, tiktok: null, facebook: null });
          return;
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Strip HTML tags
          const text = data
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 50000);

          let instagram = null;
          let tiktok = null;
          let facebook = null;

          // Instagram
          for (const pattern of SOCIAL_PATTERNS.instagram.url) {
            const matches = text.match(pattern);
            if (matches) {
              for (const match of matches) {
                let username = match.replace(/https?:\/\/(www\.)?instagram\.com\//gi, '').replace('@', '').replace(/\/.*$/, '');
                if (username && SOCIAL_PATTERNS.instagram.validate(username)) {
                  instagram = username;
                  break;
                }
              }
              if (instagram) break;
            }
          }

          // TikTok
          for (const pattern of SOCIAL_PATTERNS.tiktok.url) {
            const matches = text.match(pattern);
            if (matches) {
              for (const match of matches) {
                let username = match.replace(/https?:\/\/(www\.|vm\.)?tiktok\.com\//gi, '').replace('@', '').replace(/\/.*$/, '');
                if (username && SOCIAL_PATTERNS.tiktok.validate(username)) {
                  tiktok = username;
                  break;
                }
              }
              if (tiktok) break;
            }
          }

          // Facebook
          for (const pattern of SOCIAL_PATTERNS.facebook.url) {
            const matches = text.match(pattern);
            if (matches) {
              for (const match of matches) {
                let page = match.replace(/https?:\/\/(www\.)?(facebook|fb)\.com\//gi, '');
                if (page && page.length > 0 && page.length < 50) {
                  facebook = 'https://facebook.com/' + page.replace(/\/.*$/, '');
                  break;
                }
              }
              if (facebook) break;
            }
          }

          resolve({ instagram, tiktok, facebook });
        });
      });

      req.on('error', () => resolve({ instagram: null, tiktok: null, facebook: null }));
      req.on('timeout', () => { req.destroy(); resolve({ instagram: null, tiktok: null, facebook: null }); });

    } catch {
      resolve({ instagram: null, tiktok: null, facebook: null });
    }
  });
}

async function main() {
  console.log('\n===========================================');
  console.log('   ENRIQUECIMIENTO REDES SOCIALES');
  console.log('   Leads de CALI con website');
  console.log('===========================================\n');

  // 1. Obtener leads de Cali con website
  console.log('📍 Obteniendo leads de Cali con website...\n');

  const leads = await get(
    `${SUPABASE_URL}/rest/v1/leads?city=ilike.*Cali*&website=not.is.null&source=eq.google_places&select=id,name,website,instagram,tiktok,facebook_url&limit=50`
  );

  if (!leads || leads.length === 0) {
    console.log('❌ No se encontraron leads de Cali con website');
    return;
  }

  console.log(`✅ Encontrados ${leads.length} leads de Cali con website\n`);

  // 2. Filtrar los que NO tienen redes sociales ya
  const toEnrich = leads.filter(l => !l.instagram && !l.tiktok && !l.facebook_url);

  console.log(`📊 Leads que necesitan enrichment: ${toEnrich.length}\n`);

  if (toEnrich.length === 0) {
    console.log('✅ Todos los leads de Cali ya tienen redes sociales!');
    return;
  }

  // 3. Enriquecer cada lead
  console.log('🔍 Extrayendo redes sociales de websites...\n');

  let enriched = 0;
  let errors = 0;

  for (const lead of toEnrich) {
    if (!lead.website) continue;

    process.stdout.write(`  📍 ${lead.name?.substring(0, 35)}... `);

    try {
      const social = await extractSocialHandles(lead.website);

      if (social.instagram || social.tiktok || social.facebook) {
        const updates = {};
        if (social.instagram) updates.instagram = social.instagram;
        if (social.tiktok) updates.tiktok = social.tiktok;
        if (social.facebook) updates.facebook_url = social.facebook;

        await patch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, updates);

        console.log('✅');
        if (social.instagram) console.log(`     📸 IG: @${social.instagram}`);
        if (social.tiktok) console.log(`     🎵 TT: @${social.tiktok}`);
        if (social.facebook) console.log(`     📘 FB: ${social.facebook?.substring(0, 40)}`);

        enriched++;
      } else {
        console.log('⏭️ Sin redes encontradas');
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.log('❌ Error');
      errors++;
    }
  }

  // 4. Resumen
  console.log('\n\n===========================================');
  console.log('   RESULTADO');
  console.log('===========================================');
  console.log(`\n  Leads procesados: ${toEnrich.length}`);
  console.log(`  Con nuevas redes: ${enriched}`);
  console.log(`  Errores: ${errors}`);

  // 5. Verificar resultado
  console.log('\n\n📊 VERIFICANDO RESULTADO:\n');

  const updated = await get(
    `${SUPABASE_URL}/rest/v1/leads?city=ilike.*Cali*&website=not.is.null&source=eq.google_places&select=instagram,tiktok,facebook_url`
  );

  const withIg = updated.filter(l => l.instagram).length;
  const withTk = updated.filter(l => l.tiktok).length;
  const withFb = updated.filter(l => l.facebook_url).length;

  console.log(`  📸 Con Instagram: ${withIg}`);
  console.log(`  🎵 Con TikTok: ${withTk}`);
  console.log(`  📘 Con Facebook: ${withFb}`);

  console.log('\n===========================================\n');
}

main().catch(console.error);