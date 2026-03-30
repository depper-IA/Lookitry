import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';

function isAllowedHostname(hostname: string): boolean {
  const allowed = ['lookitry.com', 'wilkiedevs.com', 'supabase.co', 'supabase.in'];
  return allowed.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function toBinaryBody(buffer: Buffer): BodyInit {
  return buffer as unknown as BodyInit;
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src');

  if (!src) {
    return NextResponse.json({ error: 'src requerida' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return NextResponse.json({ error: 'URL invalida' }, { status: 400 });
  }

  if (!isAllowedHostname(parsed.hostname)) {
    return NextResponse.json({ error: 'Dominio no permitido' }, { status: 403 });
  }

  try {
    const upstream = await fetch(src, { cache: 'force-cache' });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'No se pudo obtener la imagen' }, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const inputBuffer = Buffer.from(await upstream.arrayBuffer());

    // Las imágenes usadas para compartir deben salir en JPG por compatibilidad.
    const outputBuffer = contentType.includes('image/jpeg') || contentType.includes('image/jpg')
      ? inputBuffer
      : await sharp(inputBuffer)
          .rotate()
          .jpeg({ quality: 88, mozjpeg: true, progressive: true })
          .toBuffer();

    return new Response(toBinaryBody(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
