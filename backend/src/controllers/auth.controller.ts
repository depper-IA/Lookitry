import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { RegisterBrandDto, LoginDto } from '../types';

const authService = new AuthService();
const notificationService = new NotificationService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const data: RegisterBrandDto = req.body;

      // Validaciones básicas
      if (!data.email || !data.password || !data.name || !data.slug) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Todos los campos son requeridos',
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Formato de email inválido',
        });
      }

      // Validar formato de slug (solo letras minúsculas, números y guiones)
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(data.slug)) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'El slug solo puede contener letras minúsculas, números y guiones',
        });
      }

      // Validar longitud de contraseña
      if (data.password.length < 6) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'La contraseña debe tener al menos 6 caracteres',
        });
      }

      const result = await authService.register({
        ...data,
        ip: req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || 'unknown',
        fingerprint: req.body.fingerprint || null,
      });

      // Enviar email de bienvenida (Req 13.1) — async, no bloquea la respuesta
      notificationService.sendWelcomeEmail(result.brand).catch((err) =>
        console.error('[Auth] Error enviando email de bienvenida:', err)
      );

      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Error en register:', error);

      if (error.message.includes('ya está')) {
        return res.status(409).json({
          error: 'CONFLICT',
          message: error.message,
        });
      }

      if (error.message === 'TRIAL_ABUSE') {
        return res.status(429).json({
          error: 'TRIAL_ABUSE',
          message: 'Ya existe una cuenta de prueba registrada desde este dispositivo o red. Puedes contratar un plan directamente.',
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al registrar la marca',
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const data: LoginDto = req.body;

      // Validaciones básicas
      if (!data.email || !data.password) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Email y contraseña son requeridos',
        });
      }

      const result = await authService.login(data);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en login:', error);

      if (error.message === 'Credenciales inválidas') {
        return res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al iniciar sesión',
      });
    }
  }
}
