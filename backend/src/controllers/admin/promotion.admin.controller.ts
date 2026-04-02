import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { auditService } from '../../services/audit.service';

/**
 * GET /api/admin/promotions
 */
export const getAllPromotions = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('promotions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, data: data || [] });
  } catch (error: any) {
    console.error('Error in getAllPromotions:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener promociones' });
  }
};

/**
 * POST /api/admin/promotions
 */
export const createPromotion = async (req: any, res: Response) => {
  try {
    const { type, name, config, active, starts_at, ends_at } = req.body;
    if (!type || !name) return res.status(400).json({ error: 'INVALID_BODY', message: 'Faltan campos requeridos (type, name)' });

    const { data, error } = await supabaseAdmin.from('promotions').insert({
      type, name, config: config ?? {}, active: active ?? false, starts_at: starts_at || null, ends_at: ends_at || null
    }).select().single();

    if (error) throw error;

    await auditService.log({ admin_id: req.admin.id, admin_email: req.admin.email, action: 'system.config_update', details: { promo_id: data.id, action: 'create', promo_name: name } });
    return res.status(201).json({ ok: true, data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al crear promoción' });
  }
};

/**
 * PUT /api/admin/promotions/:id
 */
export const updatePromotion = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { type, name, config, active, starts_at, ends_at } = req.body;

    const { data, error } = await supabaseAdmin.from('promotions').update({
      type, name, config: config ?? {}, active: active ?? false, starts_at: starts_at || null, ends_at: ends_at || null
    }).eq('id', id).select().single();

    if (error) throw error;

    if (req.admin) {
      await auditService.log({ admin_id: req.admin.id, admin_email: req.admin.email, action: 'system.config_update', details: { promo_id: id, action: 'update' } });
    }
    return res.json({ ok: true, data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar promoción' });
  }
};

/**
 * DELETE /api/admin/promotions/:id
 */
export const deletePromotion = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('promotions').delete().eq('id', id);
    if (error) throw error;

    if (req.admin) {
      await auditService.log({ admin_id: req.admin.id, admin_email: req.admin.email, action: 'system.config_update', details: { promo_id: id, action: 'delete' } });
    }
    return res.json({ ok: true, message: 'Promoción eliminada' });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al eliminar promoción' });
  }
};
