import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('cf-connecting-ip')
      || '';
    const response = await fetch(`${apiUrl}/api/home/tryon/check`, {
      headers: {
        'x-forwarded-for': clientIP,
        'user-agent': request.headers.get('user-agent') || '',
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error en proxy home/tryon/check:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}