'use client';

import { Brand } from '@/app/admin/brands/page';
import { ArrowUpDown } from 'lucide-react';

interface BrandTableProps {
  brands: Brand[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSelectDetails: (brand: Brand) => void;
  onSelectProducts: (brand: Brand) => void;
  onSelectActivate: (brand: Brand) => void;
  onSelectModalConfig: (brand: Brand) => void;
  onSendReset: (brand: Brand) => void;
  sortField: 'name' | 'email' | 'plan' | 'status' | 'products' | 'generations';
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: 'name' | 'email' | 'plan' | 'status' | 'products' | 'generations') => void;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  landingPrice?: number | null;
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    TRIAL:   { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' },
    PRO:     { bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
    LANDING: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
    BASIC:   { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  };
  const s = styles[plan] ?? { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active:        { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Activo' },
    expiring_soon: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Por vencer' },
    suspended:     { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Suspendido' },
    expired:       { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Vencido' },
  };
  const s = status ? map[status] : null;
  if (!s) return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)' }}>Sin suscripción</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
}

export function BrandTable({
  brands, selected, onToggleSelect, onToggleSelectAll,
  onSelectDetails, onSelectProducts, onSelectActivate, onSelectModalConfig, onSendReset,
  sortField, sortOrder, onSortChange,
  currentPage, itemsPerPage, onPageChange, landingPrice,
}: BrandTableProps) {
  const totalPages = Math.ceil(brands.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginated = brands.slice(startIdx, startIdx + itemsPerPage);

  const sortIcon = (field: typeof sortField) => (
    <ArrowUpDown className="w-3 h-3" style={{ color: sortField === field ? 'var(--accent)' : 'var(--text-muted)' }} />
  );

  const cols: { label: string; field: typeof sortField | null }[] = [
    { label: 'Marca', field: 'name' },
    { label: 'Email', field: 'email' },
    { label: 'Plan', field: 'plan' },
    { label: 'Estado', field: 'status' },
    { label: 'Productos', field: 'products' },
    { label: 'Generaciones', field: 'generations' },
    { label: 'Acciones', field: null },
  ];

  return (
    <>
      <div className="rounded-[2rem] border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-base)' }}>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && paginated.every(b => selected.has(b.id))}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && !paginated.every(b => selected.has(b.id)); }}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: '#FF5C3A' }}
                  />
                </th>
                {cols.map(c => (
                  <th
                    key={c.label}
                    onClick={() => c.field && onSortChange(c.field)}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${c.field ? 'cursor-pointer hover:bg-black/5' : ''}`}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <div className="flex items-center gap-1">
                      {c.label}
                      {c.field && sortIcon(c.field)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(brand => (
                <tr
                  key={brand.id}
                  className="border-t transition-colors"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: selected.has(brand.id) ? 'rgba(255,92,58,0.05)' : 'transparent',
                  }}
                >
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(brand.id)}
                      onChange={() => onToggleSelect(brand.id)}
                      className="w-4 h-4 rounded cursor-pointer"
style={{ accentColor: 'var(--accent)' }}
                    />
                  </td>

                  {/* Marca */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{brand.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{brand.slug}</p>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {brand.email}
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <PlanBadge plan={brand.plan} />
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {brand.plan === 'TRIAL' ? 'Gratuito'
                        : brand.plan === 'PRO' ? '$250.000/mes'
                        : brand.plan === 'BASIC' ? '$150.000/mes'
                        : brand.plan === 'LANDING' && landingPrice ? `$${landingPrice.toLocaleString('es-CO')}`
                        : '—'}
                    </p>
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {brand.plan === 'TRIAL' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v10.5a3 3 0 006 0V3M6 3h12" /></svg>
                        Prueba — {brand.trial_days_remaining ?? 0}d
                      </span>
                    ) : (
                      <StatusBadge status={brand.subscription_status} />
                    )}
                  </td>

                  {/* Productos */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {brand.stats.productsCount}
                  </td>

                  {/* Generaciones */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{brand.stats.generationsCount}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{brand.stats.generationsThisMonth} este mes</p>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelectDetails(brand)}
                        className="p-1.5 rounded-lg transition-all duration-150"
                        title="Ver detalles"
                        aria-label={`Ver detalles de ${brand.name}`}
                        style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button
                        onClick={() => onSelectProducts(brand)}
                        className="p-1.5 rounded-lg transition-all duration-150"
                        title="Ver productos"
                        aria-label={`Ver productos de ${brand.name}`}
                        style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </button>
                      {brand.plan === 'TRIAL' ? (
                        <button
                          onClick={() => onSelectActivate(brand)}
                          className="p-1.5 rounded-lg transition-all duration-150"
                          title="Activar plan"
                          aria-label={`Activar plan para ${brand.name}`}
                          style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectActivate(brand)}
                          className="p-1.5 rounded-lg transition-all duration-150"
                          title={`Cambiar a ${brand.plan === 'BASIC' ? 'PRO' : 'BASIC'}`}
                          aria-label={`Cambiar plan de ${brand.name}`}
                          style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: 'var(--accent)' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectModalConfig(brand)}
                        className="p-1.5 rounded-lg transition-all duration-150"
                        title="Configurar Modal"
                        aria-label={`Configurar modal de ${brand.name}`}
                        style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => onSendReset(brand)}
                        className="p-1.5 rounded-lg transition-all duration-150"
                        title="Enviar email de recuperación"
                        aria-label={`Enviar email de recuperación a ${brand.name}`}
                        style={{ backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {brands.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-10 w-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No se encontraron marcas</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Intenta ajustar los filtros de búsqueda.</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border px-4 py-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Mostrando {startIdx + 1} a {Math.min(startIdx + itemsPerPage, brands.length)} de {brands.length}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className="px-3 py-1.5 rounded-lg border text-xs transition-colors"
                  style={{
                    backgroundColor: currentPage === p ? 'var(--accent)' : 'var(--bg-base)',
                    color: currentPage === p ? '#fff' : 'var(--text-secondary)',
                    borderColor: currentPage === p ? 'var(--accent)' : 'var(--border-color)',
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </>
  );
}
