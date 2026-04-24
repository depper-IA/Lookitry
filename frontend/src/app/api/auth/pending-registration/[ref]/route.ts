import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const ref = params.ref;

    if (!ref) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/pending-registration/${encodeURIComponent(ref)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: AbortSignal.timeout(10000),
    });

    const data = await backendRes.json();

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error('Pending registration proxy error:', error?.message || error);
    return NextResponse.json({ error: 'Error fetching pending registration' }, { status: 500 });
  }
}