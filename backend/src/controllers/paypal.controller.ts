import { Request, Response } from 'express';
import { paypalService } from '../services/paypal.service';
import { SubscriptionService } from '../services/subscription.service';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { TrmService } from '../utils/trm';

import { pricingService } from '../services/pricing.service';

const subscriptionService = new SubscriptionService();

async function insertPaypalPaymentCompat(payload: Record<string, unknown>) {
  let result = await supabaseAdmin.from('subscription_payments').insert(payload);

  if (result.error?.message?.toLowerCase().includes('reference') && 'reference' in payload) {
    const { reference, ...fallbackPayload } = payload;
    result = await supabaseAdmin.from('subscription_payments').insert(fallbackPayload);
  }

  if (result.error) {
    throw new Error(result.error.message);
  }
}

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
      const { error: insertError } = await supabaseAdmin.from('pending_registrations').insert({
        email: email as string,
        reference,
        plan: planStr, // Usar la variable sanitizada planStr
        months: selectedMonths,
        amount: amountCOP,
        includes_landing: landing,
        status: 'pending'
      });

      if (insertError) {
        console.error('[Paypal] Error al insertar registro pendiente:', insertError.message);
        return res.status(500).json({ error: 'Error al iniciar el registro' });
      }
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

    // 2. Procesar activación según la referencia (Trial o Suscripción)
    let brandId: string | null = null;
    let months = 1;
    let plan = 'BASIC';
    let isNewRegistration = false;
    let isTrial = reference.startsWith('TRIAL-');

    if (isTrial) {
      const parts = reference.split('-');
      // TRIAL-{brandId}-{timestamp}
      brandId = parts.slice(1, -1).join('-');
      plan = 'TRIAL';
    } else {
      const match = reference.match(/PAYPAL-(.+)-M(\d+)-P([^-]+)/);
      if (!match) {
        throw new Error(`Referencia inválida o malformada: ${reference}`);
      }
      const brandIdOrVisitor = match[1];
      isNewRegistration = brandIdOrVisitor.startsWith('visitor_');
      brandId = isNewRegistration ? null : brandIdOrVisitor;
      months = parseInt(match[2], 10);
      plan = match[3];
    }
    
    const includesLanding = reference.includes('LANDING');
    
    // El monto capturado por la pasarela
    const amountUSD = parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value);

    if (isTrial && brandId) {
      // Activar Trial
      await supabaseAdmin
        .from('brands')
        .update({ trial_payment_status: 'active' })
        .eq('id', brandId);
        
      // Registrar pago (idempotente por reference interna)
      await insertPaypalPaymentCompat({
        brand_id: brandId,
        amount: amountUSD,
        currency: 'USD',
        payment_method: 'paypal',
        status: 'completed',
        months_paid: 0,
        reference,
        notes: `Pago de Plan Trial. PayPal orderId=${orderId}`,
      });
    } else if (isNewRegistration) {
      // Marcar registro pendiente como pagado
      await supabaseAdmin
        .from('pending_registrations')
        .update({ 
          status: 'paid', 
          payment_id: orderId
        })
        .eq('reference', reference);
    } else if (brandId) {
      if (plan === 'NONE') {
        // Solo compra de Landing Page, no renovar suscripción
        await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);

        // Registrar pago (landing-only)
      await insertPaypalPaymentCompat({
        brand_id: brandId,
        amount: amountUSD,
        currency: 'USD',
        payment_method: 'paypal',
          status: 'completed',
          months_paid: 0,
          reference,
          notes: `SOLO Landing Page. PayPal orderId=${orderId}`,
        });
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
          notes: `PayPal orderId=${orderId}. Ref=${reference}. Plan=${plan}. Meses=${months}.${includesLanding ? ' Incluye Landing Page.' : ''}`,
          reference,
        }, months, plan as string);
        
        if (includesLanding) {
          await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
        }
      }
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

    // 1. Verificar firma (obligatorio en prod; flexible en dev)
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
      const reference = resource.custom_id || resource.invoice_id || (resource.supplementary_data?.related_ids?.order_id);
      
      console.log(`[PayPal Webhook] Pago completado. CaptureId: ${captureId}, Monto: ${amountUSD}, Ref: ${reference}`);

      // Si tenemos referencia, podemos activar la suscripción si no se hizo ya
      if (reference && (reference.startsWith('PAYPAL-') || reference.startsWith('TRIAL-'))) {
        let brandId: string | null = null;
        let months = 1;
        let plan = 'BASIC';
        let isNewRegistration = false;
        let isTrial = reference.startsWith('TRIAL-');

        if (isTrial) {
          const parts = reference.split('-');
          brandId = parts.slice(1, -1).join('-');
          plan = 'TRIAL';
        } else {
          const match = reference.match(/PAYPAL-(.+)-M(\d+)-P([^-]+)/);
          if (match) {
            const brandIdOrVisitor = match[1];
            isNewRegistration = brandIdOrVisitor.startsWith('visitor_');
            brandId = isNewRegistration ? null : brandIdOrVisitor;
            months = parseInt(match[2], 10);
            plan = match[3];
          }
        }

        const includesLanding = reference.includes('LANDING');

        if (isTrial && brandId) {
          await supabaseAdmin.from('brands').update({ trial_payment_status: 'active' }).eq('id', brandId);
        } else if (isNewRegistration) {
          await supabaseAdmin
            .from('pending_registrations')
            .update({ 
              status: 'paid', 
              payment_id: captureId
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
              notes: `PayPal webhook captureId=${captureId}. Ref=${reference}`,
              reference,
            }, months, plan as string);

            if (includesLanding) {
              await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
            }
          }
        }
      }
  }

    return res.status(200).json({ received: true });
  });
}

