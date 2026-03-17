'use client';

import { useState, useEffect, useCallback } from 'react';

type NotificationType =
  | 'new_brand' | 'upgrade_request' | 'plan_change_request'
  | 'trial_expiring' | 'trial_expired' | 'trial_converted'
  | 'high_usage' | 'credits_exhausted' | 'suspended'
  | 'payment_received' | 'multi_month_purchase' | 'subscription_expiring'
  | 'service_down' | 'service_recovered';

interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  brandId?: string;
  brandName?: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

const STORAGE_KEY = 'admin_notifications_read';

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

const SEVERITY_STYLES: Record<string, { icon: string; badge: string; dot: string }> = {
  info:    { icon: 'rgba(59,130,246,0.12)',  badge: 'rgba(59,130,246,0.1)',  dot: '#3b82f6' },
  warning: { icon: 'rgba(245,158,11,0.12)',  badge: 'rgba(245,158,11,0.1)',  dot: '#f59e0b' },
  error:   { icon: 'rgba(239,68,68,0.12)',   badge: 'rgba(239,68,68,0.1)',   dot: '#ef4444' },
  success: { icon: 'rgba(16,185,129,0.12)',  badge: 'rgba(16,185,129,0.1)', dot: '#10b981' },
};

const SEVERITY_TEXT: Record<string, string> = {
  info: '#3b82f6', warning: '#f59e0b', error: '#ef4444', success: '#10b981',
};

const TYPE_LABELS: Record<string, string> = {
  new_brand: 'Nueva marca', upgrade_request: 'Solicitud upgrade',
  plan_change_request: 'Cambio de plan', trial_expiring: 'Trial por vencer',
  trial_expired: 'Trial vencido', trial_converted: 'Trial convertido',
  high_usage: 'Alto uso', credits_exhausted: 'Créditos agotados',
  suspended: 'Suspendida', payment_received: 'Pago recibido',
  multi_month_purchase: 'Compra multi-mes', subscription_expiring: 'Suscripción por vencer',
  service_down: 'Servicio caído', service_recovered: 'Servicio recuperado',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

function NotifIcon({ type, severity }: { type: NotificationType; severity: string }) {
  const color = SEVERITY_TEXT[severity] ?? '#6b7280';
  const paths: Partial<Record<NotificationType, string>> = {
    new_brand: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
    upgrade_request: 'M13 10V3L4 14h7v7l9-11h-7z',
    plan_change_request: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    trial_expiring: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    trial_expired: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    subscription_expiring: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    trial_converted: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    high_usage: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    credits_exhausted: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    suspended: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    payment_received: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    multi_month_purchase: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    service_down: 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 8v4m0 4h.01',
    service_recovered: 'M5 13l4 4L19 7',
  };
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type] ?? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
    </svg>
  );
}

type FilterSeverity = 'all' | 'info' | 'warning' | 'error' | 'success';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminNotification | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread'>('all');
  const [search, setSearch] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/admin/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setReadIds(getReadIds());
    } catch { /* silencioso */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = () => {
    const all = new Set(notifications.map(n => n.id));
    saveReadIds(all); setReadIds(all);
  };

  const markOneRead = (id: string) => {
    const updated = new Set(readIds); updated.add(id);
    saveReadIds(updated); setReadIds(updated);
  };

  const filtered = notifications.filter(n => {
    if (filterSeverity !== 'all' && n.severity !== filterSeverity) return false;
    if (filterRead === 'unread' && readIds.has(n.id)) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) &&
        !n.message.toLowerCase().includes(search.toLowerCase()) &&
        !(n.brandName ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const severityFilters: { id: FilterSeverity; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'error', label: 'Error' },
    { id: 'warning', label: 'Advertencia' },
    { id: 'success', label: 'Éxito' },
    { id: 'info', label: 'Info' },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>Notificaciones</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {notifications.length} notificaciones · {unreadCount} sin leer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: '#FF5C3A', color: '#fff' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div
        className="rounded-xl border p-4 flex flex-wrap gap-3 items-center"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, mensaje o marca..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Severidad */}
        <div className="flex gap-1.5 flex-wrap">
          {severityFilters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterSeverity(f.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: filterSeverity === f.id
                  ? (f.id === 'all' ? '#FF5C3A' : SEVERITY_STYLES[f.id]?.badge ?? 'var(--bg-hover)')
                  : 'var(--bg-hover)',
                color: filterSeverity === f.id
                  ? (f.id === 'all' ? '#fff' : SEVERITY_TEXT[f.id] ?? 'var(--text-primary)')
                  : 'var(--text-muted)',
                border: `1px solid ${filterSeverity === f.id ? 'transparent' : 'var(--border-color)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Leídas/No leídas */}
        <div className="flex gap-1.5">
          {(['all', 'unread'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterRead(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
              style={{
                background: filterRead === v ? 'rgba(255,92,58,0.1)' : 'var(--bg-hover)',
                color: filterRead === v ? '#FF5C3A' : 'var(--text-muted)',
                borderColor: filterRead === v ? '#FF5C3A' : 'var(--border-color)',
              }}
            >
              {v === 'all' ? 'Todas' : 'Sin leer'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin notificaciones</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {filtered.map(n => {
              const isRead = readIds.has(n.id);
              const s = SEVERITY_STYLES[n.severity];
              return (
                <div
                  key={n.id}
                  onClick={() => { markOneRead(n.id); setSelected(n); }}
                  className="flex gap-4 px-5 py-4 cursor-pointer transition-colors"
                  style={{ background: !isRead ? 'rgba(255,92,58,0.03)' : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = !isRead ? 'rgba(255,92,58,0.03)' : 'transparent')}
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5" style={{ background: s?.icon }}>
                    <NotifIcon type={n.type} severity={n.severity} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: s?.badge, color: SEVERITY_TEXT[n.severity] }}>
                          {TYPE_LABELS[n.type] ?? n.type}
                        </span>
                        {n.brandName && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                            {n.brandName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                  </div>
                  {!isRead && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ background: s?.dot }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: SEVERITY_STYLES[selected.severity]?.icon }}>
                <NotifIcon type={selected.type} severity={selected.severity} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {new Date(selected.createdAt).toLocaleString('es-CO')}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo modal */}
            <div className="px-5 py-4 space-y-3">
              {selected.brandName && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span style={{ color: 'var(--text-muted)' }}>Marca:</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selected.brandName}</span>
                </div>
              )}
              <div className="rounded-lg px-4 py-3" style={{ background: 'var(--bg-hover)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selected.message}</p>
              </div>
              {selected.metadata?.fromPlan && selected.metadata?.toPlan && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    {String(selected.metadata.fromPlan)}
                  </span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}>
                    {String(selected.metadata.toPlan)}
                  </span>
                </div>
              )}
              {selected.metadata?.clientMessage && (
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Mensaje del cliente:</p>
                  <div className="rounded-lg px-4 py-3 border" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
                    <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>"{String(selected.metadata.clientMessage)}"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }}>
              {selected.brandId && (
                <a
                  href="/admin/brands"
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: '#FF5C3A', color: '#fff' }}
                  onClick={() => setSelected(null)}
                >
                  Ver marca
                </a>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
