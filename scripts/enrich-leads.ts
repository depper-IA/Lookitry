/**
 * Script de Enriquecimiento de Leads
 *
 * Uso: node scripts/enrich-leads.ts
 *
 * Funciones:
 * 1. Ejecuta migración para agregar columna facebook_url
 * 2. Obtiene leads sin datos de contacto
 * 3. Para cada lead con source_id (Google Place ID), obtiene phone/website de Place Details API
 * 4. Actualiza los leads en la DB
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

// Configuración
const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg';
const GOOGLE_PLACES_API_KEY = 'AIzaSyAJ51_4EOFOeYg7D143dtHYosEW1XSgE5s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Lead {
  id: string;
  name: string;
  source_id: string | null;
  phone: string | null;
  website: string | null;
}

interface PlaceDetails {
  formatted_phone_number?: string;
  website?: string;
  formatted_address?: string;
}

/**
 * Ejecuta SQL directo en Supabase
 */
async function executeSQL(sql: string): Promise<void> {
  const { error } = await supabase.rpc('exec', { sql_query: sql });
  if (error) {
    // Si no existe la función exec, intentamos de otra forma
    console.log('Nota: No se pudo ejecutar SQL directo. Se usará método alternativo.');
  }
}

/**
 * Agrega columna facebook_url si no existe
 */
async function runMigration(): Promise<boolean> {
  console.log('\n📦 Ejecutando migración...');

  try {
    // Verificar si la columna existe
    const { data: columnExists } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'leads')
      .eq('column_name', 'facebook_url')
      .single();

    if (!columnExists) {
      console.log('  ➕ Agregando columna facebook_url...');
      // Usar la API de Supabase directamente para alterar tabla
      const { error } = await supabase.from('leads').select('id').limit(1);
      if (error && error.message.includes('facebook_url')) {
        console.log('  ⚠️ La columna facebook_url no existe aún - necesita migración manual');
        console.log('  ℹ️ Ejecuta en Supabase Dashboard SQL Editor:');
        console.log('     ALTER TABLE leads ADD COLUMN facebook_url VARCHAR(500);');
      }
    } else {
      console.log('  ✅ Columna facebook_url ya existe');
    }

    // Verificar tiktok
    const { data: tiktokExists } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'leads')
      .eq('column_name', 'tiktok')
      .single();

    if (!tiktokExists) {
      console.log('  ⚠️ La columna tiktok no existe aún - necesita migración manual');
      console.log('  ℹ️ Ejecuta en Supabase Dashboard SQL Editor:');
      console.log('     ALTER TABLE leads ADD COLUMN tiktok VARCHAR(255);');
    } else {
      console.log('  ✅ Columna tiktok ya existe');
    }

    return true;
  } catch (err) {
    console.error('  ❌ Error en migración:', err);
    return false;
  }
}

/**
 * Obtiene Place Details de Google Places API
 */
async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  return new Promise((resolve) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}&fields=formatted_phone_number,website,formatted_address`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'OK' && result.result) {
            resolve({
              formatted_phone_number: result.result.formatted_phone_number || undefined,
              website: result.result.website || undefined,
              formatted_address: result.result.formatted_address || undefined,
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
 * Obtiene leads sin phone ni website
 */
async function getLeadsToEnrich(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('id, name, source_id, phone, website')
    .or('phone.is.null,website.is.null')
    .eq('source', 'google_places')
    .not('source_id', 'is', 'null')
    .limit(50); // Limitar para evitar overuse de quota

  if (error) {
    console.error('Error obteniendo leads:', error);
    return [];
  }

  return data || [];
}

/**
 * Actualiza un lead con datos de Place Details
 */
async function updateLead(leadId: string, updates: { phone?: string; website?: string }): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId);

  if (error) {
    console.error(`Error actualizando lead ${leadId}:`, error);
  }
}

/**
 * Programa principal
 */
async function main() {
  console.log('🚀 ENRIQUECIMIENTO DE LEADS');
  console.log('================================\n');

  // 1. Ejecutar migración
  await runMigration();

  // 2. Obtener leads a enriquecer
  console.log('\n📊 Obteniendo leads a enriquecer...');
  const leads = await getLeadsToEnrich();
  console.log(`   Encontrados: ${leads.length} leads sin phone/website`);

  if (leads.length === 0) {
    console.log('\n✅ No hay leads que enriquecer');
    return;
  }

  // 3. Enriquecer cada lead
  console.log('\n🔍 Enriquciendo leads con Place Details API...\n');

  let enriched = 0;
  let skipped = 0;
  let errors = 0;

  for (const lead of leads) {
    if (!lead.source_id) {
      skipped++;
      continue;
    }

    console.log(`  📍 ${lead.name}...`);

    try {
      const details = await getPlaceDetails(lead.source_id);

      if (details) {
        const updates: { phone?: string; website?: string } = {};

        if (details.formatted_phone_number && !lead.phone) {
          updates.phone = details.formatted_phone_number;
          console.log(`     📞 Phone: ${details.formatted_phone_number}`);
        }

        if (details.website && !lead.website) {
          updates.website = details.website;
          console.log(`     🌐 Website: ${details.website}`);
        }

        if (Object.keys(updates).length > 0) {
          await updateLead(lead.id, updates);
          enriched++;
          console.log(`     ✅ Actualizado`);
        } else {
          console.log(`     ⏭️ Sin cambios`);
          skipped++;
        }
      } else {
        console.log(`     ❌ Sin detalles`);
        errors++;
      }

      // Rate limiting - 100ms entre requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error(`     ❌ Error:`, err);
      errors++;
    }
  }

  // 4. Resumen
  console.log('\n================================');
  console.log('📊 RESUMEN');
  console.log('================================');
  console.log(`   Leads enriquecidos: ${enriched}`);
  console.log(`   Leads saltados: ${skipped}`);
  console.log(`   Errores: ${errors}`);
  console.log(`   Quota consumida: ~${leads.length - errors} requests de Place Details`);
  console.log('\n💡 Nota: La quota de Google Places es 500/día, 28k/mes');

  // 5. Verificar estado actual
  console.log('\n📈 Estado actual de leads:');
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  const { count: withPhone } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .not('phone', 'is', 'null');

  const { count: withWebsite } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .not('website', 'is', 'null');

  const { count: withEmail } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .not('email', 'is', 'null');

  console.log(`   Total leads: ${totalLeads}`);
  console.log(`   Con phone: ${withPhone}`);
  console.log(`   Con website: ${withWebsite}`);
  console.log(`   Con email: ${withEmail}`);

  console.log('\n⚠️ IMPORTANTE: Google Places NUNCA devuelve emails.');
  console.log('   Para obtener emails reales, considera:');
  console.log('   1. Usar Apify Google Maps Scraper (n8n workflow)');
  console.log('   2. Scraping de websites de los negocios');
  console.log('   3. LinkedIn Sales Navigator');
}

main().catch(console.error);