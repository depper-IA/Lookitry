'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

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
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/lead-searches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error cargando búsquedas');
      const data = await res.json();
      setSearches(data.searches || []);

      const quotaRes = await fetch(`${API_URL}/api/admin/lead-searches/quota`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json();
        setQuota(quotaData);
      }
    } catch (err: any) {
      setError(err.message);
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
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/lead-searches/${id}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error ejecutando búsqueda');
      alert(`Búsqueda completada: ${data.inserted} leads nuevos, ${data.duplicates} duplicados`);
      fetchSearches();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta búsqueda?')) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${API_URL}/api/admin/lead-searches/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
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
          <h1 className="text-2xl font-bold text-[#0a0a0a]">Lead Searches</h1>
          <p className="text-sm text-[#999] mt-1">
            Búsquedas en Google Places
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF5C3A] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <IconPlus />
          Nueva Búsqueda
        </button>
      </div>

      {quota && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-[#e5e5e5] p-4">
            <p className="text-2xl font-bold text-[#FF5C3A]">{quota.daily_remaining}</p>
            <p className="text-xs text-[#999]">Búsquedas hoy (límite: {quota.daily_limit})</p>
          </div>
          <div className="bg-white rounded-lg border border-[#e5e5e5] p-4">
            <p className="text-2xl font-bold text-[#3b82f6]">{quota.monthly_remaining}</p>
            <p className="text-xs text-[#999]">Este mes (límite: {quota.monthly_limit})</p>
          </div>
          <div className="bg-white rounded-lg border border-[#e5e5e5] p-4 col-span-2">
            <p className="text-sm text-[#999]">Google Places free tier: 28,000 búsquedas/mes</p>
            <div className="w-full bg-[#e5e5e5] rounded-full h-2 mt-2">
              <div
                className="bg-[#FF5C3A] h-2 rounded-full"
                style={{ width: `${(quota.monthly_used / quota.monthly_limit) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[#999] mt-1">Usado: {quota.monthly_used}/{quota.monthly_limit}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <IconWarning />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><IconX /></button>
        </div>
      )}

      {searches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-[#e5e5e5]">
          <IconSearch />
          <p className="text-[#999] mt-2">No hay búsquedas configuradas</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-[#FF5C3A] hover:underline"
          >
            Crear la primera
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e5e5e5]">
                <th className="text-left px-4 py-3 text-sm font-medium text-[#666]">Nombre</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#666]">Ubicación</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#666]">Keywords</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#666]">Última corrida</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#666]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {searches.map((search) => (
                <tr key={search.id} className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0a0a0a]">{search.name}</p>
                    <p className="text-xs text-[#999]">
                      {search.schedule_enabled ? 'Programada' : 'Manual'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#666]">
                    {search.city || 'Todas'}, {search.country}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {search.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#f5f5f5] rounded text-xs text-[#666]">
                          {kw}
                        </span>
                      ))}
                      {search.keywords.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-[#999]">
                          +{search.keywords.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#666]">
                    <div className="flex items-center gap-1">
                      <IconClock />
                      {formatDate(search.last_run_at)}
                    </div>
                    {search.last_results_count > 0 && (
                      <p className="text-xs text-[#10b981]">{search.last_results_count} leads</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRun(search.id)}
                        disabled={actionLoading === search.id}
                        className="p-2 text-[#10b981] hover:bg-[#f0fdf4] rounded-lg transition-colors disabled:opacity-50"
                        title="Ejecutar búsqueda"
                      >
                        {actionLoading === search.id ? <IconSpinner /> : <IconPlay />}
                      </button>
                      <button
                        onClick={() => handleDelete(search.id)}
                        disabled={actionLoading === search.id}
                        className="p-2 text-[#999] hover:text-[#ef4444] hover:bg-[#fef2f2] rounded-lg transition-colors disabled:opacity-50"
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
        <SearchModal onClose={() => setShowModal(false)} onSave={fetchSearches} />
      )}
    </motion.div>
  );
}

function SearchModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
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

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.keywords.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${API_URL}/api/admin/lead-searches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          country: form.country,
          city: form.city || undefined,
          keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
          max_results: parseInt(form.max_results) || 50,
          search_radius_km: parseInt(form.search_radius_km) || 10,
          schedule_enabled: form.schedule_enabled,
        }),
      });
      onSave();
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-[#e5e5e5]">
          <h2 className="text-lg font-bold text-[#0a0a0a]">Nueva Búsqueda</h2>
          <button onClick={onClose}><IconX /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ej: Boutiques Cali"
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">País *</label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
              >
                <option value="Colombia">Colombia</option>
                <option value="USA">USA</option>
                <option value="España">España</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Keywords *</label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="boutique, ropa moda, accesorios (separados por coma)"
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Máx resultados</label>
              <input
                type="number"
                value={form.max_results}
                onChange={(e) => setForm({ ...form, max_results: e.target.value })}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Radio (km)</label>
              <input
                type="number"
                value={form.search_radius_km}
                onChange={(e) => setForm({ ...form, search_radius_km: e.target.value })}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-[#e5e5e5]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#666] hover:text-[#0a0a0a] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim() || !form.keywords.trim()}
            className="px-4 py-2 bg-[#FF5C3A] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <IconSpinner /> : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
