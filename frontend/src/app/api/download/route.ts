import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/download?url=...&filename=...
 * Proxy server-side para descargar imágenes externas sin problemas de CORS.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const url = searchParams.get('url');
  const filename = searchParams.get('filename') || 'imagen.jpg';

  if (!url) {
    return NextResponse.json({ error: 'url requerida' }, { status: 400 });
  }

  // Solo permitir URLs de dominios conocidos
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
  }

  const allowed = ['pruebalo.wilkiedevs.com', 'wilkiedevs.com', 'supabase.co', 'supabase.in'];
  const isAllowed = allowed.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  if (!isAllowed) {
    return NextResponse.json({ error: 'Dominio no permitido' }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Error al obtener imagen' }, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
