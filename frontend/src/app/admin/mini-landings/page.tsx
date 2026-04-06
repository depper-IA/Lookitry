'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://lookitry.com';

interface LandingBrand {
  id: string;
  name: string;
  email: string;
  slug: string;
  plan: string;
  is_in_trial?: boolean;
  has_landing_page: boolean;
  landing_suspended_at: string | null;
  subscription_status: string | null;
  created_at: string;
  dias_para_eliminacion: number | null;
}

type FilterEstado = 'all' | 'activa' | 'suspendida' | 'inactiva';
type FilterPlanML = 'all' | 'TRIAL' | 'BASIC' | 'PRO';
type SortFieldML = 'name' | 'plan' | 'estado' | 'dias';
type SortOrder = 'asc' | 'desc';

function getEstado(b: LandingBrand): 'activa' | 'suspendida' | 'inactiva' {
  if (b.landing_suspended_at) return 'suspendida';
  if (b.has_landing_page) return 'activa';
  return 'inactiva';
}

// ── Iconos ────────────────────────────────────────────────────────────────────
function IconGlobe({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}
function IconPause({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" /><circle cx="12" cy="12" r="10" />
    </svg>
  );
}
function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-5.197-3.027A1 1 0 008 9.027v5.946a1 1 0 001.555.832l5.197-3.027a1 1 0 000-1.61z" /><circle cx="12" cy="12" r="10" />
    </svg>
  );
}
function IconToggleOn({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="1" y="7" width="22" height="10" rx="5" /><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconToggleOff({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="1" y="7" width="22" height="10" rx="5" /><circle cx="8" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconExternal({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
function IconWarning({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}
function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AdminMiniLandingsPage() {
  const [brands, setBrands] = useState<LandingBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('all');
  const [filterPlan, setFilterPlan] = useState<FilterPlanML>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ brand: LandingBrand; action: 'activate' | 'deactivate' | 'suspend' | 'restore' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortFieldML>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const ITEMS_PER_PAGE = 5;

  // ── Modal Promo Global ───────────────────────────────────────────────────
  const [modalConfig, setModalConfig] = useState({
    title: 'Activa tu Mini-Landing personalizada',
    description: 'Muestra tus productos en una página web profesional optimizada para móviles y aumenta tus ventas.',
    imageUrl: '',
    previewMinutes: 0.25,
  });
  const [savingModal, setSavingModal] = useState(false);
  const [alertState, setAlertState] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchModalConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.modal_promo_config) {
          setModalConfig({
            title: data.modal_promo_config.title,
            description: data.modal_promo_config.description,
            imageUrl: data.modal_promo_config.imageUrl,
            previewMinutes: (data.modal_promo_config.previewSeconds || data.modal_promo_config.previewMinutes * 60 || 15) / 60,
          });
        } else {
          setModalConfig({
            title: data.modal_title || 'Activa tu Mini-Landing personalizada',
            description: data.modal_description || 'Muestra tus productos en una página web profesional.',
            imageUrl: data.modal_image_url || '',
            previewMinutes: (data.mini_landing_preview_seconds || 15) / 60,
          });
        }
      }
    } catch {}
  }, []);

  const handleSaveModalConfig = async () => {
    setSavingModal(true);
    setAlertState(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modal_promo_config: {
            ...modalConfig,
            previewSeconds: Math.round(modalConfig.previewMinutes * 60)
          },
          modal_title: modalConfig.title,
          modal_description: modalConfig.description,
          modal_image_url: modalConfig.imageUrl,
          mini_landing_preview_seconds: Math.round(modalConfig.previewMinutes * 60)
        }),
      });
      if (!res.ok) throw new Error('Error al guardar la configuración');
      setAlertState({ type: 'success', message: 'Configuración guardada correctamente' });
      setTimeout(() => setAlertState(null), 3000);
    } catch (err: any) { 
      setAlertState({ type: 'error', message: err.message });
    } finally {
      setSavingModal(false);
    }
  };

  const toggleSort = (field: SortFieldML) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/mini-landings`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar');
      setBrands(data.brands);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBrands(); fetchModalConfig(); }, [fetchBrands, fetchModalConfig]);
  useEffect(() => { setCurrentPage(1); }, [search, filterEstado, filterPlan]);

  const filtered = useMemo(() => {
    const base = brands.filter(b => {
      const matchSearch =
        !search ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.email.toLowerCase().includes(search.toLowerCase()) ||
        b.slug.toLowerCase().includes(search.toLowerCase());
      const matchEstado = filterEstado === 'all' || getEstado(b) === filterEstado;
      const matchPlan = filterPlan === 'all'
        ? true
        : filterPlan === 'TRIAL'
        ? b.plan === 'TRIAL'
        : b.plan === filterPlan;
      return matchSearch && matchEstado && matchPlan;
    });

    return [...base].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';
      if (sortField === 'name') {
        valA = a.name.toLowerCase(); valB = b.name.toLowerCase();
      } else if (sortField === 'plan') {
        valA = a.plan; valB = b.plan;
      } else if (sortField === 'estado') {
        const order = { activa: 0, suspendida: 1, inactiva: 2 };
        valA = order[getEstado(a)]; valB = order[getEstado(b)];
      } else if (sortField === 'dias') {
        valA = a.dias_para_eliminacion ?? 999; valB = b.dias_para_eliminacion ?? 999;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [brands, search, filterEstado, filterPlan, sortField, sortOrder]);

  const counts = {
    all: brands.length,
    activa: brands.filter(b => getEstado(b) === 'activa').length,
    suspendida: brands.filter(b => getEstado(b) === 'suspendida').length,
    inactiva: brands.filter(b => getEstado(b) === 'inactiva').length,
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleAction = async (brand: LandingBrand, action: 'activate' | 'deactivate' | 'suspend' | 'restore') => {
    setActionLoading(brand.id + action);
    setConfirmModal(null);

    try {
      let res: Response;
      if (action === 'activate' || action === 'deactivate') {
        res = await fetch(`${API_URL}/api/admin/brands/${brand.id}/landing-page`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ has_landing_page: action === 'activate' }),
        });
      } else if (action === 'suspend') {
        res = await fetch(`${API_URL}/api/admin/mini-landings/${brand.id}/suspend`, {
          method: 'PATCH',
          credentials: 'include',
        });
      } else {
        res = await fetch(`${API_URL}/api/admin/mini-landings/${brand.id}/restore`, {
          method: 'PATCH',
          credentials: 'include',
        });
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      await fetchBrands();
    } catch (err: any) {
      setAlertState({ type: 'error', message: err.message || 'Error al ejecutar acción' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
      <IconWarning className="w-4 h-4 flex-shrink-0" />
      {error}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-5"
    >
      {alertState && (
        <div className={`fixed top-6 right-6 z-[60] max-w-sm px-5 py-4 rounded-2xl border shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-right-4 duration-300 ${
          alertState.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
            : 'bg-red-500/10 border-red-500/30 text-red-500'
        }`} style={{ backdropFilter: 'blur(8px)' }}>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1">{alertState.type === 'success' ? 'Éxito' : 'Error'}</p>
            <p className="text-sm font-bold leading-tight">{alertState.message}</p>
          </div>
          <button onClick={() => setAlertState(null)} className="hover:opacity-70 transition-opacity text-xs p-1 mt-1">✕</button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>
            Mini-Landings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Total: {brands.length} | Mostrando: {filtered.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBrands}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest border transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}
          >
            <IconRefresh className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { key: 'all',       label: 'Total',       color: 'var(--text-primary)' },
          { key: 'activa',    label: 'Activas',     color: '#22c55e' },
          { key: 'suspendida',label: 'Suspendidas', color: '#FF5C3A' },
          { key: 'inactiva',  label: 'Inactivas',   color: '#6b7280' },
        ] as const).map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilterEstado(key)}
            className="p-4 rounded-[2rem] border text-left transition-all"
            style={{
              backgroundColor: filterEstado === key ? 'rgba(255,92,58,0.06)' : 'var(--bg-card)',
              borderColor: filterEstado === key ? '#FF5C3A' : 'var(--border-color)',
            }}
          >
            <p className="text-2xl font-bold" style={{ color }}>{counts[key]}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="rounded-[2rem] border p-4 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o slug..."
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-2">
            {([
              { value: 'all',   label: 'Todos' },
              { value: 'TRIAL', label: 'Trial' },
              { value: 'BASIC', label: 'Basic' },
              { value: 'PRO',   label: 'Pro' },
            ] as { value: FilterPlanML; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterPlan(value)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border"
                style={{
                  backgroundColor: filterPlan === value ? '#FF5C3A' : 'var(--bg-base)',
                  color: filterPlan === value ? '#fff' : 'var(--text-secondary)',
                  borderColor: filterPlan === value ? '#FF5C3A' : 'var(--border-color)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Paginación Superior */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-[2rem] border px-6 py-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Página {currentPage} de {totalPages} <span className="mx-1 opacity-30">|</span> {filtered.length} marcas
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest disabled:opacity-40 transition-all hover:bg-black/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}
            >
              Anterior
            </button>
            <div className="flex gap-1 items-center px-2">
              <span className="text-[10px] font-black text-[#FF5C3A]">{currentPage}</span>
              <span className="text-[10px] font-black opacity-20">/</span>
              <span className="text-[10px] font-black text-[var(--text-muted)]">{totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest disabled:opacity-40 transition-all hover:bg-black/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-[2rem] border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-base)' }}>
                {([
                  { label: 'Marca',               field: 'name'   as SortFieldML },
                  { label: 'Plan',                field: 'plan'   as SortFieldML },
                  { label: 'Estado landing',      field: 'estado' as SortFieldML },
                  { label: 'Suscripción',         field: null },
                  { label: 'Días para eliminación', field: 'dias' as SortFieldML },
                  { label: 'Acciones',            field: null },
                ]).map(h => (
                  <th
                    key={h.label}
                    onClick={() => h.field && toggleSort(h.field)}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${h.field ? 'cursor-pointer hover:bg-black/5 transition-colors' : ''}`}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <div className="flex items-center gap-1">
                      {h.label}
                      {h.field && (
                        <ArrowUpDown className="w-3 h-3" style={{ color: sortField === h.field ? '#FF5C3A' : 'var(--text-muted)' }} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(brand => {
                const estado = getEstado(brand);
                const isLoading = (s: string) => actionLoading === brand.id + s;
                return (
                  <tr key={brand.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                    {/* Marca */}
                    <td className="px-4 py-3.5">
                      <a 
                        href={`${FRONTEND_URL}/sitio/${brand.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold hover:underline decoration-[#FF5C3A]/40 underline-offset-4 transition-all"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {brand.name}
                      </a>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{brand.email}</div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>{brand.slug}</div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={
                          brand.plan === 'TRIAL'
                            ? { backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }
                            : brand.plan === 'PRO'
                            ? { backgroundColor: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }
                            : { backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }
                        }
                      >
                        {brand.plan}
                      </span>
                    </td>

                    {/* Estado landing */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {estado === 'activa' && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Activa
                        </span>
                      )}
                      {estado === 'suspendida' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]" />
                          Suspendida
                        </span>
                      )}
                      {estado === 'inactiva' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Inactiva
                        </span>
                      )}
                    </td>

                    {/* Suscripción */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {brand.subscription_status === 'active' && <span className="text-xs text-emerald-600 font-medium">Activa</span>}
                      {brand.subscription_status === 'expiring_soon' && <span className="text-xs text-amber-600 font-medium">Por vencer</span>}
                      {brand.subscription_status === 'suspended' && <span className="text-xs font-medium" style={{ color: '#FF5C3A' }}>Suspendida</span>}
                      {brand.subscription_status === 'expired' && <span className="text-xs text-red-600 font-medium">Vencida</span>}
                      {!brand.subscription_status && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>

                    {/* Días para eliminación */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {brand.dias_para_eliminacion !== null ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold"
                          style={{ color: brand.dias_para_eliminacion <= 15 ? '#ef4444' : brand.dias_para_eliminacion <= 30 ? '#FF5C3A' : '#f59e0b' }}
                        >
                          <IconWarning className="w-3.5 h-3.5" />
                          {brand.dias_para_eliminacion}d
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                                        {/* Ver página */}
                        <a
                          href={`${FRONTEND_URL}/sitio/${brand.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg transition-all duration-150 hover:opacity-80"
                          style={{ color: '#3b82f6' }}
                          title="Ver página pública"
                        >
                          <IconExternal className="w-4 h-4" />
                        </a>

                        {/* Activar / Desactivar */}
                        {estado === 'inactiva' ? (
                          <button
                            onClick={() => setConfirmModal({ brand, action: 'activate' })}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg transition-all duration-150 hover:opacity-80 disabled:opacity-40"
                            style={{ color: '#22c55e' }}
                            title="Activar mini-landing"
                          >
                            {isLoading('activate')
                              ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-current" />
                              : <IconToggleOff className="w-4 h-4" />}
                          </button>
                        ) : estado === 'activa' ? (
                          <button
                            onClick={() => setConfirmModal({ brand, action: 'deactivate' })}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg transition-all duration-150 hover:opacity-80 disabled:opacity-40"
                            style={{ color: '#22c55e' }}
                            title="Desactivar mini-landing"
                          >
                            {isLoading('deactivate')
                              ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-current" />
                              : <IconToggleOn className="w-4 h-4" />}
                          </button>
                        ) : null}

                        {/* Suspender (solo si está activa) */}
                        {estado === 'activa' && (
                          <button
                            onClick={() => setConfirmModal({ brand, action: 'suspend' })}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg transition-all duration-150 hover:opacity-80 disabled:opacity-40"
                            style={{ color: '#f59e0b' }}
                            title="Suspender mini-landing (simula falta de pago)"
                          >
                            {isLoading('suspend')
                              ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-current" />
                              : <IconPause className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Restaurar (solo si está suspendida) */}
                        {estado === 'suspendida' && (
                          <button
                            onClick={() => setConfirmModal({ brand, action: 'restore' })}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg transition-all duration-150 hover:opacity-80 disabled:opacity-40"
                            style={{ color: '#22c55e' }}
                            title="Restaurar mini-landing"
                          >
                            {isLoading('restore')
                              ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-current" />
                              : <IconPlay className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <IconGlobe className="mx-auto w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sin resultados</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Ajusta los filtros de búsqueda.</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border px-4 py-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1
                : currentPage <= 3 ? i + 1
                : currentPage >= totalPages - 2 ? totalPages - 4 + i
                : currentPage - 2 + i;
              return (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className="px-3 py-1.5 rounded-lg border text-xs transition-colors"
                  style={{
                    backgroundColor: currentPage === p ? '#FF5C3A' : 'var(--bg-base)',
                    color: currentPage === p ? '#fff' : 'var(--text-secondary)',
                    borderColor: currentPage === p ? '#FF5C3A' : 'var(--border-color)',
                  }}>
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: CONFIGURACIÓN MODAL PROMO GLOBAL (NUEVO) ── */}
      <div className="mt-16 pt-10 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
            <IconGlobe className="w-6 h-6 text-[#FF5C3A]" />
          </div>
          <div>
            <h2 className="text-2xl font-jakarta font-bold text-[var(--text-primary)] tracking-tight">Configuración Modal Promo</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">Define el mensaje global que verán las marcas que aún no tienen mini-landing.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Edición */}
          <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 ml-1">Título del Modal</label>
                <input
                  type="text"
                  value={modalConfig.title}
                  onChange={e => setModalConfig({ ...modalConfig, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] text-sm font-bold outline-none focus:border-[#FF5C3A] transition-all"
                  placeholder="Ej: ¡Potencia tu marca hoy!"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 ml-1">Descripción / Beneficios</label>
                <textarea
                  value={modalConfig.description}
                  onChange={e => setModalConfig({ ...modalConfig, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] text-sm outline-none focus:border-[#FF5C3A] transition-all resize-none leading-relaxed"
                  placeholder="Explica las ventajas de tener una mini-landing..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 ml-1">Imagen URL (Opcional)</label>
                  <input
                    type="text"
                    value={modalConfig.imageUrl}
                    onChange={e => setModalConfig({ ...modalConfig, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] text-sm outline-none focus:border-[#FF5C3A] transition-all"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 ml-1">Tiempo de Vista Previa (Min)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={60}
                      value={modalConfig.previewMinutes}
                      onChange={e => setModalConfig({ ...modalConfig, previewMinutes: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-4 pr-12 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] text-sm font-mono font-bold outline-none focus:border-[#FF5C3A] transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--text-muted)] uppercase">min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveModalConfig}
                disabled={savingModal}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#FF5C3A] text-white text-xs font-black uppercase tracking-[0.2em] hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-[#FF5C3A]/20"
              >
                {savingModal ? <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-white" /> : <IconRefresh className="w-5 h-5" />}
                Guardar Configuración Global
              </button>
              <p className="text-[9px] text-center text-[var(--text-muted)] mt-4 uppercase font-bold tracking-widest">Aplica instantáneamente para todos los usuarios</p>
            </div>
          </div>

          {/* Vista Previa Interactiva */}
          <div className="bg-[var(--bg-base)] p-10 rounded-[3rem] border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-6 left-8 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Simulación en vivo</span>
            </div>
            
            {/* Modal Mockup */}
            <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl p-8 space-y-6 transform transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-[#FF5C3A]/10 flex items-center justify-center">
                <IconGlobe className="w-10 h-10 text-[#FF5C3A]" />
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-xl font-jakarta font-bold text-[var(--text-primary)] tracking-tight leading-tight">{modalConfig.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{modalConfig.description}</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="w-full py-3.5 rounded-xl bg-[#FF5C3A] text-white text-[10px] font-black uppercase tracking-[0.2em] text-center shadow-lg shadow-[#FF5C3A]/20">
                  Activar mi página
                </div>
                <button className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  Quizás más tarde
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]">
                <p className="text-[9px] text-center text-[var(--text-muted)] font-bold uppercase tracking-widest">
                  Se activará tras <span className="text-[#FF5C3A]">{modalConfig.previewMinutes} minutos</span> de navegación
                </p>
              </div>
            </div>

            {/* Decoración de fondo */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#FF5C3A]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#FF5C3A]/5 rounded-full blur-3xl pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmModal && (
        <ConfirmModal
          brand={confirmModal.brand}
          action={confirmModal.action}
          onConfirm={() => handleAction(confirmModal.brand, confirmModal.action)}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </motion.div>
  );
}

// ── Modal de confirmación ─────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, { title: string; desc: string; btnColor: string; btnLabel: string }> = {
  activate:   { title: 'Activar mini-landing',    desc: 'La página pública de esta marca quedará visible.',                                                                btnColor: '#22c55e', btnLabel: 'Activar' },
  deactivate: { title: 'Desactivar mini-landing',  desc: 'La página pública dejará de ser accesible. El cliente verá una página de inactividad.',                          btnColor: '#6b7280', btnLabel: 'Desactivar' },
  suspend:    { title: 'Suspender mini-landing',   desc: 'Se marcará como suspendida por falta de pago. El contador de 90 días para eliminación comenzará desde ahora.',   btnColor: '#f59e0b', btnLabel: 'Suspender' },
  restore:    { title: 'Restaurar mini-landing',   desc: 'Se limpiará la suspensión y la página volverá a estar activa.',                                                  btnColor: '#22c55e', btnLabel: 'Restaurar' },
};

function ConfirmModal({
  brand,
  action,
  onConfirm,
  onCancel,
}: {
  brand: LandingBrand;
  action: 'activate' | 'deactivate' | 'suspend' | 'restore';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cfg = ACTION_LABELS[action];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 transition-opacity duration-150 animate-in fade-in">
      <div
        className="w-full max-w-sm rounded-2xl border p-6 space-y-4 transition-transform duration-200 scale-100 animate-in zoom-in-95"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{cfg.title}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{brand.name}</span>
            {' — '}{cfg.desc}
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm border transition-all duration-150 hover:opacity-80"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: cfg.btnColor }}
          >
            {cfg.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
