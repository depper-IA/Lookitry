import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// GET /api/admin/coupons — listar todos los cupones
export async function listCoupons(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ data: data ?? [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/admin/coupons — crear cupón
export async function createCoupon(req: Request, res: Response) {
  try {
    const { code, discount_type, discount_value, max_uses, expires_at, plan_ids, active } = req.body;

    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ error: 'code, discount_type y discount_value son requeridos' });
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: code.toUpperCase().trim(),
        discount_type,
        discount_value: Number(discount_value),
        max_uses: max_uses ?? null,
        expires_at: expires_at ?? null,
        plan_ids: plan_ids ?? [],
        active: active ?? true,
        uses_count: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: `El código "${code.toUpperCase()}" ya existe` });
      }
      throw error;
    }
    return res.status(201).json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/admin/coupons/:id — actualizar cupón
export async function updateCoupon(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { code, discount_type, discount_value, max_uses, expires_at, plan_ids, active } = req.body;

    const updates: Record<string, unknown> = {};
    if (code !== undefined) updates.code = code.toUpperCase().trim();
    if (discount_type !== undefined) updates.discount_type = discount_type;
    if (discount_value !== undefined) updates.discount_value = Number(discount_value);
    if (max_uses !== undefined) updates.max_uses = max_uses ?? null;
    if (expires_at !== undefined) updates.expires_at = expires_at ?? null;
    if (plan_ids !== undefined) updates.plan_ids = plan_ids;
    if (active !== undefined) updates.active = active;

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Cupón no encontrado' });
    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /api/admin/coupons/:id — eliminar cupón
export async function deleteCoupon(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
