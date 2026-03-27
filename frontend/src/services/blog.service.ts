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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const fetchOptions = {
  headers: {
    apikey: anonKey || '',
    Authorization: `Bearer ${anonKey || ''}`,
  },
};

export async function fetchBlogCategories(): Promise<BlogCategory[]> {
  if (!supabaseUrl || !anonKey) return [];

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/blog_categories?select=*&order=name.asc`, fetchOptions);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return [];
  }
}

export async function fetchBlogPosts(categoryId?: string): Promise<BlogPost[]> {
  if (!supabaseUrl || !anonKey) return [];

  try {
    let url = `${supabaseUrl}/rest/v1/blogs?select=*,category:blog_categories(*)&status=eq.published&order=published_at.desc.nullslast,created_at.desc`;
    
    if (categoryId) {
      url += `&category_id=eq.${categoryId}`;
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) return [];
    return await response.json();
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
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
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
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  try {
    const response = await fetch(`${apiBase}/api/blog/admin/${id}`, { credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    // La API puede retornar el post directo o envuelto en {post: ...}
    return data.post || data || null;
  } catch (error) {
    console.error('Error admin fetching post by id:', error);
    return null;
  }
}

export async function adminUpdatePost(id: string, postData: Partial<BlogPost>): Promise<boolean> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  try {
    const response = await fetch(`${apiBase}/api/blog/admin/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error('Error admin updating post:', error);
    return false;
  }
}

export async function adminDeletePost(id: string): Promise<boolean> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  try {
    const response = await fetch(`${apiBase}/api/blog/admin/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error('Error admin deleting post:', error);
    return false;
  }
}
