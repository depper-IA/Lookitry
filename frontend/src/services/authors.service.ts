export interface BlogAuthor {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string> | null;
  expertise: string[] | null;
  credentials: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthorArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  meta_description: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  tags: string[] | null;
  category: { name: string; slug: string } | null;
}

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

async function frontendFetch<T>(path: string): Promise<T> {
  const url = `${FRONTEND_URL}/api${path}`;
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Frontend API ${response.status}`);
  }
  return response.json();
}

export async function fetchAuthorBySlug(slug: string): Promise<{ author: BlogAuthor; articles: AuthorArticle[] } | null> {
  try {
    const result = await frontendFetch<{ ok: boolean; data: { author: BlogAuthor; articles: AuthorArticle[] }; error?: string }>(
      `/autores/${encodeURIComponent(slug)}`
    );
    if (!result.ok || !result.data) return null;
    return result.data;
  } catch (error) {
    console.error('Error fetching author by slug:', error);
    return null;
  }
}