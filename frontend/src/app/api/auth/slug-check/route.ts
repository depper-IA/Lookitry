import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Use API_URL instead of BACKEND_URL for consistency (they should be the same in production)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug requerido' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/slug-check?slug=${encodeURIComponent(slug)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!backendRes.ok) {
      // El backend /api/auth/slug-check usa .maybeSingle() — 404 = slug no existe = DISPONIBLE
      // Cualquier otro error (500, 502, etc.) sí es un error real del servidor
      if (backendRes.status === 404) {
        return NextResponse.json({ available: true });
      }
      console.error('Backend slug-check error:', backendRes.status, await backendRes.text());
      return NextResponse.json({ error: 'Error del servidor', available: null }, { status: 500 });
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Slug check proxy error:', error?.message || error);
    if (error?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Timeout al verificar slug', available: null }, { status: 504 });
    }
    return NextResponse.json({ error: 'Error al verificar slug', available: null }, { status: 500 });
  }
}
