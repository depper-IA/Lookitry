/**
 * Verificador completo del sistema de leads
 */

const https = require('https');

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_SERVICE_KEY = '***REMOVED-SECRET***';

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

async function getColumns(tableName) {
  const columns = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/information_schema.columns?table_name=eq.${tableName}&select=column_name,data_type`
  );
  return columns || [];
}

async function getLeadsSample() {
  const leads = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?select=*&limit=10`
  );
  return leads || [];
}

async function countLeads() {
  const res = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?select=id`
  );
  return res?.length || 0;
}

async function countField(field) {
  const res = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/leads?${field}=not.is.null&select=id`
  );
  return res?.length || 0;
}

async function main() {
  console.log('\n===========================================');
  console.log('   VERIFICACIÓN COMPLETA DEL SISTEMA DE LEADS');
  console.log('===========================================\n');

  // 1. Estructura de la tabla leads
  console.log('📋 ESTRUCTURA DE LA TABLA leads');
  console.log('-------------------------------------------');

  const columns = await getColumns('leads');
  console.log(`Total columnas: ${columns.length}\n`);

  const columnNames = columns.map(c => c.column_name);

  for (const col of columns) {
    const marker = ['name', 'email', 'phone', 'website', 'instagram', 'tiktok', 'facebook_url'].includes(col.column_name) ? '📌' : '  ';
    console.log(`  ${marker} ${col.column_name} (${col.data_type})`);
  }

  console.log('\n📌 COLUMNAS CRÍTICAS PARA MARKETING:');
  console.log('-------------------------------------------');
  const criticalFields = ['name', 'email', 'phone', 'website', 'instagram', 'tiktok', 'facebook_url'];
  for (const field of criticalFields) {
    const exists = columnNames.includes(field);
    console.log(`  ${exists ? '✅' : '❌'} ${field}`);
  }

  // 2. Estado de datos
  console.log('\n\n📊 ESTADO DE DATOS DE LEADS');
  console.log('-------------------------------------------');

  const total = await countLeads();
  console.log(`\n  📊 Total leads: ${total}`);

  const withPhone = await countField('phone');
  const withWebsite = await countField('website');
  const withEmail = await countField('email');
  const withInstagram = await countField('instagram');
  const withTiktok = await countField('tiktok');
  const withFacebook = await countField('facebook_url');

  console.log(`  📞 Con phone: ${withPhone} (${total > 0 ? Math.round(withPhone/total*100) : 0}%)`);
  console.log(`  🌐 Con website: ${withWebsite} (${total > 0 ? Math.round(withWebsite/total*100) : 0}%)`);
  console.log(`  📧 Con email: ${withEmail} (${total > 0 ? Math.round(withEmail/total*100) : 0}%)`);
  console.log(`  📸 Con Instagram: ${withInstagram} (${total > 0 ? Math.round(withInstagram/total*100) : 0}%)`);
  console.log(`  🎵 Con TikTok: ${withTiktok} (${total > 0 ? Math.round(withTiktok/total*100) : 0}%)`);
  console.log(`  📘 Con Facebook: ${withFacebook} (${total > 0 ? Math.round(withFacebook/total*100) : 0}%)`);

  // 3. Muestra de leads
  console.log('\n\n📋 MUESTRA DE 5 LEADS');
  console.log('-------------------------------------------');

  const sample = await getLeadsSample();

  for (let i = 0; i < Math.min(5, sample.length); i++) {
    const lead = sample[i];
    console.log(`\n  Lead #${i + 1}:`);
    console.log(`    ID: ${lead.id?.substring(0, 8)}...`);
    console.log(`    Nombre: ${lead.name || '(sin nombre)'}`);
    console.log(`    Email: ${lead.email || '❌'}`);
    console.log(`    Phone: ${lead.phone || '❌'}`);
    console.log(`    Website: ${lead.website ? '✅' : '❌'}`);
    console.log(`    Instagram: ${lead.instagram || '❌'}`);
    console.log(`    TikTok: ${lead.tiktok || '❌'}`);
    console.log(`    Facebook: ${lead.facebook_url || '❌'}`);
  }

  // 4. Resumen
  console.log('\n\n===========================================');
  console.log('   RESUMEN');
  console.log('===========================================');

  if (columnNames.includes('facebook_url') && columnNames.includes('tiktok') && withPhone > 0 && withWebsite > 0) {
    console.log('\n  ✅ Sistema de leads FUNCIONANDO correctamente');
    console.log(`     - ${withPhone} leads con phone`);
    console.log(`     - ${withWebsite} leads con website`);
    console.log('     - Columnas facebook_url y tiktok existen');
  } else {
    console.log('\n  ⚠️ Hay problemas que resolver:');

    if (!columnNames.includes('facebook_url')) {
      console.log('     ❌ Falta columna facebook_url');
    }
    if (!columnNames.includes('tiktok')) {
      console.log('     ❌ Falta columna tiktok');
    }
    if (withPhone === 0) {
      console.log('     ❌ 0 leads con phone - verificar enriquecimiento');
    }
    if (withWebsite === 0) {
      console.log('     ❌ 0 leads con website - verificar enriquecimiento');
    }
  }

  console.log('\n');
}

main().catch(console.error);