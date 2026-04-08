import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const categoryId = request.nextUrl.searchParams.get('category_id');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '5', 10);
    const offset = (page - 1) * limit;

    const url =
      `${SUPABASE_URL}/rest/v1/blogs` +
      `?select=*,category:blog_categories(*)` +
      `&status=eq.published` +
      `&order=published_at.desc.nullslast,created_at.desc` +
      `&limit=${limit}` +
      `&offset=${offset}` +
      (categoryId ? `&category_id=eq.${encodeURIComponent(categoryId)}` : '');

    // Get total count for pagination
    const countUrl =
      `${SUPABASE_URL}/rest/v1/blogs` +
      `?select=id` +
      `&status=eq.published` +
      (categoryId ? `&category_id=eq.${encodeURIComponent(categoryId)}` : '');

    const [response, countResponse] = await Promise.all([
      fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'count=exact',
        },
        next: { revalidate: 60 },
      }),
      fetch(countUrl, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'head',
        },
        next: { revalidate: 60 },
      }),
    ]);

    if (!response.ok) throw new Error(`Supabase ${response.status}`);

    const data = await response.json();
    const total = parseInt(countResponse.headers.get('content-range')?.split('/').pop() || '0', 10);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      ok: true,
      data: Array.isArray(data) ? data : [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
