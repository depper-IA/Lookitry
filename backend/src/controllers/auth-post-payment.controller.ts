import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { verifyEmailTemplate } from '../templates/email-templates';

const authService = new AuthService();
const emailService = new EmailService();

/**
 * Registro exclusivo para el flujo post-pago.
 * Sin Turnstile, sin anti-abuso de trial, sin rate limiter estricto.
 * El usuario ya pagó — no tiene sentido bloquearlo.
 */
export async function registerPostPayment(req: Request, res: Response) {
  try {
    const { contact_name, name, slug, email, phone, password } = req.body;

    // Validaciones mínimas
    if (!email || !password || !name || !slug) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Todos los campos son requeridos' });
    }
    if (!contact_name || contact_name.trim().length < 3) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El nombre completo es requerido (mínimo 3 caracteres)' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Formato de email inválido' });
    }
    if (!/^[a-z0-9-]{3,}$/.test(slug)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El slug solo puede contener letras minúsculas, números y guiones (mín. 3 caracteres)' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Registrar sin verificaciones de trial/turnstile/abuso
    const result = await authService.register({
      contact_name,
      name,
      slug,
      email,
      phone: phone || undefined,
      password,
      ip: 'post-payment',
      fingerprint: null,
    });

    // Enviar email de verificación (async, no bloquea)
    if (result.verificationToken) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
      const verifyUrl = `${frontendUrl}/auth/verify?token=${result.verificationToken}`;
      emailService.sendEmail({
        to: result.brand.email,
        subject: 'Confirma tu correo — Lookitry',
        html: verifyEmailTemplate({ name: result.brand.name, email: result.brand.email }, verifyUrl),
      }).catch(err => console.error('[PostPayment] Error enviando email:', err));
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('[PostPayment] Error en registro:', error);

    if (error.message?.includes('ya está')) {
      return res.status(409).json({ error: 'CONFLICT', message: error.message });
    }

    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al crear la cuenta' });
  }
}
