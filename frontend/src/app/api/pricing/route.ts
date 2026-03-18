import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET — lectura pública de toda la config
export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pricing_config?select=id,data,updated_at`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const rows = await res.json();
    return NextResponse.json({ ok: true, data: rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// PUT — actualizar una fila (requiere adminToken)
export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');

  // Verificar token admin contra Supabase
  const verifyRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/admin/verify`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!verifyRes.ok) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json() as { id: string; data: Record<string, unknown> };
  if (!body.id || !body.data) {
    return NextResponse.json({ ok: false, error: 'Faltan campos id y data' }, { status: 400 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pricing_config?id=eq.${encodeURIComponent(body.id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ data: body.data }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }

  // Invalidar caché ISR para que la landing refleje el cambio
  revalidateTag('pricing');

  return NextResponse.json({ ok: true });
}
