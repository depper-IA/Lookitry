import { Request, Response } from 'express';
import { paypalService } from '../services/paypal.service';
import { SubscriptionService } from '../services/subscription.service';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { pricingService } from '../services/pricing.service';

const subscriptionService = new SubscriptionService();
const PAYPAL_AMOUNT_TOLERANCE = 0.01;

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

function parsePaypalReference(reference: string): {
  brandId: string | null;
  months: number;
  plan: string;
  isNewRegistration: boolean;
  isTrial: boolean;
} {
  if (reference.startsWith('GUEST-TRIAL-')) {
    return {
      brandId: null,
      months: 0,
      plan: 'TRIAL',
      isNewRegistration: true,
      isTrial: true,
    };
  }

  if (reference.startsWith('TRIAL-')) {
    const parts = reference.split('-');
    return {
      brandId: parts.slice(1, -1).join('-'),
      months: 0,
      plan: 'TRIAL',
      isNewRegistration: false,
      isTrial: true,
    };
  }

  const match = reference.match(/PAYPAL-(.+)-M(\d+)-P([^-]+)/);
  if (!match) {
    throw new Error(`Referencia inválida o malformada: ${reference}`);
  }

  const brandIdOrVisitor = match[1];

  return {
    brandId: brandIdOrVisitor.startsWith('visitor_') ? null : brandIdOrVisitor,
    months: parseInt(match[2], 10),
    plan: match[3],
    isNewRegistration: brandIdOrVisitor.startsWith('visitor_'),
    isTrial: false,
  };
}

function assertTrackedOrder(reference: string, trackedOrder: any, orderId: string, amountUSD: number) {
  if (!trackedOrder) {
    throw new Error('No se encontró la orden interna de PayPal para esta referencia');
  }

  if (trackedOrder.order_id && trackedOrder.order_id !== orderId) {
    throw new Error('La orden de PayPal no coincide con la referencia registrada');
  }

  if (Math.abs(Number(trackedOrder.amount_usd_expected) - amountUSD) > PAYPAL_AMOUNT_TOLERANCE) {
    throw new Error('El monto capturado no coincide con el monto esperado');
  }
}

async function fulfillPaypalPayment(reference: string, orderId: string, amountUSD: number, source: 'capture' | 'webhook') {
  const { brandId, months, plan, isNewRegistration, isTrial } = parsePaypalReference(reference);
  const includesLanding = reference.includes('LANDING');
  const notesPrefix = source === 'webhook' ? 'PayPal webhook' : 'PayPal';

  if (isTrial && brandId) {
    await supabaseAdmin
      .from('brands')
      .update({ trial_payment_status: 'active' })
      .eq('id', brandId);

    await insertPaypalPaymentCompat({
      brand_id: brandId,
      amount: amountUSD,
      currency: 'USD',
      payment_method: 'paypal',
      status: 'completed',
      months_paid: 1,
      reference,
      notes: `${notesPrefix} orderId=${orderId}. Trial`,
    });
    return;
  }

  if (isNewRegistration) {
    await supabaseAdmin
      .from('pending_registrations')
      .update({
        status: 'paid',
        payment_id: orderId,
      })
      .eq('reference', reference);
    return;
  }

  if (!brandId) {
    return;
  }

  if (plan === 'NONE') {
    const { data: existingLandingPayment } = await supabaseAdmin
      .from('subscription_payments')
      .select('id')
      .eq('reference', reference)
      .limit(1)
      .maybeSingle();

    if (!existingLandingPayment) {
      await insertPaypalPaymentCompat({
        brand_id: brandId,
        amount: amountUSD,
        currency: 'USD',
        payment_method: 'paypal',
        status: 'completed',
        months_paid: 1,
        reference,
        notes: `SOLO Landing Page. ${notesPrefix} orderId=${orderId}`,
      });
    }

    await supabaseAdmin
      .from('brands')
      .update({ has_landing_page: true, landing_suspended_at: null })
      .eq('id', brandId);
    return;
  }

  await subscriptionService.renewSubscription(
    brandId,
    {
      brand_id: brandId,
      amount: amountUSD,
      currency: 'USD',
      payment_method: 'paypal',
      status: 'completed',
      months_paid: months,
      payment_date: new Date().toISOString(),
      notes: `${notesPrefix} orderId=${orderId}. Ref=${reference}. Plan=${plan}. Meses=${months}.${includesLanding ? ' Incluye Landing Page.' : ''}`,
      reference,
    },
    months,
    plan as string
  );

  if (includesLanding) {
    await supabaseAdmin
      .from('brands')
      .update({ has_landing_page: true, landing_suspended_at: null })
      .eq('id', brandId);
  }
}

export class PaypalController {
  getCheckoutUrl = asyncHandler(async (req: Request, res: Response) => {
    const { months, plan, email, trm, includes_landing } = req.query;

    if (!months || !plan) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos: months, plan' });
    }

    const selectedMonths = parseInt(months as string, 10);
    const planStr = (plan as string).toUpperCase();
    const landing = includes_landing === 'true';

    const amountCOP = await pricingService.calculateTotal(planStr, selectedMonths, landing);

    const overrideTrm = trm ? parseFloat(trm as string) : undefined;
    const { trm: currentTrm, source } = await pricingService.getEffectiveTrm(overrideTrm);
    console.log(`[PaypalController] TRM usada para checkout: ${currentTrm} (source=${source})`);

    const brandId = (req as any).brand?.id || `visitor_${Date.now()}`;
    const reference = `PAYPAL-${brandId}-M${selectedMonths}-P${planStr}${landing ? '-LANDING' : ''}-${Date.now()}`;

    if (email) {
      const { error: insertError } = await supabaseAdmin.from('pending_registrations').insert({
        email: email as string,
        reference,
        plan: planStr,
        months: selectedMonths,
        amount: amountCOP,
        includes_landing: landing,
        status: 'pending',
      });

      if (insertError) {
        console.error('[Paypal] Error al insertar registro pendiente:', insertError.message);
        return res.status(500).json({ error: 'Error al iniciar el registro' });
      }
    }

    const createdOrder = await paypalService.createOrder(amountCOP, currentTrm, reference);
    await paypalService.recordOrder({
      reference,
      brand_id: (req as any).brand?.id || null,
      email: email ? String(email) : null,
      plan: planStr,
      months: selectedMonths,
      amount_cop: amountCOP,
      trm: currentTrm,
      amount_usd_expected: createdOrder.amountUSD,
      order_id: createdOrder.orderId,
      status: 'created',
    });

    return res.status(200).json({ checkoutUrl: createdOrder.checkoutUrl, reference });
  });

  capturePayment = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, reference: requestedReference } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    const order = await paypalService.getOrder(orderId);
    const resolvedReference = paypalService.extractReference(order);
    if (!resolvedReference) {
      throw new Error('No se pudo resolver la referencia interna del pago PayPal');
    }

    if (requestedReference && requestedReference !== resolvedReference) {
      return res.status(409).json({ error: 'La referencia no coincide con la orden de PayPal' });
    }

    const trackedOrder = await paypalService.getTrackedOrder(resolvedReference);
    const orderAmountUSD = paypalService.extractAmountUsd(order);
    if (orderAmountUSD == null) {
      throw new Error('No se pudo validar el monto de la orden PayPal');
    }
    assertTrackedOrder(resolvedReference, trackedOrder, orderId, orderAmountUSD);

    let effectiveOrder = order;
    if (order.status === 'APPROVED') {
      effectiveOrder = await paypalService.captureOrder(orderId);
    } else if (order.status !== 'COMPLETED') {
      throw new Error(`El pago no se completó (Status: ${order.status})`);
    }

    const amountUSD = paypalService.extractAmountUsd(effectiveOrder);
    if (amountUSD == null) {
      throw new Error('No se pudo validar el monto capturado en PayPal');
    }
    assertTrackedOrder(resolvedReference, trackedOrder, orderId, amountUSD);

    await fulfillPaypalPayment(resolvedReference, orderId, amountUSD, 'capture');
    await paypalService.markOrderStatus(resolvedReference, 'completed', orderId);

    return res.status(200).json({
      success: true,
      message: 'Pago capturado y suscripción activada',
      orderId,
      status: effectiveOrder.status,
      reference: resolvedReference,
    });
  });

  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const event = req.body;
    console.log(`[PayPal Webhook] Evento recibido: ${event.event_type}`);

    const isValid = await paypalService.verifyWebhookSignature(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Firma inválida' });
    }

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource;
      const captureId = resource.id;
      const amountUSD = parseFloat(resource.amount.value);
      const reference =
        resource.custom_id ||
        resource.invoice_id ||
        resource.supplementary_data?.related_ids?.order_id;
      const orderId = resource.supplementary_data?.related_ids?.order_id || captureId;

      console.log(`[PayPal Webhook] Pago completado. CaptureId: ${captureId}, Monto: ${amountUSD}, Ref: ${reference}`);

      if (reference && (reference.startsWith('PAYPAL-') || reference.startsWith('TRIAL-') || reference.startsWith('GUEST-TRIAL-'))) {
        const trackedOrder = await paypalService.getTrackedOrder(reference);
        assertTrackedOrder(reference, trackedOrder, orderId, amountUSD);
        await fulfillPaypalPayment(reference, orderId, amountUSD, 'webhook');
        await paypalService.markOrderStatus(reference, 'completed', orderId);
      }
    }

    return res.status(200).json({ received: true });
  });
}
