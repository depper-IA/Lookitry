import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
  let supabase: ReturnType<typeof createClient> | null = null;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  const staticRoutes = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1.0, lastmod: new Date().toISOString().split('T')[0] },
    { url: `${BASE_URL}/planes`, changeFrequency: 'weekly', priority: 0.9, lastmod: new Date().toISOString().split('T')[0] },
    { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.9, lastmod: new Date().toISOString().split('T')[0] },
    { url: `${BASE_URL}/casos-de-exito`, changeFrequency: 'monthly', priority: 0.8, lastmod: new Date().toISOString().split('T')[0] },
    { url: `${BASE_URL}/contacto`, changeFrequency: 'monthly', priority: 0.8, lastmod: new Date().toISOString().split('T')[0] },
    { url: `${BASE_URL}/ayuda`, changeFrequency: 'monthly', priority: 0.7, lastmod: new Date().toISOString().split('T')[0] },
    { url: `${BASE_URL}/terminos`, changeFrequency: 'yearly', priority: 0.5, lastmod: new Date().toISOString().split('T')[0] },
    { url: `${BASE_URL}/privacidad`, changeFrequency: 'yearly', priority: 0.5, lastmod: new Date().toISOString().split('T')[0] },
  ];

  let dynamicRoutes: { url: string; changeFrequency: string; priority: number; lastmod?: string }[] = [];

  if (supabase) {
    try {
      const { data: posts } = await supabase
        .from('blogs')
        .select('slug, updated_at, published_at')
        .eq('status', 'published');

      if (posts) {
        dynamicRoutes.push(...posts.map((post: any) => ({
          url: `${BASE_URL}/blog/${post.slug}`,
          changeFrequency: 'monthly',
          priority: 0.7,
          lastmod: (post.published_at || post.updated_at)?.split('T')[0],
        })));
      }

      const { data: brands } = await supabase
        .from('brands')
        .select('slug, updated_at')
        .eq('has_landing_page', true);

      if (brands) {
        dynamicRoutes.push(...brands.map((brand: any) => ({
          url: `${BASE_URL}/sitio/${brand.slug}`,
          changeFrequency: 'weekly',
          priority: 0.8,
          lastmod: brand.updated_at?.split('T')[0],
        })));
      }
    } catch (err) {
      console.error('Error fetching dynamic routes for sitemap:', err);
    }
  }

  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => `
  <url>
    <loc>${route.url}</loc>
    ${route.lastmod ? `<lastmod>${route.lastmod}</lastmod>` : ''}
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}