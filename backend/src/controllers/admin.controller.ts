import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AdminService } from '../services/admin.service';
import { notificationService } from '../services/notification.service';
import { auditService } from '../services/audit.service';
import { generateToken } from '../utils/jwt';
import { emailService } from '../services/email.service';
import { createAdminNotification } from '../utils/adminNotifications';
import { adminPasswordResetEmail } from '../templates/email-templates';

const adminService = new AdminService();

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
}

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

    // Auditoría de login
    auditService.log({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'admin.login',
    });

    return res.status(200).json({
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

// ── Gestión de admins ─────────────────────────────────────────────────────────

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pruebalo.wilkiedevs.com';
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
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Contraseña</td><td style="padding:8px 12px;font-weight:600;color:#111827">${password}</td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Nivel de acceso</td><td style="padding:8px 12px;color:#111827">${permissionsList}</td></tr>
          </table>
          <p style="color:#dc2626;font-size:13px;margin-bottom:24px">
            Por seguridad, cambia tu contraseña después de iniciar sesión por primera vez.
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
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'currentPassword y newPassword son requeridos' });
    }
    await adminService.changeOwnPassword(req.admin.id, currentPassword, newPassword);

    auditService.log({
      admin_id: req.admin.id,
      admin_email: req.admin.email,
      action: 'admin.change_password',
    });

    return res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error: any) {
    const isValidation = error.message === 'La contraseña actual es incorrecta'
      || error.message === 'La nueva contraseña debe tener al menos 8 caracteres';
    return res.status(isValidation ? 400 : 500).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

// ── Créditos OpenRouter ───────────────────────────────────────────────────────

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

// ── Feedback de generaciones (51.8) ──────────────────────────────────────────

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
 * Envía email de recuperación de contraseña a una marca desde el panel admin
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

    const frontendUrl = process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await emailService.sendEmail({
      to: brand.email,
      subject: 'Recuperación de contraseña — Lookitry',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#FF5C3A;margin-bottom:8px">Recuperación de contraseña</h2>
          <p style="color:#6b7280;margin-bottom:24px">
            Hola <strong>${brand.name}</strong>, recibiste este correo porque se solicitó un restablecimiento de contraseña para tu cuenta.
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
    const { brand_id, status, payment_method, limit, offset } = req.query;
    
    const result = await adminService.getPayments({
      brand_id: brand_id as string | undefined,
      status: status as string | undefined,
      payment_method: payment_method as string | undefined,
      limit: limit ? parseInt(limit as string) : 50,
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

    await auditService.log({
      admin_id: req.admin.id,
      admin_email: req.admin.email,
      action: 'system.config_update',
      details: { promo_id: id, action: 'delete' }
    });

    return res.json({ ok: true, message: 'Promoción eliminada' });
  } catch (error: any) {
    console.error('Error in deletePromotion:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al eliminar promoción' });
  }
};
