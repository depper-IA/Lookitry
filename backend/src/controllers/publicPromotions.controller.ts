import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';

/**
 * GET /api/promotions
 * Devuelve promociones activas y vigentes (público).
 */
export const getActivePromotions = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const activePromos = (data || []).filter((promo: any) => {
      const startsOk = !promo?.starts_at || new Date(promo.starts_at) <= now;
      const endsOk = !promo?.ends_at || new Date(promo.ends_at) >= now;
      return startsOk && endsOk;
    });

    return res.json({ ok: true, data: activePromos });
  } catch (error: any) {
    console.error('Error in getActivePromotions:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener promociones' });
  }
};