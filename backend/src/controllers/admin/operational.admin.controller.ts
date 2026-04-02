import { Request, Response } from 'express';
import { AdminService } from '../../services/admin.service';
import { auditService } from '../../services/audit.service';
import axios from 'axios';

const adminService = new AdminService();

/**
 * GET /api/admin/mission-control
 */
export const getMissionControl = async (_req: Request, res: Response) => {
  try {
    const result = await adminService.getMissionControl();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in getMissionControl:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener datos del mission control' });
  }
};

/**
 * GET /api/admin/audit-log
 */
export const getAuditLog = async (req: Request, res: Response) => {
  try {
    const { limit, offset, action, admin_email, from, to } = req.query as any;
    const result = await adminService.getAuditLog({
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
      action: action as string | undefined,
      admin_email: admin_email as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener log de auditoría' });
  }
};

/**
 * GET /api/admin/pricing
 */
export const getPricingConfig = async (_req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('pricing_config').select('*').order('id', { ascending: true });
    if (error) throw error;
    return res.json({ ok: true, data: data || [] });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener precios' });
  }
};

/**
 * PUT /api/admin/pricing
 */
export const updatePricingConfig = async (req: any, res: Response) => {
  try {
    const { id, data: configData } = req.body;
    if (!id || !configData) return res.status(400).json({ error: 'INVALID_BODY', message: 'Faltan campos id o data' });

    const { supabaseAdmin } = await import('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('pricing_config').update({ data: configData, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;

    if (req.admin) {
      await auditService.log({ admin_id: req.admin.id, admin_email: req.admin.email, action: 'system.config_update', details: { pricing_id: id, action: 'update_pricing' } });
    }
    return res.json({ ok: true, data });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar precios' });
  }
};
