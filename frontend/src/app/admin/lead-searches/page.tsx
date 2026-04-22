'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
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

// === ICONS ===
function IconPlus() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function IconPlay() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconTrash() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconX() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconSpinner() {
  return <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function IconWarning() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function IconSearch() {
  return <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function IconClock() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconMapPin() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function IconTag() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.025.171 1.43.476l2.227 2.215a2 2 0 010 2.835l-5.523 5.523a2 2 0 01-.64.285l-3.328 1.165a2 2 0 01-1.381.556H7a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>;
}
function IconBolt() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}
function IconUsers() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function IconLightbulb() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
}
function IconCheck() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}

function formatDate(iso?: string) {
  if (!iso) return 'Nunca';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getQuotaColor(percentage: number): string {
  if (percentage >= 90) return '#ef4444';
  if (percentage >= 75) return '#f59e0b';
  return '#10b981';
}

function getQuotaBgColor(percentage: number): string {
  if (percentage >= 90) return 'rgba(239,68,68,0.1)';
  if (percentage >= 75) return 'rgba(245,158,11,0.1)';
  return 'rgba(16,185,129,0.1)';
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
      alert(`Búsqueda completada: ${data.inserted} leads nuevos, ${data.duplicates} duplicados`);
      fetchSearches();
    } catch (err: any) {
      setError(err.message || 'Error ejecutando búsqueda');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta búsqueda?')) return;
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
      className="p-6 max-w-6xl mx-auto"
    >
      {/* HEADER EXPLICATIVO */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}>
            <IconSearch />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Generador de Leads
            </h1>
            <p className="mt-2 text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              Busca automáticamente negocios de moda en Google Maps y los agrega como leads para tu equipo de ventas. 
              Usa Google Places API para encontrar boutiques, tiendas de ropa y accesorios.
            </p>
          </div>
        </div>
      </div>

      {/* QUOTA CARDS MEJORADOS */}
      {quota && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card Diario */}
          <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Hoy</span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: getQuotaBgColor((quota.daily_used / quota.daily_limit) * 100), color: getQuotaColor((quota.daily_used / quota.daily_limit) * 100) }}>
                {(quota.daily_used / quota.daily_limit * 100).toFixed(0)}% usado
              </span>
            </div>
            <p className="text-4xl font-bold tracking-tight mb-1" style={{ color: getQuotaColor((quota.daily_used / quota.daily_limit) * 100) }}>
              {quota.daily_remaining}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              búsquedas restantes hoy
            </p>
            <div className="w-full rounded-full h-2 mt-3" style={{ backgroundColor: 'var(--border-color)' }}>
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${(quota.daily_used / quota.daily_limit) * 100}%`, backgroundColor: getQuotaColor((quota.daily_used / quota.daily_limit) * 100) }}
              />
            </div>
          </div>

          {/* Card Mensual */}
          <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Este mes</span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: getQuotaBgColor((quota.monthly_used / quota.monthly_limit) * 100), color: getQuotaColor((quota.monthly_used / quota.monthly_limit) * 100) }}>
                {(quota.monthly_used / quota.monthly_limit * 100).toFixed(0)}% usado
              </span>
            </div>
            <p className="text-4xl font-bold tracking-tight mb-1" style={{ color: getQuotaColor((quota.monthly_used / quota.monthly_limit) * 100) }}>
              {quota.monthly_remaining.toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              búsquedas restantes este mes
            </p>
            <div className="w-full rounded-full h-2 mt-3" style={{ backgroundColor: 'var(--border-color)' }}>
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${(quota.monthly_used / quota.monthly_limit) * 100}%`, backgroundColor: getQuotaColor((quota.monthly_used / quota.monthly_limit) * 100) }}
              />
            </div>
          </div>

          {/* Card Info */}
          <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-3">
              <IconLightbulb />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Sobre la quota</span>
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <p>Google Places free tier permite hasta <strong style={{ color: 'var(--text-primary)' }}>28,000 búsquedas al mes</strong>.</p>
              <p>El límite diario es de 500 búsquedas. La quota se reinicia cada día y cada mes automáticamente.</p>
            </div>
          </div>
        </div>
      )}

      {/* COMO FUNCIONA */}
      <div className="mb-8 p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Cómo funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}>
              <IconTag />
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>1. Configura los keywords</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Define términos como &quot;boutique&quot;, &quot;ropa mujer&quot; o &quot;denim&quot; para encontrar negocios relevantes
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}>
              <IconBolt />
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>2. Ejecuta la búsqueda</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Click en &quot;Ejecutar&quot; y el sistema buscará negocios en Google Maps según tu configuración
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}>
              <IconUsers />
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>3. Revisa los leads</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Los leads encontrados aparecerán en tu panel de CRM con toda la información de contacto
            </p>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
          <IconWarning />
          <span style={{ color: '#ef4444' }}>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><IconX /></button>
        </div>
      )}

      {/* SEARCHES LIST */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Búsquedas configuradas
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          <IconPlus />
          Nueva Búsqueda
        </button>
      </div>

      {searches.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="mb-4">
            <IconSearch />
          </div>
          <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No hay búsquedas configuradas</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Crea tu primera búsqueda para empezar a generar leads automáticamente
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            <IconPlus />
            Crear primera búsqueda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {searches.map((search) => (
            <motion.div
              key={search.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border p-5 transition-colors"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                    {search.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: search.schedule_enabled ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', color: search.schedule_enabled ? '#10b981' : '#6366f1' }}>
                      {search.schedule_enabled ? 'Programada' : 'Manual'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRun(search.id)}
                    disabled={actionLoading === search.id}
                    className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                    style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)' }}
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
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 mb-3">
                <IconMapPin />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {search.city ? `${search.city}, ` : ''}{search.country}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  • {search.search_radius_km}km radio
                </span>
              </div>

              {/* Keywords */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconTag />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>KEYWORDS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {search.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-1 rounded-md text-xs" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <IconClock />
                  <span>Última: {formatDate(search.last_run_at)}</span>
                </div>
                {search.last_results_count > 0 && (
                  <div className="flex items-center gap-1 text-sm" style={{ color: '#10b981' }}>
                    <IconCheck />
                    <span>{search.last_results_count} leads nuevos</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
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
      setLocalError(err.message || 'Error al crear búsqueda');
    }
    setSaving(false);
  };

  const keywordExamples = ['boutique', 'ropa mujer', 'denim', 'accesorios moda', 'zapatos', 'tienda ropa'];
  const parsedKeywords = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="rounded-2xl max-w-xl w-full border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Nueva Búsqueda de Leads</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
            <IconX />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Nombre de la búsqueda *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ej: Boutiques en Cali"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', '--focus-ring-color': 'var(--accent)' } as React.CSSProperties}
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Un nombre para identificar esta búsqueda
            </p>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Ubicación *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="Colombia">Colombia</option>
                <option value="USA">USA</option>
                <option value="España">España</option>
              </select>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ciudad (opcional)"
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Si no especificas ciudad, se buscarán negocios en todo el país
            </p>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Keywords de búsqueda *
            </label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="boutique, ropa moda, accesorios"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Términos para buscar negocios en Google. Sepáralos con coma.
            </p>
            
            {/* Ejemplos */}
            <div className="mt-3">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Ejemplos: </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {keywordExamples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      const current = form.keywords ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
                      if (!current.includes(ex)) {
                        setForm({ ...form, keywords: [...current, ex].join(', ') });
                      }
                    }}
                    className="px-2 py-1 text-xs rounded-md transition-colors hover:scale-105"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview de búsqueda */}
          {parsedKeywords.length > 0 && (
            <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>PREVIEW DE LA BÚSQUEDA</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Buscar negocios que contengan <strong>{parsedKeywords.join('</strong> o <strong>')}</strong> 
                {form.city ? ` en ${form.city}` : ` en ${form.country}`}
                {form.search_radius_km ? ` dentro de ${form.search_radius_km}km` : ''}
              </p>
            </div>
          )}

          {/* Configuración */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Máx resultados
              </label>
              <input
                type="number"
                value={form.max_results}
                onChange={(e) => setForm({ ...form, max_results: e.target.value })}
                min="1"
                max="200"
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Límite de leads a guardar
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Radio de búsqueda
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.search_radius_km}
                  onChange={(e) => setForm({ ...form, search_radius_km: e.target.value })}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all pr-12"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>km</span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                radio en kilómetros desde el centro
              </p>
            </div>
          </div>

          {localError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <IconWarning />
              <span>{localError}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim() || !form.keywords.trim()}
            className="px-5 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            {saving ? <IconSpinner /> : <IconPlus />}
            Crear búsqueda
          </button>
        </div>
      </motion.div>
    </div>
  );
}
