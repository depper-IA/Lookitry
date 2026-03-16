import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { wompiService } from '../services/wompi.service';

const router = Router();

/**
 * GET /api/trial/status
 * Retorna si hay una campaña de trial activa y cuántos días ofrece.
 * Público — no requiere auth.
 */
router.get('/status', asyncHandler(async (req, res) => {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('trial_campaigns')
    .select('id, trial_days')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return res.json({ active: false });
  }
  return res.json({ active: true, trial_days: data.trial_days });
}));

/**
 * POST /api/trial/initiate
 * Genera la URL de Wompi para tokenizar la tarjeta del trial.
 * Requiere auth (la cuenta ya fue creada en /register).
 * Monto: 100 COP (el mínimo aceptado por Wompi — se usa solo para tokenizar).
 */
router.post('/initiate', authMiddleware, asyncHandler(async (req, res) => {
  const brand = (req as any).brand;
  if (!brand?.id) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Marcar trial como pendiente de pago
  await supabase
    .from('brands')
    .update({ trial_payment_status: 'pending_payment' })
    .eq('id', brand.id);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendUrl}/trial-activado`;

  // Monto mínimo de Wompi: 100 COP
  const checkoutUrl = await wompiService.getCheckoutUrl(brand.id, 100, redirectUrl);

  return res.json({ checkoutUrl });
}));

export default router;
