'use client';

import { useEffect, useState } from 'react';
import { Activity, Search, Filter } from 'lucide-react';

import { adminApi } from '@/services/adminApi';

interface AuditEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_brand_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

interface AuditData {
  entries: AuditEntry[];
  count: number;
  message?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    'admin.login': 'Login admin',
    'brand.plan_change': 'Cambio de plan',
    'brand.create': 'Marca creada',
    'brand.delete': 'Marca eliminada',
    'brand.plan_activate': 'Plan activado',
    'brand.landing_page_toggle': 'Landing toggle',
    'brand.landing_suspend': 'Landing suspendida',
    'brand.landing_restore': 'Landing restaurada',
    'brand.send_reset_email': 'Email reset enviado',
    'admin.change_password': 'Cambio contraseña',
    'admin.send_credentials': 'Credenciales enviadas',
    'brand.modal_config_update': 'Modal actualizado',
  };
  return labels[action] || action;
}

export default function AdminAuditLogPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchAction, setSearchAction] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (searchEmail) params.set('admin_email', searchEmail);
    if (searchAction) params.set('action', searchAction);

    adminApi.get(`/admin/audit-log?${params}`)
      .then(d => { if (d.error) throw new Error(d.message); setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, searchEmail, searchAction]);

  if (loading && !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
      {error}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Auditoría</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Historial de acciones administrativas — quién, qué, cuándo</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchEmail}
            onChange={e => { setSearchEmail(e.target.value); setPage(0); }}
            placeholder="Buscar por email de admin..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex-1 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchAction}
            onChange={e => { setSearchAction(e.target.value); setPage(0); }}
            placeholder="Filtrar por acción..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div className="rounded-[2rem] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {data?.message && (
          <div className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{data.message}</div>
        )}
        {data && data.entries.length === 0 && !data.message && (
          <div className="px-5 py-12 text-center">
            <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin registros de auditoría</p>
          </div>
        )}
        {data && data.entries.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-base)' }}>
                    {['Fecha', 'Admin', 'Acción', 'Detalle'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map(entry => (
                    <tr key={entry.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td className="px-5 py-3 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatDate(entry.created_at)}</td>
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{entry.admin_email}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}>
                          {formatAction(entry.action)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {entry.details ? JSON.stringify(entry.details) : entry.target_brand_id ? `Brand: ${entry.target_brand_id}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Mostrando {data.entries.length} de {data.count} registros
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  Anterior
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={data.entries.length < limit}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
