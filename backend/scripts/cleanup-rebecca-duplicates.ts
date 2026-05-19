/**
 * Script para limpiar leads duplicados de Rebecca
 * Normaliza phones (sin +) y elimina duplicados
 */

const SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_KEY = '***REMOVED-SECRET***';

interface LeadRecord {
  id: string;
  phone: string;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  internal_notes: string | null;
}

async function supabaseQuery<T = unknown>(table: string, options: {
  select?: string;
  eq?: Record<string, string>;
  order?: string;
  limit?: number;
} = {}): Promise<T> {
  let url = `${SUPABASE_URL}/rest/v1/${table}?`;
  
  const params = new URLSearchParams();
  if (options.select) params.append('select', options.select);
  if (options.order) params.append('order', options.order);
  if (options.limit) params.append('limit', options.limit.toString());
  
  if (options.eq) {
    for (const [col, val] of Object.entries(options.eq)) {
      params.append(col, `eq.${val}`);
    }
  }
  
  url += params.toString();
  
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  
  if (!res.ok) {
    throw new Error(await res.text());
  }
  
  return res.json() as T;
}

async function supabaseDelete(table: string, ids: string[]) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=in.(${ids.join(',')})`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  
  if (!res.ok) {
    throw new Error(await res.text());
  }
  
  return true;
}

async function supabaseUpdate(table: string, id: string, data: Record<string, unknown>) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    throw new Error(await res.text());
  }
  
  return true;
}

// Normalizar phone: siempre sin +
function normalizePhone(phone: string): string {
  return phone.replace(/^\+/, '').replace(/^0/, '');
}

// Agrupar phones similares
function areSamePhone(phone1: string, phone2: string): boolean {
  const n1 = normalizePhone(phone1);
  const n2 = normalizePhone(phone2);
  return n1 === n2;
}

async function cleanupDuplicates() {
  console.log('🔍 Buscando leads duplicados (normalizando phones)...\n');

  try {
    const leads = await supabaseQuery<LeadRecord[]>('leads', {
      select: 'id,phone,created_at,updated_at,name,email,internal_notes',
      eq: { source: 'whatsapp' }
    });

    const webLeads = await supabaseQuery<LeadRecord[]>('leads', {
      select: 'id,phone,created_at,updated_at,name,email,internal_notes',
      eq: { source: 'web' }
    });

    const allLeads: LeadRecord[] = [...leads, ...webLeads];
    console.log(`📊 Total leads: ${allLeads.length}\n`);

    // Agrupar por phone normalizado
    const normalizedGroups: Record<string, LeadRecord[]> = {};
    for (const lead of allLeads) {
      const normalized = normalizePhone(lead.phone);
      if (!normalizedGroups[normalized]) {
        normalizedGroups[normalized] = [];
      }
      normalizedGroups[normalized].push(lead);
    }

    // Filtrar grupos con duplicados
    const duplicatedGroups = Object.entries(normalizedGroups)
      .filter(([_, leads]) => leads.length > 1);

    console.log(`📊 Grupos con duplicados: ${duplicatedGroups.length}`);

    if (duplicatedGroups.length === 0) {
      console.log('✅ No hay duplicados para limpiar');
      return;
    }

    let totalDeleted = 0;

    for (const [normalizedPhone, leadRecords] of duplicatedGroups) {
      console.log(`\n📱 Procesando: ${normalizedPhone}`);
      console.log(`   variants: ${leadRecords.map(l => l.phone).join(', ')}`);

      // Ordenar por updated_at descendente
      leadRecords.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      const [keep, ...toDelete] = leadRecords;
      console.log(`  ✅ Mantener: ${keep.id} (${keep.phone})`);
      console.log(`  🗑️  Eliminar: ${toDelete.length} registros`);

      // Merge notes de todos
      const mergedNotes = leadRecords
        .map(r => r.internal_notes)
        .filter((n): n is string => n !== null)
        .join('\n---\n');

      // Merge name y email (preferir el que tenga más datos)
      const mergedName = keep.name || toDelete.find(r => r.name)?.name || null;
      const mergedEmail = keep.email || toDelete.find(r => r.email)?.email || null;

      await supabaseUpdate('leads', keep.id, { 
        internal_notes: mergedNotes,
        name: mergedName,
        email: mergedEmail,
        phone: normalizedPhone // Normalizar el phone del que mantenemos
      });
      console.log('  📝 Datos mergeados y phone normalizado');

      const idsToDelete = toDelete.map(r => r.id);
      await supabaseDelete('leads', idsToDelete);

      totalDeleted += toDelete.length;
      console.log(`  ✅ Eliminados ${toDelete.length} duplicados`);
    }

    console.log(`\n\n🎉 Total de duplicados eliminados: ${totalDeleted}`);
    console.log(`📊 Leads únicos restantes: ${allLeads.length - totalDeleted}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupDuplicates();