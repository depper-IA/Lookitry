import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

/**
 * GET /api/promotions
 * Devuelve promociones activas y vigentes (público, ISR 10s).
 * Pasa por el backend para usar service_role y evitar problemas de RLS.
 */
export const revalidate = 10;

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/promotions`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 10 },
    });

    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
