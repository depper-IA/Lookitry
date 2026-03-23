'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';

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
  const ITEMS_PER_PAGE = 10;

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

  useEffect(() => { fetchBrands(); }, [fetchBrands]);
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
        ? b.is_in_trial === true
        : b.plan === filterPlan && !b.is_in_trial;
      return matchSearch && matchEstado && matchPlan;
    });

    return [...base].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';
      if (sortField === 'name') {
        valA = a.name.toLowerCase(); valB = b.name.toLowerCase();
      } else if (sortField === 'plan') {
        valA = a.is_in_trial ? 'TRIAL' : a.plan; valB = b.is_in_trial ? 'TRIAL' : b.plan;
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
      alert(err.message || 'Error al ejecutar acción');
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
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-jakarta font-black uppercase italic tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>
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
                          brand.is_in_trial
                            ? { backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }
                            : brand.plan === 'PRO'
                            ? { backgroundColor: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }
                            : { backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }
                        }
                      >
                        {brand.is_in_trial ? 'TRIAL' : brand.plan}
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

      {/* Modal de confirmación */}
      {confirmModal && (
        <ConfirmModal
          brand={confirmModal.brand}
          action={confirmModal.action}
          onConfirm={() => handleAction(confirmModal.brand, confirmModal.action)}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
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
