'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, CreditCard, RefreshCw, CheckCircle, XCircle, Clock, Banknote, Wifi, ArrowUpDown, Download } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { adminApi } from '@/services/adminApi';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  brand_id: string;
  brands: {
    name: string;
    email: string;
    slug: string;
    plan: 'BASIC' | 'PRO' | 'TRIAL' | 'ENTERPRISE';
  };
  amount: number;
  amount_cop?: number;
  amount_original?: number;
  currency: string;
  exchange_rate_used?: number | null;
  payment_date: string;
  payment_method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  notes: string | null;
  created_at: string;
  billing_type?: string;
  archived?: boolean;
}

function normalizePayment(raw: any): Payment {
  return {
    id: raw.id,
    brand_id: raw.brand_id ?? raw.brandId ?? '',
    brands: raw.brands ?? {
      name: raw.brandName ?? '—',
      email: raw.brandEmail ?? '—',
      slug: raw.brandSlug ?? '',
      plan: raw.brandPlan ?? 'BASIC',
    },
    amount: Number(raw.amount ?? 0),
    amount_cop: raw.amount_cop ?? raw.amountCop ?? undefined,
    amount_original: raw.amount_original ?? raw.amountOriginal ?? undefined,
    currency: raw.currency ?? 'COP',
    exchange_rate_used: raw.exchange_rate_used ?? raw.exchangeRateUsed ?? null,
    payment_date: raw.payment_date ?? raw.paymentDate ?? raw.created_at ?? raw.createdAt ?? '',
    payment_method: raw.payment_method ?? raw.paymentMethod ?? 'manual',
    status: raw.status ?? 'pending',
    notes: raw.notes ?? null,
    created_at: raw.created_at ?? raw.createdAt ?? raw.payment_date ?? raw.paymentDate ?? '',
    billing_type: raw.billing_type ?? raw.billingType ?? undefined,
    archived: Boolean(raw.archived),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatOriginalAmount(payment: Payment) {
  const amount = payment.amount_original ?? payment.amount;
  if (payment.currency === 'USD') {
    return `USD ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  return formatCurrency(amount);
}

const METHOD_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  wompi:         { label: 'Wompi',         icon: <Wifi className="w-3.5 h-3.5" /> },
  transferencia: { label: 'Transferencia', icon: <Banknote className="w-3.5 h-3.5" /> },
  efectivo:      { label: 'Efectivo',      icon: <Banknote className="w-3.5 h-3.5" /> },
  tarjeta:       { label: 'Tarjeta',       icon: <CreditCard className="w-3.5 h-3.5" /> },
  manual:        { label: 'Manual',        icon: <RefreshCw className="w-3.5 h-3.5" /> },
};

const STATUS_CONFIG: Record<string, { label: string; style: React.CSSProperties; icon: React.ReactNode }> = {
  completed: { label: 'Completado', style: { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }, icon: <CheckCircle className="w-3.5 h-3.5" /> },
  pending:   { label: 'Pendiente',  style: { backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }, icon: <Clock className="w-3.5 h-3.5" /> },
  failed:    { label: 'Fallido',    style: { backgroundColor: 'rgba(239,68,68,0.12)',   color: '#ef4444' }, icon: <XCircle className="w-3.5 h-3.5" /> },
  refunded:  { label: 'Reembolsado',style: { backgroundColor: 'rgba(107,114,128,0.12)',color: '#6b7280' }, icon: <RefreshCw className="w-3.5 h-3.5" /> },
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Filtros
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Ordenamiento
  const [sortField, setSortField] = useState<'name' | 'amount' | 'date' | 'status' | 'method'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: 'name' | 'amount' | 'date' | 'status' | 'method') => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const params = new URLSearchParams();
      if (methodFilter !== 'all') {
        params.set('payment_method', methodFilter);
        params.set('method', methodFilter);
      }
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (search) params.set('search', search);

      const data = await adminApi.get<{ payments?: Payment[]; stats?: { total_revenue?: number; completed_count?: number } }>(`/admin/revenue/payments?${params.toString()}`);
      const normalizedPayments: Payment[] = Array.isArray(data.payments) ? data.payments.map(normalizePayment) : [];
      const completedPayments = normalizedPayments.filter((payment: Payment) => payment.status === 'completed');
      setPayments(normalizedPayments);
      setTotalRevenue(data.stats?.total_revenue ?? completedPayments.reduce((sum, payment) => sum + (payment.amount_cop ?? payment.amount), 0));
      setCompletedCount(data.stats?.completed_count ?? completedPayments.length);
    } catch (e: any) {
      setError(e.message || 'Error al obtener pagos');
    } finally {
      setLoading(false);
    }
  }, [methodFilter, statusFilter, fromDate, toDate, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setCurrentPage(1); }, [methodFilter, statusFilter, fromDate, toDate, search]);

  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const sorted = useMemo(() => [...payments].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';
    if (sortField === 'name') {
      valA = (a.brands?.name ?? '').toLowerCase(); valB = (b.brands?.name ?? '').toLowerCase();
    } else if (sortField === 'amount') {
      valA = a.amount_cop ?? a.amount; valB = b.amount_cop ?? b.amount;
    } else if (sortField === 'date') {
      valA = new Date(a.payment_date || a.created_at).getTime();
      valB = new Date(b.payment_date || b.created_at).getTime();
    } else if (sortField === 'status') {
      valA = a.status; valB = b.status;
    } else if (sortField === 'method') {
      valA = (a.payment_method || '').toLowerCase(); valB = (b.payment_method || '').toLowerCase();
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  }), [payments, sortField, sortOrder]);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToCSV = () => {
    const headers = ['Fecha', 'Marca', 'Email', 'Plan', 'Monto (COP)', 'Método', 'Estado'];
    const rows = sorted.map(p => [
      new Date(p.payment_date || p.created_at).toLocaleDateString('es-CO'),
      p.brands?.name || '',
      p.brands?.email || '',
      p.brands?.plan || '',
      (p.amount_cop || p.amount).toString(),
      p.payment_method || '',
      p.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos_lookitry_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Resumen por método
  const byMethod = payments.reduce<Record<string, { count: number; total: number }>>((acc, p) => {
    const m = p.payment_method || 'otro';
    if (!acc[m]) acc[m] = { count: 0, total: 0 };
    if (p.status === 'completed') { acc[m].count++; acc[m].total += p.amount_cop ?? p.amount; }
    return acc;
  }, {});

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm">{error}</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-jakarta font-bold tracking-tight">Pagos</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Historial completo de pagos registrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV}
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl border text-sm hover:opacity-80 transition-opacity">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button onClick={fetchPayments}
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl border text-sm hover:opacity-80 transition-opacity">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      {/* Resumen por método */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(byMethod).map(([method, data]) => {
          const cfg = METHOD_LABELS[method] ?? { label: method, icon: <Banknote className="w-3.5 h-3.5" /> };
          return (
            <div key={method} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border px-5 py-4">
              <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--text-muted)' }}>
                {cfg.icon}
                <span className="text-xs font-medium uppercase tracking-wide">{cfg.label}</span>
              </div>
              <p style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">{formatCurrency(data.total)}</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">{data.count} pago{data.count !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
        <div className="bg-[#FF5C3A] rounded-2xl px-5 py-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80 mb-2">Total completados</p>
          <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs opacity-70 mt-0.5">{completedCount} pago{completedCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por marca, email o slug..."
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="w-full pl-9 pr-3 py-2 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
          </div>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            className="px-3 py-2 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]">
            <option value="all">Todos los métodos</option>
            <option value="wompi">Wompi</option>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="manual">Manual</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            className="px-3 py-2 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]">
            <option value="all">Todos los estados</option>
            <option value="completed">Completado</option>
            <option value="pending">Pendiente</option>
            <option value="failed">Fallido</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label style={{ color: 'var(--text-muted)' }} className="text-xs whitespace-nowrap">Desde</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="px-3 py-1.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
          </div>
          <div className="flex items-center gap-2">
            <label style={{ color: 'var(--text-muted)' }} className="text-xs whitespace-nowrap">Hasta</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="px-3 py-1.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
          </div>
          {(fromDate || toDate || search || methodFilter !== 'all' || statusFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setMethodFilter('all'); setStatusFilter('all'); setFromDate(''); setToDate(''); }}
              className="text-xs text-[#FF5C3A] hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#FF5C3A]/30 border-t-[#FF5C3A] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="border-b">
                    {([
                      { label: 'Marca',   field: 'name'   as const },
                      { label: 'Plan',    field: null },
                      { label: 'Monto',   field: 'amount' as const },
                      { label: 'Método',  field: 'method' as const },
                      { label: 'Fecha',   field: 'date'   as const },
                      { label: 'Estado',  field: 'status' as const },
                      { label: 'Notas',   field: null },
                    ]).map(h => (
                      <th
                        key={h.label}
                        onClick={() => h.field && toggleSort(h.field)}
                        style={{ color: 'var(--text-muted)' }}
                        className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide ${h.field ? 'cursor-pointer hover:bg-black/5 transition-colors' : ''}`}
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
                <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
                  {paginated.map(p => {
                    const methodCfg = METHOD_LABELS[p.payment_method] ?? { label: p.payment_method, icon: <Banknote className="w-3.5 h-3.5" /> };
                    const statusCfg = STATUS_CONFIG[p.status] ?? { label: p.status, style: { backgroundColor: 'rgba(107,114,128,0.12)', color: '#6b7280' }, icon: null };
                    const brand = p.brands || { name: '—', email: '—', plan: '—' };
                    return (
                      <tr key={p.id} className="hover:opacity-80 transition-opacity">
                        <td className="px-5 py-3.5">
                          <p style={{ color: 'var(--text-primary)' }} className="font-medium">{brand.name}</p>
                          <p style={{ color: 'var(--text-muted)' }} className="text-xs">{brand.email}</p>
                          <div className="mt-1 flex items-center gap-2">
                            {p.billing_type && (
                              <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                                {p.billing_type}
                              </span>
                            )}
                            {p.archived && (
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-400">
                                Archivada
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${brand.plan === 'PRO' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {brand.plan}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p style={{ color: 'var(--text-primary)' }} className="font-semibold">{formatCurrency(p.amount_cop ?? p.amount)}</p>
                          {p.currency === 'USD' ? (
                            <p style={{ color: 'var(--text-muted)' }} className="text-[11px] mt-0.5">
                              {formatOriginalAmount(p)}
                              {p.exchange_rate_used ? ` · TRM ${p.exchange_rate_used.toLocaleString('es-CO')}` : ''}
                            </p>
                          ) : (
                            <p style={{ color: 'var(--text-muted)' }} className="text-[11px] mt-0.5">{formatOriginalAmount(p)}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            {methodCfg.icon} {methodCfg.label}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }} className="px-5 py-3.5">{formatDate(p.payment_date)}</td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit" style={statusCfg.style}>
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }} className="px-5 py-3.5 text-xs max-w-xs truncate">{p.notes ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {payments.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm">No hay pagos con los filtros seleccionados.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="flex items-center justify-between border rounded-[2rem] px-5 py-3">
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, payments.length)} de {payments.length}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-40 hover:opacity-80 transition-opacity">
              Anterior
            </button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-40 hover:opacity-80 transition-opacity">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
