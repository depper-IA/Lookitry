/**
 * Script para limpiar leads duplicados de Rebecca
 * Mantiene el registro más reciente de cada phone, elimina los demás
 * 
 * Uso: npx ts-node scripts/cleanup-rebecca-duplicates.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  console.log('🔍 Buscando leads duplicados...\n');

  // 1. Encontrar phones duplicados
  const { data: duplicates, error: dupError } = await supabase
    .from('leads')
    .select('phone')
    .in('source', ['whatsapp_rebecca', 'web_rebecca']);

  if (dupError) {
    console.error('Error buscando duplicados:', dupError);
    return;
  }

  // Contar occurrences de cada phone
  const phoneCounts: Record<string, number> = {};
  for (const lead of duplicates || []) {
    phoneCounts[lead.phone] = (phoneCounts[lead.phone] || 0) + 1;
  }

  // Filtrar solo los que tienen duplicados
  const duplicatedPhones = Object.entries(phoneCounts)
    .filter(([_, count]) => count > 1)
    .map(([phone]) => phone);

  console.log(`📊 Encontrados ${duplicatedPhones.length} phones con duplicados\n`);

  if (duplicatedPhones.length === 0) {
    console.log('✅ No hay duplicados para limpiar');
    return;
  }

  // 2. Para cada phone duplicado, mantener el más reciente
  let totalDeleted = 0;

  for (const phone of duplicatedPhones) {
    console.log(`\n📱 Procesando: ${phone}`);

    const { data: leadRecords, error: fetchError } = await supabase
      .from('leads')
      .select('id, created_at, updated_at, name, email, internal_notes')
      .eq('phone', phone)
      .order('updated_at', { ascending: false });

    if (fetchError || !leadRecords || leadRecords.length === 0) {
      console.log(`  ⚠️ Error o no encontrado`);
      continue;
    }

    const [keep, ...toDelete] = leadRecords;
    console.log(`  ✅ Mantener: ${keep.id} (actualizado: ${keep.updated_at})`);
    console.log(`  🗑️  Eliminar: ${toDelete.length} registros`);

    // Merge notes de todos los registros antes de eliminar
    const mergedNotes = leadRecords
      .map(r => r.internal_notes)
      .filter(Boolean)
      .join('\n---\n');

    // Actualizar el registro a mantener con todas las notas
    await supabase
      .from('leads')
      .update({ internal_notes: mergedNotes })
      .eq('id', keep.id);

    // Eliminar los duplicados
    const idsToDelete = toDelete.map(r => r.id);
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.log(`  ❌ Error eliminando: ${deleteError.message}`);
    } else {
      totalDeleted += toDelete.length;
      console.log(`  ✅ Eliminados ${toDelete.length} duplicados`);
    }
  }

  console.log(`\n\n🎉 Total de duplicados eliminados: ${totalDeleted}`);
}

cleanupDuplicates().catch(console.error);