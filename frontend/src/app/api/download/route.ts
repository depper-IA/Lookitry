import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';

function toBinaryBody(buffer: Buffer): BodyInit {
  return buffer as unknown as BodyInit;
}

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

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'URL invalida' }, { status: 400 });
  }

  const allowed = ['lookitry.com', 'wilkiedevs.com', 'supabase.co', 'supabase.in'];
  const isAllowed = allowed.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
  if (!isAllowed) {
    return NextResponse.json({ error: 'Dominio no permitido' }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Error al obtener imagen' }, { status: 502 });
    }

    const upstreamContentType = upstream.headers.get('content-type') || 'image/jpeg';
    const inputBuffer = Buffer.from(await upstream.arrayBuffer());
    const shouldConvertToJpeg = upstreamContentType.includes('image/webp');
    const outputBuffer = shouldConvertToJpeg
      ? await sharp(inputBuffer).rotate().jpeg({ quality: 90, mozjpeg: true, progressive: true }).toBuffer()
      : inputBuffer;
    const contentType = shouldConvertToJpeg ? 'image/jpeg' : upstreamContentType;
    const safeFilename = shouldConvertToJpeg
      ? filename.replace(/\.[^.]+$/u, '') + '.jpg'
      : filename;

    return new Response(toBinaryBody(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
