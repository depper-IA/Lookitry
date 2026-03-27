'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetchPosts, adminDeletePost, BlogPost } from '@/services/blog.service';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await adminFetchPosts();
    setPosts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este artículo? Esta acción no se puede deshacer.')) return;
    const ok = await adminDeletePost(id);
    if (ok) {
      setPosts(prev => prev.filter(p => p.id !== id));
    } else {
      alert('Error al eliminar el artículo');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando artículos...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-jakarta font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Gestión de Blog
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Total de artículos: {posts.length}
          </p>
        </div>
        <button 
          disabled
          className="px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
          title="Próximamente"
        >
          Crear Artículo Manual
        </button>
      </div>

      <div className="rounded-[2.5rem] border overflow-hidden shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-base)' }}>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Artículo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Categoría</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Estado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right" style={{ color: 'var(--text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {posts.map((post) => (
                <tr key={post.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {post.featured_image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                          <img src={post.featured_image} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <Link href={`/admin/blog/${post.id}`} className="text-sm font-bold block hover:text-[#FF5C3A] transition-colors" style={{ color: 'var(--text-primary)' }}>
                          {post.title}
                        </Link>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                          /blog/{post.slug}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/5" style={{ color: 'var(--text-secondary)' }}>
                      {post.category?.name || 'IA & Moda'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      post.status === 'published' 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                    }`}>
                      {post.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {new Date(post.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Link 
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-all border border-white/5 hover:border-white/10"
                        title="Ver en el sitio"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                      <Link 
                        href={`/admin/blog/${post.id}`}
                        className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-[#FF5C3A] transition-all border border-white/5 hover:border-[#FF5C3A]/20"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-red-500 transition-all border border-white/5 hover:border-red-500/20"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3v5h5" />
                </svg>
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Sin artículos</h3>
              <p className="text-xs max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                El n8n aún no ha generado ningún artículo o no hay datos en la base de datos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
