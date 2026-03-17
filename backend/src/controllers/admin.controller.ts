import { Response } from 'express';
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

    const { supabase } = await import('../config/supabase');
    const { data, error } = await supabase
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

    const { supabase } = await import('../config/supabase');
    const { data, error } = await supabase
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
      .select('id, name, email, slug, plan, is_in_trial, has_landing_page, landing_suspended_at, subscription_status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const ahora = Date.now();
    const brands = (data || []).map((b: any) => {
      let dias_para_eliminacion: number | null = null;
      if (b.landing_suspended_at) {
        const transcurridos = Math.floor((ahora - new Date(b.landing_suspended_at).getTime()) / (1000 * 60 * 60 * 24));
        dias_para_eliminacion = Math.max(0, 90 - transcurridos);
      }
      return { ...b, dias_para_eliminacion };
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
