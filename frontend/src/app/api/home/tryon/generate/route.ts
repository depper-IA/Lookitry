import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    const proxySecret = process.env.INTERNAL_PROXY_SECRET || '';
    const realClientIP = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-real-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || '';

    let response: Response;

    if (contentType.includes('multipart/form-data')) {
      // Forward multipart binary directly (no base64 inflation)
      const formData = await request.formData();
      response = await fetch(`${apiUrl}/api/home/tryon/generate`, {
        method: 'POST',
        headers: {
          'x-real-client-ip': realClientIP,
          'x-internal-proxy-secret': proxySecret,
          'user-agent': request.headers.get('user-agent') || '',
        },
        body: formData,
      });
    } else {
      // Legacy JSON base64 — convert to multipart before forwarding
      const body = await request.json();
      const { productId, selfieBase64 } = body;

      const proxyFormData = new FormData();
      proxyFormData.append('productId', productId || '');
      // Convert base64 to Blob and append as file
      if (selfieBase64) {
        const base64Data = selfieBase64.replace(/^data:image\/\w+;base64,/, '');
        const binaryData = Buffer.from(base64Data, 'base64');
        const blob = new Blob([binaryData], { type: 'image/jpeg' });
        proxyFormData.append('selfie', blob, 'selfie.jpg');
      }

      response = await fetch(`${apiUrl}/api/home/tryon/generate`, {
        method: 'POST',
        headers: {
          'x-real-client-ip': realClientIP,
          'x-internal-proxy-secret': proxySecret,
          'user-agent': request.headers.get('user-agent') || '',
        },
        body: proxyFormData,
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error en proxy home/tryon/generate:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}