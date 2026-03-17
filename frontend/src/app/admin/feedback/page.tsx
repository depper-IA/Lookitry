'use client';

import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

const ERROR_TYPE_LABELS: Record<string, string> = {
  wrong_clothing_removed: 'Ropa incorrecta eliminada',
  wrong_clothing_kept:    'Ropa incorrecta conservada',
  body_distortion:        'Distorsión corporal',
  color_wrong:            'Color incorrecto',
  product_not_applied:    'Producto no aplicado',
  background_changed:     'Fondo modificado',
  other:                  'Otro',
};

const ERROR_TYPE_COLORS: Record<string, string> = {
  wrong_clothing_removed: '#ef4444',
  wrong_clothing_kept:    '#f97316',
  body_distortion:        '#a855f7',
  color_wrong:            '#3b82f6',
  product_not_applied:    '#ec4899',
  background_changed:     '#14b8a6',
  other:                  '#6b7280',
};

interface Feedback {
  id: string;
  generation_id: string;
  brand_id: string;
  error_type: string;
  description: string | null;
  product_category: string | null;
  prompt_used: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

interface StatRow {
  error_type: string;
  product_category: string | null;
  count: number;
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks]     = useState<Feedback[]>([]);
  const [stats, setStats]             = useState<StatRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [resolving, setResolving]     = useState<string | null>(null);
  const [expanded, setExpanded]       = useState<string | null>(null);

  // Filtros
  const [filterType, setFilterType]       = useState('');
  const [filterResolved, setFilterResolved] = useState('false');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('error_type', filterType);
      if (filterResolved !== '') params.set('resolved', filterResolved);

      const [fbRes, stRes] = await Promise.all([
        fetch(`${API}/api/admin/feedback?${params}`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/feedback/stats`, { headers: authHeaders() }),
      ]);
      const fbData = await fbRes.json();
      const stData = await stRes.json();
      setFeedbacks(fbData.feedbacks ?? []);
      setStats(stData.stats ?? []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [filterType, filterResolved]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await fetch(`${API}/api/admin/feedback/${id}/resolve`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, resolved: true, resolved_at: new Date().toISOString() } : f));
    } finally {
      setResolving(null);
    }
  };

  const totalUnresolved = feedbacks.filter(f => !f.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
            Feedback de generaciones
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Errores reportados por clientes del widget
          </p>
        </div>
        {totalUnresolved > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#ef4444' }}>
            {totalUnresolved} sin resolver
          </span>
        )}
      </div>

      {/* Stats de errores frecuentes */}
      {stats.length > 0 && (
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
            Errores frecuentes (sin resolver)
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.slice(0, 8).map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ERROR_TYPE_COLORS[s.error_type] ?? '#6b7280' }}
                />
                <span className="font-medium">{ERROR_TYPE_LABELS[s.error_type] ?? s.error_type}</span>
                {s.product_category && (
                  <span style={{ color: 'var(--text-muted)' }}>· {s.product_category}</span>
                )}
                <span
                  className="font-bold px-1.5 py-0.5 rounded-md text-white text-[10px]"
                  style={{ backgroundColor: ERROR_TYPE_COLORS[s.error_type] ?? '#6b7280' }}
                >
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(ERROR_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={filterResolved}
          onChange={e => setFilterResolved(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="false">Sin resolver</option>
          <option value="true">Resueltos</option>
          <option value="">Todos</option>
        </select>

        <button
          onClick={load}
          className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1.5 transition-colors hover:opacity-80"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No hay feedbacks con estos filtros</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden xl:table-cell" style={{ color: 'var(--text-muted)' }}>Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((f, i) => (
                <>
                  <tr
                    key={f.id}
                    className="transition-colors cursor-pointer"
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: expanded === f.id ? 'var(--bg-hover)' : i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)',
                    }}
                    onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-white"
                        style={{ backgroundColor: ERROR_TYPE_COLORS[f.error_type] ?? '#6b7280' }}
                      >
                        {ERROR_TYPE_LABELS[f.error_type] ?? f.error_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      {f.product_category ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
                      <span className="truncate block">{f.description ?? <span style={{ color: 'var(--text-muted)' }}>Sin descripción</span>}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(f.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {f.resolved ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Resuelto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#f97316' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!f.resolved && (
                        <button
                          onClick={e => { e.stopPropagation(); handleResolve(f.id); }}
                          disabled={resolving === f.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{ backgroundColor: '#FF5C3A' }}
                        >
                          {resolving === f.id ? '...' : 'Resolver'}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Fila expandida con prompt */}
                  {expanded === f.id && f.prompt_used && (
                    <tr key={`${f.id}-exp`} style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                      <td colSpan={6} className="px-4 pb-4 pt-2">
                        <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          Prompt usado en la generación
                        </p>
                        <pre
                          className="text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words"
                          style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', maxHeight: '160px' }}
                        >
                          {f.prompt_used}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
