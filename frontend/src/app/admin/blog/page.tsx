'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  adminDeletePost,
  adminFetchPosts,
  BlogPost,
  BlogSettings,
  fetchBlogSettings,
  triggerBlogPulse,
  updateBlogSettings,
} from '@/services/blog.service';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggerMessage, setTriggerMessage] = useState('');
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPosts();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await fetchBlogSettings();
    setSettings(data);
  };

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
      setPosts((prev) => prev.filter((post) => post.id !== id));
    } else {
      setError('Error al eliminar el artículo');
    }
  };

  const handleUpdateFrequency = async (freq: 'daily' | 'weekly' | 'monthly') => {
    if (!settings) return;
    setIsSaving(true);
    setError('');
    const ok = await updateBlogSettings({ frequency: freq });
    if (ok) {
      await loadSettings();
    } else {
      setError('No se pudo actualizar la frecuencia del flujo editorial.');
    }
    setIsSaving(false);
  };

  const handleToggleEnabled = async () => {
    if (!settings) return;
    setIsSaving(true);
    setError('');
    const ok = await updateBlogSettings({ is_enabled: !settings.is_enabled });
    if (ok) {
      await loadSettings();
    } else {
      setError('No se pudo actualizar el estado de la automatización.');
    }
    setIsSaving(false);
  };

  const handleTriggerNow = async () => {
    if (!confirm('¿Deseas disparar la generación de un artículo ahora mismo? Este proceso toma unos minutos en n8n.')) return;
    setIsTriggering(true);
    setError('');
    setTriggerMessage('');

    const result = await triggerBlogPulse();

    if (result.success) {
      const details = [result.message];
      if (result.attempt) details.push(`método: ${result.attempt}`);
      if (typeof result.status === 'number') details.push(`HTTP ${result.status}`);
      setTriggerMessage(details.join(' | '));
    } else {
      setError(result.message);
    }

    setIsTriggering(false);
    await loadSettings();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4"
          style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }}
        />
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Cargando artículos...
        </div>
      </div>
    );
  }

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
        <Link
          href="/admin/blog/new"
          className="px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20 hover:scale-105 active:scale-95 transition-all outline-none border-none decoration-transparent"
        >
          Crear Artículo Manual
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
          {error}
        </div>
      )}

      {triggerMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          {triggerMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 rounded-[2rem] border p-6 flex flex-col sm:flex-row items-center gap-6 shadow-lg transition-all hover:shadow-xl"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="w-16 h-16 rounded-3xl bg-[#FF5C3A]/10 flex items-center justify-center flex-shrink-0 animate-pulse">
            <svg className="w-8 h-8 text-[#FF5C3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-jakarta font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
              Pulso Editorial IA
            </h2>
            <p className="text-xs leading-relaxed max-w-md" style={{ color: 'var(--text-secondary)' }}>
              Configura el ritmo automático de publicación de <span className="font-bold text-[#FF5C3A]">Lookitry Editorial</span>.
              La IA generará temas, imágenes y artículos optimizados para SEO y ventas.
            </p>
            {settings && (
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Frecuencia:</span>
                  <select
                    value={settings.frequency}
                    onChange={(e) => handleUpdateFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    disabled={isSaving}
                    className="bg-transparent text-[11px] font-bold text-[#FF5C3A] outline-none cursor-pointer focus:ring-0 border-none p-0"
                  >
                    <option value="daily">Diaria</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Próximo:</span>
                  <span className="text-[11px] font-bold text-white">
                    {new Date(settings.next_run).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Auth:</span>
                  <span className="text-[11px] font-bold text-white">{settings.webhook_auth_mode || 'none'}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Secreto:</span>
                  <span className="text-[11px] font-bold text-white">
                    {settings.has_webhook_secret ? 'configurado' : 'ausente'}
                  </span>
                </div>
              </div>
            )}
            {settings?.last_error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-left">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Último error</div>
                <div className="mt-2 text-xs text-red-200">{settings.last_error}</div>
                {settings.last_error_at && (
                  <div className="mt-2 text-[10px] text-red-300/80">
                    {new Date(settings.last_error_at).toLocaleString('es-ES')}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={handleTriggerNow}
              disabled={isTriggering || !settings?.is_enabled}
              className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isTriggering ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:scale-105 active:scale-95 shadow-lg'
              }`}
            >
              {isTriggering ? 'Generando...' : 'Disparar Ahora'}
            </button>
            <button
              onClick={handleToggleEnabled}
              disabled={isSaving}
              className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl border ${
                settings?.is_enabled
                  ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                  : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5 hover:bg-zinc-500/10'
              }`}
            >
              {settings?.is_enabled ? '● Automatización Activa' : '○ Automatización Pausada'}
            </button>
          </div>
        </div>

        <div
          className="rounded-[2rem] border p-6 flex flex-col justify-between shadow-lg"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-muted)' }}>
              Métricas IA
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Artículos automáticos</span>
                <span className="font-bold text-white">{posts.filter((post) => !post.content.includes('manual')).length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Total Generaciones</span>
                <span className="font-bold text-[#FF5C3A]">{posts.length}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-[10px] italic leading-tight" style={{ color: 'var(--text-muted)' }}>
            * El contenido generado por IA sigue las reglas de Lookitry Editorial para optimización SEO.
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border overflow-hidden shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-base)' }}>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
                  Artículo
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
                  Categoría
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
                  Estado
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
                  Fecha
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right" style={{ color: 'var(--text-secondary)' }}>
                  Acciones
                </th>
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
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="text-sm font-bold block hover:text-[#FF5C3A] transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
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
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        post.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                      }`}
                    >
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3v5h5" />
                </svg>
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Sin artículos
              </h3>
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
