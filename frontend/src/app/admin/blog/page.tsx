'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  adminDeletePost,
  adminFetchPosts,
  BlogPost,
  BlogSettings,
  fetchBlogSettings,
  getBlogFeaturedImage,
  triggerBlogPulse,
  updateBlogSettings,
} from '@/services/blog.service';

const OPENROUTER_ARTICLE_MODELS = [
  { value: 'openrouter/free', label: 'OpenRouter Free' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
  { value: '__custom__', label: 'Otro' },
];

const BLOG_IMAGE_PROVIDERS = [
  { value: 'replicate', label: 'Replicate' },
  { value: 'openrouter', label: 'OpenRouter' },
];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggerMessage, setTriggerMessage] = useState('');
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isMonitoringRun, setIsMonitoringRun] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customArticleModel, setCustomArticleModel] = useState('');
  const [isCustomArticleModelSelected, setIsCustomArticleModelSelected] = useState(false);
  const [confirmState, setConfirmState] = useState<
    | null
    | {
        kind: 'trigger' | 'delete';
        title: string;
        message: string;
        confirmLabel: string;
        postId?: string;
      }
  >(null);

  useEffect(() => {
    loadPosts();
    loadSettings();
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const loadSettings = async () => {
    const data = await fetchBlogSettings();
    setSettings(data);
    if (data?.openrouter_article_model && !OPENROUTER_ARTICLE_MODELS.some((model) => model.value === data.openrouter_article_model)) {
      setCustomArticleModel(data.openrouter_article_model);
      setIsCustomArticleModelSelected(true);
    } else {
      setCustomArticleModel('');
      setIsCustomArticleModelSelected(false);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    const data = await adminFetchPosts();
    setPosts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
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

  const handleUpdateArticleModel = async (model: string) => {
    if (!settings) return;
    if (model === '__custom__') {
      setCustomArticleModel(settings.openrouter_article_model || '');
      setIsCustomArticleModelSelected(true);
      return;
    }
    setIsCustomArticleModelSelected(false);
    setIsSaving(true);
    setError('');
    const ok = await updateBlogSettings({ openrouter_article_model: model });
    if (ok) {
      await loadSettings();
    } else {
      setError('No se pudo actualizar el modelo editorial de OpenRouter.');
    }
    setIsSaving(false);
  };

  const handleSaveCustomArticleModel = async () => {
    if (!settings) return;
    const normalized = customArticleModel.trim();
    if (!normalized) {
      setError('Escribe un modelo válido de OpenRouter antes de guardar.');
      return;
    }
    setIsSaving(true);
    setError('');
    const ok = await updateBlogSettings({ openrouter_article_model: normalized });
    if (ok) {
      await loadSettings();
      setIsCustomArticleModelSelected(true);
    } else {
      setError('No se pudo actualizar el modelo editorial personalizado.');
    }
    setIsSaving(false);
  };

  const requestDelete = (id: string) => {
    setConfirmState({
      kind: 'delete',
      title: 'Eliminar artículo',
      message: 'Esta acción eliminará el artículo de forma permanente y no se puede deshacer.',
      confirmLabel: 'Eliminar',
      postId: id,
    });
  };

  const requestTriggerNow = () => {
    setConfirmState({
      kind: 'trigger',
      title: 'Disparar pulso editorial',
      message: 'Se generará un artículo nuevo con IA, imágenes y publicación automática. El proceso puede tardar algunos minutos.',
      confirmLabel: 'Generar ahora',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmState) return;

    if (confirmState.kind === 'trigger') {
      setConfirmState(null);
      await handleTriggerNow();
      return;
    }

    if (confirmState.kind === 'delete' && confirmState.postId) {
      const ok = await adminDeletePost(confirmState.postId);
      setConfirmState(null);
      if (ok) {
        setPosts((prev) => prev.filter((post) => post.id !== confirmState.postId));
      } else {
        setError('Error al eliminar el artículo');
      }
    }
  };

  const handleUpdateImageProvider = async (provider: 'replicate' | 'openrouter') => {
    if (!settings) return;
    setIsSaving(true);
    setError('');
    const ok = await updateBlogSettings({ image_generation_provider: provider });
    if (ok) {
      await loadSettings();
    } else {
      setError('No se pudo actualizar el proveedor de imágenes del blog.');
    }
    setIsSaving(false);
  };

  const monitorTriggeredRun = async (triggerStartedAt: Date, baselinePostIds: Set<string>) => {
    const startedAtMs = triggerStartedAt.getTime();

    for (let attempt = 0; attempt < 24; attempt += 1) {
      await sleep(5000);

      const [latestSettings, latestPosts] = await Promise.all([
        fetchBlogSettings(),
        adminFetchPosts(),
      ]);

      if (latestSettings) {
        setSettings(latestSettings);
      }
      setPosts(latestPosts);

      const latestExecutionAt = latestSettings?.execution_updated_at ? new Date(latestSettings.execution_updated_at).getTime() : null;
      if (latestSettings?.execution_status === 'error' && latestExecutionAt && latestExecutionAt >= startedAtMs) {
        setTriggerMessage('');
        setError(latestSettings.execution_message || 'n8n reportó un fallo en la ejecución del blog.');
        setIsMonitoringRun(false);
        return;
      }

      if (latestSettings?.execution_status === 'success' && latestExecutionAt && latestExecutionAt >= startedAtMs) {
        setTriggerMessage(latestSettings.execution_message || 'n8n terminó la ejecución correctamente.');
        setIsMonitoringRun(false);
        return;
      }

      const newPost = latestPosts.find((post) => {
        const createdAtMs = new Date(post.created_at).getTime();
        return !baselinePostIds.has(post.id) && createdAtMs >= startedAtMs;
      });

      if (newPost) {
        setTriggerMessage(`Artículo generado correctamente: ${newPost.title}`);
        setIsMonitoringRun(false);
        return;
      }
    }

    setTriggerMessage('La ejecución sigue en curso o no reportó un estado final todavía. Revisa n8n si tarda más de lo normal.');
    setIsMonitoringRun(false);
  };

  const handleTriggerNow = async () => {
    setIsTriggering(true);
    setError('');
    setTriggerMessage('');
    const triggerStartedAt = new Date();
    const baselinePostIds = new Set(posts.map((post) => post.id));

    const result = await triggerBlogPulse();

    if (result.success) {
      const details = [result.message];
      if (result.attempt) details.push(`método: ${result.attempt}`);
      if (typeof result.status === 'number') details.push(`HTTP ${result.status}`);
      setTriggerMessage(details.join(' | '));
      setIsMonitoringRun(true);
      await monitorTriggeredRun(triggerStartedAt, baselinePostIds);
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

  const selectedArticleModel = settings?.openrouter_article_model || 'openrouter/free';
  const hasUnknownSavedModel = !OPENROUTER_ARTICLE_MODELS.some((model) => model.value === selectedArticleModel);
  const articleModelSelectValue = (isCustomArticleModelSelected || hasUnknownSavedModel) ? '__custom__' : selectedArticleModel;
  const executionStatus = isMonitoringRun ? 'running' : (settings?.execution_status || 'idle');
  const executionTitle = error
    ? 'La ejecución falló'
    : triggerMessage
      ? 'Última actualización'
      : settings?.execution_title || 'Estado del flujo';
  const executionMessage = error
    ? error
    : triggerMessage
      ? triggerMessage
      : settings?.execution_message || 'El panel mostrará aquí el progreso y los fallos reportados por n8n.';
  const executionTimestamp = settings?.execution_updated_at || settings?.last_error_at || null;
  const executionToneClasses = executionStatus === 'error'
    ? 'border-red-500/20 bg-red-500/[0.08] text-red-200'
    : executionStatus === 'success'
      ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-200'
      : executionStatus === 'running'
        ? 'border-amber-500/20 bg-amber-500/[0.08] text-amber-100'
        : 'border-white/10 bg-white/[0.04] text-zinc-300';
  const executionBadgeClasses = executionStatus === 'error'
    ? 'text-red-300 bg-red-500/10'
    : executionStatus === 'success'
      ? 'text-emerald-300 bg-emerald-500/10'
      : executionStatus === 'running'
        ? 'text-amber-200 bg-amber-500/10'
        : 'text-zinc-400 bg-white/5';
  const executionLabel = executionStatus === 'error'
    ? 'Fallo'
    : executionStatus === 'success'
      ? 'Éxito'
      : executionStatus === 'running'
        ? 'En curso'
        : 'Sin señal';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-jakarta font-black uppercase italic tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>
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
            <h2 className="font-jakarta font-bold uppercase italic text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Modelo:</span>
                  <select
                    value={articleModelSelectValue}
                    onChange={(e) => handleUpdateArticleModel(e.target.value)}
                    disabled={isSaving}
                    className="bg-transparent text-[11px] font-bold text-[#FF5C3A] outline-none cursor-pointer focus:ring-0 border-none p-0 max-w-[180px]"
                  >
                    {OPENROUTER_ARTICLE_MODELS.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Imágenes:</span>
                  <select
                    value={settings.image_generation_provider || 'replicate'}
                    onChange={(e) => handleUpdateImageProvider(e.target.value as 'replicate' | 'openrouter')}
                    disabled={isSaving}
                    className="bg-transparent text-[11px] font-bold text-[#FF5C3A] outline-none cursor-pointer focus:ring-0 border-none p-0 max-w-[140px]"
                  >
                    {BLOG_IMAGE_PROVIDERS.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {settings && articleModelSelectValue === '__custom__' && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  type="text"
                  value={customArticleModel}
                  onChange={(e) => setCustomArticleModel(e.target.value)}
                  placeholder="Ej: openai/gpt-4.1 o meta-llama/llama-3.3-70b-instruct"
                  disabled={isSaving}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-500"
                />
                <button
                  onClick={handleSaveCustomArticleModel}
                  disabled={isSaving || !customArticleModel.trim()}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#FF5C3A] text-white disabled:opacity-50"
                >
                  Guardar Modelo
                </button>
              </div>
            )}
            <div className={`mt-4 rounded-[1.6rem] border px-4 py-4 text-left ${executionToneClasses}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Estado del flujo
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">
                    {executionTitle}
                  </div>
                  <div className="mt-2 text-xs leading-6">
                    {executionMessage}
                  </div>
                </div>
                <div className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${executionBadgeClasses}`}>
                  {executionLabel}
                </div>
              </div>
              {executionTimestamp && (
                <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Actualizado {new Date(executionTimestamp).toLocaleString('es-ES')}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={requestTriggerNow}
              disabled={isTriggering || isMonitoringRun}
              className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                (isTriggering || isMonitoringRun) ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:scale-105 active:scale-95 shadow-lg'
              }`}
            >
              {isTriggering ? 'Disparando...' : isMonitoringRun ? 'Monitoreando...' : 'Disparar Ahora'}
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
            <h2 className="font-jakarta font-bold uppercase italic text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Métricas IA
            </h2>
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

      <div className="rounded-[2rem] border overflow-hidden shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
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
                      {getBlogFeaturedImage(post) && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                          <img src={getBlogFeaturedImage(post) as string} alt="" className="w-full h-full object-cover" />
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
                        onClick={() => requestDelete(post.id)}
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

      {confirmState && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={() => setConfirmState(null)}
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl"
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border shadow-[0_30px_120px_rgba(0,0,0,0.55)]" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,92,58,0.28),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(180deg,rgba(255,92,58,0.02),rgba(255,255,255,0))]" />
            <div className="relative border-b border-white/10 px-7 py-6 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.35rem] border border-[#FF5C3A]/20 bg-[#FF5C3A]/12 text-[#FF5C3A] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[#FF5C3A]/80">
                    Lookitry Editorial
                  </div>
                  <h3 className="mt-1 font-jakarta text-2xl font-bold tracking-tight text-white">
                    {confirmState.title}
                  </h3>
                </div>
              </div>
            </div>
            <div className="relative px-7 py-7 sm:px-8">
              <p className="max-w-xl text-[15px] leading-8 text-zinc-300">
                {confirmState.message}
              </p>
              <div className="mt-6 rounded-[1.5rem] border px-4 py-4" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                  Nota
                </div>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  {confirmState.kind === 'trigger'
                    ? 'La generación se ejecutará en n8n y puede tardar unos minutos mientras crea imágenes, redacta y publica el artículo.'
                    : 'Esta acción quitará el artículo del panel y del sitio si ya estaba publicado.'}
                </p>
              </div>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmState(null)}
                  className="rounded-2xl border px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] transition hover:scale-[1.02] active:scale-[0.99]"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="rounded-2xl bg-[#FF5C3A] px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-[#FF5C3A]/20 transition hover:scale-[1.02] active:scale-[0.99]"
                >
                  {confirmState.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
