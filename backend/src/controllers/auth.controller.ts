import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { verifyEmailTemplate, passwordResetTemplate } from '../templates/email-templates';
import { RegisterBrandDto, LoginDto } from '../types';
import { AuthRequest } from '../middleware/auth';
import { generateToken } from '../utils/jwt';

const authService = new AuthService();
const emailService = new EmailService();

/** Emite el JWT como cookie HTTP-Only segura */
const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

function setCookieToken(res: Response, token: string): void {
  const cookieOptions: any = {
    httpOnly: true,
    secure: IS_PROD,           // Solo HTTPS en producción
    sameSite: IS_PROD ? 'none' : 'lax', // 'none' cross-origin en prod (requiere secure)
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 días en ms
    path: '/',
  };

  if (COOKIE_DOMAIN && IS_PROD) {
    cookieOptions.domain = COOKIE_DOMAIN;
  }

  res.cookie('token', token, cookieOptions);
}

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const data: RegisterBrandDto = req.body;

      if (!data.email || !data.password || !data.name || !data.slug) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Todos los campos son requeridos' });
      }

      if (!data.contact_name || data.contact_name.trim().length < 3) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El nombre completo es requerido (mínimo 3 caracteres)' });
      }

      // Verificar Turnstile si está habilitado
      // Se omite en el flujo post-pago (cuando viene con referencia de pago Wompi)
      const turnstileEnabled = process.env.TURNSTILE_ENABLED === 'true' && false; // Desactivado temporalmente
      const isPostPayment = !!req.body.ref;
      if (turnstileEnabled && !isPostPayment) {
        const token = req.body.turnstileToken;
        if (!token) {
          return res.status(400).json({ error: 'CAPTCHA_REQUIRED', message: 'Verificación de seguridad requerida' });
        }
        const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '';
        const formData = new URLSearchParams();
        formData.append('secret', process.env.TURNSTILE_SECRET_KEY || '');
        formData.append('response', token);
        if (ip) formData.append('remoteip', ip);

        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });
        const verifyData = await verifyRes.json() as { success: boolean; 'error-codes'?: string[] };
        if (!verifyData.success) {
          console.error('[Turnstile] Verificación fallida:', verifyData['error-codes']);
          return res.status(400).json({ error: 'CAPTCHA_FAILED', message: 'Verificación de seguridad fallida. Intenta de nuevo.' });
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Formato de email inválido' });
      }

      // Bloquear dominios de email desechables
      const disposableDomains = ['mailinator.com','guerrillamail.com','tempmail.com','throwam.com','yopmail.com','sharklasers.com','grr.la','guerrillamail.info','spam4.me','trashmail.com','trashmail.me','dispostable.com','fakeinbox.com','maildrop.cc','mailnull.com','spamgourmet.com','tempr.email','discard.email','10minutemail.com','minutemail.com','throwaway.email','getairmail.com','filzmail.com','spamgourmet.net','spamgourmet.org'];
      const emailDomain = data.email.split('@')[1]?.toLowerCase();
      if (emailDomain && disposableDomains.includes(emailDomain)) {
        return res.status(400).json({ error: 'DISPOSABLE_EMAIL', message: 'No se permiten correos temporales. Usa tu correo real.' });
      }

      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(data.slug)) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El slug solo puede contener letras minúsculas, números y guiones' });
      }

      if (data.password.length < 6) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const result = await authService.register({
        ...data,
        ip: req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || 'unknown',
        fingerprint: req.body.fingerprint || null,
      });

      // Enviar email de verificación solo si NO requiere verificación de tarjeta.
      // Si requireCardVerification=true, el email se envía desde el webhook de Wompi
      // una vez que el pago de $100 sea confirmado. Esto cierra la brecha donde un
      // usuario podía verificar el email sin haber completado el pago.
      if (result.verificationToken && !result.requireCardVerification) {
        const frontendUrl = (process.env.NODE_ENV === 'development' || !process.env.FRONTEND_URL) ? 'http://localhost:3000' : process.env.FRONTEND_URL;
        const verifyUrl = `${frontendUrl}/auth/verify?token=${result.verificationToken}`;
        emailService.sendEmail({
          to: result.brand.email,
          subject: 'Confirma tu correo — Lookitry',
          html: verifyEmailTemplate({ name: result.brand.name, email: result.brand.email }, verifyUrl),
        }).catch(err => console.error('[Auth] Error enviando email de verificación:', err));
      }

      // Emitir token como cookie HTTP-Only (más seguro que localStorage)
      if (result.token) setCookieToken(res, result.token);
      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Error en register:', error);

      if (error.message.includes('ya está')) {
        return res.status(409).json({ error: 'CONFLICT', message: error.message });
      }

      if (error.message === 'TRIAL_ABUSE') {
        return res.status(429).json({
          error: 'TRIAL_ABUSE',
          message: 'Ya existe una cuenta de prueba registrada desde este dispositivo o red. Puedes contratar un plan directamente.',
        });
      }

      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al registrar la marca' });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Token requerido' });
      }

      const result = await authService.verifyEmail(token) as { ok: boolean; message: string; brandId?: string };
      if (!result.ok) {
        return res.status(400).json({ error: 'INVALID_TOKEN', message: result.message });
      }

      // Si se verificó correctamente, emitir cookie de sesión (Auto-login)
      if (result.brandId) {
        const fullBrand = await authService.getBrandById(result.brandId);
        if (fullBrand) {
          const newToken = generateToken({ brandId: fullBrand.id, email: fullBrand.email });
          setCookieToken(res, newToken);
          
          // Disparar correo de Bienvenida con los datos del plan tras la verificación exitosa.
          // skipPreferenceCheck=true porque la tabla notification_preferences puede estar
          // vacía para esta marca (recién creada).
          import('../services/notification.service')
            .then(({ notificationService }) => notificationService.sendWelcomeEmail(fullBrand as any, true))
            .catch(err => console.error('[Auth] Error importando notificationService:', err));
          
          return res.status(200).json({ 
            message: result.message,
            token: newToken,
            brand: {
              id: fullBrand.id,
              name: fullBrand.name,
              email: fullBrand.email,
              slug: fullBrand.slug,
              plan: fullBrand.plan,
              emailVerified: true
            }
          });
        }
      }

      return res.status(200).json({ message: result.message });
    } catch (error: any) {
      console.error('Error en verifyEmail:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al verificar el correo' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const data: LoginDto = req.body;

      if (!data.email || !data.password) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email y contraseña son requeridos' });
      }

      const result = await authService.login(data);
      // Emitir token como cookie HTTP-Only (más seguro que localStorage)
      if (result.token) setCookieToken(res, result.token);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en login:', error);

      if (error.message === 'Credenciales inválidas') {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: error.message });
      }

      if (error.message === 'EMAIL_NOT_VERIFIED') {
        return res.status(403).json({ error: 'EMAIL_NOT_VERIFIED', message: 'Debes verificar tu correo electrónico antes de iniciar sesión' });
      }

      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al iniciar sesión' });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email requerido' });
      }

      const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://lookitry.com');
      const { brand, token } = await authService.requestPasswordResetGetToken(email);

      // Siempre responder OK para no revelar si el email existe
      if (brand && token) {
        const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;
        emailService.sendEmail({
          to: brand.email,
          subject: 'Recuperar contraseña — Lookitry',
          html: passwordResetTemplate({ name: brand.name, email: brand.email }, resetUrl),
        }).catch(err => console.error('[Auth] Error enviando email de reset:', err));
      }

      return res.status(200).json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' });
    } catch (error: any) {
      console.error('Error en forgotPassword:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al procesar la solicitud' });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Token y contraseña son requeridos' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 6 caracteres' });
      }

      await authService.resetPassword(token, password);
      return res.status(200).json({ message: 'Contraseña restablecida correctamente' });
    } catch (error: any) {
      console.error('Error en resetPassword:', error);
      if (error.message === 'TOKEN_INVALID' || error.message === 'TOKEN_EXPIRED') {
        return res.status(400).json({ error: error.message, message: 'El enlace es inválido o ha expirado. Solicita uno nuevo.' });
      }
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al restablecer la contraseña' });
    }
  }

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email requerido' });
      }

      const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://lookitry.com');
      const { brand, token } = await authService.resendVerificationEmail(email);

      if (brand && token) {
        const verifyUrl = `${frontendUrl}/auth/verify?token=${token}`;
        emailService.sendEmail({
          to: brand.email,
          subject: 'Confirma tu correo — Lookitry',
          html: verifyEmailTemplate({ name: brand.name, email: brand.email }, verifyUrl),
        }).catch(err => console.error('[Auth] Error reenviando email de verificación:', err));
      }

      // Siempre responder OK para no revelar si el email existe
      return res.status(200).json({ message: 'Si el email está pendiente de verificación, recibirás un nuevo enlace.' });
    } catch (error: any) {
      console.error('Error en resendVerification:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al reenviar el correo' });
    }
  }

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const brandId = req.brand!.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Contraseña actual y nueva son requeridas' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      await authService.changePassword(brandId, currentPassword, newPassword);
      return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error: any) {
      console.error('Error en changePassword:', error);
      if (error.message === 'WRONG_PASSWORD') {
        return res.status(401).json({ error: 'WRONG_PASSWORD', message: 'La contraseña actual es incorrecta' });
      }
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al cambiar la contraseña' });
    }
  }
}
