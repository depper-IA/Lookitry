import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_categories?select=*&order=name.asc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) throw new Error(`Supabase ${response.status}`);

    const data = await response.json();
    return NextResponse.json({ ok: true, data: Array.isArray(data) ? data : [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
