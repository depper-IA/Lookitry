import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy de imágenes para evitar bloqueos CORS/referrer de WordPress.
 * Uso: /api/img-proxy?url=https://...
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  // Validar que sea una URL HTTP/HTTPS válida
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new NextResponse('Invalid URL protocol', { status: 400 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Lista de User-Agents a intentar en orden
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'curl/7.88.1',
  ];

  for (const ua of userAgents) {
    try {
      const res = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': ua,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'es,en;q=0.9',
          // Sin Referer ni Origin — evita bloqueos de WordPress
        },
        redirect: 'follow',
        // @ts-ignore — Node fetch signal
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      // Intentar con el siguiente User-Agent
      continue;
    }
  }

  // Todos los intentos fallaron — redirigir a la URL original como último recurso
  return NextResponse.redirect(parsedUrl.toString(), { status: 302 });
}
