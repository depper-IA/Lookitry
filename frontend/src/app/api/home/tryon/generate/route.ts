import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, selfieBase64 } = body;

    if (!productId || !selfieBase64) {
      return NextResponse.json(
        { error: 'productId and selfieBase64 are required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    // Priority: cf-connecting-ip (Cloudflare real client IP) > x-forwarded-for > request.ip
    // This ensures the real client IP reaches the backend for whitelist checking
    const realClientIP = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || '';

    const response = await fetch(`${apiUrl}/api/home/tryon/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': realClientIP,
        'user-agent': request.headers.get('user-agent') || '',
      },
      body: JSON.stringify({ productId, selfieBase64 }),
    });

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