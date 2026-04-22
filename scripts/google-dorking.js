#!/usr/bin/env node
/**
 * Google Dorking Email Finder - Busca emails usando Google Dorking
 *
 * METODO 1: DuckDuckGo (gratis, sin API key)
 * - No requiere API key
 * - Limitado a ~30 requests/minuto
 *
 * METODO 2: Google Custom Search API (requiere API key, gratis 100/day)
 * - Mas confiable
 * - Setup: https://developers.google.com/custom-search/v1/introduction
 *
 * PATRONES DE DORKING:
 * - site:dominio.com "@dominio.com"
 * - site:linkedin.com/in "CEO @dominio.com"
 * - "contacto@dominio.com"
 *
 * EJECUCION:
 *   node scripts/google-dorking.js
 */

const axios = require('../backend/node_modules/axios');

// Configuracion
const USE_DUCKDUCKGO = true; // Cambiar a false si usas Google API
const MAX_RESULTS_PER_DOMAIN = 5;

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';
const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';

async function getLeadsWithWebsites() {
  try {
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/leads?select=id,name,website,email&website=not.is.null&email=is.null&limit=200`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    return response.data.filter(l => l.website && l.email === null);
  } catch (error) {
    console.error('Error fetching leads:', error.message);
    return [];
  }
}

function extractDomain(website) {
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

async function searchWithDuckDuckGo(domain) {
  const queries = [
    `"@${domain}"`,
    `site:${domain} contact`,
    `"contact@${domain}"`
  ];

  const emails = new Set();

  for (const query of queries) {
    try {
      // Usar DuckDuckGo HTML (sin API key)
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      // Extraer emails del HTML
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = response.data.match(emailRegex) || [];

      matches.forEach(email => {
        // Filtrar emails genéricos
        if (!email.includes('noreply') && !email.includes('no-reply') && !email.includes('example')) {
          emails.add(email.toLowerCase());
        }
      });

      // Esperar entre requests
      await new Promise(r => setTimeout(r, 1500));

    } catch (error) {
      console.log(`    Error en búsqueda: ${error.message}`);
    }
  }

  return Array.from(emails);
}

async function searchWithGoogleAPI(domain) {
  // Si tienes Google API key, usa este metodo
  const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    console.log('    (Google API no configurada, usa modo DuckDuckGo)');
    return [];
  }

  const queries = [
    `"@${domain}"`,
    `site:${domain} contact`
  ];

  const emails = new Set();

  for (const query of queries) {
    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: GOOGLE_API_KEY,
          cx: GOOGLE_CSE_ID,
          q: query,
          num: MAX_RESULTS_PER_DOMAIN
        }
      });

      const items = response.data.items || [];
      for (const item of items) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = (item.snippet + ' ' + item.title).match(emailRegex) || [];
        matches.forEach(email => emails.add(email.toLowerCase()));
      }

      await new Promise(r => setTimeout(r, 1000));

    } catch (error) {
      console.log(`    Google API error: ${error.message}`);
    }
  }

  return Array.from(emails);
}

async function updateLeadEmail(leadId, email) {
  try {
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`,
      {
        email,
        enrichment_source: 'google_dorking',
        last_enriched_at: new Date().toISOString()
      },
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
    console.error('    Error updating DB:', error.message);
    return false;
  }
}

async function main() {
  console.log('=== GOOGLE DORKING EMAIL FINDER ===\n');

  console.log('Buscando leads sin email...');
  const leads = await getLeadsWithWebsites();
  console.log(`Encontrados ${leads.length} leads sin email\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const lead of leads) {
    if (!lead.website) {
      skipped++;
      continue;
    }

    const domain = extractDomain(lead.website);
    console.log(`Procesando: ${lead.name}`);
    console.log(`  Dominio: ${domain}`);

    let emails;
    if (USE_DUCKDUCKGO) {
      emails = await searchWithDuckDuckGo(domain);
    } else {
      emails = await searchWithGoogleAPI(domain);
    }

    if (emails.length > 0) {
      // Filtrar el email principal del dominio
      const primaryEmail = emails.find(e => e.includes(domain)) || emails[0];
      console.log(`  ✓ Email encontrado: ${primaryEmail}`);

      const updated = await updateLeadEmail(lead.id, primaryEmail);
      if (updated) {
        success++;
        console.log(`  ✓ Actualizado en DB`);
      } else {
        failed++;
      }
    } else {
      console.log(`  ✗ No se encontraron emails`);
      failed++;
    }

    console.log('');
    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('=== RESUMEN ===');
  console.log(`Exitos: ${success}`);
  console.log(`Fallidos: ${failed}`);
  console.log(`Omitidos: ${skipped}`);
}

main().catch(console.error);
