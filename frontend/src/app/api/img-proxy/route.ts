import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy de imágenes universal para evitar bloqueos CORS/referrer de WordPress y otros proveedores.
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

  // Lista de User-Agents para evadir bloqueos de seguridad (Hotlink protection, anti-bot, etc.)
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'curl/7.88.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Wget/1.21.1',
  ];

  for (const ua of userAgents) {
    try {
      const res = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': ua,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'es,en;q=0.9',
          'Cache-Control': 'no-cache',
          // Sin Referer por defecto ayuda a saltar bloqueos de "Hotlink protection" básicos
        },
        redirect: 'follow',
        // @ts-ignore — Node fetch signal timeout
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        console.warn(`[Img Proxy] Falló con UA ${ua}: ${res.status}`);
        continue;
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      
      // Validar que realmente sea una imagen
      if (!contentType.startsWith('image/')) {
        console.warn(`[Img Proxy] URL no retornó imagen: ${contentType}`);
        // Si no es imagen, no seguimos intentando con otros UA, el recurso no es una imagen
        break; 
      }

      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
          'X-Proxy-Origin': parsedUrl.hostname,
        },
      });
    } catch (err: any) {
      console.warn(`[Img Proxy] Error con UA ${ua}:`, err.message);
      continue;
    }
  }

  // Todos los intentos fallaron — como ÚLTIMO RECURSO redirigimos al navegador
  // Esto permite que si el servidor del cliente bloquea al servidor de Lookitry pero no al navegador del usuario, cargue.
  console.log(`[Img Proxy] Fallback final: Redirect a ${parsedUrl.toString()}`);
  return NextResponse.redirect(parsedUrl.toString(), { status: 302 });
}
