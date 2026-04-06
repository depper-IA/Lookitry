'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';

interface LeadSearch {
  id: string;
  name: string;
  country: string;
  city?: string;
  keywords: string[];
  search_radius_km: number;
  max_results: number;
  schedule_enabled: boolean;
  last_run_at?: string;
  last_results_count: number;
  created_at: string;
}

interface QuotaStatus {
  daily_used: number;
  monthly_used: number;
  daily_limit: number;
  monthly_limit: number;
  daily_remaining: number;
  monthly_remaining: number;
}

interface SearchesResponse {
  searches: LeadSearch[];
}

interface QuotaResponse {
  daily_used: number;
  monthly_used: number;
  daily_limit: number;
  monthly_limit: number;
  daily_remaining: number;
  monthly_remaining: number;
}

function IconPlus() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function IconPlay() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconTrash() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconX() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function IconWarning() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function IconSearch() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function IconClock() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function formatDate(iso?: string) {
  if (!iso) return 'Nunca';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LeadSearchesPage() {
  const [searches, setSearches] = useState<LeadSearch[]>([]);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSearches = useCallback(async () => {
    try {
      const data = await adminApi.get<SearchesResponse>('/admin/lead-searches');
      setSearches(data.searches || []);

      try {
        const quotaData = await adminApi.get<QuotaResponse>('/admin/lead-searches/quota');
        setQuota(quotaData);
      } catch {
        // Quota endpoint may not exist, silently ignore
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando búsquedas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  const handleRun = async (id: string) => {
    setActionLoading(id);
    try {
      const data = await adminApi.post<{ inserted: number; duplicates: number; message?: string }>(`/admin/lead-searches/${id}/run`);
      alert(`Busqueda completada: ${data.inserted} leads nuevos, ${data.duplicates} duplicados`);
      fetchSearches();
    } catch (err: any) {
      setError(err.message || 'Error ejecutando busqueda');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta busqueda?')) return;
    setActionLoading(id);
    try {
      await adminApi.delete(`/admin/lead-searches/${id}`);
      fetchSearches();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Lead Searches</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Búsquedas en Google Places
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          <IconPlus />
          Nueva Búsqueda
        </button>
      </div>

      {quota && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{quota.daily_remaining}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Búsquedas hoy (límite: {quota.daily_limit})</p>
          </div>
          <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{quota.monthly_remaining}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Este mes (límite: {quota.monthly_limit})</p>
          </div>
          <div className="rounded-lg border p-4 col-span-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Google Places free tier: 28,000 búsquedas/mes</p>
            <div className="w-full rounded-full h-2 mt-2" style={{ backgroundColor: 'var(--border-color)' }}>
              <div
                className="h-2 rounded-full"
                style={{ width: `${(quota.monthly_used / quota.monthly_limit) * 100}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Usado: {quota.monthly_used}/{quota.monthly_limit}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
          <IconWarning />
          <span style={{ color: '#ef4444' }}>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><IconX /></button>
        </div>
      )}

      {searches.length === 0 ? (
        <div className="text-center py-12 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <IconSearch />
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>No hay búsquedas configuradas</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            Crear la primera
          </button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Nombre</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Ubicación</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Keywords</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Última corrida</th>
                <th className="text-right px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {searches.map((search) => (
                <tr key={search.id} className="border-b last:border-0 transition-colors" style={{ borderColor: 'var(--border-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{search.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {search.schedule_enabled ? 'Programada' : 'Manual'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {search.city || 'Todas'}, {search.country}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {search.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                          {kw}
                        </span>
                      ))}
                      {search.keywords.length > 3 && (
                        <span className="px-2 py-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          +{search.keywords.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1">
                      <IconClock />
                      {formatDate(search.last_run_at)}
                    </div>
                    {search.last_results_count > 0 && (
                      <p className="text-xs" style={{ color: '#10b981' }}>{search.last_results_count} leads</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRun(search.id)}
                        disabled={actionLoading === search.id}
                        className="p-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ color: '#10b981' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Ejecutar búsqueda"
                      >
                        {actionLoading === search.id ? <IconSpinner /> : <IconPlay />}
                      </button>
                      <button
                        onClick={() => handleDelete(search.id)}
                        disabled={actionLoading === search.id}
                        className="p-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Eliminar"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <SearchModal onClose={() => setShowModal(false)} onSave={fetchSearches} setError={setError} />
      )}
    </motion.div>
  );
}

function SearchModal({ onClose, onSave, setError }: { onClose: () => void; onSave: () => void; setError: (msg: string) => void }) {
  const [form, setForm] = useState({
    name: '',
    country: 'Colombia',
    city: '',
    keywords: '',
    max_results: '50',
    search_radius_km: '10',
    schedule_enabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.keywords.trim()) return;
    setSaving(true);
    setLocalError('');
    try {
      await adminApi.post('/admin/lead-searches', {
        name: form.name,
        country: form.country,
        city: form.city || undefined,
        keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        max_results: parseInt(form.max_results) || 50,
        search_radius_km: parseInt(form.search_radius_km) || 10,
        schedule_enabled: form.schedule_enabled,
      });
      onSave();
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Error al crear busqueda');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl max-w-lg w-full border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Nueva Búsqueda</h2>
          <button onClick={onClose}><IconX /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ej: Boutiques Cali"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>País *</label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="Colombia">Colombia</option>
                <option value="USA">USA</option>
                <option value="España">España</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Opcional"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Keywords *</label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="boutique, ropa moda, accesorios (separados por coma)"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Máx resultados</label>
              <input
                type="number"
                value={form.max_results}
                onChange={(e) => setForm({ ...form, max_results: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Radio (km)</label>
              <input
                type="number"
                value={form.search_radius_km}
                onChange={(e) => setForm({ ...form, search_radius_km: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          {localError && (
            <div className="text-sm text-red-500 mt-2">{localError}</div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim() || !form.keywords.trim()}
            className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            {saving ? <IconSpinner /> : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
