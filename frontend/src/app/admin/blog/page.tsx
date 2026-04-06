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
import { motion } from 'framer-motion';

const OPENROUTER_ARTICLE_MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
  { value: 'openrouter/free', label: 'OpenRouter Free' },
  { value: '__custom__', label: 'Otro' },
];

const BLOG_IMAGE_PROVIDERS = [
  { value: 'replicate', label: 'Replicate' },
  { value: 'openrouter', label: 'OpenRouter' },
];

const OPENROUTER_IMAGE_MODELS = [
  { value: 'openai/dall-e-3', label: 'DALL-E 3 (OpenAI)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { value: 'google/gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: '__custom__', label: 'Otro' },
];

function sanitizeExecutionMessage(message: string | null | undefined, status: 'error' | 'success' | 'running' | 'idle') {
  const normalized = message?.trim();
  const looksTechnical = normalized
    ? /x-n8n-secret|http\s*\d+|metodo:|método:|webhook|execution-status|n8n/i.test(normalized)
    : false;

  if (normalized && !looksTechnical) {
    return normalized;
  }

  if (status === 'error') {
    return 'No pudimos completar la generación del artículo. Revisa la última ejecución del flujo o vuelve a intentarlo.';
  }

  if (status === 'success') {
    return 'La ejecución terminó correctamente. El panel ya refleja el resultado más reciente del flujo editorial.';
  }

  if (status === 'running') {
    return 'Estamos preparando el artículo. Este proceso puede tardar varios minutos mientras investigamos, redactamos y generamos las imágenes.';
  }

  return 'Aquí verás el progreso real del flujo editorial y cualquier novedad importante de la publicación automática.';
}

export default function AdminBlogPage() {
  type SortKey = 'title' | 'category' | 'status' | 'created_at';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [executionNotice, setExecutionNotice] = useState('');
  const [triggerMessage, setTriggerMessage] = useState('');
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isMonitoringRun, setIsMonitoringRun] = useState(false);
  const [pendingExecutionStartedAt, setPendingExecutionStartedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [customArticleModel, setCustomArticleModel] = useState('');
  const [isCustomArticleModelSelected, setIsCustomArticleModelSelected] = useState(false);
  const [customImageModel, setCustomImageModel] = useState('');
  const [isCustomImageModelSelected, setIsCustomImageModelSelected] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [sortKey, sortDirection, posts.length]);

  useEffect(() => {
    if (!pendingExecutionStartedAt) return;

    const intervalId = window.setInterval(async () => {
      const [latestSettings, latestPosts] = await Promise.all([
        fetchBlogSettings(),
        adminFetchPosts(),
      ]);

      if (latestSettings) {
        setSettings(latestSettings);
      }
      setPosts(latestPosts);

      const latestExecutionAt = latestSettings?.execution_updated_at
        ? new Date(latestSettings.execution_updated_at).getTime()
        : null;

      if (!latestExecutionAt || latestExecutionAt < pendingExecutionStartedAt) {
        return;
      }

      if (latestSettings?.execution_status === 'error') {
        setExecutionNotice('');
        setTriggerMessage('');
        setError(sanitizeExecutionMessage(latestSettings.execution_message, 'error'));
        setIsMonitoringRun(false);
        setPendingExecutionStartedAt(null);
        return;
      }

      if (latestSettings?.execution_status === 'success') {
        setExecutionNotice('');
        setError('');
        setTriggerMessage(sanitizeExecutionMessage(latestSettings.execution_message, 'success'));
        setIsMonitoringRun(false);
        setPendingExecutionStartedAt(null);
      }
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [pendingExecutionStartedAt]);

  const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const toggleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => prev === 'asc' ? 'desc' : 'asc');
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === 'created_at' ? 'desc' : 'asc');
  };

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

    if (data?.openrouter_image_model && !OPENROUTER_IMAGE_MODELS.some((model) => model.value === data.openrouter_image_model)) {
      setCustomImageModel(data.openrouter_image_model);
      setIsCustomImageModelSelected(true);
    } else {
      setCustomImageModel('');
      setIsCustomImageModelSelected(false);
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

  const handleUpdateImageModel = async (model: string) => {
    if (!settings) return;
    if (model === '__custom__') {
      setCustomImageModel(settings.openrouter_image_model || '');
      setIsCustomImageModelSelected(true);
      return;
    }
    setIsCustomImageModelSelected(false);
    setIsSaving(true);
    setError('');
    const ok = await updateBlogSettings({ openrouter_image_model: model });
    if (ok) {
      await loadSettings();
    } else {
      setError('No se pudo actualizar el modelo de imagen de OpenRouter.');
    }
    setIsSaving(false);
  };

  const handleSaveCustomImageModel = async () => {
    if (!settings) return;
    const normalized = customImageModel.trim();
    if (!normalized) {
      setError('Escribe un modelo de imagen válido de OpenRouter antes de guardar.');
      return;
    }
    setIsSaving(true);
    setError('');
    const ok = await updateBlogSettings({ openrouter_image_model: normalized });
    if (ok) {
      await loadSettings();
      setIsCustomImageModelSelected(true);
    } else {
      setError('No se pudo actualizar el modelo de imagen personalizado.');
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
    setPendingExecutionStartedAt(startedAtMs);

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
        setExecutionNotice('');
        setError(latestSettings.execution_message || 'n8n reportó un fallo en la ejecución del blog.');
        setIsMonitoringRun(false);
        setPendingExecutionStartedAt(null);
        return;
      }

      if (latestSettings?.execution_status === 'success' && latestExecutionAt && latestExecutionAt >= startedAtMs) {
        setExecutionNotice('');
        setError('');
        setTriggerMessage(latestSettings.execution_message || 'n8n terminó la ejecución correctamente.');
        setIsMonitoringRun(false);
        setPendingExecutionStartedAt(null);
        return;
      }

      const newPost = latestPosts.find((post) => {
        const createdAtMs = new Date(post.created_at).getTime();
        return !baselinePostIds.has(post.id) && createdAtMs >= startedAtMs;
      });

      if (newPost) {
        setExecutionNotice('');
        setError('');
        setTriggerMessage(`Artículo generado correctamente: ${newPost.title}`);
        setIsMonitoringRun(false);
        setPendingExecutionStartedAt(null);
        return;
      }
    }

    setError('');
    setTriggerMessage('');
    setExecutionNotice('n8n aún no confirmó el resultado del flujo. El panel seguirá consultando automáticamente hasta recibir `success` o `error` desde `/api/blog/execution-status`.');
    setIsMonitoringRun(false);
  };

  const handleTriggerNow = async () => {
    setIsTriggering(true);
    setError('');
    setExecutionNotice('');
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
      setPendingExecutionStartedAt(null);
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

  const selectedArticleModel = settings?.openrouter_article_model || 'google/gemini-2.5-flash';
  const hasUnknownSavedModel = !OPENROUTER_ARTICLE_MODELS.some((model) => model.value === selectedArticleModel);
  const articleModelSelectValue = (isCustomArticleModelSelected || hasUnknownSavedModel) ? '__custom__' : selectedArticleModel;
  const executionStatus = error
    ? 'error'
    : (isMonitoringRun || pendingExecutionStartedAt)
      ? 'running'
      : (settings?.execution_status || 'idle');
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
    ? 'border-red-500/30 bg-red-500/10 dark:bg-red-500/[0.08] text-red-700 dark:text-red-200 shadow-sm'
    : executionStatus === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-200 shadow-sm'
      : executionStatus === 'running'
        ? 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/[0.08] text-amber-700 dark:text-amber-100 shadow-sm'
        : 'border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300';
  const executionBadgeClasses = executionStatus === 'error'
    ? 'text-red-600 dark:text-red-300 bg-red-500/20 dark:bg-red-500/10'
    : executionStatus === 'success'
      ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/20 dark:bg-emerald-500/10'
      : executionStatus === 'running'
        ? 'text-amber-600 dark:text-amber-200 bg-amber-500/20 dark:bg-amber-500/10'
        : 'text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-white/5';
  const executionLabel = executionStatus === 'error'
    ? 'Fallo'
    : executionStatus === 'success'
      ? 'Éxito'
      : executionStatus === 'running'
        ? 'En curso'
        : 'Sin señal';

  const effectiveExecutionTitle = error
    ? executionTitle
    : executionNotice
      ? 'Esperando confirmacion del flujo'
      : executionTitle;
  const effectiveExecutionMessage = error
    ? executionMessage
    : executionNotice
      ? executionNotice
      : executionMessage;
  const postsPerPage = 6;
  const sortedPosts = [...posts].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (sortKey === 'title') {
      return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }) * direction;
    }

    if (sortKey === 'category') {
      const categoryA = a.category?.name || 'IA & Moda';
      const categoryB = b.category?.name || 'IA & Moda';
      return categoryA.localeCompare(categoryB, 'es', { sensitivity: 'base' }) * direction;
    }

    if (sortKey === 'status') {
      return a.status.localeCompare(b.status, 'es', { sensitivity: 'base' }) * direction;
    }

    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
  });
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / postsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPosts = sortedPosts.slice(
    (safeCurrentPage - 1) * postsPerPage,
    safeCurrentPage * postsPerPage,
  );
  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
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
          className="lg:col-span-2 rounded-[2rem] border p-6 sm:p-8 flex flex-col lg:flex-row items-center lg:items-start gap-6 shadow-md transition-all hover:shadow-lg relative overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#FF5C3A]/10 text-[#FF5C3A] flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1 text-center lg:text-left w-full">
            <h2 className="font-jakarta font-black uppercase tracking-tight text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
              Pulso Editorial <span className="text-[#FF5C3A]">IA</span>
            </h2>
            <p className="text-[13px] leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Configura el ritmo automático de publicación de Lookitry Editorial.
              La Inteligencia Artificial generará temas, imágenes de alta resolución y artículos optimizados para SEO y conversión.
            </p>
            {settings && (
              <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-black/5 border-black/5 dark:bg-white/5 dark:border-white/5 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Frecuencia:</span>
                  <select
                    value={settings.frequency}
                    onChange={(e) => handleUpdateFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    disabled={isSaving}
                    className="bg-transparent text-[11px] font-black text-[#FF5C3A] uppercase tracking-widest outline-none cursor-pointer focus:ring-0 border-none p-0"
                  >
                    <option value="daily">Diaria</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-black/5 border-black/5 dark:bg-white/5 dark:border-white/5 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Próximo:</span>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    {new Date(settings.next_run).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-black/5 border-black/5 dark:bg-white/5 dark:border-white/5 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Modelo:</span>
                  <select
                    value={articleModelSelectValue}
                    onChange={(e) => handleUpdateArticleModel(e.target.value)}
                    disabled={isSaving}
                    className="bg-transparent text-[11px] font-bold outline-none cursor-pointer focus:ring-0 border-none p-0 w-[120px] sm:w-[150px] truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {OPENROUTER_ARTICLE_MODELS.map((model) => (
                      <option key={model.value} value={model.value} className="bg-white dark:bg-[#0a0a0a]">
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-black/5 border-black/5 dark:bg-white/5 dark:border-white/5 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Imágenes:</span>
                  <select
                    value={settings.image_generation_provider || 'replicate'}
                    onChange={(e) => handleUpdateImageProvider(e.target.value as 'replicate' | 'openrouter')}
                    disabled={isSaving}
                    className="bg-transparent text-[11px] font-bold outline-none cursor-pointer focus:ring-0 border-none p-0"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {BLOG_IMAGE_PROVIDERS.map((provider) => (
                      <option key={provider.value} value={provider.value} className="bg-white dark:bg-[#0a0a0a]">
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                {settings.image_generation_provider === 'openrouter' && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-black/5 border-black/5 dark:bg-white/5 dark:border-white/5 transition-colors animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Modelo Img:</span>
                    <select
                      value={(isCustomImageModelSelected || (settings.openrouter_image_model && !OPENROUTER_IMAGE_MODELS.some(m => m.value === settings.openrouter_image_model))) ? '__custom__' : settings.openrouter_image_model}
                      onChange={(e) => handleUpdateImageModel(e.target.value)}
                      disabled={isSaving}
                      className="bg-transparent text-[11px] font-bold outline-none cursor-pointer focus:ring-0 border-none p-0 w-[100px] sm:w-[130px] truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {OPENROUTER_IMAGE_MODELS.map((model) => (
                        <option key={model.value} value={model.value} className="bg-white dark:bg-[#0a0a0a]">
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            {settings && articleModelSelectValue === '__custom__' && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                <input
                  type="text"
                  value={customArticleModel}
                  onChange={(e) => setCustomArticleModel(e.target.value)}
                  placeholder="Ej: openai/gpt-4.1 o meta-llama/llama-3.3-70b-instruct"
                  disabled={isSaving}
                  className="flex-1 rounded-[1.2rem] border bg-black/5 border-black/10 dark:bg-white/5 dark:border-white/10 px-4 py-2.5 text-xs outline-none focus:border-[#FF5C3A]/50 transition-all font-medium"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  onClick={handleSaveCustomArticleModel}
                  disabled={isSaving || !customArticleModel.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  Guardar Modelo
                </button>
              </div>
            )}
            {settings && (isCustomImageModelSelected || (settings.openrouter_image_model && !OPENROUTER_IMAGE_MODELS.some(m => m.value === settings.openrouter_image_model))) && settings.image_generation_provider === 'openrouter' && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  type="text"
                  value={customImageModel}
                  onChange={(e) => setCustomImageModel(e.target.value)}
                  placeholder="Ej: openai/dall-e-3 o nano banana"
                  disabled={isSaving}
                  className="flex-1 rounded-[1.2rem] border bg-black/5 border-black/10 dark:bg-white/5 dark:border-white/10 px-4 py-2.5 text-xs outline-none focus:border-[#FF5C3A]/50 transition-all font-medium"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  onClick={handleSaveCustomImageModel}
                  disabled={isSaving || !customImageModel.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  Guardar Modelo Imagen
                </button>
              </div>
            )}
            <div className={`mt-6 rounded-[1.6rem] border p-5 sm:p-6 text-left transition-all relative overflow-hidden ${executionToneClasses}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between relative z-10">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] opacity-80 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                    Estado del Flujo
                  </div>
                  <div className="mt-1 text-base font-bold tracking-tight">
                    {effectiveExecutionTitle}
                  </div>
                  <div className="mt-2 text-xs leading-relaxed opacity-90 font-medium">
                    {effectiveExecutionMessage}
                  </div>
                </div>
                <div className={`inline-flex shrink-0 items-center justify-center rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${executionBadgeClasses}`}>
                  {executionLabel}
                </div>
              </div>
              {executionTimestamp && (
                <div className="mt-4 pt-3 border-t border-current/10 text-[9px] font-bold uppercase tracking-[0.15em] opacity-60">
                  Actualizado: <span className="opacity-100">{new Date(executionTimestamp).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full lg:w-48 xl:w-56 shrink-0 mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-current/10 lg:pl-6 text-center lg:text-left">
            <button
              onClick={requestTriggerNow}
              disabled={isTriggering || isMonitoringRun}
              className={`w-full px-5 py-3.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                (isTriggering || isMonitoringRun) 
                  ? 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 cursor-not-allowed shadow-none' 
                  : 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isTriggering ? 'Generando...' : isMonitoringRun ? 'Procesando...' : 'Forzar Artículo'}
            </button>
            <button
              onClick={handleToggleEnabled}
              disabled={isSaving}
              className={`w-full px-5 py-3 rounded-[1rem] border text-[9px] font-black uppercase tracking-widest transition-all ${
                settings?.is_enabled
                  ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
                  : 'text-zinc-600 dark:text-zinc-400 border-zinc-500/30 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {settings?.is_enabled ? '● Sistema Activo' : '○ Flujo Pausado'}
            </button>
          </div>
        </div>

        <div
          className="rounded-[2rem] border p-6 sm:p-8 flex flex-col justify-between shadow-md relative overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.02] blur-xl rounded-full -mr-6 -mt-6"></div>
          <div className="relative z-10">
            <h2 className="font-jakarta font-black uppercase tracking-tight text-xl mb-6 flex items-center gap-3 text-current">
              Métricas IA
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4 py-3 rounded-xl border bg-black/5 border-black/5 dark:bg-white/5 dark:border-white/5">
                <span className="text-[11px] font-bold opacity-80 uppercase tracking-wider text-current">Artículos Autónomos</span>
                <span className="text-base font-black text-current">{posts.filter((post) => !post.content.includes('manual')).length}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 rounded-xl border bg-black/5 border-black/5 dark:bg-white/5 dark:border-white/5">
                <span className="text-[11px] font-bold opacity-80 uppercase tracking-wider text-current">Total Publicaciones</span>
                <span className="text-base font-black text-[#FF5C3A]">{posts.length}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-current/10 text-[10px] font-medium leading-relaxed opacity-60 text-current text-center sm:text-left relative z-10">
            * El contenido inteligente se rige por las directrices de optimización orgánica y semántica de Lookitry.
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border shadow-md overflow-hidden bg-card" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }} className="border-b">
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] opacity-60 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  <button type="button" onClick={() => toggleSort('title')} className="inline-flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
                    <span>Artículo</span>
                    <span>{sortIndicator('title')}</span>
                  </button>
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] opacity-60 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  <button type="button" onClick={() => toggleSort('category')} className="inline-flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
                    <span>Clasificación</span>
                    <span>{sortIndicator('category')}</span>
                  </button>
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] opacity-60 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
                    <span>Visibilidad</span>
                    <span>{sortIndicator('status')}</span>
                  </button>
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] opacity-60 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  <button type="button" onClick={() => toggleSort('created_at')} className="inline-flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
                    <span>Registro</span>
                    <span>{sortIndicator('created_at')}</span>
                  </button>
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] opacity-60 text-right transition-colors" style={{ color: 'var(--text-primary)' }}>Control</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {paginatedPosts.map((post) => (
                <tr key={post.id} className="group hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {getBlogFeaturedImage(post) && (
                        <div className="w-12 h-12 rounded-[0.85rem] overflow-hidden flex-shrink-0 border bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                          <img src={getBlogFeaturedImage(post) as string} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        </div>
                      )}
                      <div className="min-w-0 pr-4">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="text-sm font-bold block truncate max-w-[200px] sm:max-w-xs transition-colors hover:text-[#FF5C3A]"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {post.title}
                        </Link>
                        <span className="text-[10px] font-semibold mt-1 block truncate opacity-60 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                          /blog/{post.slug}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-black/5 border-black/10 dark:bg-white/5 dark:border-white/10 uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                      {post.category?.name || 'IA & Moda'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                        post.status === 'published'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-black/5 border border-black/10 text-zinc-600 dark:bg-white/5 dark:border-white/10 dark:text-zinc-400'
                      }`}
                    >
                      {post.status === 'published' ? 'Público' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold opacity-80" style={{ color: 'var(--text-primary)' }}>
                      {new Date(post.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-2.5 rounded-[0.85rem] bg-black/5 border-transparent text-zinc-500 hover:text-white hover:bg-zinc-800 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 transition-all border dark:hover:border-white/20 shadow-sm"
                        title="Abrir URL Pública"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="p-2.5 rounded-[0.85rem] bg-black/5 border-transparent text-zinc-500 hover:text-[#FF5C3A] hover:bg-[#FF5C3A]/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-[#FF5C3A]/20 transition-all border dark:hover:border-[#FF5C3A]/30 shadow-sm"
                        title="Editar Artículo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => requestDelete(post.id)}
                        className="p-2.5 rounded-[0.85rem] bg-black/5 border-transparent text-zinc-500 hover:text-red-500 hover:bg-red-500/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-red-500/20 transition-all border dark:hover:border-red-500/30 shadow-sm"
                        title="Borrar Definitivamente"
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
          {posts.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="text-[11px] font-bold opacity-70" style={{ color: 'var(--text-primary)' }}>
                Mostrando {(safeCurrentPage - 1) * postsPerPage + 1}-{Math.min(safeCurrentPage * postsPerPage, sortedPosts.length)} de {sortedPosts.length}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border disabled:opacity-40"
                  style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                      page === safeCurrentPage ? 'bg-[#FF5C3A] text-white border-[#FF5C3A]' : ''
                    }`}
                    style={page === safeCurrentPage ? undefined : { color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border disabled:opacity-40"
                  style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
          {posts.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-[1.5rem] bg-black/5 dark:bg-white/5 flex items-center justify-center mb-5 border border-black/10 dark:border-white/10 shadow-sm">
                <svg className="w-10 h-10 opacity-60" style={{ color: 'var(--text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3v5h5" />
                </svg>
              </div>
              <h3 className="text-xl font-black mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Directorio Vacío
              </h3>
              <p className="text-sm max-w-sm leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                No hay artículos redactados. La Inteligencia Artificial nutrirá este espacio en el próximo ciclo programado.
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
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md transition-opacity"
          />
          <div className="relative w-full max-w-lg sm:max-w-xl overflow-hidden rounded-[2.5rem] border shadow-2xl transform transition-all" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C3A]/5 to-transparent pointer-events-none" />
            
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col items-center text-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF5C3A] shadow-inner">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF5C3A]">
                    Lookitry Editorial
                  </div>
                  <h3 className="font-jakarta text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {confirmState.title}
                  </h3>
                </div>
              </div>
              
              <div className="px-2 sm:px-4 text-center">
                <p className="text-[14px] leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {confirmState.message}
                </p>
                
                <div className="mt-6 rounded-2xl border p-4 sm:p-5 text-left bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Nota Importante
                  </div>
                  <p className="mt-2 text-xs sm:text-[13px] leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {confirmState.kind === 'trigger'
                      ? 'La generación se ejecutará en n8n y puede tardar unos minutos. El panel reflejará el progreso automáticamente.'
                      : 'Esta acción borrará el artículo permanentemente. Si fue publicado, dejará de ser visible en el sitio.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
                <button
                  type="button"
                  onClick={() => setConfirmState(null)}
                  className="w-full sm:w-auto rounded-[1.2rem] border px-6 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="w-full sm:w-auto rounded-[1.2rem] bg-[#FF5C3A] px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#FF5C3A]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {confirmState.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
