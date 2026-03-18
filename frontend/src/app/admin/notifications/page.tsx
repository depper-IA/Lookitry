'use client';

import { useState, useEffect, useCallback } from 'react';

type Severity = 'info' | 'warning' | 'error' | 'success';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  brandId?: string;
  brandName?: string;
  createdAt: string;
  severity: Severity;
  metadata?: Record<string, unknown>;
}

interface NotificationPreference {
  type: string;
  enabled: boolean;
}

const CATEGORIES: Record<string, { label: string; types: string[] }> = {
  brands: {
    label: 'Marcas',
    types: ['new_brand', 'upgrade_request', 'plan_change_request', 'trial_expiring', 'trial_expired', 'trial_converted', 'suspended'],
  },
  usage: {
    label: 'Uso',
    types: ['high_usage', 'credits_exhausted'],
  },
  payments: {
    label: 'Pagos',
    types: ['payment_received', 'multi_month_purchase', 'subscription_expiring'],
  },
  system: {
    label: 'Sistema',
    types: ['service_down', 'service_recovered', 'smtp_down', 'smtp_recovered'],
  },
};

function typeToCategory(type: string): string {
  for (const [cat, { types }] of Object.entries(CATEGORIES)) {
    if (types.includes(type)) return cat;
  }
  return 'system';
}

const SEVERITY_COLORS: Record<Severity, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#10b981',
};


function SeverityIcon({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity];
  if (severity === 'success') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  );
  if (severity === 'error') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
  );
  if (severity === 'warning') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
  );
}

function Toggle({ enabled, onChange, loading }: { enabled: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50"
      style={{ backgroundColor: enabled ? '#FF5C3A' : '#d1d5db' }}
      aria-checked={enabled}
      role="switch"
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: enabled ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [prefLoading, setPrefLoading] = useState(false);
  const [togglingType, setTogglingType] = useState<string | null>(null);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showPrefs, setShowPrefs] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/admin/notifications`, { credentials: 'include' });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchPreferences = useCallback(async () => {
    try {
      setPrefLoading(true);
      const res = await fetch(`${apiBase}/api/admin/notification-preferences`, { credentials: 'include' });
      const data = await res.json();
      setPreferences(data.preferences || []);
    } catch {
      // silencioso
    } finally {
      setPrefLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  const togglePreference = async (type: string) => {
    const current = preferences.find(p => p.type === type);
    const newEnabled = current ? !current.enabled : false;
    setTogglingType(type);
    try {
      await fetch(`${apiBase}/api/admin/notification-preferences/${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: newEnabled }),
      });
      setPreferences(prev =>
        prev.map(p => p.type === type ? { ...p, enabled: newEnabled } : p)
      );
    } catch {
      // silencioso
    } finally {
      setTogglingType(null);
    }
  };

  const markRead = (id: string) => setReadIds(prev => new Set([...prev, id]));

  const filtered = notifications.filter(n => {
    if (filterSeverity !== 'all' && n.severity !== filterSeverity) return false;
    if (filterRead === 'unread' && readIds.has(n.id)) return false;
    if (filterRead === 'read' && !readIds.has(n.id)) return false;
    if (filterCategory !== 'all' && typeToCategory(n.type) !== filterCategory) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;


  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base, #0a0a0a)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
            {unreadCount > 0 && (
              <p className="text-sm mt-0.5" style={{ color: '#999' }}>
                {unreadCount} sin leer
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchNotifications}
              className="p-2 rounded-xl border transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--border-color, #222)', color: '#999' }}
              title="Actualizar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => { setShowPrefs(v => !v); if (!showPrefs) fetchPreferences(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-white/5"
              style={{ borderColor: showPrefs ? '#FF5C3A' : 'var(--border-color, #222)', color: showPrefs ? '#FF5C3A' : '#bbb' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Preferencias
            </button>
          </div>
        </div>

        {/* Panel de preferencias */}
        {showPrefs && (
          <div className="mb-6 rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card, #141414)', borderColor: 'var(--border-color, #222)' }}>
            <h2 className="text-sm font-semibold text-white mb-4">Preferencias de notificaciones</h2>
            {prefLoading ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#999' }}>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Cargando...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.entries(CATEGORIES).map(([catKey, { label, types }]) => (
                  <div key={catKey}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#666' }}>{label}</p>
                    <div className="space-y-3">
                      {types.map(type => {
                        const pref = preferences.find(p => p.type === type);
                        const enabled = pref ? pref.enabled : true;
                        return (
                          <div key={type} className="flex items-center justify-between gap-3">
                            <span className="text-sm" style={{ color: '#bbb' }}>{type.replace(/_/g, ' ')}</span>
                            <Toggle
                              enabled={enabled}
                              onChange={() => togglePreference(type)}
                              loading={togglingType === type}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-2 rounded-xl text-sm border bg-transparent text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            style={{ borderColor: 'var(--border-color, #222)' }}
          />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border bg-transparent focus:outline-none"
            style={{ borderColor: 'var(--border-color, #222)', color: '#bbb', backgroundColor: 'var(--bg-card, #141414)' }}
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(CATEGORIES).map(([k, { label }]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border bg-transparent focus:outline-none"
            style={{ borderColor: 'var(--border-color, #222)', color: '#bbb', backgroundColor: 'var(--bg-card, #141414)' }}
          >
            <option value="all">Todas las severidades</option>
            <option value="error">Error</option>
            <option value="warning">Advertencia</option>
            <option value="info">Info</option>
            <option value="success">Éxito</option>
          </select>
          <select
            value={filterRead}
            onChange={e => setFilterRead(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border bg-transparent focus:outline-none"
            style={{ borderColor: 'var(--border-color, #222)', color: '#bbb', backgroundColor: 'var(--bg-card, #141414)' }}
          >
            <option value="all">Todas</option>
            <option value="unread">Sin leer</option>
            <option value="read">Leídas</option>
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6" style={{ color: '#FF5C3A' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#666' }}>
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="text-sm">Sin notificaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => {
              const isRead = readIds.has(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => { setSelected(n); markRead(n.id); }}
                  className="w-full text-left rounded-2xl border px-4 py-3.5 transition-colors hover:bg-white/5"
                  style={{
                    backgroundColor: isRead ? 'transparent' : 'var(--bg-card, #141414)',
                    borderColor: isRead ? 'var(--border-color, #222)' : SEVERITY_COLORS[n.severity] + '33',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <SeverityIcon severity={n.severity} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${isRead ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>
                        {!isRead && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#FF5C3A' }} />}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#999' }}>{n.message}</p>
                    </div>
                    <p className="text-xs flex-shrink-0" style={{ color: '#666' }}>
                      {new Date(n.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card, #141414)', borderColor: 'var(--border-color, #222)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <SeverityIcon severity={selected.severity} />
                <h3 className="font-semibold text-white">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: '#666' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: '#bbb' }}>{selected.message}</p>
            {selected.brandName && (
              <p className="text-xs mb-2" style={{ color: '#666' }}>Marca: <span style={{ color: '#999' }}>{selected.brandName}</span></p>
            )}
            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <pre className="text-xs rounded-xl p-3 overflow-auto" style={{ backgroundColor: '#0a0a0a', color: '#666' }}>
                {JSON.stringify(selected.metadata, null, 2)}
              </pre>
            )}
            <p className="text-xs mt-4" style={{ color: '#555' }}>
              {new Date(selected.createdAt).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
