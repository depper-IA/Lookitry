import { Request, Response } from 'express';
import { paypalService } from '../services/paypal.service';
import { SubscriptionService } from '../services/subscription.service';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { pricingService } from '../services/pricing.service';
import { NotificationService } from '../services/notification.service';
import { addonCreditsService } from '../services/addonCredits.service';
import { planChangeService } from '../services/planChange.service';
import { hasActivePaidSubscription, isTrialLandingBlocked } from '../utils/brandLifecycle';

const subscriptionService = new SubscriptionService();
const notificationService = new NotificationService();
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
  if (addonCreditsService.isAddonReference(reference)) {
    await addonCreditsService.applyPurchasedCredits(reference, 'paypal', amountUSD, orderId);
    return;
  }

  const { brandId, months, plan, isNewRegistration, isTrial } = parsePaypalReference(reference);
  const includesLanding = reference.includes('LANDING');
  const notesPrefix = source === 'webhook' ? 'PayPal webhook' : 'PayPal';

  if (isTrial && brandId) {
    await supabaseAdmin
      .from('brands')
      .update({ plan: 'TRIAL', trial_payment_status: 'active' })
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
    const { data: pendingRegistration } = await supabaseAdmin
      .from('pending_registrations')
      .select('email, reference, plan, amount, status')
      .eq('reference', reference)
      .maybeSingle();

    const wasPending = pendingRegistration?.status === 'pending';

    await supabaseAdmin
      .from('pending_registrations')
      .update({
        status: 'paid',
        payment_id: orderId,
      })
      .eq('reference', reference);

    if (wasPending && pendingRegistration?.email && ['BASIC', 'PRO'].includes((pendingRegistration.plan || '').toUpperCase())) {
      notificationService.sendCompleteRegistrationEmail({
        email: pendingRegistration.email,
        reference: pendingRegistration.reference,
        plan: pendingRegistration.plan,
        amount: pendingRegistration.amount,
      }).catch(err => console.error('[PayPal] Error email registro pendiente:', err));
    }
    return;
  }

  if (!brandId) {
    return;
  }

  const { data: currentBrand } = await supabaseAdmin.from('brands').select('*').eq('id', brandId).single();
  if (plan === 'NONE' && currentBrand && isTrialLandingBlocked(currentBrand)) {
    throw new Error('TRIAL_LANDING_BLOCKED');
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

  // BUG #3 FIX: Detectar si es un upgrade (BASIC → PRO) para pasar isUpgrade=true
  // Esto activa la lógica de prorrateo en renewSubscription (newStartDate = now, no acumula)
  const isActualUpgrade =
    hasActivePaidSubscription(currentBrand) && currentBrand?.plan === 'BASIC' && String(plan).toUpperCase() === 'PRO';

  try {
    if (isActualUpgrade) {
      await planChangeService.markProcessing(reference, amountUSD);
    }

    if (isActualUpgrade && amountUSD <= PAYPAL_AMOUNT_TOLERANCE && !includesLanding) {
      const newPlanTotal = await pricingService.calculateTotal('PRO', months, false);
      const preview = await subscriptionService.calculateUpgradeProration(
        brandId,
        'PRO',
        months,
        newPlanTotal,
        0
      );

      await subscriptionService.applyFreeUpgrade(
        brandId,
        'PRO',
        months,
        preview.creditAmount,
        preview.newPlanTotal,
        reference,
        preview.newEndDate
      );

      await planChangeService.markCompleted(reference, 0);
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
      plan as string,
      isActualUpgrade
    );

    if (isActualUpgrade) {
      await planChangeService.markCompleted(reference, amountUSD);
    }
  } catch (error) {
    if (isActualUpgrade) {
      await planChangeService.markFailed(reference, (error as Error)?.message || 'Error procesando upgrade PayPal');
    }
    throw error;
  }

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
    if ((req as any).brand?.id && landing && planStr === 'NONE') {
      const { data: currentBrand } = await supabaseAdmin.from('brands').select('*').eq('id', (req as any).brand.id).single();
      if (currentBrand && isTrialLandingBlocked(currentBrand)) {
        return res.status(403).json({ error: 'TRIAL_LANDING_BLOCKED', message: 'La mini-landing requiere primero activar un plan pago.' });
      }
    }

    const hasAuthenticatedBrand = Boolean((req as any).brand?.id);
    if (hasAuthenticatedBrand && planStr === 'TRIAL') {
      return res.status(409).json({
        error: 'AUTHENTICATED_TRIAL_DISABLED',
        message: 'El trial solo puede comprarse sin una sesion activa. Cierra sesion y usa /trial-checkout.',
      });
    }

    let amountCOP = hasAuthenticatedBrand
      ? await pricingService.calculateTotal(planStr, selectedMonths, landing)
      : await pricingService.calculateExternalCheckoutTotal(planStr, selectedMonths, landing);

    if (hasAuthenticatedBrand && planStr === 'PRO') {
      const { data: currentBrand } = await supabaseAdmin
        .from('brands')
        .select('plan, subscription_status, trial_end_date, trial_payment_status')
        .eq('id', (req as any).brand.id)
        .single();

      const isActualUpgrade =
        hasActivePaidSubscription(currentBrand) &&
        currentBrand?.plan === 'BASIC';

      console.log(`[PaypalCheckout] brand=${(req as any).brand.id} plan=${currentBrand?.plan} status=${currentBrand?.subscription_status} isActualUpgrade=${isActualUpgrade}`);

      if (isActualUpgrade) {
        const planOnlyTotal = await pricingService.calculateTotal(planStr, selectedMonths, false);
        const preview = await subscriptionService.calculateUpgradeProration(
          (req as any).brand.id,
          'PRO',
          selectedMonths,
          planOnlyTotal,
          0
        );

        const landingAmount = landing
          ? await pricingService.calculateTotal(planStr, selectedMonths, true) - planOnlyTotal
          : 0;

        amountCOP = Math.max(0, preview.amountToPay + landingAmount);
        console.log(`[PaypalCheckout] Proration aplicada: credit=${preview.creditAmount} amountToPay=${preview.amountToPay} amountCOP=${amountCOP}`);
      } else {
        console.log(`[PaypalCheckout] Sin proration. Cobro completo: ${amountCOP} COP`);
      }
    }

    const overrideTrm = trm ? parseFloat(trm as string) : undefined;
    const { trm: currentTrm, source } = await pricingService.getEffectiveTrm(overrideTrm);
    console.log(`[PaypalController] TRM usada para checkout: ${currentTrm} (source=${source})`);

    const brandId = (req as any).brand?.id || `visitor_${Date.now()}`;
    const reference = `PAYPAL-${brandId}-M${selectedMonths}-P${planStr}${landing ? '-LANDING' : ''}-${Date.now()}`;
    const frontendUrl = process.env.FRONTEND_URL || 'https://lookitry.com';
    const returnUrl = hasAuthenticatedBrand
      ? `${frontendUrl}/dashboard/checkout?plan=${planStr}&months=${selectedMonths}&method=paypal&ref=${encodeURIComponent(reference)}`
      : undefined;
    const cancelUrl = hasAuthenticatedBrand
      ? `${frontendUrl}/dashboard/checkout?plan=${planStr}`
      : undefined;

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

    const createdOrder = await paypalService.createOrder(amountCOP, currentTrm, reference, returnUrl, cancelUrl);
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

    if (hasAuthenticatedBrand && planStr === 'PRO') {
      const { data: currentBrand } = await supabaseAdmin.from('brands').select('plan, subscription_status, trial_end_date').eq('id', (req as any).brand.id).single();
      if (hasActivePaidSubscription(currentBrand) && currentBrand?.plan === 'BASIC') {
        await planChangeService.createPending({
          brandId: (req as any).brand.id,
          reference,
          source: 'paypal',
          fromPlan: currentBrand?.plan || null,
          toPlan: 'PRO',
          months: selectedMonths,
          amountExpected: amountCOP,
          metadata: { includesLanding: landing, amountUsdExpected: createdOrder.amountUSD },
        });
      }
    }

    return res.status(200).json({ checkoutUrl: createdOrder.checkoutUrl, reference });
  });

  capturePayment = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, reference: requestedReference } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    // Idempotencia: si la referencia ya está completada en DB, retornar éxito sin re-procesar
    if (requestedReference) {
      const existingByRef = await paypalService.getTrackedOrder(requestedReference);
      if (existingByRef?.status === 'completed') {
        console.log(`[PaypalCapture] Orden ya procesada (by ref): ${requestedReference}`);
        return res.status(200).json({
          success: true,
          message: 'Pago ya procesado anteriormente',
          orderId,
          status: 'COMPLETED',
          reference: requestedReference,
          alreadyProcessed: true,
        });
      }
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

    // Idempotencia: ya procesada
    if (trackedOrder?.status === 'completed') {
      console.log(`[PaypalCapture] Orden ya completada en DB: ${resolvedReference}`);
      return res.status(200).json({
        success: true,
        message: 'Pago ya procesado anteriormente',
        orderId,
        status: 'COMPLETED',
        reference: resolvedReference,
        alreadyProcessed: true,
      });
    }

    const orderAmountUSD = paypalService.extractAmountUsd(order);
    if (orderAmountUSD == null) {
      throw new Error('No se pudo validar el monto de la orden PayPal');
    }
    assertTrackedOrder(resolvedReference, trackedOrder, orderId, orderAmountUSD);

    let effectiveOrder = order;
    if (order.status === 'APPROVED') {
      effectiveOrder = await paypalService.captureOrder(orderId);
    } else if (order.status === 'COMPLETED') {
      // Orden ya capturada en PayPal (PAY_NOW sandbox o webhook previo)
      effectiveOrder = order;
    } else {
      throw new Error(`El pago no se completó (Status: ${order.status})`);
    }

    const amountUSD = paypalService.extractAmountUsd(effectiveOrder);
    if (amountUSD == null) {
      throw new Error('No se pudo validar el monto capturado en PayPal');
    }
    // Usar el monto de la orden rastreada si PayPal devuelve algo distinto dentro de tolerancia
    const finalAmount = trackedOrder && Math.abs(amountUSD - Number(trackedOrder.amount_usd_expected)) > PAYPAL_AMOUNT_TOLERANCE
      ? Number(trackedOrder.amount_usd_expected)
      : amountUSD;

    assertTrackedOrder(resolvedReference, trackedOrder, orderId, finalAmount);

    await fulfillPaypalPayment(resolvedReference, orderId, finalAmount, 'capture');
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

      if (
        reference &&
        (
          reference.startsWith('PAYPAL-') ||
          reference.startsWith('TRIAL-') ||
          reference.startsWith('GUEST-TRIAL-') ||
          addonCreditsService.isAddonReference(reference)
        )
      ) {
        const trackedOrder = await paypalService.getTrackedOrder(reference);
        assertTrackedOrder(reference, trackedOrder, orderId, amountUSD);
        await fulfillPaypalPayment(reference, orderId, amountUSD, 'webhook');
        await paypalService.markOrderStatus(reference, 'completed', orderId);
      }
    }

    return res.status(200).json({ received: true });
  });
}
