'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Search, RefreshCw, Eye, RotateCcw, X, ChevronLeft, ChevronRight, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface Generation {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  product_id: string | null;
  product_name: string | null;
  status: GenerationStatus;
  model_provider: 'openrouter' | 'replicate' | null;
  selfie_url: string | null;
  result_url: string | null;
  error_message: string | null;
  processing_time_ms: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface GenerationStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface Brand {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<GenerationStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Pendiente' },
  processing: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', label: 'Procesando' },
  completed: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', label: 'Completada' },
  failed: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: 'Fallida' },
};

// ── Helper Components ─────────────────────────────────────────────────────────

function LoadingSpinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent ${className}`} />
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-sm ${
      type === 'success' ? 'border-emerald-500/20 bg-emerald-600/90' : 'border-red-500/20 bg-red-600/90'
    }`}>
      {message}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GenerationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<GenerationStats>({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [filterBrand, setFilterBrand] = useState(searchParams.get('brand') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');

  // Pagination
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 20);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit) || 1;

  // Detail modal
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  // Retry confirm
  const [retryTarget, setRetryTarget] = useState<Generation | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      const data = await adminApi.get<{ brands: Brand[] }>('/admin/brands?limit=1000');
      setBrands(data.brands || []);
    } catch { /* silent */ }
  }, []);

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBrand) params.set('brand_id', filterBrand);
      if (filterStatus) params.set('status', filterStatus);
      if (dateFrom) params.set('start_date', dateFrom);
      if (dateTo) params.set('end_date', dateTo);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const [genData, statsData] = await Promise.all([
        adminApi.get<{ generations: Generation[]; total: number }>(`/admin/generations?${params.toString()}`),
        adminApi.get<{ total: number; pending: number; processing: number; completed: number; failed: number }>(
          `/admin/generations/stats${filterBrand ? `?brand_id=${filterBrand}` : ''}`
        ),
      ]);

      setGenerations(genData.generations || []);
      setTotal(genData.total || 0);
      setStats({
        total: statsData.total || 0,
        pending: statsData.pending || 0,
        processing: statsData.processing || 0,
        completed: statsData.completed || 0,
        failed: statsData.failed || 0,
      });
    } catch (err: any) {
      setToast({ message: err.message || 'Error al cargar generaciones', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterBrand, filterStatus, dateFrom, dateTo, page, limit]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const clearFilters = () => {
    setFilterBrand('');
    setFilterStatus('');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(filterBrand || filterStatus || searchTerm || dateFrom || dateTo);

  const handleRetry = async () => {
    if (!retryTarget) return;
    setRetryLoading(true);
    try {
      const data = await adminApi.post<{ success: boolean }>(
        `/api/admin/generations/${retryTarget.id}/retry`,
        {}
      );
      if (data.success) {
        setToast({ message: 'Generación reintentada correctamente', type: 'success' });
        setRetryTarget(null);
        fetchGenerations();
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Error al reintentar', type: 'error' });
    } finally {
      setRetryLoading(false);
    }
  };

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="font-jakarta text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Historial de Try-Ons
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {total.toLocaleString()} generaciones totales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['pending', 'processing', 'completed', 'failed'] as GenerationStatus[]).map((status) => (
          <div
            key={status}
            className="rounded-2xl border p-4 cursor-pointer transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: filterStatus === status ? STATUS_CONFIG[status].text : 'var(--border-color)',
            }}
            onClick={() => {
              setFilterStatus(filterStatus === status ? '' : status);
              setPage(1);
            }}
          >
            <p className="text-2xl font-bold" style={{ color: STATUS_CONFIG[status].text }}>
              {stats[status]}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {STATUS_CONFIG[status].label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); }}
            className="relative flex-1"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, marca o producto..."
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50"
            />
          </form>

          {/* Brand Filter */}
          <select
            value={filterBrand}
            onChange={(e) => { setFilterBrand(e.target.value); setPage(1); }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[180px]"
          >
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[160px]"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="processing">Procesando</option>
            <option value="completed">Completada</option>
            <option value="failed">Fallida</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none"
              style={{ colorScheme: 'dark' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white flex items-center gap-2"
            >
              <X className="h-4 w-4" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-[var(--border-color)] bg-[var(--bg-base)] text-left">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">ID</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Marca</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Producto</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Status</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Modelo</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Tiempo</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Fecha</th>
                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent)]/20 border-t-[var(--accent)]" />
                  </td>
                </tr>
              ) : generations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[var(--accent)]">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                      <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                        No hay generaciones que coincidan
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                generations.map((gen) => (
                  <tr
                    key={gen.id}
                    className="border-t border-[var(--border-color)] transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedGeneration(gen)}
                        className="font-mono text-xs text-[var(--accent)] hover:underline truncate block max-w-[120px]"
                        title={gen.id}
                      >
                        {gen.id.slice(0, 8)}...
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{gen.brand_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[var(--text-secondary)] truncate max-w-[160px]" title={gen.product_name || '—'}>
                        {gen.product_name || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: STATUS_CONFIG[gen.status].bg,
                          color: STATUS_CONFIG[gen.status].text,
                        }}
                      >
                        {STATUS_CONFIG[gen.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[var(--text-secondary)] text-xs uppercase">
                        {gen.model_provider || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[var(--text-secondary)] font-mono text-xs">
                        {gen.processing_time_ms != null ? `${gen.processing_time_ms}ms` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">
                      {new Date(gen.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedGeneration(gen)}
                          className="rounded-xl bg-white/5 p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-white"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {gen.status === 'failed' && (
                          <button
                            onClick={() => setRetryTarget(gen)}
                            className="rounded-xl bg-amber-500/10 p-2 text-amber-400 transition-colors hover:bg-amber-500/20"
                            title="Reintentar"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Mostrando {showingFrom} - {showingTo} de {total.toLocaleString()}
          </p>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 5) {
              p = i + 1;
            } else if (page <= 3) {
              p = i + 1;
            } else if (page >= totalPages - 2) {
              p = totalPages - 4 + i;
            } else {
              p = page - 2 + i;
            }
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                  p === page
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-1"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedGeneration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="font-jakarta text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Detalle de Generación
                </h2>
                <p className="mt-1 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{selectedGeneration.id}</p>
              </div>
              <button
                onClick={() => setSelectedGeneration(null)}
                className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status & Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[var(--border-color)] p-4">
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Estado</p>
                  <span
                    className="inline-flex rounded-full px-3 py-1.5 text-sm font-semibold"
                    style={{
                      backgroundColor: STATUS_CONFIG[selectedGeneration.status].bg,
                      color: STATUS_CONFIG[selectedGeneration.status].text,
                    }}
                  >
                    {STATUS_CONFIG[selectedGeneration.status].label}
                  </span>
                </div>
                <div className="rounded-xl border border-[var(--border-color)] p-4">
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Marca</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedGeneration.brand_name}</p>
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[var(--border-color)] p-4">
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Selfie</p>
                  {selectedGeneration.selfie_url ? (
                    <a href={selectedGeneration.selfie_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedGeneration.selfie_url}
                        alt="Selfie"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </a>
                  ) : (
                    <div className="h-40 flex items-center justify-center rounded-lg bg-[var(--bg-base)]">
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin imagen</p>
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-[var(--border-color)] p-4">
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Resultado</p>
                  {selectedGeneration.result_url ? (
                    <a href={selectedGeneration.result_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedGeneration.result_url}
                        alt="Resultado"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </a>
                  ) : (
                    <div className="h-40 flex items-center justify-center rounded-lg bg-[var(--bg-base)]">
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {selectedGeneration.status === 'failed' ? 'Error - sin resultado' : 'Pendiente'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {selectedGeneration.error_message && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-400 mb-1">Mensaje de error</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedGeneration.error_message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedGeneration.metadata && Object.keys(selectedGeneration.metadata).length > 0 && (
                <div className="rounded-xl border border-[var(--border-color)] p-4">
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Metadata</p>
                  <pre className="text-xs font-mono overflow-x-auto p-3 rounded-lg bg-[var(--bg-base)]" style={{ color: 'var(--text-secondary)' }}>
                    {JSON.stringify(selectedGeneration.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Actions */}
              {selectedGeneration.status === 'failed' && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedGeneration(null);
                      setRetryTarget(selectedGeneration);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-500/20"
                  >
                    <RotateCcw className="h-4 w-4" /> Reintentar generación
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Retry Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(retryTarget)}
        onClose={() => setRetryTarget(null)}
        onConfirm={handleRetry}
        title="Reintentar Generación"
        message={`¿Deseas reintentar la generación fallida del cliente "${retryTarget?.brand_name}"?`}
        confirmLabel={retryLoading ? 'Reintentando...' : 'Reintentar'}
        cancelLabel="Cancelar"
        variant="warning"
        isLoading={retryLoading}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </motion.div>
  );
}
