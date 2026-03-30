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
}

export interface BlogSettings {
  id: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  is_enabled: boolean;
  next_run: string;
  last_run: string | null;
  webhook_url: string;
  openrouter_article_model?: string;
  openrouter_image_model?: string;
  image_generation_provider?: 'replicate' | 'openrouter';
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

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
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
  return post.featured_image || extractFirstImageFromContent(post.content);
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

export async function fetchBlogCategories(): Promise<BlogCategory[]> {
  try {
    const response = await fetch('/api/blog/categories');
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return [];
  }
}

export async function fetchBlogPosts(categoryId?: string): Promise<BlogPost[]> {
  try {
    const url = categoryId ? `/api/blog?category_id=${encodeURIComponent(categoryId)}` : '/api/blog';
    const response = await fetch(url);
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const path = `/api/blog/${encodeURIComponent(slug)}`;
    const url = typeof window === 'undefined' ? `${appBaseUrl}${path}` : path;
    const response = await fetch(url, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.data ?? null;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return null;
  }
}

export async function adminFetchPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${apiBase}/api/blog/admin`, { credentials: 'include' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : (data.posts || []);
  } catch (error) {
    console.error('Error admin fetching posts:', error);
    return [];
  }
}

export async function adminFetchPostById(id: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${apiBase}/api/blog/admin/${id}`, { credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.post || data || null;
  } catch (error) {
    console.error('Error admin fetching post by id:', error);
    return null;
  }
}

export async function adminUpdatePost(id: string, postData: Partial<BlogPost>): Promise<boolean> {
  try {
    const response = await fetch(`${apiBase}/api/blog/admin/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.error('Error admin updating post:', error);
    return false;
  }
}

export async function adminDeletePost(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBase}/api/blog/admin/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.error('Error admin deleting post:', error);
    return false;
  }
}

export async function adminCreatePost(postData: Partial<BlogPost>): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${apiBase}/api/blog/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.post || null;
  } catch (error) {
    console.error('Error admin creating post:', error);
    return null;
  }
}

export async function fetchBlogSettings(): Promise<BlogSettings | null> {
  try {
    const response = await fetch(`${apiBase}/api/blog/settings`, { credentials: 'include' });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog settings:', error);
    return null;
  }
}

export async function updateBlogSettings(settings: Partial<BlogSettings>): Promise<boolean> {
  try {
    const response = await fetch(`${apiBase}/api/blog/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      credentials: 'include',
    });
    return response.ok;
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
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    const response = await fetch(`${apiBase}/api/blog/settings/trigger`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message || (response.ok ? 'Éxito' : 'Error'),
      attempt: data.attempt,
      status: data.status,
    };
  } catch (error: any) {
    console.error('Error triggering blog pulse:', error);
    if (error?.name === 'AbortError') {
      return {
        success: false,
        message: 'El disparo manual tardó demasiado en responder. Revisa si n8n quedó esperando una respuesta o si el webhook no respondió a tiempo.',
      };
    }
    return { success: false, message: error.message };
  }
}
