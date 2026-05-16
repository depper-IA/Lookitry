import { api } from './api';
import { adminApi } from './adminApi';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  meta_description: string;
  featured_image: string;
  category_id: string;
  tags: string[];
  status: 'draft' | 'published';
  published_at: string;
  created_at: string;
  updated_at?: string;
  topic_id?: string;
  category?: BlogCategory;
  toc_items?: Array<{ title: string; id: string }>;
  reading_time?: string;
}

export interface BlogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  pagination: BlogPagination;
}

export interface BlogSettings {
  id: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  is_enabled: boolean;
  next_run: string;
  last_run: string | null;
  webhook_url: string;
  image_generation_provider?: 'vertex';
  updated_at: string;
  has_webhook_secret?: boolean;
  webhook_auth_mode?: 'none' | 'header' | 'basic' | 'bearer';
  last_error?: string | null;
  last_error_at?: string | null;
  execution_status?: 'idle' | 'running' | 'success' | 'error';
  execution_title?: string | null;
  execution_message?: string | null;
  execution_updated_at?: string | null;
}

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

export function extractFirstImageFromContent(content?: string | null): string | null {
  if (!content) return null;
  const match = content.match(/<img[^>]+src=["']([^"' >]+)["']/i);
  return match?.[1] || null;
}

export function getBlogFeaturedImage(
  post?: {
    featured_image?: string | null;
    content?: string | null;
  } | null,
): string | null {
  if (!post) return null;
  // IMPORTANTE: Solo devolver featured_image explícito para evitar duplicación con imágenes del HTML
  // El hero se maneja 100% desde featured_image; el contenido HTML tiene sus propias imágenes body
  return post.featured_image || null;
}

export function getBlogShareImage(
  post?: {
    featured_image?: string | null;
    content?: string | null;
  } | null,
): string | null {
  const image = getBlogFeaturedImage(post);
  if (!image) return null;

  return `${appBaseUrl}/api/blog/social-image?src=${encodeURIComponent(image)}`;
}

export function getBlogTeaser(
  post?: {
    excerpt?: string | null;
    meta_description?: string | null;
  } | null,
  fallback = 'Descubre una idea práctica para vender mejor con LOOKITRY, reducir fricción y darle más claridad a tu ecommerce de moda.'
): string {
  const raw = String(post?.excerpt || post?.meta_description || '').replace(/\s+/g, ' ').trim();
  if (!raw) return fallback;

  const normalized = raw.replace(/\.\.\.+$/g, '').trim();
  const hasStrongLead = /^(descubre|aprende|conoce|impulsa|convierte|evita|mejora|por que|como)/i.test(normalized);
  const teaser = hasStrongLead ? normalized : `Descubre ${normalized.charAt(0).toLowerCase()}${normalized.slice(1)}`;

  if (teaser.length <= 165) return teaser;
  return `${teaser.slice(0, 162).trim()}...`;
}

// URL base para el frontend (Next.js API routes)
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

async function frontendFetch<T>(path: string): Promise<T> {
  const url = `${FRONTEND_URL}/api${path}`;
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store', // Prevent Next.js from aggressively caching the API response
  });
  if (!response.ok) {
    throw new Error(`Frontend API ${response.status}`);
  }
  return response.json();
}

export async function fetchBlogCategories(): Promise<BlogCategory[]> {
  try {
    const result = await frontendFetch<{ ok: boolean; data: BlogCategory[] }>('/blog/categories');
    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return [];
  }
}

export async function fetchBlogPosts(categoryId?: string, page = 1, limit = 5): Promise<{ posts: BlogPost[]; pagination: BlogPagination }> {
  try {
    let path = `/blog?page=${page}&limit=${limit}`;
    if (categoryId) path += `&category_id=${encodeURIComponent(categoryId)}`;
    const result = await frontendFetch<{ ok: boolean; data: BlogPost[]; pagination: BlogPagination }>(path);
    return {
      posts: Array.isArray(result.data) ? result.data : [],
      pagination: result.pagination,
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { posts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
  }
}

export async function fetchRecentBlogPosts(limit = 3, excludeSlug?: string): Promise<BlogPost[]> {
  const result = await fetchBlogPosts(undefined, 1, limit * 3); // Fetch more to filter
  return result.posts
    .filter((post) => post.status === 'published' && (!excludeSlug || post.slug !== excludeSlug))
    .sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    })
    .slice(0, limit);
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const result = await frontendFetch<{ ok: boolean; data: BlogPost }>(`/blog/${encodeURIComponent(slug)}`);
    return result.data ?? null;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return null;
  }
}

export async function adminFetchPosts(): Promise<BlogPost[]> {
  try {
    const data = await adminApi.get('/blog/admin');
    return Array.isArray(data) ? data : (data.posts || []);
  } catch (error) {
    console.error('Error admin fetching posts:', error);
    return [];
  }
}

export async function adminFetchPostById(id: string): Promise<BlogPost | null> {
  try {
    const data = await adminApi.get(`/blog/admin/${id}`);
    return data.post || data || null;
  } catch (error) {
    console.error('Error admin fetching post by id:', error);
    return null;
  }
}

export async function adminUpdatePost(id: string, postData: Partial<BlogPost>): Promise<boolean> {
  try {
    await adminApi.put(`/blog/admin/${id}`, postData);
    return true;
  } catch (error) {
    console.error('Error admin updating post:', error);
    return false;
  }
}

export async function adminDeletePost(id: string): Promise<boolean> {
  try {
    await adminApi.delete(`/blog/admin/${id}`);
    return true;
  } catch (error) {
    console.error('Error admin deleting post:', error);
    return false;
  }
}

export async function adminCreatePost(postData: Partial<BlogPost>): Promise<BlogPost | null> {
  try {
    const data = await adminApi.post('/blog/admin', postData);
    return data.post || null;
  } catch (error) {
    console.error('Error admin creating post:', error);
    return null;
  }
}

export async function fetchBlogSettings(): Promise<BlogSettings | null> {
  try {
    return await adminApi.get('/blog/settings');
  } catch (error) {
    console.error('Error fetching blog settings:', error);
    return null;
  }
}

export async function updateBlogSettings(settings: Partial<BlogSettings>): Promise<boolean> {
  try {
    await adminApi.put('/blog/settings', settings);
    return true;
  } catch (error) {
    console.error('Error updating blog settings:', error);
    return false;
  }
}

export async function triggerBlogPulse(): Promise<{
  success: boolean;
  message: string;
  attempt?: string;
  status?: number;
}> {
  try {
    const data = await adminApi.post('/blog/settings/trigger');
    return {
      success: true,
      message: data.message || 'Éxito',
      attempt: data.attempt,
      status: data.status,
    };
  } catch (error: any) {
    console.error('Error triggering blog pulse:', error);
    return { 
      success: false, 
      message: error.message || 'Error desconocido' 
    };
  }
}
