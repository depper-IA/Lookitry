import { Request, Response } from 'express';
import { paypalService } from '../services/paypal.service';
import { SubscriptionService } from '../services/subscription.service';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { TrmService } from '../utils/trm';

import { pricingService } from '../services/pricing.service';

const subscriptionService = new SubscriptionService();

export class PaypalController {
  /**
   * GET /api/payments/paypal/checkout-url
   * Genera el link de PayPal y crea el registro pendiente
   */
  getCheckoutUrl = asyncHandler(async (req: Request, res: Response) => {
    const { months, plan, email, trm, includes_landing } = req.query;

    if (!months || !plan) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos: months, plan' });
    }

    const selectedMonths = parseInt(months as string, 10);
    const planStr = (plan as string).toUpperCase();
    const landing = includes_landing === 'true';

    // RECALCULAR MONTO EN BACKEND (SEGURIDAD)
    const amountCOP = await pricingService.calculateTotal(planStr, selectedMonths, landing);
    
    // Obtener TRM (usar la de query si existe, sino automática)
    const currentTrm = trm ? parseFloat(trm as string) : await TrmService.getCurrentTrm();
    
    // Crear referencia única
    const brandId = (req as any).brand?.id || `visitor_${Date.now()}`;
    const reference = `PAYPAL-${brandId}-M${selectedMonths}-P${planStr}${landing ? '-LANDING' : ''}-${Date.now()}`;

    // 1. Si es un registro nuevo (viene email), crear registro pendiente
    if (email) {
      await supabaseAdmin.from('pending_registrations').insert({
        email: email as string,
        reference,
        plan: plan as string,
        months: selectedMonths,
        includes_landing: landing,
        amount: amountCOP,
        status: 'pending'
      });
    }

    // 2. Generar link en PayPal
    const checkoutUrl = await paypalService.createOrder(amountCOP, currentTrm, reference);

    return res.status(200).json({ checkoutUrl, reference });
  });

  /**
   * POST /api/payments/paypal/capture
   * Captura el pago aprobado y activa la suscripción
   */
  capturePayment = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, reference } = req.body;

    if (!orderId || !reference) {
      return res.status(400).json({ error: 'orderId y reference son requeridos' });
    }

    // 1. Capturar en PayPal
    const captureData = await paypalService.captureOrder(orderId);
    
    if (captureData.status !== 'COMPLETED') {
      throw new Error(`El pago no se completó (Status: ${captureData.status})`);
    }

    // 2. Procesar activación según la referencia robustamente (soporta UUIDs con guiones)
    const match = reference.match(/PAYPAL-(.+)-M(\d+)-P([^-]+)/);
    if (!match) {
      throw new Error(`Referencia inválida o malformada: ${reference}`);
    }

    const brandIdOrVisitor = match[1];
    const isNewRegistration = brandIdOrVisitor.startsWith('visitor_');
    const brandId = isNewRegistration ? null : brandIdOrVisitor;
    const months = parseInt(match[2], 10);
    const plan = match[3];
    const includesLanding = reference.includes('LANDING');
    
    // El monto capturado por la pasarela
    const amountUSD = parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value);

    if (isNewRegistration) {
      // Marcar registro pendiente como pagado
      await supabaseAdmin
        .from('pending_registrations')
        .update({ 
          status: 'paid', 
          payment_id: orderId,
          amount: amountUSD // Guardamos el valor en USD capturado
        })
        .eq('reference', reference);
    } else if (brandId) {
      if (plan === 'NONE') {
        // Solo compra de Landing Page, no renovar suscripción
        await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
      } else {
        // Renovación/Upgrade de marca existente
        await subscriptionService.renewSubscription(brandId, {
          brand_id: brandId,
          amount: amountUSD,
          currency: 'USD',
          payment_method: 'paypal',
          status: 'completed',
          months_paid: months,
          payment_date: new Date().toISOString(),
          notes: `PayPal Order: ${orderId}. Plan: ${plan}. Meses: ${months}.`,
        }, months, plan as string);
        
        if (includesLanding) {
          await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
        }
      }
      
      // Registrar pago
      await supabaseAdmin.from('subscription_payments').insert({
        brand_id: brandId,
        amount: amountUSD,
        currency: 'USD',
        payment_method: 'paypal',
        status: 'completed',
        months_paid: plan === 'NONE' ? 0 : months,
        reference: orderId,
        notes: plan === 'NONE' ? 'SOLO Landing Page' : undefined
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Pago capturado y suscripción activada',
      orderId,
      status: captureData.status
    });
  });

  /**
   * POST /api/payments/paypal/webhook
   * Recibe notificaciones de PayPal (CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED, etc.)
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const event = req.body;
    console.log(`[PayPal Webhook] Evento recibido: ${event.event_type}`);

    // 1. Verificar firma (Opcional por ahora, implementado stub en service)
    const isValid = await paypalService.verifyWebhookSignature(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Firma inválida' });
    }

    // 2. Procesar evento de captura completada
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource;
      const captureId = resource.id;
      const amountUSD = parseFloat(resource.amount.value);
      
      // Intentar obtener la referencia de custom_id (si se envió) o de las notas
      const reference = resource.custom_id || (resource.supplementary_data?.related_ids?.order_id);
      
      console.log(`[PayPal Webhook] Pago completado. CaptureId: ${captureId}, Monto: ${amountUSD}, Ref: ${reference}`);

      // Si tenemos referencia, podemos activar la suscripción si no se hizo ya
      if (reference && reference.startsWith('PAYPAL-')) {
        const match = reference.match(/PAYPAL-(.+)-M(\d+)-P([^-]+)/);
        if (match) {
          const brandIdOrVisitor = match[1];
          const isNewRegistration = brandIdOrVisitor.startsWith('visitor_');
          const brandId = isNewRegistration ? null : brandIdOrVisitor;
          const months = parseInt(match[2], 10);
          const plan = match[3];
          const includesLanding = reference.includes('LANDING');

        if (isNewRegistration) {
          await supabaseAdmin
            .from('pending_registrations')
            .update({ 
              status: 'paid', 
              payment_id: captureId,
              amount: amountUSD 
            })
            .eq('reference', reference);
        } else if (brandId) {
          if (plan === 'NONE') {
            await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
          } else {
            await subscriptionService.renewSubscription(brandId, {
              brand_id: brandId,
              amount: amountUSD,
              currency: 'USD',
              payment_method: 'paypal',
              status: 'completed',
              months_paid: months,
              payment_date: new Date().toISOString(),
              notes: `PayPal Webhook: ${captureId}. Ref: ${reference}`,
            }, months, plan as string);

            if (includesLanding) {
              await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
            }
          }

          // Evitar duplicados en subscription_payments (la DB tiene un check o podemos hacerlo aquí)
          // Por simplicidad, el servicio suele manejar la idempotencia o la referencia es única
        }
      }
    }
  }

    return res.status(200).json({ received: true });
  });
}

