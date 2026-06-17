import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { generateToken } from '../utils/jwt';
import { wompiService } from '../services/wompi.service';
import { paypalService } from '../services/paypal.service';
import { pricingService } from '../services/pricing.service';

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

  const normalizedEmail = email.trim().toLowerCase();

  // Verificar si ya existe una marca con este email
  const { data: existingBrand } = await supabaseAdmin
    .from('brands')
    .select('id, plan, subscription_status, trial_end_date, trial_payment_status')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (existingBrand) {
    const isTrialActive =
      existingBrand.plan === 'TRIAL' &&
      existingBrand.trial_end_date &&
      new Date(existingBrand.trial_end_date) > new Date() &&
      existingBrand.subscription_status !== 'suspended';

    const hasPaidPlan =
      existingBrand.subscription_status === 'active' ||
      existingBrand.subscription_status === 'expiring_soon';

    if (isTrialActive || hasPaidPlan) {
      return res.status(409).json({
        error: 'BRAND_ALREADY_EXISTS',
        message: 'Ya tienes una cuenta activa. Redirigiendo al dashboard...',
        redirectUrl: '/dashboard/subscription',
        brandId: existingBrand.id,
      });
    }
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

  const guestId = `visitor_${crypto.randomUUID()}`;
  const reference = `GUEST-TRIAL-${guestId}`;

  const { error: insertError } = await supabaseAdmin.from('pending_registrations').insert({
    email: normalizedEmail,
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
    const { trm } = await pricingService.getEffectiveTrm(
      trmOverride ? Number(trmOverride) : undefined
    );

    const createdOrder = await paypalService.createOrder(price, trm, reference, successUrl);

    await paypalService.recordOrder({
      reference,
      brand_id: null,
      email: normalizedEmail,
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

/**
 * POST /api/trial/activate-guest
 * Activa el trial para un usuario autenticado (Google) después del pago.
 * Requiere cookie de sesión válida.
 */
router.post('/activate-guest', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { ref } = req.body;

  if (!ref) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La referencia es requerida' });
  }

  const normalizedRef = String(ref).toUpperCase();
  if (!normalizedRef.startsWith('GUEST-TRIAL-')) {
    return res.status(400).json({ error: 'INVALID_REFERENCE', message: 'Referencia de trial inválida' });
  }

  // Buscar pending_registration
  const { data: pending, error: pendingError } = await supabaseAdmin
    .from('pending_registrations')
    .select('*')
    .eq('reference', ref)
    .maybeSingle();

  if (pendingError || !pending) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Referencia no encontrada' });
  }

  if (pending.status === 'used') {
    // Ya fue utilizada, verificar si la brand ya tiene trial activo
    const brandId = req.brand?.id;
    if (brandId) {
      const { data: brand } = await supabaseAdmin
        .from('brands')
        .select('id, plan, trial_end_date, subscription_status')
        .eq('id', brandId)
        .single();

      if (brand?.plan === 'TRIAL' && brand?.trial_end_date) {
        return res.json({ success: true, alreadyActivated: true });
      }
    }
    return res.status(409).json({ error: 'ALREADY_USED', message: 'Esta referencia ya fue utilizada' });
  }

  if (pending.status !== 'paid') {
    return res.status(402).json({ error: 'PAYMENT_NOT_CONFIRMED', message: 'El pago no ha sido confirmado' });
  }

  // Obtener la campaign para calcular trial_end_date
  const now = new Date();
  const { data: campaign } = await supabaseAdmin
    .from('trial_campaigns')
    .select('trial_days, trial_generations_limit')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${now.toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const trialDays = campaign?.trial_days || 7;
  const trialLimit = campaign?.trial_generations_limit || 15;
  const trialEndDate = new Date(now);
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);

  // Actualizar la brand del usuario autenticado
  const brandId = req.brand?.id;
  if (!brandId) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No hay sesión activa' });
  }

  const { data: updatedBrand, error: updateError } = await supabaseAdmin
    .from('brands')
    .update({
      plan: 'TRIAL',
      subscription_status: 'active',
      trial_end_date: trialEndDate.toISOString(),
      trial_generations_limit: trialLimit,
      trial_payment_status: 'active',
    })
    .eq('id', brandId)
    .select('id, email, name, plan, trial_end_date')
    .single();

  if (updateError) {
    console.error('[Trial] Error activando trial:', updateError);
    return res.status(500).json({ error: 'ACTIVATION_FAILED', message: 'Error al activar el trial' });
  }

  // Marcar referencia como utilizada
  await supabaseAdmin
    .from('pending_registrations')
    .update({ status: 'used', updated_at: now.toISOString() } as any)
    .eq('reference', ref);

  // Generate JWT and set cookie
  const token = generateToken({ brandId: brandId, email: updatedBrand?.email || req.brand?.email || '' });

  const IS_PROD = process.env.NODE_ENV === 'production';
  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
  const cookieOptions: any = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };
  if (COOKIE_DOMAIN && IS_PROD) cookieOptions.domain = COOKIE_DOMAIN;
  res.cookie('token', token, cookieOptions);

  return res.json({ success: true, brand: updatedBrand });
}));

export default router;
