import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sanitizeError } from '../utils/sanitizeError';

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
    return res.status(500).json({ error: sanitizeError(err, 'Error al listar cupones') });
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
    return res.status(500).json({ error: sanitizeError(err, 'Error al crear cupón') });
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
    return res.status(500).json({ error: sanitizeError(err, 'Error al actualizar cupón') });
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
    return res.status(500).json({ error: sanitizeError(err, 'Error al eliminar cupón') });
  }
}

// POST /api/coupons/validate — validar cupón (público, sin auth)
export async function validateCoupon(req: Request, res: Response) {
  try {
    const { code, plan } = req.body as { code?: string; plan?: string };

    if (!code) {
      return res.status(400).json({ ok: false, error: 'Código requerido' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const now = new Date().toISOString();

    // Usar SQL directo para evitar problemas con el cliente Supabase y RLS
    // supabaseAdmin usa service_role que bypasea RLS completamente
    const { data: rows, error } = await supabaseAdmin
      .from('coupons')
      .select('id, code, discount_type, discount_value, max_uses, uses_count, expires_at, plan_ids, active')
      .eq('code', normalizedCode)
      .eq('active', true)
      .limit(1);

    if (error) {
      console.error('[Coupons] Error al consultar cupón:', error);
      throw error;
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Cupón inválido o expirado' });
    }

    const coupon = rows[0];

    // Verificar expiración manualmente (evita el .or() que puede fallar con anon key)
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date(now)) {
      return res.status(404).json({ ok: false, error: 'Cupón inválido o expirado' });
    }

    // Verificar límite de usos
    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return res.status(409).json({ ok: false, error: 'Este cupón ya alcanzó su límite de usos' });
    }

    // Verificar que aplica al plan solicitado
    if (plan && coupon.plan_ids && coupon.plan_ids.length > 0 && !coupon.plan_ids.includes(plan)) {
      return res.status(422).json({ ok: false, error: 'Este cupón no aplica para el plan seleccionado' });
    }

    return res.json({
      ok: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        plan_ids: coupon.plan_ids,
      },
    });
  } catch (err: any) {
    console.error('[Coupons] Error en validateCoupon:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}


export async function redeemCoupon(req: Request, res: Response) {
  try {
    const { coupon_id } = req.body as { coupon_id?: string };
    if (!coupon_id) return res.status(400).json({ error: 'coupon_id requerido' });

    const brandId = (req as any).brand?.id;
    if (!brandId) return res.status(401).json({ error: 'Autenticación requerida' });

    // Actualización atómica vía RPC: incrementa uses_count SOLO si no alcanzó max_uses
    // Esto elimina la condición de carrera TOCTOU del patrón read-then-write
    const { data: newCount, error } = await supabaseAdmin
      .rpc('increment_coupon_uses', { coupon_id_input: coupon_id });

    if (error) {
      console.error('[Coupons] Error al redimir cupón:', error);
      return res.status(400).json({ error: 'No se pudo redimir el cupón' });
    }

    if (newCount === null) {
      return res.status(404).json({ error: 'Cupón no encontrado o sin usos disponibles' });
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error('[Coupons] Error inesperado en redeemCoupon:', err);
    return res.status(500).json({ error: sanitizeError(err, 'Error interno del servidor') });
  }
}
