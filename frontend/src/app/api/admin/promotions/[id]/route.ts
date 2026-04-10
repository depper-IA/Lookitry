import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return false;
  const res = await fetch(`${API_URL}/api/admin/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

/** PUT /api/admin/promotions/[id] — editar promoción */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/promotions?id=eq.${params.id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }

  const data = await res.json();
  revalidatePath('/api/promotions');
  return NextResponse.json({ ok: true, data: data[0] });
}

/** DELETE /api/admin/promotions/[id] — eliminar promoción */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/promotions?id=eq.${params.id}`,
    {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }

  revalidatePath('/api/promotions');
  return NextResponse.json({ ok: true });
}
