import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { wompiService } from '../services/wompi.service';

const router = Router();
// Force rebuild to ensure最新的 trial routes are active

/**
 * GET /api/trial/status
 * Retorna si hay una campaña de trial activa y cuántos días ofrece.
 * Público — no requiere auth.
 */
router.get('/status', asyncHandler(async (req, res) => {
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
    return res.json({ trialAvailable: false, trialDays: 0, campaignName: null, endsAt: null, requireCardVerification: false, priceCOP: 0 });
  }
  return res.json({
    trialAvailable: true,
    trialDays: data.trial_days,
    priceCOP: data.price_cop ?? 20000,
    campaignName: data.name ?? null,
    endsAt: data.ends_at ?? null,
    requireCardVerification: data.require_card_verification === true,
  });
}));

/**
 * POST /api/trial/initiate
 * Genera la URL de pago (Wompi o PayPal) para activar el trial.
 * Requiere auth (la cuenta ya fue creada en /register).
 */
router.post('/initiate', authMiddleware, asyncHandler(async (req, res) => {
  const brand = (req as any).brand;
  const { method = 'wompi', trm: trmOverride } = req.body;

  if (!brand?.id) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // 1. Obtener campaña activa y su precio
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

  // 2. Si el costo es 0 (o require_card_verification=false), activar trial directamente
  if (price === 0 || campaign?.require_card_verification === false) {
    await supabaseAdmin
      .from('brands')
      .update({ plan: 'TRIAL', trial_payment_status: 'active' })
      .eq('id', brand.id);
    return res.json({ skipPayment: true, message: 'Trial activado directamente' });
  }

  // 3. Generar referencia única de Trial
  const reference = wompiService.generateTrialReference(brand.id);

  // 4. Marcar trial como pendiente de pago
  await supabaseAdmin
    .from('brands')
    .update({ trial_payment_status: 'pending_payment' })
    .eq('id', brand.id);

  const frontendUrl = process.env.FRONTEND_URL || 'https://lookitry.com';
  const successUrl = `${frontendUrl}/trial-activado`;

  // 5. Generar URL según el método
  if (method === 'paypal') {
    const { paypalService } = require('../services/paypal.service');
    const { pricingService } = require('../services/pricing.service');
    const { trm } = await pricingService.getEffectiveTrm(
      trmOverride ? Number(trmOverride) : undefined
    );
    // Reutilizamos el checkout de suscripción de paypalService pero con nuestra referencia TRIAL-
    const returnUrl = `${frontendUrl}/pago-exitoso?method=paypal&ref=${reference}&isTrial=true`;
    const createdOrder = await paypalService.createOrder(price, trm, reference, returnUrl);
    await paypalService.recordOrder({
      reference,
      brand_id: brand.id,
      email: brand.email || null,
      plan: 'TRIAL',
      months: 1,
      amount_cop: price,
      trm,
      amount_usd_expected: createdOrder.amountUSD,
      order_id: createdOrder.orderId,
      status: 'created',
    });
    return res.json({ checkoutUrl: createdOrder.checkoutUrl, reference });
  } else {
    // Wompi
    const checkoutUrl = await wompiService.getCheckoutUrl(brand.id, price, successUrl, false, 1, 'TRIAL', reference);
    return res.json({ checkoutUrl, reference });
  }
}));

/**
 * POST /api/trial/initiate-guest
 * Genera URL de pago para trial sin tener cuenta aún.
 * El usuario se registrará DESPUÉS del pago exitoso.
 */
router.post('/initiate-guest', asyncHandler(async (req, res) => {
  const { email, brandName: rawBrandName, name, method = 'wompi', trm: trmOverride } = req.body;
  const brandName = rawBrandName || name;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email válido es requerido' });
  }

  // 1. Obtener campaña activa
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
  const trialDays = campaign?.trial_days ?? 7;

  // 2. Generar referencia de invitado
  const guestId = `visitor_${Date.now()}`;
  const reference = `GUEST-TRIAL-${guestId}`;

  // 3. Crear registro pendiente
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
  // Redirigir al registro con la referencia después del pago
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
  } else {
    // Wompi
    const checkoutUrl = await wompiService.getCheckoutUrl(guestId, price, successUrl, false, 0, 'TRIAL', reference);
    return res.json({ checkoutUrl, reference });
  }
}));

export default router;
