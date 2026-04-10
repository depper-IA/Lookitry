'use client';

import { useEffect, useState } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  BarChart3, 
  Search, 
  FileText, 
  ImageIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  Calendar,
  Settings2,
  RefreshCw,
  Plus
} from 'lucide-react';
import Link from 'next/link';

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
  };

  const loadPosts = async () => {
    setLoading(true);
    const data = await adminFetchPosts();
    setPosts(data);
    setLoading(false);
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
      setTriggerMessage(result.message);
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
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--accent)]" />
        <div className="text-sm text-[var(--text-secondary)]">
          Cargando universo editorial...
        </div>
      </div>
    );
  }

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
      : settings?.execution_message || 'El panel mostrará el progreso paso a paso de n8n.';

  const executionTimestamp = settings?.execution_updated_at || settings?.last_error_at || null;

  const getStepStatus = (stepSearch: string) => {
    const msg = executionMessage.toLowerCase();
    if (executionStatus === 'error' && msg.includes(stepSearch)) return 'error';
    if (msg.includes('finalizado') || msg.includes('terminado') || msg.includes('completado')) return 'completed';
    if (msg.includes(stepSearch)) return 'current';
    
    // Si ya pasamos este paso basado en mensajes posteriores
    const steps = ['investigando', 'redactando', 'generando imágenes'];
    const currentIdx = steps.findIndex(s => msg.includes(s));
    const stepIdx = steps.indexOf(stepSearch);
    if (currentIdx > stepIdx && currentIdx !== -1) return 'completed';
    
    return 'pending';
  };

  const editorialSteps = [
    { key: 'investigando', label: 'Investigando', icon: Search },
    { key: 'redactando', label: 'Redactando', icon: FileText },
    { key: 'generando imágenes', label: 'Imágenes IA', icon: ImageIcon },
  ];

  const postsPerPage = 6;
  const sortedPosts = [...posts].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    if (sortKey === 'title') return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }) * direction;
    if (sortKey === 'category') {
      const catA = a.category?.name || 'IA & Moda';
      const catB = b.category?.name || 'IA & Moda';
      return catA.localeCompare(catB, 'es', { sensitivity: 'base' }) * direction;
    }
    if (sortKey === 'status') return a.status.localeCompare(b.status, 'es', { sensitivity: 'base' }) * direction;
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
  });

  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / postsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPosts = sortedPosts.slice((safeCurrentPage - 1) * postsPerPage, safeCurrentPage * postsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <h1 className="font-jakarta font-black uppercase italic tracking-tight text-3xl text-[var(--text-primary)]">
              Editorial Look<span className="text-[var(--accent)]">itry</span>
            </h1>
          </div>
          <p className="text-sm font-medium opacity-60 ml-4 text-[var(--text-primary)]">
            Ecosistema de contenidos inteligente • {posts.length} artículos
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black shadow-xl hover:scale-105 transition-all outline-none"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo Manual
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Status Card */}
        <div 
          className="lg:col-span-8 rounded-[2.5rem] border p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden transition-all hover:shadow-[var(--accent)]/5 bg-[var(--bg-card)] border-[var(--border-color)]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-jakarta font-black uppercase tracking-tighter text-2xl flex items-center gap-2 text-[var(--text-primary)]">
                  Pulso <span className="text-[var(--accent)]">IA</span>
                </h2>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                  executionStatus === 'running' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  executionStatus === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  {executionStatus === 'running' ? 'Procesando' : executionStatus === 'error' ? 'Fallo' : 'Activo'}
                </div>
              </div>
              <p className="text-sm font-medium opacity-60 leading-relaxed mb-6 text-[var(--text-primary)]">
                Nuestra red neuronal investiga tendencias, redacta con alma y genera visuales de alto impacto de forma autónoma.
              </p>

              {/* Real-time Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {editorialSteps.map((step) => {
                  const status = getStepStatus(step.key);
                  const Icon = step.icon;
                  return (
                    <div 
                      key={step.key}
                      className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500 ${
                        status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-100 scale-100' :
                        status === 'current' ? 'bg-[var(--accent)]/5 border-[var(--accent)]/40 shadow-lg shadow-[var(--accent)]/5 scale-[1.02]' :
                        'bg-black/5 dark:bg-white/5 border-transparent opacity-30 scale-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        status === 'completed' ? 'text-emerald-500' :
                        status === 'current' ? 'text-[var(--accent)]' :
                        'text-zinc-500'
                      }`}>
                        {status === 'current' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                        {step.label}
                      </span>
                      {status === 'completed' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute top-2 right-2" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detailed Message Buffer */}
              <div className={`p-6 rounded-3xl border transition-all ${
                executionStatus === 'error' ? 'bg-red-500/5 border-red-500/20' : 
                executionStatus === 'running' ? 'bg-[var(--accent)]/5 border-[var(--accent)]/10' :
                'bg-black/5 dark:bg-white/5 border-transparent'
              }`}>
                <div className="flex gap-4 items-start">
                  <div className={`mt-1 ${executionStatus === 'error' ? 'text-red-500' : 'text-[var(--accent)]'}`}>
                    {executionStatus === 'error' ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 text-[var(--text-primary)]">
                      {executionTitle}
                    </h4>
                    <p className="text-[13px] font-bold leading-relaxed text-[var(--text-primary)]">
                      {executionMessage}
                    </p>
                    {executionTimestamp && (
                      <div className="mt-3 text-[9px] font-bold uppercase tracking-widest opacity-30 text-[var(--text-primary)]">
                        Última señal: {new Date(executionTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="w-full md:w-56 shrink-0 flex flex-col gap-3">
              <button
                onClick={requestTriggerNow}
                disabled={isTriggering || isMonitoringRun}
                className="group relative w-full px-6 py-4 rounded-2xl bg-[var(--accent)] text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  {isTriggering || isMonitoringRun ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Forzar Pulso
                </span>
              </button>
              
              <button
                onClick={handleToggleEnabled}
                disabled={isSaving}
                className={`w-full px-6 py-3.5 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                  settings?.is_enabled
                    ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10'
                    : 'border-zinc-500/30 text-zinc-500 bg-zinc-500/5 hover:bg-zinc-500/10'
                }`}
              >
                {settings?.is_enabled ? '● Sistema Activo' : '○ Flujo Pausado'}
              </button>

              <div className="mt-4 p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-transparent">
                <div className="flex items-center gap-2 mb-3 opacity-40">
                  <Settings2 className="w-3 h-3" />
                  <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
                    Configuración
                  </h5>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1.5 block text-[var(--text-primary)]">
                      Frecuencia
                    </label>
                    <select
                      value={settings?.frequency}
                      onChange={(e) => handleUpdateFrequency(e.target.value as any)}
                      className="w-full bg-transparent text-xs font-bold outline-none border-none p-0 cursor-pointer text-[var(--text-primary)]"
                    >
                      <option value="daily" className="bg-white dark:bg-[#0a0a0a]">Diaria</option>
                      <option value="weekly" className="bg-white dark:bg-[#0a0a0a]">Semanal</option>
                      <option value="monthly" className="bg-white dark:bg-[#0a0a0a]">Mensual</option>
                    </select>
                  </div>
                  <div className="pt-3 border-t border-black/5 dark:border-white/5">
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1 block text-[var(--text-primary)]">
                      Próximo Vuelo
                    </label>
                    <div className="flex items-center gap-2 text-[var(--text-primary)]">
                      <Calendar className="w-3 h-3 opacity-40" />
                      <span className="text-xs font-black">
                        {settings ? new Date(settings.next_run).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Analytics Card */}
        <div 
          className="lg:col-span-4 rounded-[2.5rem] border p-8 flex flex-col justify-between shadow-lg relative overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="font-jakarta font-black uppercase tracking-tighter text-lg mb-6 flex items-center gap-3 text-[var(--text-primary)]">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Métricas IA
            </h3>
            
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-indigo-500/20 transition-all group">
                <div className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40 mb-1 group-hover:text-indigo-500 transition-colors text-[var(--text-primary)] italic">Autónomos</div>
                <div className="text-3xl font-black text-[var(--text-primary)]">{posts.filter(p => !p.content.includes('manual')).length}</div>
              </div>
              <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-[var(--accent)]/20 transition-all group">
                <div className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40 mb-1 group-hover:text-[var(--accent)] transition-colors text-[var(--text-primary)] italic">Total Índice</div>
                <div className="text-3xl font-black text-[var(--accent)]">{posts.length}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-5 rounded-3xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 relative z-10">
            <p className="text-[10px] leading-relaxed font-bold italic opacity-50 text-[var(--text-primary)]">
              &quot;El motor Lookitry optimiza cada palabra para máximo engagement y autoridad digital.&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div 
        className="rounded-[2.5rem] border shadow-2xl overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b bg-[var(--bg-base)] border-[var(--border-color)]">
                {['title', 'category', 'status', 'created_at'].map((key) => (
                  <th key={key} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--text-primary)]">
                    <button 
                      onClick={() => toggleSort(key as SortKey)}
                      className={`inline-flex items-center gap-2 hover:text-[var(--accent)] transition-colors ${sortKey === key ? 'text-[var(--accent)] opacity-100' : ''}`}
                    >
                      {key === 'title' ? 'Artículo' : key === 'category' ? 'Categoría' : key === 'status' ? 'Visibilidad' : 'Fecha'}
                      <span className="text-[8px] font-black">{sortKey === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                    </button>
                  </th>
                ))}
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right text-[var(--text-primary)]">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y border-[var(--border-color)]">
              {paginatedPosts.map((post) => (
                <tr key={post.id} className="group hover:bg-black/5 dark:hover:bg-white/[0.02] transition-all">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-black/10 dark:bg-white/5 flex-shrink-0">
                        <img 
                          src={getBlogFeaturedImage(post) || '/placeholder-img.jpg'} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link 
                          href={`/admin/blog/${post.id}`}
                          className="block font-black text-sm tracking-tight hover:text-[var(--accent)] transition-colors truncate max-w-[200px] sm:max-w-md text-[var(--text-primary)]"
                        >
                          {post.title}
                        </Link>
                        <span className="text-[10px] font-bold opacity-40 block mt-1 uppercase tracking-tight text-[var(--text-primary)]">/blog/{post.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-[var(--text-primary)]">
                      {post.category?.name || 'IA & Moda'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      post.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                      {post.status === 'published' ? 'Publicado' : 'Borrador'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-bold opacity-60 text-[var(--text-primary)]">
                      {new Date(post.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/blog/${post.slug}`} 
                        target="_blank"
                        className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all border border-transparent dark:hover:border-[var(--accent)]/20 shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link 
                        href={`/admin/blog/${post.id}`} 
                        className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all border border-transparent dark:hover:border-indigo-500/20 shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => requestDelete(post.id)}
                        className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent dark:hover:border-red-500/20 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {posts.length > 0 && (
            <div className="px-8 py-6 border-t border-[var(--border-color)] flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--text-primary)]">
                Página {safeCurrentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                        page === safeCurrentPage ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmState(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-[3rem] border border-[var(--border-color)] overflow-hidden shadow-2xl bg-[var(--bg-card)]"
            >
              <div className="p-10 text-center">
                <div className={`w-20 h-20 rounded-[2.2rem] mx-auto mb-6 flex items-center justify-center shadow-inner ${
                  confirmState.kind === 'trigger' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-red-500/10 text-red-500'
                }`}>
                  {confirmState.kind === 'trigger' ? <Zap className="w-10 h-10 fill-current" /> : <Trash2 className="w-10 h-10" />}
                </div>
                
                <h3 className="font-jakarta text-3xl font-black tracking-tight mb-4 text-[var(--text-primary)]">
                  {confirmState.title}
                </h3>
                
                <p className="text-sm font-medium opacity-60 leading-relaxed mb-8 text-[var(--text-primary)]">
                  {confirmState.message}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setConfirmState(null)}
                    className="flex-1 px-8 py-4 rounded-2xl border border-[var(--border-color)] font-black text-[11px] uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[var(--text-primary)]"
                  >
                    Retroceder
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className={`flex-1 px-8 py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${
                      confirmState.kind === 'trigger' ? 'bg-[var(--accent)] shadow-[var(--accent)]/20' : 'bg-red-500 shadow-red-500/20'
                    }`}
                  >
                    {confirmState.confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
