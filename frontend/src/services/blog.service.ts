'use client';

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
  category?: BlogCategory;
}

export interface BlogSettings {
  id: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  is_enabled: boolean;
  next_run: string;
  last_run: string | null;
  webhook_url: string;
  updated_at: string;
  has_webhook_secret?: boolean;
  webhook_auth_mode?: 'none' | 'header' | 'basic' | 'bearer';
  last_error?: string | null;
  last_error_at?: string | null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

const fetchOptions = {
  headers: {
    apikey: anonKey || '',
    Authorization: `Bearer ${anonKey || ''}`,
  },
};

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
  if (!supabaseUrl || !anonKey) return null;

  try {
    const url = `${supabaseUrl}/rest/v1/blogs?select=*,category:blog_categories(*)&slug=eq.${slug}&status=eq.published&limit=1`;
    const response = await fetch(url, fetchOptions);

    if (!response.ok) return null;

    const posts = await response.json();
    return posts.length > 0 ? posts[0] : null;
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
    const response = await fetch(`${apiBase}/api/blog/settings/trigger`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message || (response.ok ? 'Éxito' : 'Error'),
      attempt: data.attempt,
      status: data.status,
    };
  } catch (error: any) {
    console.error('Error triggering blog pulse:', error);
    return { success: false, message: error.message };
  }
}
