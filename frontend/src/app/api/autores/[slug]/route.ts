import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch author by slug
    const authorUrl =
      `${SUPABASE_URL}/rest/v1/authors` +
      `?select=*` +
      `&slug=eq.${encodeURIComponent(slug)}` +
      `&is_active=eq.true` +
      `&limit=1`;

    const authorRes = await fetch(authorUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 300 },
    });

    if (!authorRes.ok) {
      throw new Error(`Supabase author ${authorRes.status}`);
    }

    const authorData = await authorRes.json();
    const author = Array.isArray(authorData) && authorData.length > 0 ? authorData[0] : null;

    if (!author) {
      return NextResponse.json({ ok: false, error: 'Autor no encontrado' }, { status: 404 });
    }

    // Fetch author's published articles
    const articlesUrl =
      `${SUPABASE_URL}/rest/v1/blogs` +
      `?select=id,slug,title,excerpt,meta_description,featured_image,published_at,created_at,tags,category:blog_categories(name,slug)` +
      `&author_id=eq.${author.id}` +
      `&status=eq.published` +
      `&order=published_at.desc` +
      `&limit=50`;

    const articlesRes = await fetch(articlesUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 300 },
    });

    if (!articlesRes.ok) {
      throw new Error(`Supabase articles ${articlesRes.status}`);
    }

    const articles = await articlesRes.json();

    return NextResponse.json({
      ok: true,
      data: { author, articles: Array.isArray(articles) ? articles : [] }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}