import { Request, Response } from 'express';
import { paypalService } from '../services/paypal.service';
import { SubscriptionService } from '../services/subscription.service';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../middleware/errorHandler';

const subscriptionService = new SubscriptionService();

export class PaypalController {
  /**
   * GET /api/payments/paypal/checkout-url
   * Genera el link de PayPal y crea el registro pendiente
   */
  getCheckoutUrl = asyncHandler(async (req: Request, res: Response) => {
    const { amount, months, plan, email, trm, includes_landing } = req.query;

    if (!amount || !months || !plan || !trm) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const amountCOP = parseInt(amount as string, 10);
    const selectedMonths = parseInt(months as string, 10);
    const currentTrm = parseFloat(trm as string);
    const landing = includes_landing === 'true';

    // Crear referencia única
    const brandId = (req as any).brand?.id || `visitor_${Date.now()}`;
    const reference = `PAYPAL-${brandId}-M${selectedMonths}-P${plan}${landing ? '-LANDING' : ''}-${Date.now()}`;

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

    // 2. Procesar activación según la referencia
    const isNewRegistration = reference.includes('visitor_');
    const parts = reference.split('-');
    const brandId = isNewRegistration ? null : parts[1];
    const months = parseInt(parts[2].slice(1), 10);
    const plan = parts[3].slice(1);
    const includesLanding = reference.includes('LANDING');
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
      
      // Registrar pago
      await supabaseAdmin.from('subscription_payments').insert({
        brand_id: brandId,
        amount: amountUSD,
        currency: 'USD',
        payment_method: 'paypal',
        status: 'completed',
        months_paid: months,
        reference: orderId
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Pago capturado y suscripción activada',
      orderId,
      status: captureData.status
    });
  });
}
