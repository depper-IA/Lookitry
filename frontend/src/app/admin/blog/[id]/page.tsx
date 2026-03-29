'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminFetchPostById, adminUpdatePost, fetchBlogCategories, BlogPost, BlogCategory } from '@/services/blog.service';
import Link from 'next/link';

export default function BlogEditorPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [post, setPost] = useState<Partial<BlogPost> | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (id) {
       loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postData, cats] = await Promise.all([
        adminFetchPostById(id),
        fetchBlogCategories()
      ]);
      
      if (postData) {
        setPost(postData);
      } else {
        setError('No se encontró el artículo');
      }
      setCategories(cats);
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPost(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !id) return;
    
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload = { ...post };
      // Normalizar category_id: si es string vacío, enviamos null para que Supabase lo acepte
      if (!payload.category_id || payload.category_id === '') {
        payload.category_id = null as any;
      }

      const ok = await adminUpdatePost(id, payload);
      if (ok) {
        setSuccess(true);
        // Recargar datos para confirmar que la categoría se guardó
        await loadData();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Error al guardar los cambios en el servidor');
      }
    } catch (err) {
      setError('Excepción al intentar guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
      <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Iniciando Editor</div>
    </div>
  );

  if (error && !post) return (
    <div className="text-center py-20 px-6">
      <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-4 mx-auto border border-red-500/20">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{error}</p>
      <Link href="/admin/blog" className="text-[11px] font-black uppercase tracking-widest text-[#FF5C3A] hover:underline">Volver al listado</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      {/* Header Fijo/Sticky */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link href="/admin/blog" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group">
            <svg className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="font-jakarta font-extrabold text-3xl tracking-tight text-white">
              Editar Artículo
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{post?.title?.substring(0, 50)}...</p>
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
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-white transition-all shadow-xl shadow-[#FF5C3A]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 min-w-[180px] flex items-center justify-center gap-3"
            style={{ backgroundColor: '#FF5C3A' }}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Principal (8/12) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex gap-2 p-1.5 rounded-[1.5rem] bg-white/5 border border-white/5 w-fit">
            <button 
              onClick={() => setActiveTab('edit')}
              className={`px-6 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20' : 'text-zinc-500 hover:text-white'}`}
            >
              Editor HTML
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20' : 'text-zinc-500 hover:text-white'}`}
            >
              Vista Previa
            </button>
          </div>

          {activeTab === 'edit' ? (
            <div className="rounded-[3rem] border border-white/5 p-10 space-y-8 shadow-2xl relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF5C3A] to-transparent opacity-30"></div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1">Título del Artículo</label>
                <input 
                  type="text" 
                  name="title"
                  value={post?.title || ''} 
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-[1.5rem] bg-white/[0.03] border border-white/10 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/30 focus:border-[#FF5C3A]/50 transition-all placeholder:text-zinc-700"
                  placeholder="Introduzca el título..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1">Slug Personalizado</label>
                <div className="flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-white/[0.03] border border-white/10 focus-within:border-[#FF5C3A]/30 transition-all">
                  <span className="text-xs text-zinc-600 font-bold select-none opacity-50">lookitry.com/blog/</span>
                  <input 
                    type="text" 
                    name="slug"
                    value={post?.slug || ''} 
                    onChange={handleChange}
                    className="flex-1 bg-transparent border-none text-xs font-bold text-zinc-300 focus:outline-none focus:ring-0 p-0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Contenido HTML</label>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-400">Editor Manual</span>
                  </div>
                </div>
                <textarea 
                  name="content"
                  value={post?.content || ''} 
                  onChange={handleChange}
                  className="w-full h-[700px] px-8 py-8 rounded-[2rem] bg-white/[0.02] border border-white/5 text-[13px] font-mono text-zinc-400 overflow-y-auto focus:outline-none focus:ring-1 focus:ring-[#FF5C3A]/20 transition-all leading-relaxed no-scrollbar"
                  placeholder="Pega el código HTML del artículo generado..."
                />
              </div>
            </div>
          ) : (
            <div className="rounded-[3rem] border border-white/5 p-10 shadow-2xl overflow-hidden min-h-[800px]" style={{ backgroundColor: 'white' }}>
              <article className="prose prose-zinc prose-invert max-w-none text-black">
                <h1 className="text-4xl font-extrabold mb-8 text-black">{post?.title}</h1>
                <div 
                  className="blog-content text-zinc-800"
                  dangerouslySetInnerHTML={{ __html: post?.content || '<p class="text-zinc-400">Sin contenido para previsualizar</p>' }}
                />
              </article>
            </div>
          )}
        </div>

        {/* Columna Lateral (4/12) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Publicación */}
          <div className="rounded-[2.5rem] border border-white/5 p-8 space-y-6 shadow-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]"></div>
              Publicación
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Visibilidad</label>
                <select 
                  name="status"
                  value={post?.status || 'draft'} 
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#FF5C3A]/50 appearance-none cursor-pointer group-hover:bg-white/[0.05] transition-all"
                  style={{ color: post?.status === 'published' ? '#10b981' : '#f59e0b' }}
                >
                  <option value="draft" className="bg-[#0a0a0a]">Borrador</option>
                  <option value="published" className="bg-[#0a0a0a]">Publicado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Categoría</label>
                <select 
                  name="category_id"
                  value={post?.category_id || ''} 
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#FF5C3A]/50 appearance-none cursor-pointer transition-all"
                >
                  <option value="" className="bg-[#0a0a0a]">Sin Categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#0a0a0a]">{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Multimedia */}
          <div className="rounded-[2.5rem] border border-white/5 p-8 space-y-6 shadow-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]"></div>
              Multimedia
            </h3>
            
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 group">
                {post?.featured_image ? (
                  <img src={post.featured_image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">URL de Imagen</label>
                <input 
                  type="text" 
                  name="featured_image"
                  value={post?.featured_image || ''} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-medium text-zinc-400 focus:outline-none focus:border-[#FF5C3A]/50 transition-all"
                  placeholder="https://minio..."
                />
              </div>
            </div>
          </div>

          {/* SEO Pro */}
          <div className="rounded-[2.5rem] border border-white/5 p-8 space-y-6 shadow-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]"></div>
              Optimización SEO
            </h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Meta Descripción</label>
                <textarea 
                  name="meta_description"
                  value={post?.meta_description || ''} 
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5C3A]/20 transition-all leading-relaxed resize-none no-scrollbar"
                  placeholder="Descripción para resultados de búsqueda..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Extracto / Hook</label>
                <textarea 
                  name="excerpt"
                  value={post?.excerpt || ''} 
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5C3A]/20 transition-all leading-relaxed resize-none no-scrollbar"
                  placeholder="Resumen corto para el listado..."
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
