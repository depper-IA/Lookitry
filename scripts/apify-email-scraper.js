#!/usr/bin/env node
/**
 * Apify Email Scraper - Busca emails en websites de leads
 *
 * PASOS:
 * 1. Crea cuenta gratis en https://apify.com
 * 2. Consigue tu API token en https://console.apify.com/settings/integrations
 * 3. Exporta: export APIFY_API_TOKEN=tu_token_aqui
 * 4. Ejecuta: node scripts/apify-email-scraper.js
 *
 * COSTO: ~$0.01 por website (plan gratis tiene $5 credito)
 * 104 websites = ~$1
 */

const axios = require('../backend/node_modules/axios');

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const LEADS_WITH_WEBSITES = [
  // Esta lista se preencherá automaticamente si ejecutas sin argumentos
];

// Websites de los leads actuales (ejemplo)
const LEAD_WEBSITES = [
  // Los websites se cargarán de la base de datos
];

async function getLeadsWithWebsites() {
  const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';

  try {
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/leads?select=id,name,website,email&website=not.is.null&email=is.null&limit=200`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    return response.data.filter(l => l.website && l.email === null);
  } catch (error) {
    console.error('Error fetching leads:', error.message);
    return [];
  }
}

async function scrapeEmailsWithApify(website) {
  const url = website.startsWith('http') ? website : `https://${website}`;

  try {
    // Usar el actor de Apify para extraer emails
    // Actor: https://apify.com/apify/website-actor-email-extractor
    const response = await axios.post(
      'https://api.apify.com/v2/acts/apify~website-actor-email-extractor/runs',
      {
        startUrls: [{ url }],
        emails: { includePhones: false }
      },
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const runId = response.data.data.id;

    // Esperar resultado
    console.log(`  Iniciando scraper para ${website}... (Run ID: ${runId})`);

    // Poll para resultado
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 10000)); // 10s

      const statusResponse = await axios.get(
        `https://api.apify.com/v2/acts/apify~website-actor-email-extractor/runs/${runId}`,
        { headers: { 'Authorization': `Bearer ${APIFY_API_TOKEN}` } }
      );

      if (statusResponse.data.data.status === 'SUCCEEDED') {
        const datasetId = statusResponse.data.data.defaultDatasetId;

        const datasetResponse = await axios.get(
          `https://api.apify.com/v2/datasets/${datasetId}/items`,
          { headers: { 'Authorization': `Bearer ${APIFY_API_TOKEN}` } }
        );

        const emails = datasetResponse.data[0]?.emails || [];
        return emails.map(e => e.email).filter(Boolean);
      }

      attempts++;
    }

    return [];
  } catch (error) {
    console.error(`  Error con ${website}:`, error.response?.data || error.message);
    return [];
  }
}

async function updateLeadEmail(leadId, email) {
  const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';

  try {
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`,
      { email, enrichment_source: 'apify_email_scraper' },
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error updating lead:', error.message);
    return false;
  }
}

async function main() {
  if (!APIFY_API_TOKEN) {
    console.log('ERROR: necesitas exportar APIFY_API_TOKEN');
    console.log('1. Crea cuenta en https://apify.com');
    console.log('2. Ve a https://console.apify.com/settings/integrations');
    console.log('3. Copia tu API token');
    console.log('4. Ejecuta: export APIFY_API_TOKEN=tu_token_y_node_scripts/apify-email-scraper.js');
    process.exit(1);
  }

  console.log('Buscando leads sin email...');
  const leads = await getLeadsWithWebsites();
  console.log(`Encontrados ${leads.length} leads sin email\n`);

  let success = 0;
  let failed = 0;

  for (const lead of leads) {
    if (!lead.website) continue;

    console.log(`Procesando: ${lead.name}`);
    console.log(`  Website: ${lead.website}`);

    const emails = await scrapeEmailsWithApify(lead.website);

    if (emails.length > 0) {
      console.log(`  ✓ Emails encontrados: ${emails.join(', ')}`);

      // Actualizar el primer email encontrado
      const updated = await updateLeadEmail(lead.id, emails[0]);
      if (updated) {
        console.log(`  ✓ Actualizado en DB`);
        success++;
      } else {
        failed++;
      }
    } else {
      console.log(`  ✗ No se encontraron emails`);
      failed++;
    }

    // Rate limiting - esperar entre requests
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Exitos: ${success}`);
  console.log(`Fallidos: ${failed}`);
}

main().catch(console.error);
