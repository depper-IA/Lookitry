import { Response } from 'express';
import { AdminService } from '../../services/admin.service';
import { auditService } from '../../services/audit.service';
import { generateAdminToken } from '../../utils/jwt';
import { emailService } from '../../services/email.service';
import { authAdminService } from '../../services/admin/auth.admin.service';
import { verifyGoogleAccessToken, verifyGoogleToken } from '../../services/google-auth.service';
import { sanitizeError } from '../../utils/sanitizeError';

const adminService = new AdminService();

const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

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

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Formato de email inválido',
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

    // Verificar si está bloqueada
    const lockCheck = await adminService.isLockedOut(admin.id);
    if (lockCheck.locked) {
      return res.status(423).json({
        error: 'LOCKED',
        message: lockCheck.reason,
      });
    }

    // Verificar contraseña
    const isValidPassword = await adminService.verifyPassword(password, (admin as any).password);

    if (!isValidPassword) {
      await adminService.recordFailedAttempt(admin.id, req.ip || 'unknown');
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Credenciales inválidas',
      });
    }

    // Login exitoso - resetear contadores
    await adminService.resetFailedAttempts(admin.id);

    // Generar token
    const token = generateAdminToken({
      adminId: admin.id,
      email: admin.email,
    });

    // Seguridad: Cookie HTTP-Only
    const cookieOptions: any = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
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
      // Token se envía solo en cookie HTTP-only por seguridad
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

    const { admin, token } = await authAdminService.requestPasswordResetGetToken(email);

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
      message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
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

    await authAdminService.resetPasswordWithToken(token, password);

    return res.status(200).json({
      message: 'Contraseña restablecida correctamente',
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
        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
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
export const adminLogout = async (req: any, res: Response) => {
  try {
    // Extraer token de la cookie para añadirlo a la blacklist
    const token = req.cookies?.admin_token;

    // Limpiar cookie primero
    const cookieOptions: any = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    };

    if (COOKIE_DOMAIN && IS_PROD) {
      cookieOptions.domain = COOKIE_DOMAIN;
    }

    res.cookie('admin_token', '', cookieOptions);

    // Añadir token a la blacklist (errors handled gracefully to not block logout)
    if (token) {
      const { blacklistToken } = await import('../../config/redis');
      blacklistToken(token, 'admin_logout').catch(err => {
        console.error('[AdminLogout] Error adding token to blacklist:', err);
      });
    }

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
 * POST /api/admin/auth/google
 * Login de administrador con Google
 */
export const adminGoogleLogin = async (req: any, res: Response) => {
  try {
    const { credential, accessToken } = req.body;

    let googleSub: string;
    let googleEmail: string;

    if (accessToken) {
      // OAuth2 flow - frontend ya verificó con userinfo
      const googlePayload = await verifyGoogleAccessToken(accessToken);
      googleSub = googlePayload.sub;
      googleEmail = googlePayload.email;
    } else if (credential) {
      // ID Token flow
      const googlePayload = await verifyGoogleToken(credential);
      googleSub = googlePayload.sub;
      googleEmail = googlePayload.email;
    } else {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Credential o accessToken de Google requerido',
      });
    }

    if (!googleSub || !googleEmail) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Datos de Google incompletos',
      });
    }

    let admin = await adminService.getAdminByGoogleId(googleSub);

    // Si no se encuentra por Google ID, intentar vincular por email
    if (!admin) {
      console.log(`[AdminAuth] Admin no encontrado por google_id: [${googleSub}]. Intentando vincular por email: [${googleEmail}]`);
      admin = await adminService.getAdminByEmail(googleEmail);

      if (admin) {
        console.log(`[AdminAuth] Coincidencia por email encontrada. Vinculando google_id [${googleSub}] a la cuenta ID: [${admin.id}]`);
        await adminService.updateAdminGoogleId(admin.id, googleSub);
        
        // Refrescar datos del admin para asegurarnos de tener todo actualizado (opcional pero recomendado)
        admin = await adminService.getAdminById(admin.id);
        console.log(`[AdminAuth] Vinculación exitosa para: [${googleEmail}]`);
      } else {
        console.warn(`[AdminAuth] No se encontró ningún administrador con el email: [${googleEmail}]`);
      }
    } else {
      console.log(`[AdminAuth] Admin autenticado correctamente vía google_id: [${googleSub}] (${googleEmail})`);
    }

    if (!admin) {
      console.warn(`[AdminAuth] ACCESO DENEGADO: El usuario [${googleEmail}] no tiene permisos de administrador.`);
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Esta cuenta no tiene acceso de administrador',
      });
    }

    const token = generateAdminToken({
      adminId: admin.id,
      email: admin.email,
    });

    const cookieOptions: any = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };

    if (COOKIE_DOMAIN && IS_PROD) {
      cookieOptions.domain = COOKIE_DOMAIN;
    }

    res.cookie('admin_token', token, cookieOptions);

    auditService.log({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'admin.login',
      details: { method: 'google' },
    });

    return res.status(200).json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('Error in adminGoogleLogin:', error);

    if (
      error.message === 'GOOGLE_NOT_CONFIGURED' ||
      error.message === 'GOOGLE_TOKEN_INVALID' ||
      error.message === 'GOOGLE_AUDIENCE_MISMATCH' ||
      error.message === 'GOOGLE_ACCESS_TOKEN_INVALID'
    ) {
      return res.status(401).json({
        error: 'INVALID_GOOGLE_TOKEN',
        message: 'Token de Google inválido',
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al iniciar sesión con Google',
    });
  }
};

/**
 * GET /api/admin/admins
 * Listar administradores
 */
export const listAdmins = async (_req: any, res: Response) => {
  try {
    const admins = await adminService.listAdmins();
    return res.status(200).json({ admins });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al listar administradores') });
  }
};

/**
 * POST /api/admin/admins
 * Crear nuevo administrador
 */
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

    // Email de bienvenida
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://lookitry.com');
    const isSuperadmin = !permissions || permissions.length === 0;
    const permissionsList = isSuperadmin ? 'Acceso total (superadmin)' : (permissions as string[]).join(', ');

    emailService.sendEmail({
      to: email,
      subject: 'Acceso al Panel de Administración — Virtual Try-On',
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#FF5C3A;margin-bottom:8px">Bienvenido al Panel de Administración</h2>
        <p style="color:#6b7280;margin-bottom:24px">Hola <strong>${name}</strong>, se ha creado tu cuenta de administrador en Lookitry.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f9fafb;border-radius:8px;padding:16px">
          <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Email</td><td style="padding:8px 12px;font-weight:600;color:#111827">${email}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Contraseña</td><td style="padding:8px 12px;font-weight:600;color:#111827">${password}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Nivel de acceso</td><td style="padding:8px 12px;color:#111827">${permissionsList}</td></tr>
        </table>
        <p style="color:#dc2626;font-size:13px;margin-bottom:24px">Por seguridad, cambia tu contraseña después de iniciar sesión por primera vez.</p>
        <a href="${appUrl}/admin/login" style="display:inline-block;background:#FF5C3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Ir al panel de administración</a>
      </div>`,
    }).catch(err => console.error('[createAdmin] Error enviando email de bienvenida:', err));

    return res.status(201).json({ admin });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

/**
 * PATCH /api/admin/admins/:id/permissions
 */
export const updateAdminPermissions = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'permissions debe ser un array' });
    await adminService.updateAdminPermissions(id, permissions);
    return res.status(200).json({ message: 'Permisos actualizados' });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

/**
 * DELETE /api/admin/admins/:id
 */
export const deleteAdmin = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await adminService.deleteAdmin(id, req.admin?.id);
    return res.status(200).json({ message: 'Admin eliminado' });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

/**
 * POST /api/admin/admins/:id/credentials
 */
export const sendAdminCredentials = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { admin, newPassword } = await adminService.resetAdminPassword(id);

    const { adminPasswordResetEmail } = await import('../../templates/email-templates');
    emailService.sendEmail({
      to: admin.email,
      subject: 'Restablecimiento de contraseña — Panel de Administración',
      html: adminPasswordResetEmail(admin.name, admin.email, newPassword),
    }).catch(err => console.error('[sendAdminCredentials] Error enviando email:', err));

    auditService.log({ admin_id: req.admin?.id ?? 'unknown', admin_email: req.admin?.email ?? 'unknown', action: 'admin.send_credentials', details: { target_admin_id: id, target_email: admin.email } });
    return res.status(200).json({ message: 'Credenciales enviadas exitosamente' });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

/**
 * PUT /api/admin/admins/me/password
 */
export const changeOwnPassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!req.admin?.id) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'currentPassword y newPassword son requeridos' });
    
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
    if (COOKIE_DOMAIN && IS_PROD) cookieOptions.domain = COOKIE_DOMAIN;
    res.cookie('admin_token', '', cookieOptions);

    auditService.log({ admin_id: req.admin.id, admin_email: req.admin.email, action: 'admin.change_password' });
    return res.status(200).json({ message: 'Contraseña actualizada exitosamente. Inicia sesión de nuevo con tu nueva contraseña.', requiresReauth: true });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};

/**
 * PATCH /api/admin/admins/:id/password
 */
export const changeAdminPassword = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!newPassword) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'newPassword es requerido' });
    await adminService.changeAdminPassword(id, newPassword);
    auditService.log({ admin_id: req.admin?.id ?? 'unknown', admin_email: req.admin?.email ?? 'unknown', action: 'admin.change_password', details: { target_admin_id: id } });
    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: error.message });
  }
};
