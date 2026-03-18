'use client';

import { useState, useEffect, useCallback } from 'react';

type Severity = 'info' | 'warning' | 'error' | 'success';
type Tab = 'notifications' | 'feedback';

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

interface FeedbackStat {
  error_type: string;
  product_category: string | null;
  count: number;
}

interface FeedbackRecord {
  id: string;
  generation_id: string;
  brand_id: string;
  error_type: string;
  description: string | null;
  product_category: string | null;
  prompt_used: string | null;
  resolved: boolean;
  created_at: string;
  result_image_url?: string | null;
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

const ERROR_TYPE_LABELS: Record<string, string> = {
  wrong_clothing_removed: 'Ropa incorrecta eliminada',
  wrong_clothing_kept: 'Ropa incorrecta conservada',
  body_distortion: 'Distorsión corporal',
  color_wrong: 'Color incorrecto',
  product_not_applied: 'Producto no aplicado',
  background_changed: 'Fondo modificado',
  other: 'Otro',
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

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

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
  const [activeTab, setActiveTab] = useState<Tab>('notifications');

  // --- Notificaciones ---
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

  // --- Feedback IA ---
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStat[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/admin/notifications`, { headers: authHeaders() });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch { /* silencioso */ } finally { setLoading(false); }
  }, [apiBase]);

  const fetchPreferences = useCallback(async () => {
    try {
      setPrefLoading(true);
      const res = await fetch(`${apiBase}/api/admin/notification-preferences`, { headers: authHeaders() });
      const data = await res.json();
      setPreferences(data.preferences || []);
    } catch { /* silencioso */ } finally { setPrefLoading(false); }
  }, [apiBase]);

  const fetchFeedback = useCallback(async () => {
    try {
      setFeedbackLoading(true);
      const [statsRes, listRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/feedback/stats`, { headers: authHeaders() }),
        fetch(`${apiBase}/api/admin/feedback?resolved=false&limit=200`, { headers: authHeaders() }),
      ]);
      const statsData = await statsRes.json();
      const listData = await listRes.json();
      setFeedbackStats(statsData.stats || []);
      setFeedbacks(listData.feedbacks || []);
    } catch { /* silencioso */ } finally { setFeedbackLoading(false); }
  }, [apiBase]);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  useEffect(() => {
    if (activeTab === 'feedback') fetchFeedback();
  }, [activeTab, fetchFeedback]);

  const togglePreference = async (type: string) => {
    const current = preferences.find(p => p.type === type);
    const newEnabled = current ? !current.enabled : false;
    setTogglingType(type);
    try {
      await fetch(`${apiBase}/api/admin/notification-preferences/${type}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ enabled: newEnabled }),
      });
      setPreferences(prev => prev.map(p => p.type === type ? { ...p, enabled: newEnabled } : p));
    } catch { /* silencioso */ } finally { setTogglingType(null); }
  };

  const deleteFeedback = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`${apiBase}/api/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      // Actualizar stats
      await fetchFeedback();
    } catch { /* silencioso */ } finally { setDeletingId(null); }
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

  const filteredFeedbacks = feedbackFilter === 'all'
    ? feedbacks
    : feedbacks.filter(f => f.error_type === feedbackFilter);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;
  const totalFeedback = feedbacks.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base, #0a0a0a)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Centro de actividad</h1>
          <button
            onClick={() => activeTab === 'notifications' ? fetchNotifications() : fetchFeedback()}
            className="p-2 rounded-xl border transition-colors hover:bg-white/5"
            style={{ borderColor: 'var(--border-color, #222)', color: '#999' }}
            title="Actualizar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-card, #141414)', border: '1px solid var(--border-color, #222)' }}>
          <button
            onClick={() => setActiveTab('notifications')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === 'notifications' ? '#FF5C3A' : 'transparent',
              color: activeTab === 'notifications' ? '#fff' : '#999',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            Notificaciones
            {unreadCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: activeTab === 'notifications' ? 'rgba(255,255,255,0.25)' : '#FF5C3A', color: '#fff' }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === 'feedback' ? '#FF5C3A' : 'transparent',
              color: activeTab === 'feedback' ? '#fff' : '#999',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4.2 15.3" />
            </svg>
            Feedback IA
            {totalFeedback > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: activeTab === 'feedback' ? 'rgba(255,255,255,0.25)' : '#f59e0b', color: '#fff' }}>
                {totalFeedback}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB: NOTIFICACIONES ── */}
        {activeTab === 'notifications' && (
          <>
            {/* Preferencias */}
            <div className="flex justify-end mb-4">
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
                                <Toggle enabled={enabled} onChange={() => togglePreference(type)} loading={togglingType === type} />
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
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-xl text-sm border bg-transparent focus:outline-none" style={{ borderColor: 'var(--border-color, #222)', color: '#bbb', backgroundColor: 'var(--bg-card, #141414)' }}>
                <option value="all">Todas las categorías</option>
                {Object.entries(CATEGORIES).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
              </select>
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="px-3 py-2 rounded-xl text-sm border bg-transparent focus:outline-none" style={{ borderColor: 'var(--border-color, #222)', color: '#bbb', backgroundColor: 'var(--bg-card, #141414)' }}>
                <option value="all">Todas las severidades</option>
                <option value="error">Error</option>
                <option value="warning">Advertencia</option>
                <option value="info">Info</option>
                <option value="success">Éxito</option>
              </select>
              <select value={filterRead} onChange={e => setFilterRead(e.target.value)} className="px-3 py-2 rounded-xl text-sm border bg-transparent focus:outline-none" style={{ borderColor: 'var(--border-color, #222)', color: '#bbb', backgroundColor: 'var(--bg-card, #141414)' }}>
                <option value="all">Todas</option>
                <option value="unread">Sin leer</option>
                <option value="read">Leídas</option>
              </select>
            </div>

            {/* Lista notificaciones */}
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
                      style={{ backgroundColor: isRead ? 'transparent' : 'var(--bg-card, #141414)', borderColor: isRead ? 'var(--border-color, #222)' : SEVERITY_COLORS[n.severity] + '33' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0"><SeverityIcon severity={n.severity} /></div>
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
          </>
        )}

        {/* ── TAB: FEEDBACK IA ── */}
        {activeTab === 'feedback' && (
          <>
            {feedbackLoading ? (
              <div className="flex items-center justify-center py-20">
                <svg className="animate-spin w-6 h-6" style={{ color: '#FF5C3A' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <>
                {/* Resumen por tipo de error */}
                {feedbackStats.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#666' }}>Errores frecuentes sin resolver</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {feedbackStats.map((s, i) => (
                        <div key={i} className="rounded-xl border p-3" style={{ backgroundColor: 'var(--bg-card, #141414)', borderColor: 'var(--border-color, #222)' }}>
                          <p className="text-xl font-bold text-white">{s.count}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#bbb' }}>{ERROR_TYPE_LABELS[s.error_type] ?? s.error_type}</p>
                          {s.product_category && (
                            <p className="text-xs mt-0.5" style={{ color: '#666' }}>{s.product_category}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtro por tipo */}
                <div className="flex gap-2 mb-4">
                  <select
                    value={feedbackFilter}
                    onChange={e => setFeedbackFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl text-sm border bg-transparent focus:outline-none"
                    style={{ borderColor: 'var(--border-color, #222)', color: '#bbb', backgroundColor: 'var(--bg-card, #141414)' }}
                  >
                    <option value="all">Todos los tipos</option>
                    {Object.entries(ERROR_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <span className="flex items-center text-sm" style={{ color: '#666' }}>
                    {filteredFeedbacks.length} registro{filteredFeedbacks.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Tabla de feedbacks */}
                {filteredFeedbacks.length === 0 ? (
                  <div className="text-center py-20" style={{ color: '#666' }}>
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4.2 15.3" />
                    </svg>
                    <p className="text-sm">Sin feedback pendiente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFeedbacks.map(f => (
                      <div
                        key={f.id}
                        className="rounded-2xl border px-4 py-3.5"
                        style={{ backgroundColor: 'var(--bg-card, #141414)', borderColor: 'var(--border-color, #222)' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f59e0b22', color: '#f59e0b' }}>
                                {ERROR_TYPE_LABELS[f.error_type] ?? f.error_type}
                              </span>
                              {f.product_category && (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ffffff11', color: '#999' }}>
                                  {f.product_category}
                                </span>
                              )}
                            </div>
                            {f.description && (
                              <p className="text-sm mt-2 line-clamp-2" style={{ color: '#bbb' }}>{f.description}</p>
                            )}
                            <p className="text-xs mt-1.5" style={{ color: '#555' }}>
                              {new Date(f.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteFeedback(f.id)}
                            disabled={deletingId === f.id}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-red-500/10 disabled:opacity-50"
                            style={{ borderColor: '#ef444433', color: '#ef4444' }}
                          >
                            {deletingId === f.id ? (
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            )}
                            Eliminar del RAG
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>

      {/* Modal detalle notificación */}
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
