import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Use API_URL for consistency - this routes to the backend in production
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password, brandName, contactName, slug, plan, months, turnstileToken } = body;

    // Validate required fields
    if (!email || !password || !brandName || !contactName || !slug) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        brandName,
        contactName,
        slug,
        plan,
        months,
        turnstileToken,
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout for registration
      credentials: 'include',
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // Return the response from backend - includes token and brand data
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error('Register proxy error:', error?.message || error);
    if (error?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Timeout al crear la cuenta' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }
}
