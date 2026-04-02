import { Request, Response } from 'express';
import { AdminService } from '../../services/admin.service';

const adminService = new AdminService();

/**
 * GET /api/admin/revenue/payments
 */
export const getPayments = async (req: Request, res: Response) => {
  try {
    const { brand_id, status, payment_method, limit, offset, from, to, search } = req.query;
    const result = await adminService.getPayments({
      brand_id: brand_id as string | undefined,
      status: status as string | undefined,
      payment_method: payment_method as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in getPayments:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener pagos' });
  }
};

/**
 * GET /api/admin/subscriptions
 */
export const getAllSubscriptions = async (_req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data: brands, error } = await supabaseAdmin.from('brands').select('id, name, email, slug, plan, subscription_status, subscription_start_date, subscription_end_date, last_payment_date, trial_end_date, trial_generations_limit, trial_payment_status, email_verified').order('created_at', { ascending: false });
    if (error) throw error;

    const now = new Date();
    const subscriptions = (brands || []).map((brand: any) => {
      const isTrial = brand.plan === 'TRIAL';
      let daysRemaining: number | null = null;
      let trialDaysRemaining: number | null = null;

      if (isTrial && brand.trial_end_date) {
        const trialEnd = new Date(brand.trial_end_date);
        trialDaysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = trialDaysRemaining;
      } else if (brand.subscription_end_date) {
        const end = new Date(brand.subscription_end_date);
        daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      let status = brand.subscription_status;
      if (isTrial) {
        status = trialDaysRemaining !== null && trialDaysRemaining < 0 ? 'expired' : 'active';
      } else if (daysRemaining !== null) {
        if (daysRemaining < 0) status = 'expired';
        else if (daysRemaining <= 7) status = 'expiring_soon';
        else status = 'active';
      }

      return { id: brand.id, name: brand.name, email: brand.email, slug: brand.slug, plan: brand.plan, is_in_trial: isTrial, trial_end_date: brand.trial_end_date, trial_days_remaining: trialDaysRemaining, subscription_status: status, subscription_start_date: brand.subscription_start_date, subscription_end_date: brand.subscription_end_date, last_payment_date: brand.last_payment_date, daysRemaining };
    });
    return res.status(200).json({ subscriptions });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al cargar suscripciones' });
  }
};

/**
 * POST /api/admin/subscriptions/:id/payment
 */
export const registerSubscriptionPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, months, plan, currency, status, payment_date, payment_method, notes } = req.body;
    if (!id || !amount || !months || !plan) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ID, monto, meses y plan son requeridos' });
    }

    const { supabaseAdmin } = await import('../../config/supabase');
    const { data: brand, error: brandError } = await supabaseAdmin.from('brands').select('id, name, email, plan').eq('id', id).single();
    if (brandError || !brand) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    const now = payment_date ? new Date(payment_date) : new Date();
    const endDate = new Date(now.getTime() + 30 * months * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabaseAdmin.from('brands').update({ plan: plan.toUpperCase(), subscription_status: 'active', subscription_start_date: now.toISOString(), subscription_end_date: endDate.toISOString(), last_payment_date: now.toISOString(), trial_end_date: null, trial_payment_status: null }).eq('id', id);
    if (updateError) return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar suscripción' });

    const { error: paymentError } = await supabaseAdmin.from('subscription_payments').insert({ brand_id: id, amount, currency: currency || 'COP', payment_date: now.toISOString(), payment_method: payment_method || 'manual', status: status || 'completed', months_paid: months, notes: notes || `Pago registrado manualmente por admin. Plan: ${plan}, ${months} mes(es).` });
    if (paymentError) console.error('[registerSubscriptionPayment] Error inserting payment:', paymentError);

    return res.status(200).json({ message: 'Pago registrado exitosamente', subscription: { plan: plan.toUpperCase(), status: 'active', endDate: endDate.toISOString() } });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al registrar pago' });
  }
};

/**
 * PATCH /api/admin/subscriptions/:id/suspend
 */
export const suspendSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = await import('../../config/supabase');
    const { error } = await supabaseAdmin.from('brands').update({ subscription_status: 'suspended' }).eq('id', id);
    if (error) throw error;
    return res.status(200).json({ message: 'Suscripción suspendida exitosamente' });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al suspender suscripción' });
  }
};

/**
 * PATCH /api/admin/subscriptions/:id/reactivate
 */
export const reactivateSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data: brand, error: brandError } = await supabaseAdmin.from('brands').select('id, subscription_end_date, plan, trial_end_date').eq('id', id).single();
    if (brandError || !brand) return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });

    const now = new Date();
    if (brand.plan === 'TRIAL' && brand.trial_end_date && new Date(brand.trial_end_date) < now) {
      return res.status(400).json({ error: 'TRIAL_EXPIRED', message: 'El trial ha expirado. Registra un pago para reactivar.' });
    } else if (brand.subscription_end_date && new Date(brand.subscription_end_date) < now) {
      return res.status(400).json({ error: 'SUBSCRIPTION_EXPIRED', message: 'La suscripción ha expirado. Registra un pago para reactivar.' });
    }

    const { error: updateError } = await supabaseAdmin.from('brands').update({ subscription_status: 'active' }).eq('id', id);
    if (updateError) throw updateError;
    return res.status(200).json({ message: 'Suscripción reactivada exitosamente' });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al reactivar suscripción' });
  }
};
