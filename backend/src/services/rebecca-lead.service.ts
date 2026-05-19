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
  // Nuevos campos para perfil completo
  website?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  city?: string | null;
  country?: string | null;
  business_type?: string | null;
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
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  city: string | null;
  country: string | null;
  business_type: string | null;
}

/**
 * Normaliza un número de teléfono para evitar duplicados
 */
function normalizePhone(phone: string): string {
  return phone.replace(/^\+/, '').replace(/^0+/, '').trim();
}

/**
 * Guarda o actualiza un lead de Rebecca en la tabla leads de Supabase.
 * Si el lead existe (por phone normalizado), actualiza campos nuevos.
 * Si no existe, lo crea.
 */
export async function upsertRebeccaLead(data: RebeccaLeadData): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const { phone, name, email, source, stage, last_message, website, instagram, tiktok, city, country, business_type } = data;

    const normalizedPhone = normalizePhone(phone);

    // Buscar lead existente
    const { data: existingLead, error: findError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('[RebeccaLead] Error buscando lead:', findError);
      return { success: false, error: findError.message };
    }

    const now = new Date().toISOString();

    if (existingLead) {
      // LEAD EXISTE → actualizar solo campos vacíos
      const updates: Partial<StoredLead> = { updated_at: now };

      if (website && !existingLead.website) updates.website = website;
      if (instagram && !existingLead.instagram) updates.instagram = instagram;
      if (tiktok && !existingLead.tiktok) updates.tiktok = tiktok;
      if (city && !existingLead.city) updates.city = city;
      if (country && !existingLead.country) updates.country = country;
      if (business_type && !existingLead.business_type) updates.business_type = business_type;
      if (name && !existingLead.name) updates.name = name;
      if (email && !existingLead.email) updates.email = email;

      if (last_message) {
        const existingNotes = existingLead.internal_notes || '';
        if (!existingNotes.includes(last_message.substring(0, 50))) {
          updates.internal_notes = existingNotes + `[${now}] Lead: ${last_message}\n`;
        }
      }

      if (Object.keys(updates).length > 1) {
        await supabaseAdmin.from('leads').update(updates).eq('id', existingLead.id);
      }

      return { success: true, leadId: existingLead.id };

    } else {
      // LEAD NUEVO → crear
      const { data: newLead, error: insertError } = await supabaseAdmin
        .from('leads')
        .insert({
          phone: normalizedPhone,
          name: name || null,
          email: email || null,
          source,
          status: stage || 'new',
          bot_status: stage || 'new',
          country: country || 'CO',
          city: city || null,
          website: website || null,
          instagram: instagram || null,
          tiktok: tiktok || null,
          business_type: business_type || null,
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
 * Agrega una nota a la conversación del lead
 */
export async function appendLeadNote(phone: string, note: string): Promise<boolean> {
  try {
    const normalized = normalizePhone(phone);
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('internal_notes')
      .eq('phone', normalized)
      .single();

    if (!lead) return false;

    const now = new Date().toISOString();
    const existingNotes = lead.internal_notes || '';
    if (existingNotes.includes(note.substring(0, 50))) return true;
    
    const newNote = `[${now}] ${note}\n`;

    const { error } = await supabaseAdmin
      .from('leads')
      .update({ internal_notes: existingNotes + newNote, updated_at: now })
      .eq('phone', normalized);

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
 * Verifica si un lead existe
 */
export async function leadExists(phone: string): Promise<boolean> {
  try {
    const normalized = normalizePhone(phone);
    const { data } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('phone', normalized)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Actualiza el stage del lead
 */
export async function updateLeadStage(phone: string, stage: RebeccaLeadData['stage']): Promise<boolean> {
  try {
    const normalized = normalizePhone(phone);
    const { error } = await supabaseAdmin
      .from('leads')
      .update({ status: stage, bot_status: stage, updated_at: new Date().toISOString() })
      .eq('phone', normalized);

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
 * Obtiene datos del lead por phone
 */
export async function getLeadByPhone(phone: string): Promise<StoredLead | null> {
  try {
    const normalized = normalizePhone(phone);
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('phone', normalized)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Actualiza datos de contacto del lead (nombre, email)
 */
export async function updateLeadContactInfo(
  phone: string,
  contactData: { name?: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { name, email } = contactData;
    const normalized = normalizePhone(phone);

    if (!name && !email) {
      return { success: false, error: 'No hay datos para actualizar' };
    }

    const updates: Partial<StoredLead> = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (email) updates.email = email;

    const { error } = await supabaseAdmin
      .from('leads')
      .update(updates)
      .eq('phone', normalized);

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
 * Actualiza perfil completo del lead (website, instagram, tiktok, ciudad, país)
 */
export async function updateLeadProfile(
  phone: string,
  profileData: {
    website?: string;
    instagram?: string;
    tiktok?: string;
    city?: string;
    country?: string;
    business_type?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = normalizePhone(phone);
    const updates: Partial<StoredLead> = { updated_at: new Date().toISOString() };

    if (profileData.website) updates.website = profileData.website;
    if (profileData.instagram) updates.instagram = profileData.instagram;
    if (profileData.tiktok) updates.tiktok = profileData.tiktok;
    if (profileData.city) updates.city = profileData.city;
    if (profileData.country) updates.country = profileData.country;
    if (profileData.business_type) updates.business_type = profileData.business_type;

    if (Object.keys(updates).length === 1) {
      return { success: false, error: 'No hay datos para actualizar' };
    }

    const { error } = await supabaseAdmin
      .from('leads')
      .update(updates)
      .eq('phone', normalized);

    if (error) {
      console.error('[RebeccaLead] Error actualizando perfil:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[RebeccaLead] Error actualizando perfil:', err);
    return { success: false, error: 'Error interno' };
  }
}

/**
 * Obtiene contexto del lead para Rebecca
 */
export async function getLeadContextForRebecca(phone: string): Promise<{
  exists: boolean;
  name?: string;
  email?: string;
  stage?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  city?: string;
  country?: string;
  business_type?: string;
}> {
  try {
    const normalized = normalizePhone(phone);
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('name, email, status, bot_status, website, instagram, tiktok, city, country, business_type')
      .eq('phone', normalized)
      .single();

    if (error || !data) {
      return { exists: false };
    }

    return {
      exists: true,
      name: data.name || undefined,
      email: data.email || undefined,
      stage: data.bot_status || data.status || undefined,
      website: data.website || undefined,
      instagram: data.instagram || undefined,
      tiktok: data.tiktok || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      business_type: data.business_type || undefined,
    };
  } catch {
    return { exists: false };
  }
}