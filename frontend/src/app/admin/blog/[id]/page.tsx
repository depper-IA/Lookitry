'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  adminFetchPostById,
  adminUpdatePost,
  fetchBlogCategories,
  BlogPost,
  BlogCategory,
} from '@/services/blog.service';
import { motion } from 'framer-motion';

const panelStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' };
const fieldStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };
const optionStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' };

export default function BlogEditorPage() {
  const params = useParams();
  const id = params?.id as string;
  const [post, setPost] = useState<Partial<BlogPost> | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [postData, cats] = await Promise.all([
        adminFetchPostById(id),
        fetchBlogCategories(),
      ]);

      if (postData) {
        setPost(postData);
      } else {
        setError('No se encontró el artículo');
      }
      setCategories(cats);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void loadData();
    }
  }, [id, loadData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPost((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSave = async () => {
    if (!post || !id) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload = { ...post };
      if (!payload.category_id || payload.category_id === '') {
        payload.category_id = null as never;
      }

      const ok = await adminUpdatePost(id, payload);
      if (ok) {
        setSuccess(true);
        await loadData();
        window.setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Error al guardar los cambios en el servidor');
      }
    } catch {
      setError('Excepción al intentar guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          Iniciando Editor
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="text-center py-20 px-6">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-4 mx-auto border border-red-500/20">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{error}</p>
        <Link href="/admin/blog" className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-6xl mx-auto space-y-8 pb-32"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link
            href="/admin/blog"
            className="w-12 h-12 flex items-center justify-center rounded-2xl border transition-all group hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/10"
            style={panelStyle}
          >
            <svg className="w-5 h-5 transition-colors group-hover:text-[var(--accent)]" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="font-jakarta font-extrabold text-3xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Editar Artículo
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
              {post?.title?.substring(0, 50) || 'Sin título'}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {success && (
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Guardado exitoso</span>
            </div>
          )}
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-white transition-all shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 min-w-[180px] flex items-center justify-center gap-3"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {error && post && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex gap-2 p-1.5 rounded-[1.5rem] border w-fit" style={panelStyle}>
            {[
              { id: 'edit', label: 'Editor HTML' },
              { id: 'preview', label: 'Vista Previa' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'edit' | 'preview')}
                  className={`px-6 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'
                      : 'hover:text-[var(--accent)] hover:bg-[var(--accent)]/8'
                  }`}
                  style={isActive ? undefined : { color: 'var(--text-secondary)' }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'edit' ? (
            <div className="rounded-[3rem] border p-10 space-y-8 shadow-2xl relative overflow-hidden" style={panelStyle}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-30"></div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] ml-1" style={{ color: 'var(--text-muted)' }}>
                  Título del Artículo
                </label>
                <input
                  type="text"
                  name="title"
                  value={post?.title || ''}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-[1.5rem] border text-xl font-bold transition-all placeholder:opacity-50 outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
                  style={fieldStyle}
                  placeholder="Introduzca el título..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] ml-1" style={{ color: 'var(--text-muted)' }}>
                  Slug Personalizado
                </label>
                <div className="flex items-center gap-3 px-6 py-4 rounded-[1.5rem] border transition-all focus-within:ring-2 focus-within:ring-[var(--accent)]/20 focus-within:border-[var(--accent)]/40" style={fieldStyle}>
                  <span className="text-xs font-bold select-none opacity-60" style={{ color: 'var(--text-secondary)' }}>
                    lookitry.com/blog/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={post?.slug || ''}
                    onChange={handleChange}
                    className="flex-1 bg-transparent border-none text-xs font-bold focus:outline-none focus:ring-0 p-0"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1 gap-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
                    Contenido HTML
                  </label>
                  <span className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border" style={{ ...fieldStyle, color: 'var(--text-secondary)' }}>
                    Editor Manual
                  </span>
                </div>
                <textarea
                  name="content"
                  value={post?.content || ''}
                  onChange={handleChange}
                  className="w-full h-[700px] px-8 py-8 rounded-[2rem] border text-[13px] font-mono overflow-y-auto transition-all leading-relaxed no-scrollbar outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
                  style={fieldStyle}
                  placeholder="Pega el código HTML del artículo generado..."
                />
              </div>
            </div>
          ) : (
            <div className="rounded-[3rem] border p-6 sm:p-8 shadow-2xl overflow-hidden min-h-[800px]" style={panelStyle}>
              <article
                className="prose prose-zinc max-w-none rounded-[2rem] border p-6 sm:p-8 shadow-inner"
                style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <h1 className="text-4xl font-extrabold mb-8" style={{ color: 'var(--text-primary)' }}>
                  {post?.title}
                </h1>
                <div
                  className="blog-content"
                  style={{ color: 'var(--text-primary)' }}
                  dangerouslySetInnerHTML={{ __html: post?.content || '<p>Sin contenido para previsualizar</p>' }}
                />
              </article>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="rounded-[2.5rem] border p-8 space-y-6 shadow-xl" style={panelStyle}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></div>
              Publicación
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
                  Visibilidad
                </label>
                <select
                  name="status"
                  value={post?.status || 'draft'}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border text-xs font-bold appearance-none cursor-pointer transition-all outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
                  style={{ ...fieldStyle, color: post?.status === 'published' ? '#10b981' : '#f59e0b' }}
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
                  value={post?.category_id || ''}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border text-xs font-bold appearance-none cursor-pointer transition-all outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
                  style={fieldStyle}
                >
                  <option value="" style={optionStyle}>Sin Categoría</option>
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
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></div>
              Multimedia
            </h3>

            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden border group" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                {post?.featured_image ? (
                  <img src={post.featured_image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
                  URL de Imagen
                </label>
                <input
                  type="text"
                  name="featured_image"
                  value={post?.featured_image || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-[10px] font-medium transition-all outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
                  style={fieldStyle}
                  placeholder="https://minio..."
                />
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border p-8 space-y-6 shadow-xl" style={panelStyle}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></div>
              Optimización SEO
            </h3>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
                  Meta Descripción
                </label>
                <textarea
                  name="meta_description"
                  value={post?.meta_description || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl border text-xs transition-all leading-relaxed resize-none no-scrollbar outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
                  style={fieldStyle}
                  placeholder="Descripción para resultados de búsqueda..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
                  Extracto / Hook
                </label>
                <textarea
                  name="excerpt"
                  value={post?.excerpt || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-5 py-4 rounded-2xl border text-xs transition-all leading-relaxed resize-none no-scrollbar outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
                  style={fieldStyle}
                  placeholder="Resumen corto para el listado..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
