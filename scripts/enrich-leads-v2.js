/**
 * Script de Enriquecimiento de Leads - Versión 2
 * Procesa TODOS los leads restantes sin phone/website
 */

const https = require('https');

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_SERVICE_KEY = '***REMOVED-SECRET***';
const GOOGLE_PLACES_API_KEY = '***REMOVED-SECRET***';

function supabaseRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const headers = {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
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
    if (options.body) req.write(options.body);
    req.end();
  });
}

function getPlaceDetails(placeId) {
  return new Promise((resolve) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}&fields=formatted_phone_number,website`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'OK' && result.result) {
            resolve({
              phone: result.result.formatted_phone_number || null,
              website: result.result.website || null,
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function updateLead(leadId, updates) {
  await supabaseRequest(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify(updates)
  });
}

async function main() {
  console.log('\n🚀 ENRIQUECIMIENTO DE LEADS -剩余 (TODOS)\n');

  // Obtener TODOS los leads sin phone o website
  const leadsResponse = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?source=eq.google_places&source_id=not.is.null&select=id,name,source_id,phone,website&or=(phone.is.null,website.is.null)&limit=200`,
    { method: 'GET' }
  );

  const leads = leadsResponse || [];
  console.log(`📊 Leads restantes sin phone/website: ${leads.length}\n`);

  if (leads.length === 0) {
    console.log('✅ Todos los leads ya tienen datos!');
    return;
  }

  let enriched = 0;
  let errors = 0;

  for (const lead of leads) {
    if (!lead.source_id) continue;

    process.stdout.write(`📍 ${lead.name.substring(0, 40)}... `);

    try {
      const details = await getPlaceDetails(lead.source_id);

      if (details) {
        const updates = {};

        if (details.phone && !lead.phone) updates.phone = details.phone;
        if (details.website && !lead.website) updates.website = details.website;

        if (Object.keys(updates).length > 0) {
          await updateLead(lead.id, updates);
          enriched++;
          console.log('✅');
        } else {
          console.log('⏭️');
        }
      } else {
        console.log('❌');
        errors++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.log('❌ Error');
      errors++;
    }
  }

  console.log('\n================================');
  console.log('📊 RESULTADO FINAL');
  console.log('================================');
  console.log(`   Nuevos enriquecidos: ${enriched}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Quota consumida: ${leads.length} requests`);

  console.log('\n💡 Para verificar, ve a: https://lookitry.com/admin/leads');
}

main().catch(console.error);