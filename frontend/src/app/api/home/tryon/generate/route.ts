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
    // Forward the real client IP from x-forwarded-for (set by Traefik) or use request.ip
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('cf-connecting-ip') 
      || request.ip 
      || '';

    const response = await fetch(`${apiUrl}/api/home/tryon/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': clientIP,
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