'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { AlertTriangle, CheckCircle, XCircle, Trash2, Eye, X, Filter, RefreshCw } from 'lucide-react';

interface Feedback {
  id: string;
  generation_id?: string;
  brand_id?: string;
  error_type: string;
  error_message?: string;
  user_description?: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  brands?: { name: string; slug: string };
}

interface Stats {
  total: number;
  resolved: number;
  unresolved: number;
  by_type: Record<string, number>;
}

const ERROR_TYPE_LABELS: Record<string, string> = {
  'face_detection_failed': 'Deteccion de rostro',
  'clothing_alignment': 'Alineacion de ropa',
  'image_quality': 'Calidad de imagen',
  'generation_timeout': 'Timeout de generacion',
  'model_error': 'Error del modelo',
  'other': 'Otro',
};

const ERROR_TYPE_COLORS: Record<string, string> = {
  'face_detection_failed': '#ef4444',
  'clothing_alignment': '#f59e0b',
  'image_quality': '#6b7280',
  'generation_timeout': '#8b5cf6',
  'model_error': '#dc2626',
  'other': '#999999',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, resolved: 0, unresolved: 0, by_type: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filtros
  const [filterErrorType, setFilterErrorType] = useState('');
  const [filterResolved, setFilterResolved] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  const fetchFeedbacks = useCallback(async () => {
    try {
      setError(null);
      let url = '/api/admin/feedback?';
      if (filterErrorType) url += `error_type=${filterErrorType}&`;
      if (filterResolved === 'true') url += 'resolved=true&';
      else if (filterResolved === 'false') url += 'resolved=false&';
      if (filterBrand) url += `brand_id=${filterBrand}&`;

      const [feedbacksData, statsData] = await Promise.all([
        adminApi.get<{ feedbacks: Feedback[] }>(url),
        adminApi.get<{ stats: Stats }>('/api/admin/feedback/stats'),
      ]);

      setFeedbacks(feedbacksData.feedbacks || []);
      setStats(statsData.stats || { total: 0, resolved: 0, unresolved: 0, by_type: {} });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterErrorType, filterResolved, filterBrand]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleResolve = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.patch(`/api/admin/feedback/${id}/resolve`);
      fetchFeedbacks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este feedback del RAG?')) return;
    setActionLoading(id);
    try {
      await adminApi.delete(`/api/admin/feedback/${id}`);
      fetchFeedbacks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const hasActiveFilters = filterErrorType || filterResolved || filterBrand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-5"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-jakarta font-bold tracking-tight">Feedback</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            Moderar errores reportados en generaciones
          </p>
        </div>
        <button
          onClick={fetchFeedbacks}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-opacity hover:opacity-80"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Total feedbacks</p>
        </div>
        <div
          className="rounded-2xl border p-4 cursor-pointer transition-colors"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: filterResolved === 'false' ? 'var(--accent)' : 'var(--border-color)' }}
          onClick={() => setFilterResolved(filterResolved === 'false' ? '' : 'false')}
        >
          <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{stats.unresolved}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Sin resolver</p>
        </div>
        <div
          className="rounded-2xl border p-4 cursor-pointer transition-colors"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: filterResolved === 'true' ? 'var(--accent)' : 'var(--border-color)' }}
          onClick={() => setFilterResolved(filterResolved === 'true' ? '' : 'true')}
        >
          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{stats.resolved}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Resueltos</p>
        </div>
        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tasa de resolucion</p>
        </div>
      </motion.div>

      {/* Stats por tipo de error */}
      {Object.keys(stats.by_type || {}).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          {Object.entries(stats.by_type).map(([type, count]) => (
            <div
              key={type}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: filterErrorType === type ? ERROR_TYPE_COLORS[type] || 'var(--accent)' : 'var(--border-color)',
              }}
              onClick={() => setFilterErrorType(filterErrorType === type ? '' : type)}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ERROR_TYPE_COLORS[type] || '#999' }}
              />
              <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
                {ERROR_TYPE_LABELS[type] || type}: {count}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <select
            value={filterErrorType}
            onChange={(e) => setFilterErrorType(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="">Todos los tipos</option>
            {Object.entries(ERROR_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <select
          value={filterResolved}
          onChange={(e) => setFilterResolved(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">Todos</option>
          <option value="false">Sin resolver</option>
          <option value="true">Resueltos</option>
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => { setFilterErrorType(''); setFilterResolved(''); setFilterBrand(''); }}
            className="px-3 py-2 text-sm rounded-xl border transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            Limpiar filtros
          </button>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </motion.div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
        </div>
      ) : feedbacks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 rounded-2xl border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <CheckCircle className="w-12 h-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p className="mt-3" style={{ color: 'var(--text-muted)' }}>No hay feedbacks</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }} className="border-b">
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Tipo error</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Marca</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Descripcion</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Estado</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Fecha</th>
                <th className="text-right px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb) => (
                <tr
                  key={fb.id}
                  className="border-b last:border-0 transition-colors"
                  style={{ borderColor: 'var(--border-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${ERROR_TYPE_COLORS[fb.error_type] || '#999'}20`, color: ERROR_TYPE_COLORS[fb.error_type] || '#999' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ERROR_TYPE_COLORS[fb.error_type] || '#999' }} />
                      {ERROR_TYPE_LABELS[fb.error_type] || fb.error_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: 'var(--text-secondary)' }} className="text-sm">
                      {fb.brands?.name || fb.brand_id || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p style={{ color: 'var(--text-primary)' }} className="text-sm line-clamp-2">
                      {fb.user_description || fb.error_message || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {fb.resolved ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                      >
                        <CheckCircle className="w-3 h-3" /> Resuelto
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                      >
                        <XCircle className="w-3 h-3" /> Sin resolver
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(fb.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedFeedback(fb)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!fb.resolved && (
                        <button
                          onClick={() => handleResolve(fb.id)}
                          disabled={actionLoading === fb.id}
                          className="p-2 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: '#10b981' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Marcar como resuelto"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(fb.id)}
                        disabled={actionLoading === fb.id}
                        className="p-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ color: '#ef4444' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Modal de detalles */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl max-w-lg w-full border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Detalle del Feedback</h2>
              <button onClick={() => setSelectedFeedback(null)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Tipo de error</label>
                <p style={{ color: 'var(--text-primary)' }}>
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                    style={{ backgroundColor: `${ERROR_TYPE_COLORS[selectedFeedback.error_type] || '#999'}20`, color: ERROR_TYPE_COLORS[selectedFeedback.error_type] || '#999' }}
                  >
                    {ERROR_TYPE_LABELS[selectedFeedback.error_type] || selectedFeedback.error_type}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Marca</label>
                <p style={{ color: 'var(--text-primary)' }}>{selectedFeedback.brands?.name || selectedFeedback.brand_id || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Mensaje de error</label>
                <p className="text-sm mt-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
                  {selectedFeedback.error_message || '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Descripcion del usuario</label>
                <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                  {selectedFeedback.user_description || '—'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Estado</label>
                  <p className="mt-1">
                    {selectedFeedback.resolved ? (
                      <span className="inline-flex items-center gap-1" style={{ color: '#10b981' }}>
                        <CheckCircle className="w-4 h-4" /> Resuelto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1" style={{ color: '#ef4444' }}>
                        <XCircle className="w-4 h-4" /> Sin resolver
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Fecha</label>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedFeedback.created_at)}</p>
                </div>
              </div>
              {selectedFeedback.resolved && selectedFeedback.resolved_by && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Resuelto por</label>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{selectedFeedback.resolved_by}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cerrar
              </button>
              {!selectedFeedback.resolved && (
                <button
                  onClick={() => { handleResolve(selectedFeedback.id); setSelectedFeedback(null); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ backgroundColor: '#10b981', color: '#fff' }}
                >
                  Marcar resuelto
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
