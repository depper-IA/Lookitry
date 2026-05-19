import { supabaseAdmin } from '../config/supabase';

export type LeadSource = 'whatsapp_rebecca' | 'web_rebecca';

export interface RebeccaLeadData {
  phone: string;
  name?: string;
  email?: string;
  source: LeadSource;
  stage?: 'new' | 'qualified' | 'contacted' | 'interested' | 'converted' | 'lost';
  conversation_summary?: string;
  last_message?: string;
}

interface StoredLead {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  source: string | null;
  status: string | null;
  bot_status: string | null;
  internal_notes: string | null;
  updated_at: string;
}

/**
 * Guarda o actualiza un lead de Rebecca en la tabla leads de Supabase.
 * Si el lead existe (por phone), actualiza los campos nuevos.
 * Si no existe, lo crea.
 */
export async function upsertRebeccaLead(data: RebeccaLeadData): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const { phone, name, email, source, stage, conversation_summary, last_message } = data;

    // 1. Buscar lead existente por phone
    const { data: existingLead, error: findError } = await supabaseAdmin
      .from('leads')
      .select('id, phone, name, email, source, status, bot_status, internal_notes, updated_at')
      .eq('phone', phone)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 = no rows found, otros errores sí importan
      console.error('[RebeccaLead] Error buscando lead:', findError);
      return { success: false, error: findError.message };
    }

    const now = new Date().toISOString();

    if (existingLead) {
      // 2. LEAD EXISTE → actualizar solo campos nuevos
      const updates: Partial<StoredLead> = {
        updated_at: now,
      };

      // Solo actualizar si hay datos nuevos
      if (name && !existingLead.name) updates.name = name;
      if (email && !existingLead.email) updates.email = email;
      if (source && !existingLead.source) updates.source = source;
      if (stage) updates.bot_status = stage;
      
      // Agregar al internal_notes si hay conversación
      if (last_message) {
        const existingNotes = existingLead.internal_notes || '';
        const newNote = `[${now}] Lead: ${last_message}\n`;
        updates.internal_notes = existingNotes + newNote;
      }

      // Actualizar status si está en un nuevo stage
      if (stage && existingLead.status !== stage) {
        updates.status = stage;
      }

      const { error: updateError } = await supabaseAdmin
        .from('leads')
        .update(updates)
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('[RebeccaLead] Error actualizando lead:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`[RebeccaLead] Lead actualizado: ${existingLead.id}`);
      return { success: true, leadId: existingLead.id };

    } else {
      // 3. LEAD NUEVO → crear
      const { data: newLead, error: insertError } = await supabaseAdmin
        .from('leads')
        .insert({
          phone,
          name: name || null,
          email: email || null,
          source,
          status: stage || 'new',
          bot_status: stage || 'new',
          country: 'CO', // Por defecto Colombia (Lookitry primary market)
          internal_notes: last_message ? `[${now}] Lead: ${last_message}\n` : null,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[RebeccaLead] Error creando lead:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log(`[RebeccaLead] Lead creado: ${newLead.id}`);
      return { success: true, leadId: newLead.id };
    }

  } catch (err) {
    console.error('[RebeccaLead] Error general:', err);
    return { success: false, error: 'Error interno al guardar lead' };
  }
}

/**
 * Actualiza el stage del lead (para seguimiento del flujo)
 */
export async function updateLeadStage(
  phone: string,
  stage: RebeccaLeadData['stage']
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('leads')
      .update({
        status: stage,
        bot_status: stage,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', phone);

    if (error) {
      console.error('[RebeccaLead] Error actualizando stage:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[RebeccaLead] Error actualizando stage:', err);
    return false;
  }
}

/**
 * Agrega una nota a la conversación del lead
 */
export async function appendLeadNote(phone: string, note: string): Promise<boolean> {
  try {
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('internal_notes')
      .eq('phone', phone)
      .single();

    if (!lead) return false;

    const now = new Date().toISOString();
    const existingNotes = lead.internal_notes || '';
    const newNote = `[${now}] ${note}\n`;

    const { error } = await supabaseAdmin
      .from('leads')
      .update({
        internal_notes: existingNotes + newNote,
        updated_at: now,
      })
      .eq('phone', phone);

    if (error) {
      console.error('[RebeccaLead] Error agregando nota:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[RebeccaLead] Error agregando nota:', err);
    return false;
  }
}

/**
 * Obtiene datos del lead por phone (para contexto de conversación)
 */
export async function getLeadByPhone(phone: string): Promise<StoredLead | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Actualiza datos de contacto del lead (nombre, email)
 * Llama este endpoint cuando Rebecca captura estos datos
 */
export async function updateLeadContactInfo(
  phone: string,
  contactData: { name?: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { name, email } = contactData;

    if (!name && !email) {
      return { success: false, error: 'No hay datos para actualizar' };
    }

    const updates: Partial<StoredLead> = {
      updated_at: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (email) updates.email = email;

    const { error } = await supabaseAdmin
      .from('leads')
      .update(updates)
      .eq('phone', phone);

    if (error) {
      console.error('[RebeccaLead] Error actualizando contacto:', error);
      return { success: false, error: error.message };
    }

    console.log(`[RebeccaLead] Contacto actualizado para ${phone}:`, contactData);
    return { success: true };
  } catch (err) {
    console.error('[RebeccaLead] Error actualizando contacto:', err);
    return { success: false, error: 'Error interno' };
  }
}

/**
 * Obtiene contexto del lead para enviarlo a Rebecca
 * Incluye nombre y email si existen
 */
export async function getLeadContextForRebecca(phone: string): Promise<{
  exists: boolean;
  name?: string;
  email?: string;
  stage?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('name, email, status, bot_status')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return { exists: false };
    }

    return {
      exists: true,
      name: data.name || undefined,
      email: data.email || undefined,
      stage: data.bot_status || data.status || undefined,
    };
  } catch {
    return { exists: false };
  }
}
