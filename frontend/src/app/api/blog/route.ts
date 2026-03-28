import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const categoryId = request.nextUrl.searchParams.get('category_id');
    const url =
      `${SUPABASE_URL}/rest/v1/blogs` +
      `?select=*,category:blog_categories(*)` +
      `&status=eq.published` +
      `&order=published_at.desc.nullslast,created_at.desc` +
      (categoryId ? `&category_id=eq.${encodeURIComponent(categoryId)}` : '');

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) throw new Error(`Supabase ${response.status}`);

    const data = await response.json();
    return NextResponse.json({ ok: true, data: Array.isArray(data) ? data : [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
