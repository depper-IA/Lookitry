'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, CreditCard, RefreshCw, CheckCircle, XCircle, Clock, Banknote, Wifi } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  brandId: string;
  brandName: string;
  brandEmail: string;
  brandSlug: string;
  brandPlan: 'BASIC' | 'PRO';
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  notes: string | null;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function adminApi(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') ?? '' : '';
  return fetch(`${base}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const [total, setTotal] = useState(0);

  // Filtros
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (methodFilter !== 'all') params.set('method', methodFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (search) params.set('search', search);

      const res = await adminApi(`/admin/revenue/payments?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar pagos');
      setPayments(data.payments ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [methodFilter, statusFilter, fromDate, toDate, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setCurrentPage(1); }, [methodFilter, statusFilter, fromDate, toDate, search]);

  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const paginated = payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Resumen por método
  const byMethod = payments.reduce<Record<string, { count: number; total: number }>>((acc, p) => {
    const m = p.paymentMethod || 'otro';
    if (!acc[m]) acc[m] = { count: 0, total: 0 };
    if (p.status === 'completed') { acc[m].count++; acc[m].total += p.amount; }
    return acc;
  }, {});

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm">{error}</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-syne font-bold">Pagos</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Historial completo de pagos registrados</p>
        </div>
        <button onClick={fetchPayments}
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl border text-sm hover:opacity-80 transition-opacity">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
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
          <p className="text-xl font-bold">{formatCurrency(total)}</p>
          <p className="text-xs opacity-70 mt-0.5">{payments.filter(p => p.status === 'completed').length} pagos</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-4 space-y-3">
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
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border overflow-hidden">
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
                    <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Marca</th>
                    <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Plan</th>
                    <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Monto</th>
                    <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Método</th>
                    <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Fecha</th>
                    <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Estado</th>
                    <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Notas</th>
                  </tr>
                </thead>
                <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
                  {paginated.map(p => {
                    const methodCfg = METHOD_LABELS[p.paymentMethod] ?? { label: p.paymentMethod, icon: <Banknote className="w-3.5 h-3.5" /> };
                    const statusCfg = STATUS_CONFIG[p.status] ?? { label: p.status, style: { backgroundColor: 'rgba(107,114,128,0.12)', color: '#6b7280' }, icon: null };
                    return (
                      <tr key={p.id} className="hover:opacity-80 transition-opacity">
                        <td className="px-5 py-3.5">
                          <p style={{ color: 'var(--text-primary)' }} className="font-medium">{p.brandName}</p>
                          <p style={{ color: 'var(--text-muted)' }} className="text-xs">{p.brandEmail}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.brandPlan === 'PRO' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {p.brandPlan}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-primary)' }} className="px-5 py-3.5 font-semibold">{formatCurrency(p.amount)}</td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            {methodCfg.icon} {methodCfg.label}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }} className="px-5 py-3.5">{formatDate(p.paymentDate)}</td>
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
        <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="flex items-center justify-between border rounded-2xl px-5 py-3">
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
