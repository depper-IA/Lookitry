import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { wompiService } from '../services/wompi.service';

const router = Router();

/**
 * GET /api/trial/status
 * Retorna si hay una campaña de trial activa y cuántos días ofrece.
 * Público, no requiere auth.
 */
router.get('/status', asyncHandler(async (_req, res) => {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from('trial_campaigns')
    .select('id, trial_days, name, ends_at, require_card_verification, price_cop')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return res.json({
      active: false,
      trialAvailable: false,
      trialDays: 0,
      campaignName: null,
      endsAt: null,
      requiresTrialPayment: false,
      priceCOP: 0,
    });
  }

  const requiresTrialPayment = Number(data.price_cop ?? 0) > 0 && data.require_card_verification !== false;

  return res.json({
    active: true,
    trialAvailable: true,
    trialDays: data.trial_days,
    priceCOP: data.price_cop ?? 20000,
    campaignName: data.name ?? null,
    endsAt: data.ends_at ?? null,
    requiresTrialPayment,
  });
}));

/**
 * POST /api/trial/initiate
 * Flujo legado deshabilitado.
 * El trial para clientes nuevos ahora siempre se inicia en /trial-checkout
 * y genera referencias GUEST-TRIAL-* antes de crear la cuenta.
 */
router.post('/initiate', authMiddleware, asyncHandler(async (_req, res) => {
  return res.status(410).json({
    error: 'El trial autenticado fue deshabilitado',
    message: 'El trial ahora siempre se inicia desde el checkout publico antes de crear la cuenta.',
    redirectPath: '/trial-checkout',
    referencePrefix: 'GUEST-TRIAL-',
  });
}));

/**
 * POST /api/trial/initiate-guest
 * Genera URL de pago para trial sin tener cuenta aún.
 * El usuario se registrará después del pago exitoso.
 */
router.post('/initiate-guest', asyncHandler(async (req, res) => {
  const { email, brandName: rawBrandName, name, method = 'wompi', trm: trmOverride } = req.body;
  const brandName = rawBrandName || name;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email válido es requerido' });
  }

  const now = new Date().toISOString();
  const { data: campaign } = await supabaseAdmin
    .from('trial_campaigns')
    .select('*')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const price = campaign?.price_cop ?? 20000;

  const guestId = `visitor_${Date.now()}`;
  const reference = `GUEST-TRIAL-${guestId}`;

  const { error: insertError } = await supabaseAdmin.from('pending_registrations').insert({
    email,
    brand_name: brandName,
    reference,
    plan: 'TRIAL',
    months: 0,
    amount: price,
    status: 'pending',
  });

  if (insertError) {
    console.error('[Trial] Error insertando registro invitado:', insertError);
    return res.status(500).json({ error: 'Error al iniciar el pago' });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://lookitry.com';
  const successUrl = `${frontendUrl}/pago-exitoso?method=paypal&ref=${reference}&isGuestTrial=true`;

  if (method === 'paypal') {
    const { paypalService } = require('../services/paypal.service');
    const { pricingService } = require('../services/pricing.service');
    const { trm } = await pricingService.getEffectiveTrm(
      trmOverride ? Number(trmOverride) : undefined
    );

    const createdOrder = await paypalService.createOrder(price, trm, reference, successUrl);

    await paypalService.recordOrder({
      reference,
      brand_id: null,
      email,
      plan: 'TRIAL',
      months: 0,
      amount_cop: price,
      trm,
      amount_usd_expected: createdOrder.amountUSD,
      order_id: createdOrder.orderId,
      status: 'created',
    });

    return res.json({ checkoutUrl: createdOrder.checkoutUrl, reference });
  }

  const checkoutUrl = await wompiService.getCheckoutUrl(guestId, price, successUrl, false, 0, 'TRIAL', reference);
  return res.json({ checkoutUrl, reference });
}));

export default router;
