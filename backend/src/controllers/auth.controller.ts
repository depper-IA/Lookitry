import { Request, Response } from 'express';

import { AuthService } from '../services/auth.service';

import { EmailService } from '../services/email.service';

import { verifyEmailTemplate, passwordResetTemplate } from '../templates/email-templates';

import { RegisterBrandDto, LoginDto } from '../types';

import { AuthRequest } from '../middleware/auth';

import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

import { supabaseAdmin } from '../config/supabase';

import { loginWithGoogle, verifyGoogleAccessToken } from '../services/google-auth.service';



const authService = new AuthService();

const emailService = new EmailService();



/** Emite el JWT como cookie HTTP-Only segura */

const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;



function setCookieToken(res: Response, token: string, refreshToken?: string): void {

  const cookieOptions: any = {

    httpOnly: true,

    secure: IS_PROD,           // Solo HTTPS en producción

    sameSite: 'lax', // 'lax' para compatibilidad con logout cross-origin

    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 días en ms

    path: '/',

  };



  if (COOKIE_DOMAIN && IS_PROD) {

    cookieOptions.domain = COOKIE_DOMAIN;

  }



  res.cookie('token', token, cookieOptions);

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, cookieOptions);
  }

}



function clearCookieToken(res: Response): void {

  const clearOptions: any = {

    path: '/',

    httpOnly: true,

    secure: IS_PROD,

    sameSite: 'lax',

  };



  if (COOKIE_DOMAIN && IS_PROD) {

    clearOptions.domain = COOKIE_DOMAIN;

  }



  res.clearCookie('token', clearOptions);
  res.clearCookie('refreshToken', clearOptions);

}



export class AuthController {

  async register(req: Request, res: Response) {

    try {

      // Si el usuario ya tiene sesión activa, cerrar la sesión antes de registrar

      const token = (req as any).cookies?.token || req.headers?.authorization?.replace('Bearer ', '');

      if (token) {

        try {

          const { verifyToken } = await import('../utils/jwt');

          const payload = verifyToken(token);

          if (payload.brandId) {

            console.log('[Auth] Closing existing session before new registration');

            clearCookieToken(res);

          }

        } catch {

          // Token inválido, ignorar y continuar

        }

      }



      const data: RegisterBrandDto = req.body;



      if (!data.email || !data.password || !data.name || !data.slug) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Todos los campos son requeridos' });

      }



      if (!data.contact_name || data.contact_name.trim().length < 3) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El nombre completo es requerido (mínimo 3 caracteres)' });

      }



      // Verificar Turnstile si está habilitado

      // Se omite en el flujo post-pago (cuando viene con referencia de pago Wompi)

      const turnstileEnabled = process.env.TURNSTILE_ENABLED === 'true';

      const isPostPayment = !!req.body.ref;

      if (turnstileEnabled && !isPostPayment) {

        const token = req.body.turnstileToken;

        if (!token) {

          return res.status(400).json({ error: 'CAPTCHA_REQUIRED', message: 'Verificación de seguridad requerida' });

        }

        const ip = req.ip || req.headers?.['x-forwarded-for']?.toString()?.split(',')[0].trim() || '';

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



      if (data.slug.length < 3 || data.slug.length > 50) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El slug debe tener entre 3 y 50 caracteres' });

      }



      const reservedSlugs = [

        'admin', 'api', 'app', 'blog', 'checkout', 'dashboard', 'home', 'login', 

        'logout', 'register', 'signup', 'signin', 'password', 'reset', 'forgot',

        'account', 'accounts', 'auth', 'authorize', 'callback', 'contact', 'docs',

        'documentation', 'download', 'downloads', 'email', 'help', 'home', 'jobs',

        'legal', 'market', 'markets', 'news', 'onboarding', 'payment', 'payments',

        'plans', 'pricing', 'privacy', 'products', 'profile', 'public', 'root',

        'secure', 'security', 'settings', 'shop', 'site', 'sites', 'static', 

        'support', 'terms', 'tools', 'trial', 'trial-checkout', 'upload', 'uploads',

        'users', 'verify', 'webhook', 'webhooks', 'www', 'mail', 'email', 'support', 

        'help', 'docs', 'documentation', 'admin', 'superadmin', 'root', 'system',

        'null', 'undefined', 'true', 'false', 'none', 'default', 'main', 'test',

        'demo', 'dev', 'development', 'staging', 'stage', 'prod', 'production',

        'lookitry', 'lookitrycom', 'wwwlookitry', 'lookitrycom', 'mobile', 'desktop'

      ];

      if (reservedSlugs.includes(data.slug.toLowerCase())) {

        return res.status(400).json({ error: 'SLUG_RESERVED', message: 'Este slug está reservado. Elige otro.' });

      }



      if (data.password.length < 8) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial' });

      }



      // Validar complejidad de contraseña

      const hasUppercase = /[A-Z]/.test(data.password);

      const hasLowercase = /[a-z]/.test(data.password);

      const hasNumber = /[0-9]/.test(data.password);

      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.password);

      

      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe contener mayúscula, minúscula, número y carácter especial' });

      }



      const result = await authService.register({

        ...data,

        ip: req.ip || req.headers?.['x-forwarded-for']?.toString()?.split(',')[0].trim() || 'unknown',

        fingerprint: req.body.fingerprint || null,

      });



      // Enviar email de verificacion solo si NO requiere pago por prueba.

      // Si requiresTrialPayment=true, el email se envia desde el webhook cuando

      // el pago del trial queda confirmado. Asi evitamos que alguien verifique

      // el email sin haber completado el pago de la prueba.

      if (result.verificationToken && !result.requiresTrialPayment) {

        const frontendUrl = (process.env.NODE_ENV === 'development' || !process.env.FRONTEND_URL) ? 'http://localhost:3000' : process.env.FRONTEND_URL;

        const verifyUrl = `${frontendUrl}/auth/verify?token=${result.verificationToken}`;

        emailService.sendEmail({

          to: result.brand.email,

          subject: 'Confirma tu correo — Lookitry',

          html: verifyEmailTemplate({ name: result.brand.name, email: result.brand.email }, verifyUrl),

        }).catch(err => console.error('[Auth] Error enviando email de verificación:', err));

      }



      // Emitir token como cookie HTTP-Only (más seguro que localStorage)

      if (result.token) setCookieToken(res, result.token, result.refreshToken);



      // Construir redirectTo basado en plan seleccionado (para flujo post-registro)

      const plan = req.body.plan?.toUpperCase();

      const months = parseInt(req.body.months || '1', 10);

      let redirectTo = '/checkout';

      if (plan && ['TRIAL', 'BASIC', 'PRO', 'LANDING'].includes(plan)) {

        const params = new URLSearchParams();

        params.set('plan', plan);

        if (plan !== 'TRIAL' && [3, 6, 12].includes(months)) {

          params.set('months', String(months));

        }

        redirectTo = `/checkout?${params.toString()}`;

      }



      return res.status(201).json({ ...result, redirectTo });

    } catch (error: any) {

      console.error('Error en register:', error);



      if (error.message.includes('email') && error.message.includes('ya')) {

        return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'Este correo ya está registrado. ¿Ya tienes cuenta?' });

      }



      if (error.message.includes('slug') && error.message.includes('uso')) {

        return res.status(409).json({ error: 'SLUG_TAKEN', message: 'Este URL ya está en uso. Prueba otro.' });

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

          const newToken = generateAccessToken({ brandId: fullBrand.id, email: fullBrand.email });
          const newRefreshToken = generateRefreshToken({ brandId: fullBrand.id, email: fullBrand.email });

          setCookieToken(res, newToken, newRefreshToken);

          

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



      // Verificar Turnstile si está habilitado (protege contra bots y brute-force)

      const turnstileEnabled = process.env.TURNSTILE_ENABLED === 'true';

      if (turnstileEnabled) {

        const token = req.body.turnstileToken;

        if (!token) {

          console.warn('[Auth] Login attempt without Turnstile token');

          return res.status(400).json({ error: 'CAPTCHA_REQUIRED', message: 'Verificación de seguridad requerida' });

        }



        const secret = process.env.TURNSTILE_SECRET_KEY;

        if (!secret) {

          console.error('[Auth] TURNSTILE_SECRET_KEY is not configured');

          if (process.env.NODE_ENV !== 'development') {

            return res.status(500).json({ error: 'SERVER_CONFIG_ERROR', message: 'Error de configuración de seguridad' });

          }

        } else {

          try {

            const ip = req.ip || req.headers?.['x-forwarded-for']?.toString()?.split(',')[0].trim() || '';

            const formData = new URLSearchParams();

            formData.append('secret', secret);

            formData.append('response', token);

            if (ip) formData.append('remoteip', ip);



            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {

              method: 'POST',

              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

              body: formData.toString(),

            });



            const verifyData = await verifyRes.json() as { success: boolean; 'error-codes'?: string[] };

            if (!verifyData.success) {

              console.error('[Turnstile] Login - Verificación fallida:', verifyData['error-codes']);

              return res.status(400).json({ 

                error: 'CAPTCHA_FAILED', 

                message: 'Verificación de seguridad fallida. Por favor, intenta de nuevo.',

                details: verifyData['error-codes']

              });

            }

            console.log('[Auth] Turnstile verification successful');

          } catch (error) {

            console.error('[Auth] Turnstile fetch error:', error);

            if (process.env.NODE_ENV !== 'development') {

              return res.status(503).json({ error: 'SERVICE_UNAVAILABLE', message: 'No se pudo conectar con el servicio de seguridad' });

            }

          }

        }

      }



      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(data.email)) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Formato de email inválido' });

      }



      const ip = req.ip || req.headers?.['x-forwarded-for']?.toString()?.split(',')[0].trim() || '';

      const fingerprint = req.body.fingerprint || null;



      const result = await authService.login({ ...data, ip, fingerprint });

      // Emitir token como cookie HTTP-Only (más seguro que localStorage)

      if (result.token) setCookieToken(res, result.token, result.refreshToken);

      return res.status(200).json(result);

    } catch (error: any) {

      console.error('Error en login:', error);



      if (error.message === 'Credenciales inválidas') {

        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: error.message });

      }



      if (error.message.includes('bloqueada')) {

        return res.status(423).json({ error: 'ACCOUNT_LOCKED', message: error.message });

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

      if (password.length < 8) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial' });

      }

      

      const hasUppercase = /[A-Z]/.test(password);

      const hasLowercase = /[a-z]/.test(password);

      const hasNumber = /[0-9]/.test(password);

      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      

      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe contener mayúscula, minúscula, número y carácter especial' });

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

      if (newPassword.length < 8) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial' });

      }

      

      const hasUppercase = /[A-Z]/.test(newPassword);

      const hasLowercase = /[a-z]/.test(newPassword);

      const hasNumber = /[0-9]/.test(newPassword);

      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

      

      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe contener mayúscula, minúscula, número y carácter especial' });

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



  async checkEmail(req: Request, res: Response) {

    try {

      const { email } = req.query;



      if (!email || typeof email !== 'string') {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email requerido' });

      }



      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Formato de email inválido' });

      }



      const { data: brand, error } = await supabaseAdmin

        .from('brands')

        .select('id')

        .eq('email', email.toLowerCase())

        .maybeSingle();



      if (error) {

        console.error('[checkEmail] Error consultando brand:', error);

        return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al verificar email' });

      }



      if (!brand) {

        return res.status(200).json({ exists: false });

      }



      return res.status(200).json({

        exists: true,

      });

    } catch (error: any) {

      console.error('Error en checkEmail:', error);

      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al verificar email' });

    }

  }



  async googleLogin(req: Request, res: Response) {

    try {

      // permite login con cualquier cuenta Google (incluso si hay cookie activa)

      // El usuario elegirá cuenta en el diálogo de Google gracias a prompt: 'select_account'



      const { credential, accessToken } = req.body;



      let result: any;



      if (accessToken) {

        // OAuth2 flow (popup) - validar access token en backend

        const userInfo = await verifyGoogleAccessToken(accessToken);

        const { findOrCreateBrandFromGoogle } = await import('../services/google-auth.service');

        result = await findOrCreateBrandFromGoogle(userInfo);

      } else if (credential) {

        // ID Token flow (One Tap)

        result = await loginWithGoogle(credential);

      } else {

        return res.status(400).json({ error: 'CREDENTIAL_REQUIRED', message: 'Credential o accessToken de Google requerido' });

      }



      if (result.token) setCookieToken(res, result.token, result.refreshToken);



      return res.status(200).json({

        token: result.token,

        brand: {

          id: result.brand.id,

          name: result.brand.name,

          email: result.brand.email,

          slug: result.brand.slug || null,

          plan: result.brand.plan || 'TRIAL',

          emailVerified: true,

          authProvider: result.brand.auth_provider || 'google',

        },

        needsOnboarding: result.needsOnboarding,

        isNewBrand: result.isNewBrand,

        accountLinked: result.accountLinked,

        pendingRegistrationId: result.pendingRegistrationId || null,

        redirectTo: result.redirectTo || null,

      });

  } catch (error: any) {

    const errMsg = error?.message || 'UNKNOWN_ERROR';

    console.error('Error en googleLogin:', errMsg, error?.stack);



    if (errMsg === 'GOOGLE_NOT_CONFIGURED') {

      return res.status(503).json({ error: 'SERVICE_NOT_CONFIGURED', message: 'Google Auth no está configurado' });

    }



    if (errMsg === 'DISPOSABLE_EMAIL') {

      return res.status(400).json({ error: 'DISPOSABLE_EMAIL', message: 'No se permiten correos temporales. Usa tu correo real.' });

    }



    if (

      errMsg === 'GOOGLE_TOKEN_INVALID' ||

      errMsg === 'GOOGLE_AUDIENCE_MISMATCH' ||

      errMsg === 'GOOGLE_ACCESS_TOKEN_INVALID'

    ) {

      return res.status(401).json({ error: 'INVALID_GOOGLE_TOKEN', message: 'Token de Google inválido' });

    }



    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al iniciar sesión con Google', detail: errMsg });

  }

  }



  async completeGoogleOnboarding(req: AuthRequest, res: Response) {

    try {

      const { ref, name, slug } = req.body;



      if (!name || !slug) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Nombre de marca y slug son requeridos' });

      }



      const slugRegex = /^[a-z0-9-]+$/;

      if (!slugRegex.test(slug)) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El slug solo puede contener letras minúsculas, números y guiones' });

      }



      if (slug.length < 3 || slug.length > 50) {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El slug debe tener entre 3 y 50 caracteres' });

      }



      const reservedSlugs = [

        'admin', 'api', 'app', 'blog', 'checkout', 'dashboard', 'home', 'login', 

        'logout', 'register', 'signup', 'signin', 'password', 'reset', 'forgot',

        'account', 'accounts', 'auth', 'authorize', 'callback', 'contact', 'docs',

        'documentation', 'download', 'downloads', 'email', 'help', 'jobs',

        'legal', 'market', 'markets', 'news', 'onboarding', 'payment', 'payments',

        'plans', 'pricing', 'privacy', 'products', 'profile', 'public', 'root',

        'secure', 'security', 'settings', 'shop', 'site', 'sites', 'static', 

        'support', 'terms', 'tools', 'trial', 'trial-checkout', 'upload', 'uploads',

        'users', 'verify', 'webhook', 'webhooks', 'www', 'mail', 'support', 

        'help', 'docs', 'documentation', 'superadmin', 'system', 'null', 'undefined',

        'true', 'false', 'none', 'default', 'main', 'test', 'demo', 'dev', 

        'development', 'staging', 'stage', 'prod', 'production', 'lookitry', 

        'lookitrycom', 'wwwlookitry', 'mobile', 'desktop'

      ];

      if (reservedSlugs.includes(slug.toLowerCase())) {

        return res.status(400).json({ error: 'SLUG_RESERVED', message: 'Este slug está reservado. Elige otro.' });

      }



      // Verificar slug único

      const { data: existingSlug } = await supabaseAdmin

        .from('brands')

        .select('id')

        .eq('slug', slug)

        .maybeSingle();



      if (existingSlug) {

        return res.status(409).json({ error: 'SLUG_TAKEN', message: 'Este slug ya está en uso. Prueba con otro.' });

      }



      let brandData: any;



      if (ref) {

        // FLUJO NUEVO: Crear marca desde pending_registrations

        const { data: pendingReg, error: pendingError } = await supabaseAdmin

          .from('pending_registrations')

          .select('*')

          .eq('id', ref)

          .maybeSingle();



        if (pendingError || !pendingReg) {

          return res.status(404).json({ error: 'NOT_FOUND', message: 'Registro pendiente no encontrado' });

        }



        // Generar slug bonito basado en el nombre si el slug proporcionado contiene "G-"

        const finalSlug = slug.includes('G-') ? slug : slug;



        // Crear la marca usando los datos de pending_registrations

        const { data: newBrand, error: brandError } = await supabaseAdmin

          .from('brands')

          .insert({

            email: pendingReg.email,

            password: null,

            name: name,

            slug: finalSlug,

            contact_name: pendingReg.brand_name || name,

            google_id: pendingReg.reference?.includes('G-') ? pendingReg.reference.split('-')[1] : null,

            auth_provider: 'google',

            email_verified: true,

            needs_onboarding: false,

            plan: pendingReg.plan || 'TRIAL',

            subscription_status: null,

            trial_end_date: null,

            trial_generations_limit: 0,

            primary_color: '#000000',

            secondary_color: '#ffffff',

          })

          .select('*')

          .single();



        if (brandError) {

          console.error('[GoogleOnboarding] Error creando marca:', brandError);

          return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al crear la marca' });

        }



        // Marcar pending_registrations como completado

        await supabaseAdmin

          .from('pending_registrations')

          .update({ status: 'completed' })

          .eq('id', ref);



        brandData = newBrand;

      } else if (req.brand?.id) {

        // FLUJO LEGACY: Actualizar marca existente (para usuarios que ya tenían marca)

        const { data: updatedBrand, error } = await supabaseAdmin

          .from('brands')

          .update({ name, slug, needs_onboarding: false })

          .eq('id', req.brand.id)

          .select('*')

          .single();



        if (error) {

          console.error('[GoogleOnboarding] Error actualizando marca:', error);

          return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al completar configuración' });

        }



        brandData = updatedBrand;

      } else {

        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Se requiere ref o sesión activa' });

      }



      const newToken = generateAccessToken({ brandId: brandData.id, email: brandData.email });
      const newRefreshToken = generateRefreshToken({ brandId: brandData.id, email: brandData.email });

      setCookieToken(res, newToken, newRefreshToken);



      return res.status(200).json({

        message: 'Configuración completada',

        brand: {

          id: brandData.id,

          name: brandData.name,

          email: brandData.email,

          slug: brandData.slug,

          plan: brandData.plan,

          emailVerified: true,

        },

        token: newToken,

      });

    } catch (error: any) {

      console.error('Error en completeGoogleOnboarding:', error);

      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al completar configuración' });

    }

  }

}

