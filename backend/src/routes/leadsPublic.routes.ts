import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Valid business types for fashion
const FASHION_BUSINESS_TYPES = ['boutique', 'tienda_online', 'showroom', 'galeria'];
const VALID_BUSINESS_TYPES = [...FASHION_BUSINESS_TYPES, 'distribuidor', 'otro'];
const VALID_SOURCES = ['organic_contact', 'post_demo_capture'];

// Validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Allow formats: +57XXXXXXXXXX, 57XXXXXXXXXX, XXXXXXXXXX (10+ digits)
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  const phoneRegex = /^(\+?\d{10,15})$/;
  return phoneRegex.test(cleanPhone);
}

function detectCountry(phone?: string, country?: string): string {
  if (country) return country;
  if (phone) {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('+1')) return 'US';
    if (cleanPhone.startsWith('+34')) return 'ES';
    if (cleanPhone.startsWith('+57')) return 'CO';
    if (cleanPhone.startsWith('+52')) return 'MX';
  }
  return 'CO'; // Default to Colombia
}

interface PublicLeadPayload {
  nombre: string;
  email: string;
  telefono?: string;
  nombre_negocio: string;
  tipo_negocio: string;
  mensaje?: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  page_url?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate the incoming lead payload
 */
function validatePayload(payload: PublicLeadPayload): ValidationResult {
  const errors: Record<string, string> = {};

  // nombre: required, min 3 chars, max 255
  if (!payload.nombre || typeof payload.nombre !== 'string') {
    errors.nombre = 'El nombre es requerido';
  } else if (payload.nombre.trim().length < 3) {
    errors.nombre = 'El nombre debe tener al menos 3 caracteres';
  } else if (payload.nombre.trim().length > 255) {
    errors.nombre = 'El nombre no puede exceder 255 caracteres';
  }

  // email: required, valid email format
  if (!payload.email || typeof payload.email !== 'string') {
    errors.email = 'El email es requerido';
  } else if (!isValidEmail(payload.email.trim())) {
    errors.email = 'El formato del email no es válido';
  }

  // nombre_negocio: required, min 3 chars, max 255
  if (!payload.nombre_negocio || typeof payload.nombre_negocio !== 'string') {
    errors.nombre_negocio = 'El nombre del negocio es requerido';
  } else if (payload.nombre_negocio.trim().length < 3) {
    errors.nombre_negocio = 'El nombre del negocio debe tener al menos 3 caracteres';
  } else if (payload.nombre_negocio.trim().length > 255) {
    errors.nombre_negocio = 'El nombre del negocio no puede exceder 255 caracteres';
  }

  // tipo_negocio: required, enum válido
  if (!payload.tipo_negocio || typeof payload.tipo_negocio !== 'string') {
    errors.tipo_negocio = 'El tipo de negocio es requerido';
  } else if (!VALID_BUSINESS_TYPES.includes(payload.tipo_negocio)) {
    errors.tipo_negocio = `El tipo de negocio debe ser uno de: ${VALID_BUSINESS_TYPES.join(', ')}`;
  }

  // telefono: optional, si viene debe ser válido
  if (payload.telefono && typeof payload.telefono === 'string') {
    if (payload.telefono.trim() && !isValidPhone(payload.telefono.trim())) {
      errors.telefono = 'El formato del teléfono no es válido';
    }
  }

  // mensaje: optional, max 500 chars
  if (payload.mensaje && typeof payload.mensaje === 'string') {
    if (payload.mensaje.length > 500) {
      errors.mensaje = 'El mensaje no puede exceder 500 caracteres';
    }
  }

  // source: required, enum válido
  if (!payload.source || typeof payload.source !== 'string') {
    errors.source = 'La fuente es requerida';
  } else if (!VALID_SOURCES.includes(payload.source)) {
    errors.source = `La fuente debe ser una de: ${VALID_SOURCES.join(', ')}`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * POST /api/leads/public
 * Capture a new lead from public forms (contact form or post-demo modal)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = req.body as PublicLeadPayload;

    console.log('[LeadsPublic] Received lead payload:', JSON.stringify({
      ...payload,
      email: payload.email ? payload.email.substring(0, 3) + '***' : undefined,
      telefono: payload.telefono ? '***' : undefined
    }));

    // Validate payload
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        fields: validation.errors
      });
    }

    const normalizedEmail = payload.email.trim().toLowerCase();

    // Check if email already exists
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    const now = new Date().toISOString();
    const isFashionRelevant = FASHION_BUSINESS_TYPES.includes(payload.tipo_negocio);
    const country = detectCountry(payload.telefono);

    // Prepare lead data (mapping payload to DB fields)
    const leadData = {
      name: payload.nombre.trim(),
      email: normalizedEmail,
      phone: payload.telefono?.trim() || null,
      business_type: payload.tipo_negocio,
      country,
      status: 'new',
      source: payload.source,
      is_fashion_relevant: isFashionRelevant,
      // Additional metadata stored in notes or enrichment fields
      notes: payload.mensaje?.trim() || null,
      // UTM data stored in metadata field if needed
      metadata: {
        utm_source: payload.utm_source || null,
        utm_medium: payload.utm_medium || null,
        utm_campaign: payload.utm_campaign || null,
        page_url: payload.page_url || null,
        original_nombre_negocio: payload.nombre_negocio.trim(),
        captured_at: now
      }
    };

    let leadId: string;

    if (existingLead) {
      // Update existing lead instead of creating duplicate
      console.log(`[LeadsPublic] Lead exists with ID ${existingLead.id}, updating...`);

      const { data: updatedLead, error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          name: leadData.name,
          phone: leadData.phone,
          business_type: leadData.business_type,
          country,
          status: 'new', // Reset to new for re-engagement
          source: leadData.source,
          is_fashion_relevant: isFashionRelevant,
          notes: leadData.notes,
          metadata: leadData.metadata,
          updated_at: now
        })
        .eq('id', existingLead.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('[LeadsPublic] Error updating lead:', updateError);
        throw updateError;
      }

      leadId = updatedLead.id;
    } else {
      // Create new lead
      console.log('[LeadsPublic] Creating new lead...');

      const { data: newLead, error: insertError } = await supabaseAdmin
        .from('leads')
        .insert(leadData)
        .select('id')
        .single();

      if (insertError) {
        console.error('[LeadsPublic] Error inserting lead:', insertError);
        throw insertError;
      }

      leadId = newLead.id;
    }

    // TODO: Send notification to admin based on source
    // For 'organic_contact': send email notification to admin
    // For 'post_demo_capture': just save, no email
    if (payload.source === 'organic_contact') {
      console.log(`[LeadsPublic] Lead ${leadId} from organic_contact - admin notification pending implementation`);
      // TODO: Implement admin notification via email or internal notification system
    }

    console.log(`[LeadsPublic] Lead saved successfully with ID: ${leadId}`);

    return res.status(201).json({
      success: true,
      lead_id: leadId,
      message: existingLead
        ? 'Tu información ha sido actualizada. Nos pondremos en contacto contigo pronto.'
        : 'Gracias por tu interés. Nos pondremos en contacto contigo pronto.'
    });

  } catch (error: any) {
    console.error('[LeadsPublic] Error capturing lead:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno'
    });
  }
});

/**
 * GET /api/leads/public/check?email=xxx
 * Check if an email is already registered as a lead
 */
router.get('/check', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({
        exists: false,
        error: 'Email parameter is required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        exists: false,
        error: 'Invalid email format'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, business_type, status, created_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!lead) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      lead: {
        id: lead.id,
        nombre_negocio: lead.name,
        nombre: lead.name, // Backward compat
        email: lead.email,
        business_type: lead.business_type,
        status: lead.status,
        created_at: lead.created_at
      }
    });

  } catch (error: any) {
    console.error('[LeadsPublic] Error checking lead:', error);
    return res.status(500).json({
      exists: false,
      error: 'Error interno'
    });
  }
});

export default router;
