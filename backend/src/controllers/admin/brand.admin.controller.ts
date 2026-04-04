import { Request, Response } from 'express';
import { sanitizeError } from '../../utils/sanitizeError';
import { AdminService } from '../../services/admin.service';
import { auditService } from '../../services/audit.service';
import { notificationService } from '../../services/notification.service';
import { createAdminNotification } from '../../utils/adminNotifications';
import { emailService } from '../../services/email.service';

const adminService = new AdminService();

/**
 * GET /api/admin/brands
 */
export const getAllBrands = async (_req: Request, res: Response) => {
  try {
    const brands = await adminService.getAllBrandsWithStats();
    return res.status(200).json({ brands, count: brands.length });
  } catch (error: any) {
    console.error('Error in getAllBrands:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener marcas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * PATCH /api/admin/brands/:id/plan
 */
export const changeBrandPlan = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!plan || !['BASIC', 'PRO'].includes(plan)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Plan debe ser BASIC o PRO' });
    }

    await adminService.changeBrandPlan(id, plan);

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.plan_change',
      target_brand_id: id,
      details: { new_plan: plan },
    });

    return res.status(200).json({ message: 'Plan actualizado exitosamente', brandId: id, newPlan: plan });
  } catch (error: any) {
    console.error('Error in changeBrandPlan:', error);
    if (error.message === 'PLAN_CHANGE_REQUIRES_PAYMENT') {
      return res.status(409).json({
        error: 'PLAN_CHANGE_REQUIRES_PAYMENT',
        message: 'No puedes convertir un Trial a un plan pago sin registrar primero el cobro en Suscripciones/Admin Payments.',
      });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al cambiar plan' });
  }
};

/**
 * GET /api/admin/brands/:id/products
 */
export const getBrandProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ID de marca requerido' });
    const products = await adminService.getBrandProducts(id);
    return res.status(200).json({ products, count: products.length });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener productos' });
  }
};

/**
 * POST /api/admin/brands
 */
export const createBrand = async (req: any, res: Response) => {
  try {
    const { email, password, name, slug, plan, trial_days, phone, contact_name } = req.body;
    if (!email || !password || !name || !slug) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email, contraseña, nombre y slug son requeridos' });
    }

    const newBrand = await adminService.createBrand({ email, password, name, slug, plan, trial_days, phone, contact_name });

    notificationService.sendAdminCreatedWelcomeEmail(newBrand, password, Number(trial_days) || 7)
      .catch(err => console.error('Error enviando email de bienvenida:', err));

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.create',
      target_brand_id: newBrand.id,
      details: { name: newBrand.name, email: newBrand.email, plan: newBrand.plan },
    });

    return res.status(201).json({
      message: 'Marca creada exitosamente',
      brand: { id: newBrand.id, email: newBrand.email, name: newBrand.name, slug: newBrand.slug, plan: newBrand.plan, trial_end_date: newBrand.trial_end_date },
    });
  } catch (error: any) {
    const isValidationError = error.message === 'El email ya está registrado' || error.message === 'El slug ya está en uso';
    return res.status(isValidationError ? 400 : 500).json({ error: isValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al crear marca') });
  }
};

/**
 * DELETE /api/admin/brands/:id
 */
export const deleteBrand = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ID de marca requerido' });
    await adminService.deleteBrand(id);
    auditService.log({ admin_id: req.admin?.id ?? 'unknown', admin_email: req.admin?.email ?? 'unknown', action: 'brand.delete', target_brand_id: id });
    return res.status(200).json({ message: 'Marca eliminada exitosamente' });
  } catch (error: any) {
    const isNotFound = error.message === 'Marca no encontrada';
    return res.status(isNotFound ? 404 : 500).json({ error: isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al eliminar marca') });
  }
};

/**
 * DELETE /api/admin/brands/:id/products/:productId
 */
export const deleteInactiveProduct = async (req: Request, res: Response) => {
  try {
    const { id, productId } = req.params;
    await adminService.deleteInactiveProduct(id, productId);
    return res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al eliminar producto') });
  }
};

/**
 * PATCH /api/admin/brands/:id/activate-plan
 */
export const activateBrandPlan = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { plan, amount, payment_method, notes } = req.body;

    const updatedBrand = await adminService.activateBrandPlan(id, {
      plan: plan || 'BASIC',
      amount: amount || 0,
      payment_method: payment_method || 'manual',
      notes: notes || 'Activación manual por administrador',
    });

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.plan_activate',
      target_brand_id: id,
      details: { plan: plan || 'BASIC', amount, payment_method },
    });

    createAdminNotification({
      type: 'trial_converted',
      title: 'Trial convertido a plan pagado',
      message: `${updatedBrand.name} convirtió su trial al Plan ${updatedBrand.plan}`,
      severity: 'success',
      brandId: updatedBrand.id,
      brandName: updatedBrand.name,
      metadata: { plan: updatedBrand.plan, amount: amount || 0, payment_method: payment_method || 'manual' },
    }).catch(() => {});

    return res.status(200).json({
      message: 'Plan activado exitosamente',
      brand: { id: updatedBrand.id, name: updatedBrand.name, plan: updatedBrand.plan, subscription_status: updatedBrand.subscription_status, subscription_end_date: updatedBrand.subscription_end_date },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al activar plan' });
  }
};

/**
 * PATCH /api/admin/brands/:id/landing-page
 */
export const toggleLandingPage = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { has_landing_page } = req.body;
    if (typeof has_landing_page !== 'boolean') return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'has_landing_page debe ser un booleano' });

    const { supabaseAdmin } = await import('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('brands').update({ has_landing_page }).eq('id', id).select('id, name, has_landing_page').single();
    if (error || !data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    auditService.log({ admin_id: req.admin?.id ?? 'unknown', admin_email: req.admin?.email ?? 'unknown', action: 'brand.landing_page_toggle', target_brand_id: id, details: { has_landing_page } });
    return res.status(200).json({ message: `Mini-landing ${has_landing_page ? 'activada' : 'desactivada'} exitosamente`, brand: data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar mini-landing' });
  }
};

/**
 * PATCH /api/admin/brands/:id/modal-config
 */
export const updateModalConfig = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { modal_title, modal_description, modal_features } = req.body;
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('brands').update({ modal_title, modal_description, modal_features }).eq('id', id).select('id, name, modal_title, modal_description, modal_features').single();
    if (error || !data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    auditService.log({ admin_id: req.admin?.id ?? 'unknown', admin_email: req.admin?.email ?? 'unknown', action: 'brand.modal_config_update' as any, target_brand_id: id, details: { modal_title, modal_description } });
    return res.status(200).json({ message: 'Configuración del modal actualizada', brand: data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar modal' });
  }
};

/**
 * PATCH /api/admin/brands/:id/notes
 */
export const updateBrandNotes = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { internal_notes } = req.body;
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('brands').update({ 
      internal_notes,
      internal_notes_updated_at: new Date().toISOString(),
      internal_notes_updated_by: req.admin?.id ?? null
    }).eq('id', id).select('id, name, internal_notes').single();
    if (error || !data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    auditService.log({ admin_id: req.admin?.id ?? 'unknown', admin_email: req.admin?.email ?? 'unknown', action: 'brand.notes_update', target_brand_id: id, details: { notes_length: internal_notes?.length || 0 } });
    return res.status(200).json({ message: 'Notas actualizadas', brand: data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar notas' });
  }
};

/**
 * GET /api/admin/mini-landings
 */
export const getMiniLandingsAdmin = async (_req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('brands').select('id, name, email, slug, plan, trial_end_date, has_landing_page, landing_suspended_at, subscription_status, created_at').order('created_at', { ascending: false });
    if (error) throw error;

    const ahora = Date.now();
    const now = new Date();
    const brands = (data || []).map((b: any) => {
      let dias_para_eliminacion: number | null = null;
      if (b.landing_suspended_at) {
        const transcurridos = Math.floor((ahora - new Date(b.landing_suspended_at).getTime()) / (1000 * 60 * 60 * 24));
        dias_para_eliminacion = Math.max(0, 90 - transcurridos);
      }
      const trialEnd = b.trial_end_date ? new Date(b.trial_end_date) : null;
      const is_in_trial = b.plan === 'TRIAL' && trialEnd !== null && trialEnd > now && b.subscription_status !== 'active' && b.subscription_status !== 'expiring_soon';
      return { ...b, dias_para_eliminacion, is_in_trial };
    });
    return res.status(200).json({ brands, count: brands.length });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener mini-landings' });
  }
};

/**
 * PATCH /api/admin/mini-landings/:id/suspend
 */
export const suspendMiniLanding = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('brands').update({ landing_suspended_at: new Date().toISOString() }).eq('id', id).select('id, name, landing_suspended_at').single();
    if (error || !data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    auditService.log({ admin_id: req.admin?.id ?? 'unknown', admin_email: req.admin?.email ?? 'unknown', action: 'brand.landing_suspend', target_brand_id: id });
    return res.status(200).json({ message: 'Mini-landing suspendida', brand: data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al suspender mini-landing' });
  }
};

/**
 * PATCH /api/admin/mini-landings/:id/restore
 */
export const restoreMiniLanding = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('brands').update({ landing_suspended_at: null, has_landing_page: true }).eq('id', id).select('id, name, landing_suspended_at, has_landing_page').single();
    if (error || !data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    auditService.log({ admin_id: req.admin?.id ?? 'unknown', admin_email: req.admin?.email ?? 'unknown', action: 'brand.landing_restore', target_brand_id: id });
    return res.status(200).json({ message: 'Mini-landing restaurada', brand: data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al restaurar mini-landing' });
  }
};

/**
 * POST /api/admin/brands/:id/send-reset-email
 */
export const sendBrandResetEmail = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data: brand, error } = await supabaseAdmin.from('brands').select('id, name, email').eq('id', id).single();
    if (error || !brand) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await supabaseAdmin.from('brands').update({ reset_token: token, reset_token_expires_at: expiresAt.toISOString() }).eq('id', brand.id);

    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://lookitry.com');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await emailService.sendEmail({
      to: brand.email,
      subject: 'Recuperación de contraseña — Lookitry',
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#FF5C3A;margin-bottom:8px">Recuperación de contraseña</h2>
        <p style="color:#6b7280;margin-bottom:24px">Hola <strong>${brand.name}</strong>, recibiste este correo porque se solicitó un restablecimiento de contraseña para tu cuenta.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#FF5C3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px">Restablecer contraseña</a>
        <p style="color:#9ca3af;font-size:13px">Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>`,
    });

    auditService.log({ admin_id: req.admin?.id ?? 'unknown', admin_email: req.admin?.email ?? 'unknown', action: 'brand.send_reset_email', target_brand_id: id, details: { brand_email: brand.email } });
    return res.status(200).json({ message: 'Email de recuperación enviado exitosamente' });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al enviar email de recuperación' });
  }
};

/**
 * GET /api/admin/brands/:id/full
 */
export const getBrandFull = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await adminService.getBrandFull(id);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Marca no encontrada') return res.status(404).json({ error: 'NOT_FOUND', message: error.message });
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener ficha de marca' });
  }
};
