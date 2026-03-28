import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url =
      `${SUPABASE_URL}/rest/v1/blogs` +
      `?select=*,category:blog_categories(*)` +
      `&slug=eq.${encodeURIComponent(slug)}` +
      `&status=eq.published` +
      `&limit=1`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Supabase ${response.status}`);
    }

    const data = await response.json();
    const post = Array.isArray(data) && data.length > 0 ? data[0] : null;

    return NextResponse.json({ ok: true, data: post });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
