/**
 * Script de Enriquecimiento de Leads (JavaScript)
 *
 * Uso: node scripts/enrich-leads.js
 */

const https = require('https');

// Configuración
const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';
const GOOGLE_PLACES_API_KEY = 'AIzaSyAJ51_4EOFOeYg7D143dtHYosEW1XSgE5s';

/**
 * Hace request a Supabase
 */
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

/**
 * Obtiene Place Details de Google Places API
 */
function getPlaceDetails(placeId) {
  return new Promise((resolve) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}&fields=formatted_phone_number,website,formatted_address`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'OK' && result.result) {
            resolve({
              formatted_phone_number: result.result.formatted_phone_number || null,
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

/**
 * Actualiza un lead
 */
async function updateLead(leadId, updates) {
  const { error } = await supabaseRequest(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`, {
    method: 'PATCH',
    headers: {
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(updates)
  });
  return !error;
}

/**
 * Programa principal
 */
async function main() {
  console.log('\n🚀 ENRIQUECIMIENTO DE LEADS');
  console.log('================================\n');

  // 1. Verificar leads a enriquecer
  console.log('📊 Obteniendo leads sin phone/website...\n');

  const leadsResponse = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?source=eq.google_places&source_id=not.is.null&select=id,name,source_id,phone,website&or=(phone.is.null,website.is.null)&limit=50`,
    { method: 'GET' }
  );

  const leads = leadsResponse || [];
  console.log(`   Encontrados: ${leads.length} leads sin phone/website\n`);

  if (leads.length === 0) {
    console.log('✅ No hay leads que enriquecer');
    return;
  }

  // 2. Enriquecer cada lead
  console.log('🔍 Enriquciendo leads con Place Details API...\n');

  let enriched = 0;
  let skipped = 0;
  let errors = 0;

  for (const lead of leads) {
    if (!lead.source_id) {
      skipped++;
      continue;
    }

    process.stdout.write(`  📍 ${lead.name}... `);

    try {
      const details = await getPlaceDetails(lead.source_id);

      if (details) {
        const updates = {};

        if (details.formatted_phone_number && !lead.phone) {
          updates.phone = details.formatted_phone_number;
        }

        if (details.website && !lead.website) {
          updates.website = details.website;
        }

        if (Object.keys(updates).length > 0) {
          await updateLead(lead.id, updates);
          enriched++;
          console.log('✅');
          if (updates.phone) console.log(`     📞 ${updates.phone}`);
          if (updates.website) console.log(`     🌐 ${updates.website}`);
        } else {
          console.log('⏭️ Sin cambios');
          skipped++;
        }
      } else {
        console.log('❌ Sin detalles');
        errors++;
      }

      // Rate limiting - 100ms entre requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.log('❌ Error');
      errors++;
    }
  }

  // 3. Resumen
  console.log('\n================================');
  console.log('📊 RESUMEN');
  console.log('================================');
  console.log(`   Leads enriquecidos: ${enriched}`);
  console.log(`   Leads saltados: ${skipped}`);
  console.log(`   Errores: ${errors}`);
  console.log(`   Quota consumida: ~${leads.length - errors} requests de Place Details`);

  // 4. Estado actual
  console.log('\n📈 Estado actual de leads:');

  const totalRes = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?select=id&limit=1`,
    { method: 'GET', headers: { 'Prefer': 'count=exact' } }
  );

  const phoneRes = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?phone=not.is.null&select=id&limit=1`,
    { method: 'GET', headers: { 'Prefer': 'count=exact' } }
  );

  const websiteRes = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?website=not.is.null&select=id&limit=1`,
    { method: 'GET', headers: { 'Prefer': 'count=exact' } }
  );

  const emailRes = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?email=not.is.null&select=id&limit=1`,
    { method: 'GET', headers: { 'Prefer': 'count=exact' } }
  );

  console.log(`   Total leads: ${leadsResponse.length || 'N/A'}`);
  console.log('   Con phone: Revisar en dashboard');
  console.log('   Con website: Revisar en dashboard');
  console.log('   Con email: Revisar en dashboard');

  console.log('\n⚠️ IMPORTANTE: Google Places NUNCA devuelve emails.');
  console.log('   Para emails reales, necesitas Apify o scraping de websites.');
}

main().catch(console.error);