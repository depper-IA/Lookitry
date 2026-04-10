import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return false;
  const res = await fetch(`${API_URL}/api/admin/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

/** GET /api/admin/promotions — todas las promociones (admin) */
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/promotions?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    return NextResponse.json({ ok: false, error: `Supabase ${res.status}` }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, data });
}

/** POST /api/admin/promotions — crear promoción */
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { type, name, config, active, starts_at, ends_at } = body;

  if (!type || !name) {
    return NextResponse.json({ ok: false, error: 'Faltan campos requeridos: type, name' }, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/promotions`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ type, name, config: config ?? {}, active: active ?? false, starts_at, ends_at }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }

  const data = await res.json();
  revalidatePath('/api/promotions');
  return NextResponse.json({ ok: true, data: data[0] }, { status: 201 });
}
