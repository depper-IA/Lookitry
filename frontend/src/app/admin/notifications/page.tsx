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

interface FeedbackRecord {
  id: string;
  generation_id: string;
  brand_id: string;
  error_type: string;
  description: string | null;
  product_category: string | null;
  prompt_used: string | null;
  result_image_url?: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

interface StatRow {
  error_type: string;
  product_category: string | null;
  count: number;
}

const CATEGORIES: Record<string, { label: string; types: string[] }> = {
  brands: { label: 'Marcas', types: ['new_brand', 'upgrade_request', 'plan_change_request', 'trial_expiring', 'trial_expired', 'trial_converted', 'suspended'] },
  usage: { label: 'Uso', types: ['high_usage', 'credits_exhausted'] },
  payments: { label: 'Pagos', types: ['payment_received', 'multi_month_purchase', 'subscription_expiring'] },
  system: { label: 'Sistema', types: ['service_down', 'service_recovered', 'smtp_down', 'smtp_recovered'] },
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

const ERROR_TYPE_COLORS: Record<string, string> = {
  wrong_clothing_removed: '#ef4444',
  wrong_clothing_kept: '#f97316',
  body_distortion: '#a855f7',
  color_wrong: '#3b82f6',
  product_not_applied: '#ec4899',
  background_changed: '#14b8a6',
  other: '#6b7280',
};

function typeToCategory(type: string): string {
  for (const [cat, { types }] of Object.entries(CATEGORIES)) {
    if (types.includes(type)) return cat;
  }
  return 'system';
}

const SEVERITY_COLORS: Record<Severity, string> = {
  info: '#3b82f6', warning: '#f59e0b', error: '#ef4444', success: '#10b981',
};

const STORAGE_KEY = 'admin_notifications_read';
function getStoredReadIds(): Set<string> {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); }
}
function saveStoredReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function authHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}

function SeverityIcon({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity];
  if (severity === 'success') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (severity === 'error') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
  if (severity === 'warning') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
}

function Toggle({ enabled, onChange, loading }: { enabled: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button onClick={onChange} disabled={loading} className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50"
      style={{ backgroundColor: enabled ? '#FF5C3A' : '#d1d5db' }} aria-checked={enabled} role="switch">
      <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: enabled ? 'translateX(18px)' : 'translateX(2px)' }} />
    </button>
  );
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');

  // Notificaciones
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [prefLoading, setPrefLoading] = useState(false);
  const [togglingType, setTogglingType] = useState<string | null>(null);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showPrefs, setShowPrefs] = useState(false);

  // Feedback
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterResolved, setFilterResolved] = useState('false');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/admin/notifications`, { credentials: 'include', headers: authHeaders() });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setReadIds(getStoredReadIds());
    } catch { } finally { setLoading(false); }
  }, [apiBase]);

  const fetchPreferences = useCallback(async () => {
    try {
      setPrefLoading(true);
      const res = await fetch(`${apiBase}/api/admin/notification-preferences`, { credentials: 'include', headers: authHeaders() });
      const data = await res.json();
      setPreferences(data.preferences || []);
    } catch { } finally { setPrefLoading(false); }
  }, [apiBase]);

  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('error_type', filterType);
      if (filterResolved !== '') params.set('resolved', filterResolved);
      const [fbRes, stRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/feedback?${params}`, { credentials: 'include', headers: authHeaders() }),
        fetch(`${apiBase}/api/admin/feedback/stats`, { credentials: 'include', headers: authHeaders() }),
      ]);
      const fbData = await fbRes.json();
      const stData = await stRes.json();
      setFeedbacks(fbData.feedbacks ?? []);
      setStats(stData.stats ?? []);
    } catch { } finally { setFeedbackLoading(false); }
  }, [apiBase, filterType, filterResolved]);

  useEffect(() => { fetchNotifications(); fetchPreferences(); }, [fetchNotifications, fetchPreferences]);
  useEffect(() => { if (activeTab === 'feedback') loadFeedback(); }, [activeTab, loadFeedback]);

  const togglePreference = async (type: string) => {
    const current = preferences.find(p => p.type === type);
    const newEnabled = current ? !current.enabled : false;
    setTogglingType(type);
    try {
      await fetch(`${apiBase}/api/admin/notification-preferences/${type}`, {
        method: 'PATCH', credentials: 'include', headers: authHeaders(), body: JSON.stringify({ enabled: newEnabled }),
      });
      setPreferences(prev => prev.map(p => p.type === type ? { ...p, enabled: newEnabled } : p));
    } catch { } finally { setTogglingType(null); }
  };

  const markAllRead = () => {
    const all = new Set(notifications.map(n => n.id));
    saveStoredReadIds(all);
    setReadIds(all);
  };

  const markRead = (id: string) => {
    const updated = new Set(readIds);
    updated.add(id);
    saveStoredReadIds(updated);
    setReadIds(updated);
  };

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await fetch(`${apiBase}/api/admin/feedback/${id}/resolve`, { method: 'PATCH', credentials: 'include', headers: authHeaders() });
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, resolved: true, resolved_at: new Date().toISOString() } : f));
    } finally { setResolving(null); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`${apiBase}/api/admin/feedback/${id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      const stRes = await fetch(`${apiBase}/api/admin/feedback/stats`, { credentials: 'include', headers: authHeaders() });
      const stData = await stRes.json();
      setStats(stData.stats ?? []);
    } finally { setDeleting(null); }
  };

  const filtered = notifications.filter(n => {
    if (filterSeverity !== 'all' && n.severity !== filterSeverity) return false;
    if (filterRead === 'unread' && readIds.has(n.id)) return false;
    if (filterRead === 'read' && !readIds.has(n.id)) return false;
    if (filterCategory !== 'all' && typeToCategory(n.type) !== filterCategory) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;
  const totalUnresolved = feedbacks.filter(f => !f.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-syne font-semibold" style={{ color: 'var(--text-primary)' }}>Centro de actividad</h1>
        <button onClick={() => activeTab === 'notifications' ? fetchNotifications() : loadFeedback()}
          className="p-2 rounded-xl border transition-colors hover:opacity-80"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} title="Actualizar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <button onClick={() => setActiveTab('notifications')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: activeTab === 'notifications' ? '#FF5C3A' : 'transparent', color: activeTab === 'notifications' ? '#fff' : 'var(--text-muted)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          Notificaciones
          {unreadCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: activeTab === 'notifications' ? 'rgba(255,255,255,0.25)' : '#ef4444', color: '#fff' }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('feedback')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: activeTab === 'feedback' ? '#FF5C3A' : 'transparent', color: activeTab === 'feedback' ? '#fff' : 'var(--text-muted)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Feedback IA
          {totalUnresolved > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: activeTab === 'feedback' ? 'rgba(255,255,255,0.25)' : '#f97316', color: '#fff' }}>
              {totalUnresolved}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB NOTIFICACIONES ── */}
      {activeTab === 'notifications' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Marcar todas como leídas ({unreadCount})
              </button>
            )}
            <button onClick={() => { setShowPrefs(v => !v); if (!showPrefs) fetchPreferences(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:opacity-80 ml-auto"
              style={{ borderColor: showPrefs ? '#FF5C3A' : 'var(--border-color)', color: showPrefs ? '#FF5C3A' : 'var(--text-secondary)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Preferencias
            </button>
          </div>

          {showPrefs && (
            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Preferencias de notificaciones</h2>
              {prefLoading ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Cargando...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Object.entries(CATEGORIES).map(([catKey, { label, types }]) => (
                    <div key={catKey}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <div className="space-y-3">
                        {types.map(type => {
                          const pref = preferences.find(p => p.type === type);
                          const enabled = pref ? pref.enabled : true;
                          return (
                            <div key={type} className="flex items-center justify-between gap-3">
                              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{type.replace(/_/g, ' ')}</span>
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
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[160px] px-3 py-2 rounded-xl text-sm border bg-transparent focus:outline-none focus:border-orange-500"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-xl text-sm border focus:outline-none"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}>
              <option value="all">Todas las categorías</option>
              {Object.entries(CATEGORIES).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="px-3 py-2 rounded-xl text-sm border focus:outline-none"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}>
              <option value="all">Todas las severidades</option>
              <option value="error">Error</option>
              <option value="warning">Advertencia</option>
              <option value="info">Info</option>
              <option value="success">Éxito</option>
            </select>
            <select value={filterRead} onChange={e => setFilterRead(e.target.value)} className="px-3 py-2 rounded-xl text-sm border focus:outline-none"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}>
              <option value="all">Todas</option>
              <option value="unread">Sin leer</option>
              <option value="read">Leídas</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin w-6 h-6" style={{ color: '#FF5C3A' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
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
                  <button key={n.id} onClick={() => { setSelected(n); markRead(n.id); }}
                    className="w-full text-left rounded-2xl border px-4 py-3.5 transition-colors hover:opacity-80"
                    style={{ backgroundColor: isRead ? 'transparent' : 'var(--bg-card)', borderColor: isRead ? 'var(--border-color)' : SEVERITY_COLORS[n.severity] + '33' }}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0"><SeverityIcon severity={n.severity} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate" style={{ color: isRead ? 'var(--text-muted)' : 'var(--text-primary)' }}>{n.title}</p>
                          {!isRead && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#FF5C3A' }} />}
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                      </div>
                      <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
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

      {/* ── TAB FEEDBACK IA ── */}
      {activeTab === 'feedback' && (
        <>
          {/* Stats */}
          {stats.length > 0 && (
            <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Errores frecuentes (sin resolver)</p>
              <div className="flex flex-wrap gap-2">
                {stats.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ERROR_TYPE_COLORS[s.error_type] ?? '#6b7280' }} />
                    <span className="font-medium">{ERROR_TYPE_LABELS[s.error_type] ?? s.error_type}</span>
                    {s.product_category && <span style={{ color: 'var(--text-muted)' }}>· {s.product_category}</span>}
                    <span className="font-bold px-1.5 py-0.5 rounded-md text-white text-[10px]" style={{ backgroundColor: ERROR_TYPE_COLORS[s.error_type] ?? '#6b7280' }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">Todos los tipos</option>
              {Object.entries(ERROR_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={filterResolved} onChange={e => setFilterResolved(e.target.value)} className="px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="false">Sin resolver</option>
              <option value="true">Resueltos</option>
              <option value="">Todos</option>
            </select>
            <button onClick={loadFeedback} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1.5 transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>

          {/* Tabla */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            {feedbackLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No hay feedbacks con estos filtros</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                    {['Tipo', 'Categoría', 'Descripción', 'Fecha', 'Estado', ''].map((h, i) => (
                      <th key={i} className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide ${i === 1 ? 'hidden md:table-cell' : i === 2 ? 'hidden lg:table-cell' : i === 3 ? 'hidden xl:table-cell' : ''}`}
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((f, i) => (
                    <>
                      <tr key={f.id} className="transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: expanded === f.id ? 'var(--bg-hover)' : i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)' }}
                        onClick={() => setExpanded(expanded === f.id ? null : f.id)}>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-white"
                            style={{ backgroundColor: ERROR_TYPE_COLORS[f.error_type] ?? '#6b7280' }}>
                            {ERROR_TYPE_LABELS[f.error_type] ?? f.error_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                          {f.product_category ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
                          <span className="truncate block">{f.description ?? <span style={{ color: 'var(--text-muted)' }}>Sin descripción</span>}</span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(f.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          {f.resolved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              Resuelto
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#f97316' }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!f.resolved && (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={e => { e.stopPropagation(); handleResolve(f.id); }}
                                disabled={resolving === f.id || deleting === f.id}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: '#FF5C3A' }}>
                                {resolving === f.id ? '...' : 'Resolver'}
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleDelete(f.id); }}
                                disabled={resolving === f.id || deleting === f.id}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{ borderColor: '#ef444455', color: '#ef4444', backgroundColor: 'transparent' }}
                                title="Eliminar del RAG">
                                {deleting === f.id ? '...' : 'Eliminar RAG'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {expanded === f.id && (f.prompt_used || f.result_image_url) && (
                        <tr key={`${f.id}-exp`} style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                          <td colSpan={6} className="px-4 pb-4 pt-2">
                            <div className="flex gap-4 flex-wrap">
                              {f.result_image_url && (
                                <div className="flex-shrink-0">
                                  <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Imagen generada</p>
                                  <a href={f.result_image_url} target="_blank" rel="noopener noreferrer">
                                    <img src={f.result_image_url} alt="Imagen generada" className="rounded-lg object-cover border"
                                      style={{ width: 120, height: 120, borderColor: 'var(--border-color)' }} />
                                  </a>
                                </div>
                              )}
                              {f.prompt_used && (
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Prompt usado en la generación</p>
                                  <pre className="text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words"
                                    style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', maxHeight: '160px' }}>
                                    {f.prompt_used}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Modal detalle notificación */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <SeverityIcon severity={selected.severity} />
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{selected.message}</p>
            {selected.brandName && (
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Marca: <span style={{ color: 'var(--text-secondary)' }}>{selected.brandName}</span></p>
            )}
            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <pre className="text-xs rounded-xl p-3 overflow-auto" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                {JSON.stringify(selected.metadata, null, 2)}
              </pre>
            )}
            <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>{new Date(selected.createdAt).toLocaleString('es-CO')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
