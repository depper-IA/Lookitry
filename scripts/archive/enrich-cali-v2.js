/**
 * Enriquecimiento de Redes Sociales - Mejorado
 * Busca patrones más amplios de redes sociales
 */

const https = require('https');
const http = require('http');

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

/**
 * Extract social handles from website content
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
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          req.destroy();
          const location = res.headers.location;
          if (location) {
            extractSocialHandles(location).then(resolve);
          } else {
            resolve({ instagram: null, tiktok: null, facebook: null });
          }
          return;
        }

        if (res.statusCode !== 200) {
          resolve({ instagram: null, tiktok: null, facebook: null });
          return;
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Strip scripts and styles
          let text = data
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .substring(0, 100000);

          // Extract from HTML attributes too
          const fullText = text + ' ' + data.substring(0, 100000);

          let instagram = null;
          let tiktok = null;
          let facebook = null;

          // INSTAGRAM patterns - more aggressive
          const igPatterns = [
            /instagram\.com\/([a-zA-Z0-9._](?:[a-zA-Z0-9._]|[a-zA-Z0-9]){1,30})/gi,
            /@([a-zA-Z0-9._]{3,30})/gi,
            /"instagram":\s*"@?([^"]+)"/gi,
            /data-instagram=["']([^"']+)["']/gi,
          ];

          for (const pattern of igPatterns) {
            if (instagram) break;
            const matches = fullText.match(pattern);
            if (matches) {
              for (const match of matches) {
                let username = match
                  .replace(/instagram\.com\//gi, '')
                  .replace(/@/g, '')
                  .replace(/"/g, '')
                  .replace(/data-instagram=/gi, '')
                  .replace(/data-instagram="|'/gi, '')
                  .split('/')[0]
                  .split('?')[0]
                  .trim();

                // Validate
                if (username && username.length >= 3 && username.length <= 30 &&
                    !username.includes('.') && !['instagram', 'com', 'https', 'http'].includes(username)) {
                  instagram = username;
                  break;
                }
              }
            }
          }

          // TIKTOK patterns
          const ttPatterns = [
            /tiktok\.com\/@([a-zA-Z0-9._]{3,24})/gi,
            /"tiktok":\s*"@?([^"]+)"/gi,
            /@([a-zA-Z0-9._]{3,24})/gi,
          ];

          for (const pattern of ttPatterns) {
            if (tiktok) break;
            const matches = fullText.match(pattern);
            if (matches) {
              for (const match of matches) {
                let username = match
                  .replace(/tiktok\.com\//gi, '')
                  .replace(/@/g, '')
                  .replace(/"/g, '')
                  .split('/')[0]
                  .split('?')[0]
                  .trim();

                if (username && username.length >= 3 && username.length <= 24 &&
                    !username.includes('.') && !['tiktok', 'vm', 'www'].includes(username)) {
                  tiktok = username;
                  break;
                }
              }
            }
          }

          // FACEBOOK patterns
          const fbPatterns = [
            /facebook\.com\/([a-zA-Z0-9.-]{1,50})/gi,
            /fb\.com\/([a-zA-Z0-9.-]{1,50})/gi,
            /"facebook":\s*"([^"]+)"/gi,
          ];

          for (const pattern of fbPatterns) {
            if (facebook) break;
            const matches = fullText.match(pattern);
            if (matches) {
              for (const match of matches) {
                let page = match
                  .replace(/facebook\.com\//gi, '')
                  .replace(/fb\.com\//gi, '')
                  .replace(/"/g, '')
                  .split('/')[0]
                  .split('?')[0]
                  .trim();

                if (page && page.length >= 1 && page.length <= 50 &&
                    !['facebook', 'pages', 'groups', 'plugins', 'sharer', 'sharer.php'].some(bad => page.toLowerCase().includes(bad))) {
                  facebook = 'https://facebook.com/' + page;
                  break;
                }
              }
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
  console.log('   ENRIQUECIMIENTO REDES SOCIALES v2');
  console.log('   Leads de CALI con website');
  console.log('===========================================\n');

  // Obtener leads de Cali con website
  console.log('📍 Obteniendo leads de Cali...\n');

  const leads = await get(
    `${SUPABASE_URL}/rest/v1/leads?city=ilike.*Cali*&website=not.is.null&source=eq.google_places&select=id,name,website,instagram,tiktok,facebook_url`
  );

  if (!leads || leads.length === 0) {
    console.log('❌ No se encontraron leads de Cali con website');
    return;
  }

  console.log(`✅ Encontrados ${leads.length} leads de Cali con website\n`);

  const toEnrich = leads.filter(l => !l.instagram || !l.tiktok || !l.facebook_url);
  console.log(`📊 Necesitan enrichment: ${toEnrich.length}\n`);

  if (toEnrich.length === 0) {
    console.log('✅ Todos los leads ya tienen redes sociales!');
    return;
  }

  // Enriquecer
  console.log('🔍 Extrayendo redes sociales...\n');

  let enriched = 0;
  let errors = 0;

  for (const lead of toEnrich) {
    if (!lead.website) continue;

    process.stdout.write(`  ${lead.name?.substring(0, 30)}... `);

    try {
      const social = await extractSocialHandles(lead.website);

      if (social.instagram || social.tiktok || social.facebook) {
        const updates = {};
        if (social.instagram && !lead.instagram) updates.instagram = social.instagram;
        if (social.tiktok && !lead.tiktok) updates.tiktok = social.tiktok;
        if (social.facebook && !lead.facebook_url) updates.facebook_url = social.facebook;

        if (Object.keys(updates).length > 0) {
          await patch(lead.id, updates);
          console.log('✅');
          if (updates.instagram) console.log(`     📸 @${updates.instagram}`);
          if (updates.tiktok) console.log(`     🎵 @${updates.tiktok}`);
          if (updates.facebook_url) console.log(`     📘 ${updates.facebook_url?.substring(0, 40)}`);
          enriched++;
        } else {
          console.log('⏭️');
        }
      } else {
        console.log('❌ No encontradas');
      }

      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      console.log('❌ Error:', err.message);
      errors++;
    }
  }

  // Resumen
  console.log('\n\n===========================================');
  console.log(`   RESULTADO: ${enriched} leads enriquecidos`);
  console.log('===========================================\n');

  // Verificar
  const final = await get(
    `${SUPABASE_URL}/rest/v1/leads?city=ilike.*Cali*&select=instagram,tiktok,facebook_url`
  );

  const withIg = final?.filter(l => l.instagram).length || 0;
  const withTk = final?.filter(l => l.tiktok).length || 0;
  const withFb = final?.filter(l => l.facebook_url).length || 0;

  console.log(`  📸 Con Instagram: ${withIg}`);
  console.log(`  🎵 Con TikTok: ${withTk}`);
  console.log(`  📘 Con Facebook: ${withFb}`);
  console.log('');
}

main().catch(console.error);