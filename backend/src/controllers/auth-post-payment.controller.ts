import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { SubscriptionService } from '../services/subscription.service';
import { verifyEmailTemplate } from '../templates/email-templates';
import { supabaseAdmin } from '../config/supabase';
import { wompiService } from '../services/wompi.service';
import { paypalService } from '../services/paypal.service';

const authService = new AuthService();
const emailService = new EmailService();
const subscriptionService = new SubscriptionService();

/**
 * Registro exclusivo para el flujo post-pago.
 * Soporta Wompi y PayPal.
 */
export async function registerPostPayment(req: Request, res: Response) {
  try {
    const { contact_name, name, slug, password, ref, fingerprint, method, orderId } = req.body;

    // 1. Validar que ref esté presente
    if (!ref) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La referencia de pago es requerida' });
    }

    // 2. Validaciones de campos del formulario
    if (!password || !name || !slug) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Todos los campos son requeridos' });
    }

    // 3. Buscar pending_registration por referencia
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_registrations')
      .select('email, plan, months, includes_landing')
      .eq('reference', ref)
      .maybeSingle();

    if (pendingError || !pending) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Referencia de pago no encontrada' });
    }

    // 4. Verificar estado de la transacción según el método
    let paymentConfirmed = false;
    let finalMethod = method || 'wompi';
    let transactionDetails = '';

    if (finalMethod === 'paypal') {
      if (!orderId) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ID de orden de PayPal requerido' });
      }
      try {
        const order = await paypalService.getOrder(orderId);
        // Si la orden está aprobada pero no capturada, capturarla
        if (order.status === 'APPROVED') {
          const capture = await paypalService.captureOrder(orderId);
          paymentConfirmed = capture.status === 'COMPLETED';
        } else {
          paymentConfirmed = order.status === 'COMPLETED';
        }
        transactionDetails = `PayPal Order: ${orderId}`;
      } catch (err: any) {
        console.error('[PostPayment] PayPal Error:', err.message);
        return res.status(502).json({ error: 'GATEWAY_ERROR', message: 'Error al verificar con PayPal' });
      }
    } else {
      // Por defecto Wompi
      try {
        const transaction = await wompiService.getTransactionByReference(ref);
        paymentConfirmed = transaction?.status === 'APPROVED';
        transactionDetails = `Wompi Ref: ${ref}`;
      } catch {
        return res.status(502).json({ error: 'GATEWAY_ERROR', message: 'Error al verificar con Wompi' });
      }
    }

    if (!paymentConfirmed) {
      return res.status(402).json({ error: 'PAYMENT_REQUIRED', message: 'El pago no ha sido confirmado aún' });
    }

    // 5. Crear la cuenta
    const result = await authService.register({
      contact_name,
      name,
      slug,
      email: pending.email,
      password,
      ip: 'post-payment',
      fingerprint: fingerprint || undefined,
    });

    // 6. Activar suscripción
    try {
      await subscriptionService.renewSubscription(
        result.brand.id,
        {
          brand_id: result.brand.id,
          amount: 0,
          currency: finalMethod === 'paypal' ? 'USD' : 'COP',
          payment_method: finalMethod,
          status: 'completed',
          months_paid: pending.months,
          payment_date: new Date().toISOString(),
          notes: `Activación post-registro. Plan: ${pending.plan}. Meses: ${pending.months}. ${transactionDetails}`,
        },
        pending.months,
        pending.plan
      );

      if (pending.includes_landing) {
        await supabaseAdmin
          .from('brands')
          .update({ has_landing_page: true, landing_suspended_at: null })
          .eq('id', result.brand.id);
      }
    } catch (subError) {
      console.error('[PostPayment] Error activando suscripción:', subError);
    }

    // 7. Email de verificación
    if (result.verificationToken) {
      const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://pruebalo.wilkiedevs.com');
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
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message || 'Error al crear la cuenta' });
  }
}
