'use client';

import { useEffect, useState } from 'react';
import {
  adminDeletePost,
  adminFetchPosts,
  BlogPost,
  BlogSettings,
  fetchBlogSettings,
  triggerBlogPulse,
  updateBlogSettings,
} from '@/services/blog.service';
import { motion } from 'framer-motion';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  BlogStatusCard,
  BlogMetricsCard,
  PostsTable,
  ConfirmModal,
} from '@/components/admin/blog';

type SortKey = 'title' | 'category' | 'status' | 'created_at';

interface ConfirmState {
  kind: 'trigger' | 'delete';
  title: string;
  message: string;
  confirmLabel: string;
  postId?: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggerMessage, setTriggerMessage] = useState('');
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isMonitoringRun, setIsMonitoringRun] = useState(false);
  const [pendingExecutionStartedAt, setPendingExecutionStartedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    loadPosts();
    loadSettings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortKey, sortDirection]);

  useEffect(() => {
    if (!pendingExecutionStartedAt) return;

    const intervalId = window.setInterval(async () => {
      const [latestSettings, latestPosts] = await Promise.all([
        fetchBlogSettings(),
        adminFetchPosts(),
      ]);

      if (latestSettings) setSettings(latestSettings);
      setPosts(latestPosts);

      const latestExecutionAt = latestSettings?.execution_updated_at
        ? new Date(latestSettings.execution_updated_at).getTime()
        : null;

      if (!latestExecutionAt || latestExecutionAt < pendingExecutionStartedAt) return;

      if (latestSettings?.execution_status === 'error') {
        setError(latestSettings.execution_message || 'Error en la ejecución');
        setIsMonitoringRun(false);
        setPendingExecutionStartedAt(null);
        return;
      }

      if (latestSettings?.execution_status === 'success') {
        setError('');
        setTriggerMessage(latestSettings.execution_message || 'Completado');
        setIsMonitoringRun(false);
        setPendingExecutionStartedAt(null);
      }
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [pendingExecutionStartedAt]);

  const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

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
    if (ok) await loadSettings();
    else setError('No se pudo actualizar la frecuencia.');
    setIsSaving(false);
  };

  const handleToggleEnabled = async () => {
    if (!settings) return;
    setIsSaving(true);
    setError('');
    const ok = await updateBlogSettings({ is_enabled: !settings.is_enabled });
    if (ok) await loadSettings();
    else setError('No se pudo actualizar el estado.');
    setIsSaving(false);
  };

  const requestDelete = (id: string) => {
    setConfirmState({
      kind: 'delete',
      title: 'Eliminar artículo',
      message: 'Esta acción eliminará el artículo de forma permanente.',
      confirmLabel: 'Eliminar',
      postId: id,
    });
  };

  const requestTriggerNow = () => {
    setConfirmState({
      kind: 'trigger',
      title: 'Disparar pulso editorial',
      message: 'Se generará un artículo nuevo con IA, imágenes y publicación.',
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

  const monitorTriggeredRun = async (triggerStartedAt: Date) => {
    const startedAtMs = triggerStartedAt.getTime();
    setPendingExecutionStartedAt(startedAtMs);

    for (let attempt = 0; attempt < 24; attempt += 1) {
      await sleep(5000);

      const [latestSettings, latestPosts] = await Promise.all([
        fetchBlogSettings(),
        adminFetchPosts(),
      ]);

      if (latestSettings) setSettings(latestSettings);
      setPosts(latestPosts);

      const latestExecutionAt = latestSettings?.execution_updated_at
        ? new Date(latestSettings.execution_updated_at).getTime()
        : null;

      if (latestSettings?.execution_status === 'error' && latestExecutionAt && latestExecutionAt >= startedAtMs) {
        setError(latestSettings.execution_message || 'Error en n8n');
        setIsMonitoringRun(false);
        setPendingExecutionStartedAt(null);
        return;
      }

      if (latestSettings?.execution_status === 'success' && latestExecutionAt && latestExecutionAt >= startedAtMs) {
        setError('');
        setTriggerMessage(latestSettings.execution_message || 'Completado');
        setIsMonitoringRun(false);
        setPendingExecutionStartedAt(null);
        return;
      }
    }

    setIsMonitoringRun(false);
    setPendingExecutionStartedAt(null);
  };

  const handleTriggerNow = async () => {
    setIsTriggering(true);
    setError('');
    setTriggerMessage('');
    const triggerStartedAt = new Date();

    const result = await triggerBlogPulse();

    if (result.success) {
      setTriggerMessage(result.message);
      setIsMonitoringRun(true);
      await monitorTriggeredRun(triggerStartedAt);
    } else {
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

  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / 6));

  const toggleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => prev === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === 'created_at' ? 'desc' : 'asc');
  };

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
        <BlogStatusCard
          settings={settings}
          isTriggering={isTriggering}
          isMonitoringRun={isMonitoringRun}
          isSaving={isSaving}
          executionStatus={executionStatus}
          executionTitle={executionTitle}
          executionMessage={executionMessage}
          executionTimestamp={executionTimestamp}
          onRequestTriggerNow={requestTriggerNow}
          onToggleEnabled={handleToggleEnabled}
          onUpdateFrequency={handleUpdateFrequency}
        />
        <BlogMetricsCard posts={posts} />
      </div>

      <PostsTable
        posts={sortedPosts}
        sortKey={sortKey}
        sortDirection={sortDirection}
        currentPage={currentPage}
        totalPages={totalPages}
        onToggleSort={toggleSort}
        onPageChange={setCurrentPage}
        onRequestDelete={requestDelete}
      />

      <ConfirmModal
        confirmState={confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirmAction}
      />
    </motion.div>
  );
}