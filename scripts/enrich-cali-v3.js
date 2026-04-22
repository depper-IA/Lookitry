/**
 * Enriquecimiento de Redes Sociales - FILTRADO
 * Solo acepta handles que parezcan cuentas reales de redes sociales
 */

const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';

// Bloquear falsos positivos (palabras que no son handles reales)
const BLOCKLIST = new Set([
  'whatsapp', 'context', 'media', 'charset', 'mobile', 'theme',
  'default', 'none', 'null', 'undefined', 'api', 'apps', 'localhost',
  'google', 'facebook', 'tiktok', 'instagram', 'twitter', 'youtube',
  'linkedin', 'pinterest', 'share', 'shareapi', 'ogimage', 'ogtitle',
  'plugin', 'analytics', 'pixel', 'tracking', 'js', 'css', 'font',
  'image', 'video', 'audio', 'file', 'path', 'url', 'href', 'src',
  'class', 'id', 'style', 'div', 'span', 'button', 'link', 'meta',
  'script', 'body', 'head', 'html', 'title', 'footer', 'header',
  'nav', 'menu', 'sidebar', 'main', 'content', 'section', 'article',
  'pinterest', 'woocommerce', 'shopify', 'magento', 'wordpress'
]);

// Handles ya verificados como VÁLIDOS
const VALID_HANDLES = {
  'urbanchicoficial': true,
  'dynamo_live': true,
  'brklbrooklyn': true,
  'stellacardonamoda': true,
  'cjboutiquecali': true,
  'almacenesurban': true,
  'dynamolivee': true,
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

function isValidHandle(username, platform) {
  if (!username) return false;

  const lower = username.toLowerCase();

  // Check blocklist
  if (BLOCKLIST.has(lower)) return false;

  // Check if it's a known valid handle
  if (VALID_HANDLES[lower]) return true;

  // Must have at least one letter or number mixed
  if (!/[a-zA-Z]/.test(username)) return false;
  if (!/[a-zA-Z0-9]/.test(username)) return false;

  // Length check per platform
  if (platform === 'instagram' && (username.length < 3 || username.length > 30)) return false;
  if (platform === 'tiktok' && (username.length < 3 || username.length > 24)) return false;

  // No special chars except underscore and dot
  if (!/^[a-zA-Z0-9._]+$/.test(username)) return false;

  // Should not be all numbers
  if (/^\d+$/.test(username)) return false;

  return true;
}

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
          const fullText = data.substring(0, 150000);

          let instagram = null;
          let tiktok = null;
          let facebook = null;

          // INSTAGRAM
          const igMatches = fullText.match(/instagram\.com\/([a-zA-Z0-9._](?:[a-zA-Z0-9._]){1,28})/gi) || [];
          for (const match of igMatches) {
            const username = match.replace(/instagram\.com\//gi, '').split('?')[0].split('/')[0];
            if (isValidHandle(username, 'instagram')) {
              instagram = username;
              break;
            }
          }

          // Also check @ mentions but be more careful
          if (!instagram) {
            const atMentions = fullText.match(/@"([a-zA-Z0-9._]{3,20})"/g) || [];
            for (const match of atMentions) {
              const username = match.replace(/@/g, '').replace(/"/g, '');
              if (isValidHandle(username, 'instagram')) {
                instagram = username;
                break;
              }
            }
          }

          // TIKTOK
          const ttMatches = fullText.match(/tiktok\.com\/@([a-zA-Z0-9._]{2,22})/gi) || [];
          for (const match of ttMatches) {
            const username = match.replace(/tiktok\.com\//gi, '').split('?')[0].split('/')[0];
            if (isValidHandle(username, 'tiktok')) {
              tiktok = username;
              break;
            }
          }

          // FACEBOOK - look for page URLs
          const fbMatches = fullText.match(/facebook\.com\/([a-zA-Z0-9.-]{2,40})/gi) || [];
          for (const match of fbMatches) {
            const page = match.replace(/facebook\.com\//gi, '').split('?')[0].split('/')[0];
            if (page && page.length >= 2 && page.length <= 40 &&
                !['pages', 'groups', 'plugins', 'sharer', 'login', 'settings', 'photos'].some(bad => page.toLowerCase().startsWith(bad))) {
              facebook = 'https://facebook.com/' + page;
              break;
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
  console.log('   ENRIQUECIMIENTO REDES SOCIALES v3');
  console.log('   FILTRADO DE handles válidos');
  console.log('===========================================\n');

  const leads = await get(
    `${SUPABASE_URL}/rest/v1/leads?city=ilike.*Cali*&website=not.is.null&select=id,name,website,instagram,tiktok,facebook_url`
  );

  if (!leads || leads.length === 0) {
    console.log('❌ No se encontraron leads');
    return;
  }

  console.log(`📊 Leads de Cali con website: ${leads.length}\n`);

  const toEnrich = leads.filter(l => !l.instagram || !l.tiktok || !l.facebook_url);
  console.log(`📊 Necesitan enrichment: ${toEnrich.length}\n`);

  let enriched = 0;

  for (const lead of toEnrich) {
    if (!lead.website) continue;

    process.stdout.write(`  ${lead.name?.substring(0, 30)}... `);

    try {
      const social = await extractSocialHandles(lead.website);

      const updates = {};
      if (social.instagram && !lead.instagram) updates.instagram = social.instagram;
      if (social.tiktok && !lead.tiktok) updates.tiktok = social.tiktok;
      if (social.facebook && !lead.facebook_url) updates.facebook_url = social.facebook;

      if (Object.keys(updates).length > 0) {
        await patch(lead.id, updates);
        console.log('✅');
        if (updates.instagram) console.log(`     📸 @${updates.instagram}`);
        if (updates.tiktok) console.log(`     🎵 @${updates.tiktok}`);
        if (updates.facebook_url) console.log(`     📘 ${updates.facebook_url}`);
        enriched++;
      } else {
        console.log('⏭️ Sin redes válidas');
      }

      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      console.log('❌ Error');
    }
  }

  console.log('\n\n===========================================');
  console.log(`   RESULTADO: ${enriched} leads procesados`);
  console.log('===========================================\n');

  // Stats finales
  const final = await get(
    `${SUPABASE_URL}/rest/v1/leads?city=ilike.*Cali*&select=instagram,tiktok,facebook_url`
  );

  console.log(`  📸 Con Instagram: ${final?.filter(l => l.instagram).length || 0}`);
  console.log(`  🎵 Con TikTok: ${final?.filter(l => l.tiktok).length || 0}`);
  console.log(`  📘 Con Facebook: ${final?.filter(l => l.facebook_url).length || 0}`);
  console.log('');
}

main().catch(console.error);