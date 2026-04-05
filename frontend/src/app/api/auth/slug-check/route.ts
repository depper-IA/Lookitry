import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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
    });

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Slug check proxy error:', error);
    return NextResponse.json({ error: 'Error al verificar slug' }, { status: 500 });
  }
}
