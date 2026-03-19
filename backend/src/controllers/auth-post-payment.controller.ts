import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { verifyEmailTemplate } from '../templates/email-templates';
import { supabaseAdmin } from '../config/supabase';
import { wompiService } from '../services/wompi.service';

const authService = new AuthService();
const emailService = new EmailService();

/**
 * Registro exclusivo para el flujo post-pago.
 * Sin Turnstile, sin anti-abuso de trial, sin rate limiter estricto.
 * El usuario ya pagó — no tiene sentido bloquearlo.
 *
 * Nuevo flujo:
 * 1. Recibe `ref` (referencia de Wompi) en lugar de `email`
 * 2. Busca el email en `pending_registrations` por esa referencia
 * 3. Verifica que la transacción esté APPROVED en Wompi
 * 4. Crea la cuenta con el email del pending
 */
export async function registerPostPayment(req: Request, res: Response) {
  try {
    const { contact_name, name, slug, password, ref, fingerprint } = req.body;

    // 1. Validar que ref esté presente
    if (!ref) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La referencia de pago es requerida' });
    }

    // 2. Validaciones de campos del formulario
    if (!password || !name || !slug) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Todos los campos son requeridos' });
    }
    if (!contact_name || contact_name.trim().length < 3) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El nombre completo es requerido (mínimo 3 caracteres)' });
    }
    if (!/^[a-z0-9-]{3,}$/.test(slug)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El slug solo puede contener letras minúsculas, números y guiones (mín. 3 caracteres)' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // 3. Buscar pending_registration por referencia
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_registrations')
      .select('email, plan, months')
      .eq('reference', ref)
      .maybeSingle();

    if (pendingError || !pending) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Referencia de pago no encontrada' });
    }

    // 4. Verificar estado de la transacción con Wompi
    let transaction: { status: string } | null = null;
    try {
      transaction = await wompiService.getTransactionByReference(ref);
    } catch {
      return res.status(502).json({ error: 'GATEWAY_ERROR', message: 'Error al verificar el pago con Wompi' });
    }

    if (!transaction || transaction.status !== 'APPROVED') {
      return res.status(402).json({ error: 'PAYMENT_REQUIRED', message: 'El pago no ha sido confirmado aún' });
    }

    // 5. Crear la cuenta usando el email del pending
    const result = await authService.register({
      contact_name,
      name,
      slug,
      email: pending.email,
      phone: undefined,
      password,
      ip: 'post-payment',
      fingerprint: fingerprint || undefined,
    });

    // 6. Activar suscripción inmediatamente con los datos del pending
    // (el webhook de Wompi no puede activarla porque en ese momento el brandId era visitor_)
    try {
      const { SubscriptionService } = await import('../services/subscription.service');
      const subscriptionService = new SubscriptionService();
      const months = pending.months || 1;
      const plan = pending.plan || 'BASIC';
      await subscriptionService.renewSubscription(
        result.brand.id,
        {
          brand_id: result.brand.id,
          amount: 0, // El monto real ya fue registrado por el webhook en pending_registrations
          currency: 'COP',
          payment_date: new Date().toISOString(),
          payment_method: 'wompi',
          status: 'completed',
          months_paid: months,
          notes: `Activación post-registro. Plan: ${plan}. Meses: ${months}. Ref: ${ref}`,
        },
        months,
        plan
      );
      console.log(`[PostPayment] Suscripción activada para brand ${result.brand.id} — Plan: ${plan}, Meses: ${months}`);
    } catch (subError) {
      // No bloquear el registro si falla la activación — se puede activar manualmente
      console.error('[PostPayment] Error activando suscripción:', subError);
    }

    // 8. Enviar email de verificación (async, no bloquea)
    if (result.verificationToken) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
      const verifyUrl = `${frontendUrl}/auth/verify?token=${result.verificationToken}`;
      emailService.sendEmail({
        to: pending.email,
        subject: 'Confirma tu correo — Lookitry',
        html: verifyEmailTemplate({ name: result.brand.name, email: pending.email }, verifyUrl),
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
