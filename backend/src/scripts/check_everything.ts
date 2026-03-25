import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno del backend (desde src/scripts)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEverything() {
  console.log('--- DIAGNÓSTICO GLOBAL DE SINCRONIZACIÓN ---');

  // 1. Buscar TODOS los productos sincronizados (external_id no nulo)
  const { data: syncedProds, error: syncError } = await supabase
    .from('products')
    .select('id, name, external_id, is_active, brand_id, brands(name, slug)')
    .not('external_id', 'is', null);

  if (syncError) {
    console.error('Error buscando productos sincronizados:', syncError.message);
  } else if (syncedProds && syncedProds.length > 0) {
    console.log(`\nEncontrados ${syncedProds.length} productos sincronizados:`);
    syncedProds.forEach(p => {
      console.log(`- [${p.is_active ? 'ACTIVO' : 'INACTIVO'}] Name: ${p.name} | External: ${p.external_id} | Brand: ${(p as any).brands?.name} (${(p as any).brands?.slug})`);
    });
  } else {
    console.log('\nNo se encontraron productos con external_id.');
  }

  // 2. Listar las últimas 20 marcas
  const { data: recentBrands } = await supabase
    .from('brands')
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentBrands) {
    console.log(`\nÚltimas 20 marcas:`);
    recentBrands.forEach(b => console.log(`- ${b.name} (${b.slug}) | ID: ${b.id} | Creada: ${b.created_at}`));
  }
}

checkEverything();
