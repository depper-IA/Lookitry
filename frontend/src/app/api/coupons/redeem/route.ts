import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

/**
 * POST /api/coupons/redeem
 * Body: { coupon_id: string }
 * Proxy hacia el backend para incrementar uses_count del cupón.
 * Se llama fire-and-forget desde el checkout antes de redirigir a Wompi.
 */
export async function POST(req: NextRequest) {
  try {
    const { coupon_id } = await req.json() as { coupon_id?: string };
    if (!coupon_id) {
      return NextResponse.json({ ok: false, error: 'coupon_id requerido' }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/api/coupons/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_id }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
