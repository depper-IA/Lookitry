/**
 * Verificar accesibilidad de websites y detectar redes sociales
 */

const https = require('https');
const http = require('http');

const urls = [
  'https://www.mattelsa.net/',
  'https://www.aguabendita.com.co/',
  'https://www.almacenurbanchic.com/',
  'http://modafresca.com.co/',
  'https://www.eltemplodelamoda.com/',
  'https://dynamobrand.co/',
  'http://vivalavida.tienda/',
  'https://brklbrooklyn.com/',
  'https://www.stellacardona.com/',
];

async function checkUrl(websiteUrl) {
  return new Promise((resolve) => {
    if (!websiteUrl || !websiteUrl.startsWith('http')) {
      resolve({ url: websiteUrl, status: 'invalid', content: '' });
      return;
    }

    try {
      const urlObj = new URL(websiteUrl);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.get({
        hostname: urlObj.hostname,
        path: urlObj.pathname || '/',
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, res => {
        if (res.statusCode === 200) {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              url: websiteUrl,
              status: '✅ accesible',
              size: data.length,
              hasInstagram: /instagram/i.test(data),
              hasTiktok: /tiktok/i.test(data),
              hasFacebook: /facebook/i.test(data),
              content: data.substring(0, 500)
            });
          });
        } else {
          resolve({ url: websiteUrl, status: `⚠️ ${res.statusCode}`, content: '' });
        }
      });

      req.on('error', e => resolve({ url: websiteUrl, status: `❌ ${e.message}`, content: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ url: websiteUrl, status: '⏱️ timeout', content: '' }); });

    } catch (e) {
      resolve({ url: websiteUrl, status: `❌ ${e.message}`, content: '' });
    }
  });
}

async function main() {
  console.log('\n🔍 VERIFICANDO ACCESIBILIDAD DE WEBSITES\n');

  for (const url of urls) {
    const result = await checkUrl(url);
    console.log(`${result.status} ${url}`);
    if (result.size) {
      console.log(`   📄 Tamaño: ${result.size} bytes`);
      if (result.hasInstagram) console.log(`   ✅ Menciona Instagram`);
      if (result.hasTiktok) console.log(`   ✅ Menciona TikTok`);
      if (result.hasFacebook) console.log(`   ✅ Menciona Facebook`);
    }
    console.log('');
  }
}

main().catch(console.error);