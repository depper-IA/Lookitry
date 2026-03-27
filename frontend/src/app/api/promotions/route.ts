import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/promotions
 * Devuelve promociones activas y vigentes (público, ISR 10s).
 */
export const revalidate = 10;

export async function GET() {
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/promotions` +
      `?select=*` +
      `&active=eq.true` +
      `&order=created_at.desc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 10 },
    });

    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const raw = await res.json();
    const now = new Date();
    const data = Array.isArray(raw)
      ? raw.filter((promo) => {
          const startsOk = !promo?.starts_at || new Date(promo.starts_at) <= now;
          const endsOk = !promo?.ends_at || new Date(promo.ends_at) >= now;
          return startsOk && endsOk;
        })
      : [];

    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
