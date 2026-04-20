import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const getPublicPricingConfig = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pricing_config')
      .select('id, data, updated_at')
      .order('id', { ascending: true });

    if (error) {
      console.error('[PublicPricingController] Error fetching pricing_config:', error);
      return res.status(500).json({ ok: false, error: 'Error consultando configuración de precios' });
    }

    return res.json({ ok: true, data });
  } catch (err) {
    console.error('[PublicPricingController] Unexpected error:', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
};