import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { wompiService } from '../services/wompi.service';

const router = Router();

/**
 * GET /api/trial/status
 * Retorna si hay una campaña de trial activa y cuántos días ofrece.
 * Público — no requiere auth.
 */
router.get('/status', asyncHandler(async (req, res) => {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from('trial_campaigns')
    .select('id, trial_days, name, ends_at, require_card_verification')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return res.json({ trialAvailable: false, trialDays: 0, campaignName: null, endsAt: null, requireCardVerification: false });
  }
  return res.json({
    trialAvailable: true,
    trialDays: data.trial_days,
    campaignName: data.name ?? null,
    endsAt: data.ends_at ?? null,
    requireCardVerification: data.require_card_verification === true,
  });
}));

/**
 * POST /api/trial/initiate
 * Genera la URL de Wompi para tokenizar la tarjeta del trial.
 * Requiere auth (la cuenta ya fue creada en /register).
 * Monto: 100 COP (el mínimo aceptado por Wompi — se usa solo para tokenizar).
 * Si la campaña activa tiene require_card_verification=false, activa el trial directamente.
 */
router.post('/initiate', authMiddleware, asyncHandler(async (req, res) => {
  const brand = (req as any).brand;
  if (!brand?.id) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Obtener campaña activa y verificar si requiere tarjeta
  const now = new Date().toISOString();
  const { data: campaign } = await supabaseAdmin
    .from('trial_campaigns')
    .select('id, trial_days, require_card_verification')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Modo test: sin verificación de tarjeta → activar trial directamente
  if (!campaign || campaign.require_card_verification === false) {
    await supabaseAdmin
      .from('brands')
      .update({ trial_payment_status: 'active' })
      .eq('id', brand.id);
    return res.json({ skipPayment: true, message: 'Trial activado en modo test' });
  }

  // Marcar trial como pendiente de pago
  await supabaseAdmin
    .from('brands')
    .update({ trial_payment_status: 'pending_payment' })
    .eq('id', brand.id);

  const frontendUrl = process.env.FRONTEND_URL || 'https://lookitry.com';
  const redirectUrl = `${frontendUrl}/trial-activado`;

  // Monto mínimo de Wompi: 100 COP — cardOnly=true restringe a solo tarjeta débito/crédito
  const checkoutUrl = await wompiService.getCheckoutUrl(brand.id, 100, redirectUrl, true);

  return res.json({ checkoutUrl });
}));

export default router;
