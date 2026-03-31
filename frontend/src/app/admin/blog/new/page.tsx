'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminCreatePost, fetchBlogCategories, BlogPost, BlogCategory } from '@/services/blog.service';

const panelStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' };
const fieldStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };
const optionStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' };

export default function NewBlogPage() {
  const router = useRouter();
  const [post, setPost] = useState<Partial<BlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    meta_description: '',
    featured_image: '',
    status: 'draft',
    tags: [],
  });
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await fetchBlogCategories();
      setCategories(cats);
    } catch {
      console.error('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPost((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!post.title || !post.content) {
      setError('El título y el contenido son obligatorios');
      return;
    }

    setSaving(true);
    setError('');

    const newPost = await adminCreatePost(post);
    if (newPost) {
      router.push(`/admin/blog/${newPost.id}`);
      return;
    }

    setError('Error al crear el artículo');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
        <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          Cargando Editor
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link
            href="/admin/blog"
            className="w-12 h-12 flex items-center justify-center rounded-2xl border transition-all group hover:border-[#FF5C3A]/30 hover:bg-[#FF5C3A]/10"
            style={panelStyle}
          >
            <svg className="w-5 h-5 transition-colors group-hover:text-[#FF5C3A]" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="font-jakarta font-extrabold text-3xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Nuevo Artículo
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
              Crea contenido de alto valor de forma manual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => void handleCreate()}
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-white transition-all shadow-xl shadow-[#FF5C3A]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 min-w-[180px] flex items-center justify-center gap-3"
            style={{ backgroundColor: '#FF5C3A' }}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Crear Artículo
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="rounded-[3rem] border p-10 space-y-8 shadow-2xl relative overflow-hidden" style={panelStyle}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF5C3A] to-transparent opacity-30"></div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] ml-1" style={{ color: 'var(--text-muted)' }}>
                Título del artículo
              </label>
              <input
                type="text"
                name="title"
                value={post.title}
                onChange={handleChange}
                className="w-full px-6 py-4 rounded-[1.5rem] border text-xl font-bold transition-all placeholder:opacity-50 outline-none focus:ring-2 focus:ring-[#FF5C3A]/20 focus:border-[#FF5C3A]/40"
                style={fieldStyle}
                placeholder="Introduce el título..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] ml-1" style={{ color: 'var(--text-muted)' }}>
                Contenido HTML
              </label>
              <textarea
                name="content"
                value={post.content}
                onChange={handleChange}
                className="w-full h-[500px] px-8 py-8 rounded-[2rem] border text-[13px] font-mono overflow-y-auto transition-all leading-relaxed no-scrollbar outline-none focus:ring-2 focus:ring-[#FF5C3A]/20 focus:border-[#FF5C3A]/40"
                style={fieldStyle}
                placeholder="Pega el código HTML aquí..."
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="rounded-[2.5rem] border p-8 space-y-6 shadow-xl" style={panelStyle}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]"></div>
              Publicación
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
                  Visibilidad
                </label>
                <select
                  name="status"
                  value={post.status}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border text-xs font-bold appearance-none cursor-pointer transition-all outline-none focus:ring-2 focus:ring-[#FF5C3A]/20 focus:border-[#FF5C3A]/40"
                  style={{ ...fieldStyle, color: post.status === 'published' ? '#10b981' : '#f59e0b' }}
                >
                  <option value="draft" style={optionStyle}>Borrador</option>
                  <option value="published" style={optionStyle}>Publicado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
                  Categoría
                </label>
                <select
                  name="category_id"
                  value={post.category_id || ''}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border text-xs font-bold appearance-none cursor-pointer transition-all outline-none focus:ring-2 focus:ring-[#FF5C3A]/20 focus:border-[#FF5C3A]/40"
                  style={fieldStyle}
                >
                  <option value="" style={optionStyle}>Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} style={optionStyle}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border p-8 space-y-6 shadow-xl" style={panelStyle}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]"></div>
              Imagen Principal
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                name="featured_image"
                value={post.featured_image || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border text-[10px] font-medium transition-all outline-none focus:ring-2 focus:ring-[#FF5C3A]/20 focus:border-[#FF5C3A]/40"
                style={fieldStyle}
                placeholder="URL de la imagen (MinIO o externa)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
