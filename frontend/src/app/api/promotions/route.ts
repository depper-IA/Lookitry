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
    const now = new Date().toISOString();
    const url =
      `${SUPABASE_URL}/rest/v1/promotions` +
      `?select=*` +
      `&active=eq.true` +
      `&or=(starts_at.is.null,starts_at.lte.${now})` +
      `&or=(ends_at.is.null,ends_at.gte.${now})` +
      `&order=created_at.desc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 10 },
    });

    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
