import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * POST /api/coupons/validate
 * Body: { code: string, plan: string }
 * Valida un cupón y retorna el descuento aplicable.
 */
export async function POST(req: NextRequest) {
  try {
    const { code, plan } = await req.json() as { code: string; plan?: string };

    if (!code) {
      return NextResponse.json({ ok: false, error: 'Código requerido' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const url =
      `${SUPABASE_URL}/rest/v1/coupons` +
      `?code=eq.${encodeURIComponent(code.trim().toUpperCase())}` +
      `&active=eq.true` +
      `&or=(expires_at.is.null,expires_at.gte.${now})` +
      `&select=*` +
      `&limit=1`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Supabase ${res.status}`);

    const rows = await res.json() as any[];

    if (!rows.length) {
      return NextResponse.json({ ok: false, error: 'Cupón inválido o expirado' }, { status: 404 });
    }

    const coupon = rows[0];

    // Verificar límite de usos
    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return NextResponse.json({ ok: false, error: 'Este cupón ya alcanzó su límite de usos' }, { status: 409 });
    }

    // Verificar que aplica al plan solicitado (si plan_ids no está vacío)
    if (plan && coupon.plan_ids.length > 0 && !coupon.plan_ids.includes(plan)) {
      return NextResponse.json({ ok: false, error: 'Este cupón no aplica para el plan seleccionado' }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        plan_ids: coupon.plan_ids,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
