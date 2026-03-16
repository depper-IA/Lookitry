import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { verifyEmailTemplate } from '../templates/email-templates';
import { RegisterBrandDto, LoginDto } from '../types';

const authService = new AuthService();
const emailService = new EmailService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const data: RegisterBrandDto = req.body;

      if (!data.email || !data.password || !data.name || !data.slug) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Todos los campos son requeridos' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Formato de email inválido' });
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

      // Enviar email de verificación (async, no bloquea la respuesta)
      if (result.verificationToken) {
        const frontendUrl = process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
        const verifyUrl = `${frontendUrl}/auth/verify?token=${result.verificationToken}`;
        emailService.sendEmail({
          to: result.brand.email,
          subject: 'Confirma tu correo — Virtual Try-On',
          html: verifyEmailTemplate({ name: result.brand.name, email: result.brand.email }, verifyUrl),
        }).catch(err => console.error('[Auth] Error enviando email de verificación:', err));
      }

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

      const result = await authService.verifyEmail(token);
      if (!result.ok) {
        return res.status(400).json({ error: 'INVALID_TOKEN', message: result.message });
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
}
