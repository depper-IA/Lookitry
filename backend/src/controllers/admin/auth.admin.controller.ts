import { Response } from 'express';
import { AdminService } from '../../services/admin.service';
import { auditService } from '../../services/audit.service';
import { generateToken } from '../../utils/jwt';
import { emailService } from '../../services/email.service';
import { authAdminService } from '../../services/admin/auth.admin.service';

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
    const cookieOptions: any = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? 'strict' : 'lax',
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
export const adminLogout = async (_req: any, res: Response) => {
  try {
    const cookieOptions: any = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? 'strict' : 'lax',
      expires: new Date(0),
      path: '/',
    };

    if (COOKIE_DOMAIN && IS_PROD) {
      cookieOptions.domain = COOKIE_DOMAIN;
    }

    res.cookie('admin_token', '', cookieOptions);

    return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
  } catch (error: any) {
    console.error('Error in adminLogout:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error interno del servidor al cerrar sesión',
    });
  }
};