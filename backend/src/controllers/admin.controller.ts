import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AdminService } from '../services/admin.service';
import { notificationService } from '../services/notification.service';
import { auditService } from '../services/audit.service';
import { generateToken } from '../utils/jwt';
import { emailService } from '../services/email.service';
import { createAdminNotification } from '../utils/adminNotifications';
import { adminPasswordResetEmail } from '../templates/email-templates';
import { getWooProductSummary, getWooTelemetrySummary } from '../utils/wooTelemetry';
import { systemService } from '../services/system.service';

const adminService = new AdminService();

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
}

/**
 * GET /api/admin/system/stats
 * Obtener estadísticas de RAM y uptime del servidor
 */
export const getSystemStats = async (_req: any, res: Response) => {
  try {
    const stats = await systemService.getStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error in getSystemStats:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener estadísticas del sistema',
    });
  }
};

/**
 * POST /api/admin/auth/login
 * Login de administrador
 */
export const adminLogin = async (req: any, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email y contraseña son requeridos',
      });
    }

    // Buscar admin
    const admin = await adminService.getAdminByEmail(email);

    if (!admin) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Credenciales inválidas',
      });
    }

    // Verificar contraseña
    const isValidPassword = await adminService.verifyPassword(password, (admin as any).password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Credenciales inválidas',
      });
    }

    // Generar token
    const token = generateToken({
      adminId: admin.id,
      email: admin.email,
    });
    // Seguridad: Cookie HTTP-Only
    // Se envía como cookie segura para proteger contra XSS (P1 Hallazgo Auditoría)
    const IS_PROD = process.env.NODE_ENV === 'production';
    const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

    const cookieOptions: any = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };

    if (COOKIE_DOMAIN && IS_PROD) {
      cookieOptions.domain = COOKIE_DOMAIN;
    }

    res.cookie('admin_token', token, cookieOptions);

    // Auditoría de login
    auditService.log({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'admin.login',
    });

    return res.status(200).json({
      // Mantenemos el token en el JSON por retrocompatibilidad, 
      // pero el frontend ahora debe usar credentials: 'include'
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('Error in adminLogin:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    });
  }
};

/**
 * POST /api/admin/auth/forgot-password
 * Solicita enlace de recuperación para un administrador
 */
export const adminForgotPassword = async (req: any, res: Response) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email requerido',
      });
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://lookitry.com');

    const { admin, token } = await adminService.requestPasswordResetGetToken(email);

    if (admin && token) {
      const resetUrl = `${frontendUrl}/admin/reset-password?token=${token}`;

      await emailService.sendEmail({
        to: admin.email,
        subject: 'Recuperar contraseña — Panel de administración Lookitry',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff">
            <h2 style="margin:0 0 12px;color:#0a0a0a;font-size:22px">Restablecer contraseña</h2>
            <p style="margin:0 0 16px;color:#555;line-height:1.6">
              Hola <strong>${admin.name}</strong>, recibimos una solicitud para cambiar la contraseña de tu cuenta de administrador.
            </p>
            <div style="margin:28px 0;text-align:center">
              <a href="${resetUrl}" style="display:inline-block;background:#FF5C3A;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700">
                Crear nueva contraseña
              </a>
            </div>
            <p style="margin:0 0 12px;color:#666;line-height:1.6">
              Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.
            </p>
            <p style="margin:0;color:#999;font-size:12px;word-break:break-all">${resetUrl}</p>
          </div>
        `,
      });
    }

    return res.status(200).json({
      message: 'Si el email existe, recibir?s un enlace para restablecer tu contrase?a.',
    });
  } catch (error: any) {
    console.error('Error in adminForgotPassword:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al procesar la solicitud',
    });
  }
};

/**
 * POST /api/admin/auth/reset-password
 * Restablece la contraseña de un administrador usando token
 */
export const adminResetPassword = async (req: any, res: Response) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Token y contraseña son requeridos',
      });
    }

    await adminService.resetPasswordWithToken(token, password);

    return res.status(200).json({
      message: 'Contrase?a restablecida correctamente',
    });
  } catch (error: any) {
    console.error('Error in adminResetPassword:', error);

    if (error.message === 'TOKEN_INVALID' || error.message === 'TOKEN_EXPIRED') {
      return res.status(400).json({
        error: error.message,
        message: 'El enlace es inválido o ha expirado. Solicita uno nuevo.',
      });
    }

    if (error.message === 'PASSWORD_TOO_SHORT') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'La contraseña debe tener al menos 8 caracteres',
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al restablecer la contraseña',
    });
  }
};

/**
 * POST /api/admin/auth/logout
 * Cerrar sesión de administrador
 */
export const adminLogout = async (_req: any, res: Response) => {
  try {
    const IS_PROD = process.env.NODE_ENV === 'production';
    const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

    const cookieOptions: any = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? 'none' : 'lax',
      expires: new Date(0),
      path: '/',
    };

    if (COOKIE_DOMAIN && IS_PROD) {
      cookieOptions.domain = COOKIE_DOMAIN;
    }

    res.cookie('admin_token', '', cookieOptions);

    // Audit log (optional, if admin ID is available from middleware)
    // auditService.log({
    //   admin_id: _req.admin?.id ? 'unknown',
    //   admin_email: _req.admin?.email ? 'unknown',
    //   action: 'admin.logout',
    // });

    return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
  } catch (error: any) {
    console.error('Error in adminLogout:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error interno del servidor al cerrar sesión',
    });
  }
};

/**
 * GET /api/admin/brands
 * Obtener todas las marcas con estadísticas
 */
export const getAllBrands = async (_req: any, res: Response) => {
  try {
    const brands = await adminService.getAllBrandsWithStats();

    return res.status(200).json({
      brands,
      count: brands.length,
    });
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
 * Cambiar plan de una marca
 */
export const changeBrandPlan = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!plan || !['BASIC', 'PRO'].includes(plan)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Plan debe ser BASIC o PRO',
      });
    }

    await adminService.changeBrandPlan(id, plan);

    // Auditoría
    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.plan_change',
      target_brand_id: id,
      details: { new_plan: plan },
    });

    return res.status(200).json({
      message: 'Plan actualizado exitosamente',
      brandId: id,
      newPlan: plan,
    });
  } catch (error: any) {
    console.error('Error in changeBrandPlan:', error);

    if (error.message === 'PLAN_CHANGE_REQUIRES_PAYMENT') {
      return res.status(409).json({
        error: 'PLAN_CHANGE_REQUIRES_PAYMENT',
        message: 'No puedes convertir un Trial a un plan pago sin registrar primero el cobro en Suscripciones/Admin Payments.',
      });
    }

    if (error.message === 'PLAN_CHANGE_REQUIRES_ACTIVE_SUBSCRIPTION') {
      return res.status(409).json({
        error: 'PLAN_CHANGE_REQUIRES_ACTIVE_SUBSCRIPTION',
        message: 'Solo puedes cambiar el plan directamente en suscripciones activas. Si está vencida o suspendida, primero registra el pago.',
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al cambiar plan',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/admin/stats
 * Obtener estadísticas globales del sistema
 */
export const getGlobalStats = async (_req: any, res: Response) => {
  try {
    const stats = await adminService.getGlobalStats();

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error in getGlobalStats:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener estadísticas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/admin/brands/:id/products
 * Obtener productos de una marca específica
 */
export const getBrandProducts = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'ID de marca requerido',
      });
    }

    const products = await adminService.getBrandProducts(id);

    return res.status(200).json({
      products,
      count: products.length,
    });
  } catch (error: any) {
    console.error('Error in getBrandProducts:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener productos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /api/admin/brands
 * Crear una nueva marca manualmente (trial)
 */
export const createBrand = async (req: any, res: Response) => {
  try {
    const { email, password, name, slug, plan, trial_days, phone, contact_name } = req.body;

    if (!email || !password || !name || !slug) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email, contraseña, nombre y slug son requeridos',
      });
    }

    const newBrand = await adminService.createBrand({
      email,
      password,
      name,
      slug,
      plan,
      trial_days,
      phone,
      contact_name,
    });

    // Enviar email de bienvenida con credenciales (sin bloquear la respuesta)
    notificationService.sendAdminCreatedWelcomeEmail(
      newBrand,
      password,
      Number(trial_days) || 7
    ).catch(err => console.error('Error enviando email de bienvenida:', err));

    // Auditoría
    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.create',
      target_brand_id: newBrand.id,
      details: { name: newBrand.name, email: newBrand.email, plan: newBrand.plan },
    });

    return res.status(201).json({
      message: 'Marca creada exitosamente',
      brand: {
        id: newBrand.id,
        email: newBrand.email,
        name: newBrand.name,
        slug: newBrand.slug,
        plan: newBrand.plan,
        trial_end_date: newBrand.trial_end_date,
      },
    });
  } catch (error: any) {
    console.error('Error in createBrand:', error);
    const isValidationError =
      error.message === 'El email ya está registrado' ||
      error.message === 'El slug ya está en uso';
    return res.status(isValidationError ? 400 : 500).json({
      error: isValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
      message: error.message || 'Error al crear marca',
    });
  }
};

/**
 * DELETE /api/admin/brands/:id
 * Eliminar una marca y todos sus datos
 */
export const deleteBrand = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'ID de marca requerido',
      });
    }

    await adminService.deleteBrand(id);

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.delete',
      target_brand_id: id,
    });

    return res.status(200).json({ message: 'Marca eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error in deleteBrand:', error);
    const isNotFound = error.message === 'Marca no encontrada';
    return res.status(isNotFound ? 404 : 500).json({
      error: isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR',
      message: error.message || 'Error al eliminar marca',
    });
  }
};

/**
 * DELETE /api/admin/brands/:id/products/:productId
 * Eliminar permanentemente un producto inactivo de una marca
 */
export const deleteInactiveProduct = async (req: any, res: Response) => {
  try {
    const { id, productId } = req.params;

    if (!id || !productId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'ID de marca y producto son requeridos',
      });
    }

    await adminService.deleteInactiveProduct(id, productId);

    return res.status(200).json({
      message: 'Producto eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error in deleteInactiveProduct:', error);
    const isValidationError =
      error.message === 'Solo se pueden eliminar productos inactivos' ||
      error.message === 'Producto no encontrado o no pertenece a esta marca';
    return res.status(isValidationError ? 400 : 500).json({
      error: isValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
      message: error.message || 'Error al eliminar producto',
    });
  }
};

/**
 * PATCH /api/admin/brands/:id/activate-plan
 * Activar plan de una marca que está en período de prueba.
 * Convierte el trial en suscripción activa pagada
 *
 * Requirement: 11 (Opción C)
 */
export const activateBrandPlan = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { plan, amount, payment_method, notes } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'ID de marca requerido',
      });
    }

    const updatedBrand = await adminService.activateBrandPlan(id, {
      plan: plan || 'BASIC',
      amount: amount || 0,
      payment_method: payment_method || 'manual',
      notes: notes || 'Activación manual por administrador',
    });

    // Auditoría
    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.plan_activate',
      target_brand_id: id,
      details: { plan: plan || 'BASIC', amount, payment_method },
    });

    // Notificación de conversión trial → plan pagado
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
      brand: {
        id: updatedBrand.id,
        name: updatedBrand.name,
        plan: updatedBrand.plan,
        subscription_status: updatedBrand.subscription_status,
        subscription_end_date: updatedBrand.subscription_end_date,
      },
    });
  } catch (error: any) {
    console.error('Error in activateBrandPlan:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al activar plan',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * PATCH /api/admin/brands/:id/landing-page
 * Activar o desactivar la mini-landing de una marca (task 33.5)
 */
export const toggleLandingPage = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { has_landing_page } = req.body;

    if (typeof has_landing_page !== 'boolean') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'has_landing_page debe ser un booleano',
      });
    }

    const { supabaseAdmin } = await import('../config/supabase');
    const { data, error } = await supabaseAdmin
      .from('brands')
      .update({ has_landing_page })
      .eq('id', id)
      .select('id, name, has_landing_page')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });
    }

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.landing_page_toggle',
      target_brand_id: id,
      details: { has_landing_page },
    });

    return res.status(200).json({
      message: `Mini-landing ${has_landing_page ? 'activada' : 'desactivada'} exitosamente`,
      brand: data,
    });
  } catch (error: any) {
    console.error('Error in toggleLandingPage:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al actualizar mini-landing',
    });
  }
};

/**
 * PATCH /api/admin/brands/:id/modal-config
 * Actualiza el texto del modal de activación que ven los visitantes.
 */
export const updateModalConfig = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { modal_title, modal_description, modal_features } = req.body;

    const { supabaseAdmin } = await import('../config/supabase');
    const { data, error } = await supabaseAdmin
      .from('brands')
      .update({ modal_title, modal_description, modal_features })
      .eq('id', id)
      .select('id, name, modal_title, modal_description, modal_features')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });
    }

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.modal_config_update' as any,
      target_brand_id: id,
      details: { modal_title, modal_description },
    });

    return res.status(200).json({ message: 'Configuración del modal actualizada', brand: data });
  } catch (error: any) {
    console.error('Error in updateModalConfig:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar modal' });
  }
};

/**
 * GET /api/admin/mini-landings
 * Lista todas las marcas con datos de mini-landing para el panel de control.
 * Incluye: has_landing_page, landing_suspended_at, subscription_status, slug, plan.
 */
export const getMiniLandingsAdmin = async (req: any, res: Response) => {
  try {
    const { supabaseAdmin } = await import('../config/supabase');
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, slug, plan, trial_end_date, has_landing_page, landing_suspended_at, subscription_status, created_at')
      .order('created_at', { ascending: false });

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
      const is_in_trial =
        b.plan === 'TRIAL' &&
        trialEnd !== null &&
        trialEnd > now &&
        b.subscription_status !== 'active' &&
        b.subscription_status !== 'expiring_soon';
      return { ...b, dias_para_eliminacion, is_in_trial };
    });

    return res.status(200).json({ brands, count: brands.length });
  } catch (error: any) {
    console.error('Error in getMiniLandingsAdmin:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener mini-landings' });
  }
};

/**
 * PATCH /api/admin/mini-landings/:id/suspend
 * Suspende manualmente la mini-landing de una marca (setea landing_suspended_at = now()).
 */
export const suspendMiniLanding = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = await import('../config/supabase');
    const { data, error } = await supabaseAdmin
      .from('brands')
      .update({ landing_suspended_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, landing_suspended_at')
      .single();

    if (error || !data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.landing_suspend',
      target_brand_id: id,
    });

    return res.status(200).json({ message: 'Mini-landing suspendida', brand: data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al suspender mini-landing' });
  }
};

/**
 * PATCH /api/admin/mini-landings/:id/restore
 * Restaura la mini-landing de una marca (limpia landing_suspended_at, activa has_landing_page).
 */
export const restoreMiniLanding = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = await import('../config/supabase');
    const { data, error } = await supabaseAdmin
      .from('brands')
      .update({ landing_suspended_at: null, has_landing_page: true })
      .eq('id', id)
      .select('id, name, landing_suspended_at, has_landing_page')
      .single();

    if (error || !data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.landing_restore',
      target_brand_id: id,
    });

    return res.status(200).json({ message: 'Mini-landing restaurada', brand: data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al restaurar mini-landing' });
  }
};

/**
 * GET /api/admin/stats/conversion
 * Métricas de conversión: marcas en trial, convertidas, tasa y conversiones por mes.
 * Requirement 29.2
 */
export const getConversionStats = async (_req: any, res: Response) => {
  try {
    const stats = await adminService.getConversionStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error in getConversionStats:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener métricas de conversión',
    });
  }
};
// Gestión de admins

export const listAdmins = async (_req: any, res: Response) => {
  try {
    const admins = await adminService.listAdmins();
    return res.status(200).json({ admins });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
};

export const createAdmin = async (req: any, res: Response) => {
  try {
    const { email, password, name, permissions } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'email, password y name son requeridos' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 8 caracteres' });
    }
    const admin = await adminService.createAdmin({ email, password, name, permissions });

    // Enviar email de bienvenida al nuevo admin (sin bloquear la respuesta)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://lookitry.com');
    const isSuperadmin = !permissions || permissions.length === 0;
    const permissionsList = isSuperadmin
      ? 'Acceso total (superadmin)'
      : (permissions as string[]).join(', ');

    emailService.sendEmail({
      to: email,
      subject: 'Acceso al Panel de Administración — Virtual Try-On',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#FF5C3A;margin-bottom:8px">Bienvenido al Panel de Administración</h2>
          <p style="color:#6b7280;margin-bottom:24px">
            Hola <strong>${name}</strong>, se ha creado tu cuenta de administrador en Virtual Try-On.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f9fafb;border-radius:8px;padding:16px">
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Email</td><td style="padding:8px 12px;font-weight:600;color:#111827">${email}</td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Contrase?a</td><td style="padding:8px 12px;font-weight:600;color:#111827">${password}</td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Nivel de acceso</td><td style="padding:8px 12px;color:#111827">${permissionsList}</td></tr>
          </table>
          <p style="color:#dc2626;font-size:13px;margin-bottom:24px">
            Por seguridad, cambia tu contrase?a despu?s de iniciar sesi?n por primera vez.
          </p>
          <a href="${appUrl}/admin/login" style="display:inline-block;background:#FF5C3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Ir al panel de administración
          </a>
        </div>
      `,
    }).catch(err => console.error('[createAdmin] Error enviando email de bienvenida:', err));

    return res.status(201).json({ admin });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

export const updateAdminPermissions = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'permissions debe ser un array' });
    }
    await adminService.updateAdminPermissions(id, permissions);
    return res.status(200).json({ message: 'Permisos actualizados' });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

export const deleteAdmin = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await adminService.deleteAdmin(id, req.admin?.id);
    return res.status(200).json({ message: 'Admin eliminado' });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

export const sendAdminCredentials = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { admin, newPassword } = await adminService.resetAdminPassword(id);

    emailService.sendEmail({
      to: admin.email,
      subject: 'Restablecimiento de contraseña — Panel de Administración',
      html: adminPasswordResetEmail(admin.name, admin.email, newPassword),
    }).catch(err => console.error('[sendAdminCredentials] Error enviando email:', err));

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'admin.send_credentials',
      details: { target_admin_id: id, target_email: admin.email },
    });

    return res.status(200).json({ message: 'Credenciales enviadas exitosamente' });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

/**
 * PUT /api/admin/admins/me/password
 * El admin autenticado cambia su propia contraseña
 */
export const changeOwnPassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!req.admin?.id) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'currentPassword y newPassword son requeridos' });
    }
    await adminService.changeOwnPassword(req.admin.id, currentPassword, newPassword);

    const IS_PROD = process.env.NODE_ENV === 'production';
    const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
    const cookieOptions: any = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? 'none' : 'lax',
      expires: new Date(0),
      path: '/',
    };

    if (COOKIE_DOMAIN && IS_PROD) {
      cookieOptions.domain = COOKIE_DOMAIN;
    }

    res.cookie('admin_token', '', cookieOptions);

    auditService.log({
      admin_id: req.admin.id,
      admin_email: req.admin.email,
      action: 'admin.change_password',
    });

    return res.status(200).json({
      message: 'Contrase?a actualizada exitosamente. Inicia sesi?n de nuevo con tu nueva contrase?a.',
      requiresReauth: true,
    });

    return res.status(200).json({ message: 'Contrase?a actualizada exitosamente' });
  } catch (error: any) {
    const isValidation = error.message === 'La contraseña actual es incorrecta'
      || error.message === 'La nueva contraseña debe tener al menos 8 caracteres';
    if (
      error.message === 'La nueva contraseña debe ser diferente a la actual'
      || error.message === 'La cuenta de administrador tiene una contraseña inválida en base de datos. Restablécela desde el panel o recrea el admin con el script seguro.'
    ) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
    }

    return res.status(isValidation ? 400 : 500).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

export const changeAdminPassword = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!newPassword) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'newPassword es requerido' });
    }
    await adminService.changeAdminPassword(id, newPassword);
    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'admin.change_password',
      details: { target_admin_id: id },
    });
    return res.status(200).json({ message: 'Contrase?a actualizada correctamente' });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};
// Créditos OpenRouter

/**
 * GET /api/admin/openrouter-credits
 * Consulta el balance de créditos en OpenRouter
 */
export const getOpenRouterCredits = async (_req: any, res: Response) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'CONFIG_ERROR', message: 'OPENROUTER_API_KEY no configurada' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'EXTERNAL_ERROR', message: 'Error al consultar OpenRouter' });
    }

    const json = await response.json() as { data?: any };
    const data = json.data ?? {};

    const limit: number | null = data.limit ?? null;
    const usage: number = data.usage ?? 0;
    const balance = limit !== null ? Math.max(0, limit - usage) : null;

    // Costo estimado por generación con gemini-2.5-flash-image
    const COST_PER_GEN = 0.039;
    const estimatedGenerations = balance !== null ? Math.floor(balance / COST_PER_GEN) : null;
    const usagePercent = limit ? Math.min(100, Math.round((usage / limit) * 100)) : null;

    return res.status(200).json({
      label: data.label ?? null,
      usage: parseFloat(usage.toFixed(4)),
      limit,
      balance: balance !== null ? parseFloat(balance.toFixed(4)) : null,
      is_free_tier: data.is_free_tier ?? false,
      rate_limit: data.rate_limit ?? null,
      usage_percent: usagePercent,
      estimated_generations_remaining: estimatedGenerations,
      cost_per_generation: COST_PER_GEN,
      low_balance_alert: balance !== null && limit !== null ? balance < limit * 0.2 : false,
      critical_balance_alert: balance !== null ? balance < 5 : false,
    });
  } catch (error: any) {
    console.error('Error in getOpenRouterCredits:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener créditos' });
  }
};
// Feedback de generaciones (51.8)

/**
 * GET /api/admin/replicate-credits
 * Valida la cuenta de Replicate y estima consumo del mes actual.
 */
export const getReplicateCredits = async (_req: any, res: Response) => {
  try {
    const adminMeta = await adminService.getAdminMeta().catch(() => ({} as {
      replicate_api_token?: string;
      replicate_monthly_budget_usd?: number;
      replicate_cost_per_generation_usd?: number;
    }));
    const apiToken = String(adminMeta.replicate_api_token || process.env.REPLICATE_API_TOKEN || '').trim();
    const metaCost = Number(adminMeta.replicate_cost_per_generation_usd);
    const envCost = Number(process.env.REPLICATE_COST_PER_GENERATION_USD);
    const costPerGeneration = Number.isFinite(metaCost) && metaCost > 0 ? metaCost : Number.isFinite(envCost) && envCost > 0 ? envCost : 0.05;
    const metaLimit = Number(adminMeta.replicate_monthly_budget_usd);
    const envLimit = Number(process.env.REPLICATE_MONTHLY_BUDGET_USD);
    const configuredLimit = Number.isFinite(metaLimit) && metaLimit > 0 ? metaLimit : Number.isFinite(envLimit) && envLimit > 0 ? envLimit : null;

    if (!apiToken) {
      return res.status(200).json({ provider: 'replicate', status: 'not_configured', configured: false, label: null, usage: null, limit: configuredLimit, balance: configuredLimit, usage_percent: null, estimated_generations_remaining: configuredLimit !== null ? Math.floor(configuredLimit / costPerGeneration) : null, cost_per_generation: costPerGeneration, low_balance_alert: false, critical_balance_alert: false, can_top_up: true, settings_url: 'https://replicate.com/account/billing', message: 'REPLICATE_API_TOKEN no configurado.' });
    }

    let label: string | null = null;
    let status: 'ok' | 'partial' = 'partial';
    let monthPredictionCount = 0;
    let usage: number | null = null;
    let balance: number | null = configuredLimit;
    let usagePercent: number | null = null;
    let estimatedGenerationsRemaining: number | null = configuredLimit !== null ? Math.floor(configuredLimit / costPerGeneration) : null;
    let lowBalanceAlert = false;
    let criticalBalanceAlert = false;
    let message = configuredLimit === null ? 'Configura un presupuesto mensual de Replicate para estimar saldo y generaciones restantes.' : 'Saldo estimado segun presupuesto mensual configurado.';

    try {
      const accountResponse = await fetch('https://api.replicate.com/v1/account', {
        headers: {
          Authorization: `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (accountResponse.ok) {
        const account = await accountResponse.json() as { username?: string; name?: string };
        label = account.name || account.username || null;
        status = 'ok';
      }

      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      let nextUrl: string | null = 'https://api.replicate.com/v1/predictions';
      let pagesRead = 0;

      while (nextUrl && pagesRead < 10) {
        const predictionsResponse = await fetch(nextUrl, {
          headers: {
            Authorization: `Token ${apiToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!predictionsResponse.ok) break;
        const payload = await predictionsResponse.json() as { results?: Array<{ created_at?: string | null }>; next?: string | null };
        const results = Array.isArray(payload.results) ? payload.results : [];
        let reachedOlderRecords = false;
        for (const prediction of results) {
          if (!prediction.created_at) continue;
          const createdAt = new Date(prediction.created_at);
          if (Number.isNaN(createdAt.getTime())) continue;
          if (createdAt >= monthStart) monthPredictionCount += 1;
          else reachedOlderRecords = true;
        }
        if (reachedOlderRecords) break;
        nextUrl = payload.next || null;
        pagesRead += 1;
      }

      usage = Number((monthPredictionCount * costPerGeneration).toFixed(2));
      if (configuredLimit !== null) {
        balance = Number(Math.max(configuredLimit - usage, 0).toFixed(2));
        usagePercent = Number(Math.min((usage / configuredLimit) * 100, 100).toFixed(2));
        estimatedGenerationsRemaining = Math.max(Math.floor(balance / costPerGeneration), 0);
        lowBalanceAlert = balance <= configuredLimit * 0.25;
        criticalBalanceAlert = balance <= configuredLimit * 0.1;
        message = `Consumo estimado con ${monthPredictionCount.toLocaleString('es-CO')} predicciones de Replicate registradas este mes.`;
      } else {
        balance = null;
        usagePercent = null;
        estimatedGenerationsRemaining = null;
        message = `Cuenta validada. Consumo estimado con ${monthPredictionCount.toLocaleString('es-CO')} predicciones del mes. Define un presupuesto mensual para calcular saldo restante.`;
      }
    } catch (providerError) {
      console.error('Error consultando cuenta Replicate:', providerError);
      if (configuredLimit !== null) {
        message = 'No se pudo leer el historico de predicciones de Replicate. Se mantiene el presupuesto configurado como referencia.';
      }
    }

    return res.status(200).json({ provider: 'replicate', status, configured: true, label, usage, limit: configuredLimit, balance, usage_percent: usagePercent, estimated_generations_remaining: estimatedGenerationsRemaining, cost_per_generation: costPerGeneration, low_balance_alert: lowBalanceAlert, critical_balance_alert: criticalBalanceAlert, can_top_up: true, settings_url: 'https://replicate.com/account/billing', message });
  } catch (error: any) {
    console.error('Error in getReplicateCredits:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener creditos de Replicate' });
  }
};
import { FeedbackService } from '../services/feedback.service';
const feedbackService = new FeedbackService();

/**
 * GET /api/admin/feedback
 * Lista feedbacks con filtros opcionales: error_type, brand_id, resolved
 */
export const getFeedbacks = async (req: any, res: Response) => {
  try {
    const { error_type, brand_id, resolved, limit } = req.query;
    const feedbacks = await feedbackService.getFeedbacks({
      error_type: error_type as any,
      brand_id: brand_id as string | undefined,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : 100,
    });
    return res.status(200).json({ feedbacks });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
};

/**
 * GET /api/admin/feedback/stats
 * Estadísticas agrupadas por tipo de error
 */
export const getFeedbackStats = async (_req: any, res: Response) => {
  try {
    const stats = await feedbackService.getErrorStats();
    return res.status(200).json({ stats });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
};

/**
 * PATCH /api/admin/feedback/:id/resolve
 * Marca un feedback como resuelto
 */
export const resolveFeedback = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await feedbackService.resolveFeedback(id, req.admin?.email ?? 'admin');
    return res.status(200).json({ message: 'Feedback marcado como resuelto' });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
};

/**
 * DELETE /api/admin/feedback/:id
 * Elimina un feedback del RAG
 */
export const deleteFeedback = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await feedbackService.deleteFeedback(id);
    return res.status(200).json({ message: 'Feedback eliminado del RAG' });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
};

/**
 * GET /api/admin/feedback/count-unresolved
 * Conteo de feedbacks sin resolver (para badge en sidebar)
 */
export const getUnresolvedFeedbackCount = async (_req: any, res: Response) => {
  try {
    const feedbacks = await feedbackService.getUnresolvedFeedbacks(1000);
    return res.status(200).json({ count: feedbacks.length });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 0 });
  }
};

/**
 * POST /api/admin/brands/:id/send-reset-email
 * Env?a email de recuperaci?n de contrase?a a una marca desde el panel admin
 */
export const sendBrandResetEmail = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = await import('../config/supabase');

    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, email')
      .eq('id', id)
      .single();

    if (error || !brand) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });
    }

    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await supabaseAdmin
      .from('brands')
      .update({ reset_token: token, reset_token_expires_at: expiresAt.toISOString() })
      .eq('id', brand.id);

    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://lookitry.com');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await emailService.sendEmail({
      to: brand.email,
      subject: 'Recuperación de contraseña — Lookitry',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#FF5C3A;margin-bottom:8px">Recuperación de contraseña</h2>
          <p style="color:#6b7280;margin-bottom:24px">
            Hola <strong>${brand.name}</strong>, recibiste este correo porque se solicit? un restablecimiento de contrase?a para tu cuenta.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#FF5C3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px">
            Restablecer contraseña
          </a>
          <p style="color:#9ca3af;font-size:13px">
            Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.
          </p>
        </div>
      `,
    });

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.send_reset_email',
      target_brand_id: id,
      details: { brand_email: brand.email },
    });

    return res.status(200).json({ message: 'Email de recuperación enviado exitosamente' });
  } catch (error: any) {
    console.error('Error in sendBrandResetEmail:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al enviar email de recuperación' });
  }
};

/**
 * GET /api/admin/revenue/payments
 * Obtener historial de pagos global con filtros
 */
export const getPayments = async (req: any, res: Response) => {
  try {
    const { brand_id, status, payment_method, limit, offset, from, to, search } = req.query;
    
    const result = await adminService.getPayments({
      brand_id: brand_id as string | undefined,
      status: status as string | undefined,
      payment_method: payment_method as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : 0,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in getPayments:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener pagos',
    });
  }
};

/**
 * GET /api/admin/woocommerce/brands-summary
 * Resumen de marcas con estado de integración WooCommerce.
 */
export const getWooBrandsSummary = async (_req: any, res: Response) => {
  try {
    const { data: brands, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, slug, email, api_key, plan, subscription_status, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const brandIds = (brands || []).map((b: any) => b.id);
    const productCounts = new Map<string, { total: number; active: number; mapped: number }>();

    if (brandIds.length) {
      const { data: products, error: prodErr } = await supabaseAdmin
        .from('products')
        .select('brand_id, is_active, external_id')
        .in('brand_id', brandIds);

      if (prodErr) throw prodErr;

      for (const p of products || []) {
        const current = productCounts.get(p.brand_id) || { total: 0, active: 0, mapped: 0 };
        current.total += 1;
        if (p.is_active) current.active += 1;
        if (p.external_id) current.mapped += 1;
        productCounts.set(p.brand_id, current);
      }
    }

    const rows = await Promise.all((brands || []).map(async (b: any) => {
      const counts = productCounts.get(b.id) || { total: 0, active: 0, mapped: 0 };
      const telemetry = await getWooTelemetrySummary(b.id, 30).catch(() => ({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatencyMs: 0,
        totalRetries: 0,
        lastSyncAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
        storeDomain: null,
      }));

      // Lógica de status para el frontend
      let status: 'active' | 'pending' | 'inactive' = 'inactive';
      if (b.api_key) {
        // Si tiene API key y ha habido actividad, está activa. Si no, está pendiente.
        status = telemetry.totalRequests > 0 ? 'active' : 'pending';
      }

      return {
        ...b,
        has_api_key: !!b.api_key,
        status,
        plugin_store_domain: telemetry.storeDomain,
        plugin_validated_at: telemetry.lastSyncAt,
        subscription_status: b.subscription_status,
        product_counts: counts,
        telemetry,
      };
    }));

    return res.status(200).json({ brands: rows, count: rows.length });
  } catch (error: any) {
    console.error('Error in getWooBrandsSummary:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener resumen WooCommerce' });
  }
};

/**
 * GET /api/admin/woocommerce/brands/:id/products
 * Productos de una marca para control de activación.
 */
export const getWooBrandProducts = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const [productSummary, telemetry] = await Promise.all([
      getWooProductSummary(id),
      getWooTelemetrySummary(id, 30),
    ]);
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, category, external_id, is_active, updated_at')
      .eq('brand_id', id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      products: products || [],
      count: (products || []).length,
      summary: {
        products: productSummary,
        telemetry,
      },
    });
  } catch (error: any) {
    console.error('Error in getWooBrandProducts:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener productos WooCommerce de la marca' });
  }
};

/**
 * PATCH /api/admin/woocommerce/brands/:id/products/:productId/active
 * Activar o desactivar un producto mapeado para control de slots.
 */
export const setWooProductActive = async (req: any, res: Response) => {
  try {
    const { id, productId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'is_active debe ser boolean' });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('brand_id', id)
      .select('id, name, is_active, external_id')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Producto no encontrado para esta marca' });
    }

    auditService.log({
      admin_id: req.admin?.id ?? 'unknown',
      admin_email: req.admin?.email ?? 'unknown',
      action: 'brand.woo_product_toggle' as any,
      target_brand_id: id,
      details: { product_id: productId, is_active },
    });

    return res.status(200).json({
      message: `Producto ${is_active ? 'activado' : 'desactivado'} exitosamente`,
      product: data,
    });
  } catch (error: any) {
    console.error('Error in setWooProductActive:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar estado de producto' });
  }
};

/**
 * GET /api/admin/promotions
 * Listar todas las promociones
 */
export const getAllPromotions = async (req: any, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ ok: true, data: data || [] });
  } catch (error: any) {
    console.error('Error in getAllPromotions:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener promociones' });
  }
};

/**
 * POST /api/admin/promotions
 * Crear nueva promoción
 */
export const createPromotion = async (req: any, res: Response) => {
  try {
    const { type, name, config, active, starts_at, ends_at } = req.body;
    if (!type || !name) {
      return res.status(400).json({ error: 'INVALID_BODY', message: 'Faltan campos requeridos (type, name)' });
    }

    const { data, error } = await supabaseAdmin
      .from('promotions')
      .insert({
        type,
        name,
        config: config ?? {},
        active: active ?? false,
        starts_at: starts_at || null,
        ends_at: ends_at || null
      })
      .select()
      .single();

    if (error) throw error;

    await auditService.log({
      admin_id: req.admin.id,
      admin_email: req.admin.email,
      action: 'system.config_update',
      details: { promo_id: data.id, action: 'create', promo_name: name }
    });

    return res.status(201).json({ ok: true, data });
  } catch (error: any) {
    console.error('Error in createPromotion:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al crear promoción' });
  }
};

/**
 * PUT /api/admin/promotions/:id
 * Actualizar promoción existente
 */
export const updatePromotion = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { type, name, config, active, starts_at, ends_at } = req.body;

    const { data, error } = await supabaseAdmin
      .from('promotions')
      .update({
        type,
        name,
        config: config ?? {},
        active: active ?? false,
        starts_at: starts_at || null,
        ends_at: ends_at || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (req.admin) {
      await auditService.log({
        admin_id: req.admin.id,
        admin_email: req.admin.email,
        action: 'system.config_update',
        details: { promo_id: id, action: 'update' }
      });
    }

    return res.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error in updatePromotion:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar promoción' });
  }
};

/**
 * DELETE /api/admin/promotions/:id
 * Eliminar promoción
 */
export const deletePromotion = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (req.admin) {
      await auditService.log({
        admin_id: req.admin.id,
        admin_email: req.admin.email,
        action: 'system.config_update',
        details: { promo_id: id, action: 'delete' }
      });
    }

    return res.json({ ok: true, message: 'Promoción eliminada' });
  } catch (error: any) {
    console.error('Error in deletePromotion:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al eliminar promoción' });
  }
};

/**
 * GET /api/admin/pricing
 * Obtener toda la configuración de precios
 */
export const getPricingConfig = async (req: any, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pricing_config')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return res.json({ ok: true, data: data || [] });
  } catch (error: any) {
    console.error('Error in getPricingConfig:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener precios' });
  }
};

/**
 * PUT /api/admin/pricing
 * Actualizar una configuración de precio específica
 */
export const updatePricingConfig = async (req: any, res: Response) => {
  try {
    const { id, data: configData } = req.body;
    if (!id || !configData) {
      return res.status(400).json({ error: 'INVALID_BODY', message: 'Faltan campos id o data' });
    }

    const { data, error } = await supabaseAdmin
      .from('pricing_config')
      .update({
        data: configData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (req.admin) {
      await auditService.log({
        admin_id: req.admin.id,
        admin_email: req.admin.email,
        action: 'system.config_update',
        details: { pricing_id: id, action: 'update_pricing' }
      });
    }

    return res.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error in updatePricingConfig:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar precios' });
  }
};

export const getMissionControl = async (_req: any, res: Response) => {
  try {
    const result = await adminService.getMissionControl();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in getMissionControl:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener datos del mission control' });
  }
};

export const getRiskData = async (_req: any, res: Response) => {
  try {
    const result = await adminService.getRiskData();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in getRiskData:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener datos de riesgo' });
  }
};

export const getEconomics = async (_req: any, res: Response) => {
  try {
    const result = await adminService.getEconomics();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in getEconomics:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener datos de economía unitaria' });
  }
};

export const getAuditLog = async (req: any, res: Response) => {
  try {
    const { limit, offset, action, admin_email, from, to } = req.query;
    const result = await adminService.getAuditLog({
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
      action: action as string | undefined,
      admin_email: admin_email as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in getAuditLog:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener log de auditoría' });
  }
};

export const getBrandFull = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ID de marca requerido' });
    }
    const result = await adminService.getBrandFull(id);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in getBrandFull:', error);
    if (error.message === 'Marca no encontrada') {
      return res.status(404).json({ error: 'NOT_FOUND', message: error.message });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener ficha de marca' });
  }
};
