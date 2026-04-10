import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName } = body;

    if (!brandName || typeof brandName !== 'string') {
      return NextResponse.json(
        { error: 'brandName es requerido' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    const response = await fetch(`${apiUrl}/api/brands/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName: brandName.trim() }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error en proxy check-availability:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
