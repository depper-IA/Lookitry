'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type NotificationType =
  | 'new_brand'
  | 'upgrade_request'
  | 'plan_change_request'
  | 'trial_expiring'
  | 'trial_expired'
  | 'trial_converted'
  | 'high_usage'
  | 'credits_exhausted'
  | 'suspended'
  | 'payment_received'
  | 'multi_month_purchase'
  | 'subscription_expiring'
  | 'service_down'
  | 'service_recovered';

interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  brandId?: string;
  brandName?: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: {
    fromPlan?: string;
    toPlan?: string;
    clientMessage?: string | null;
    months?: number;
    discountPct?: number;
    amount?: number;
    daysLeft?: number;
    plan?: string;
    service?: string;
    used?: number;
    limit?: number;
    pct?: number;
    [key: string]: unknown;
  };
}

const STORAGE_KEY = 'admin_notifications_read';

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'new_brand':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
    case 'upgrade_request':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'plan_change_request':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
    case 'trial_expiring':
    case 'trial_expired':
    case 'subscription_expiring':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'trial_converted':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
    case 'high_usage':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'credits_exhausted':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    case 'suspended':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
    case 'payment_received':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'multi_month_purchase':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'service_down':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 8v4m0 4h.01" /></svg>;
    case 'service_recovered':
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
    default:
      return null;
  }
}

const SEVERITY_STYLES: Record<string, string> = {
  info:    'bg-blue-100 text-blue-600',
  warning: 'bg-amber-100 text-amber-600',
  error:   'bg-red-100 text-red-600',
  success: 'bg-emerald-100 text-emerald-600',
};

const SEVERITY_DOT: Record<string, string> = {
  info:    'bg-blue-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
  success: 'bg-emerald-500',
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

// ── Botón para aplicar cambio de plan directamente desde la notificación ──────

function ApplyPlanChangeButton({ brandId, toPlan, onDone }: { brandId: string; toPlan: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const apply = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/admin/brands/${brandId}/plan`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ plan: toPlan }),
        }
      );
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setDone(true);
      setTimeout(onDone, 800);
    } catch (err: any) {
      alert(err.message || 'Error al aplicar el cambio');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        Aplicado
      </span>
    );
  }

  return (
    <button
      onClick={apply}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 ${toPlan === 'PRO' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'}`}
    >
      {loading
        ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      Aplicar cambio a {toPlan}
    </button>
  );
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const all = new Set(notifications.map(n => n.id));
    saveReadIds(all);
    setReadIds(all);
  };

  const markOneRead = (id: string) => {
    const updated = new Set(readIds);
    updated.add(id);
    saveReadIds(updated);
    setReadIds(updated);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => { setOpen(v => !v); if (!open) fetchNotifications(); }}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Notificaciones"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">{unreadCount} nuevas</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchNotifications} disabled={loading} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Actualizar">
                  <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">Marcar todas</button>
                )}
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
              {loading && notifications.length === 0 ? (
                <div className="py-10 flex justify-center">
                  <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm text-gray-400">Sin notificaciones</p>
                </div>
              ) : (
                notifications.map(n => {
                  const isRead = readIds.has(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => { markOneRead(n.id); setSelected(n); setOpen(false); }}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${!isRead ? 'bg-indigo-50/40' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${SEVERITY_STYLES[n.severity]}`}>
                        <NotificationIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-tight ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                      {!isRead && <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${SEVERITY_DOT[n.severity]}`} />}
                    </div>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400 text-center">{notifications.length} notificaciones de los últimos 7 días</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${SEVERITY_STYLES[selected.severity]}`}>
                <NotificationIcon type={selected.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{selected.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(selected.createdAt).toLocaleString('es-CO')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Cuerpo */}
            <div className="px-5 py-4 space-y-4">
              {selected.brandName && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span className="text-gray-500">Marca:</span>
                  <span className="font-medium text-gray-900">{selected.brandName}</span>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-700 leading-relaxed">{selected.message}</p>
              </div>

              {/* Cambio de plan */}
              {selected.metadata?.fromPlan && selected.metadata?.toPlan && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{selected.metadata.fromPlan}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selected.metadata.toPlan === 'PRO' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>{selected.metadata.toPlan}</span>
                </div>
              )}

              {/* Meses y descuento en solicitud de cambio de plan */}
              {selected.type === 'plan_change_request' && selected.metadata?.months && Number(selected.metadata.months) > 0 && (() => {
                const months = Number(selected.metadata.months);
                const discountPct = Number(selected.metadata.discountPct ?? 0);
                const totalPrice = Number(selected.metadata.totalPrice ?? 0);
                return (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span>{months} mes{months > 1 ? 'es' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {discountPct > 0 && (
                        <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">-{discountPct}%</span>
                      )}
                      {totalPrice > 0 && (
                        <span className="text-sm font-bold text-gray-900">{totalPrice.toLocaleString('es-CO')} COP</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Compra multi-mes */}
              {selected.type === 'multi_month_purchase' && selected.metadata?.months && (() => {
                const months = Number(selected.metadata.months);
                const discountPct = Number(selected.metadata.discountPct ?? 0);
                return (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">{months} meses pagados</p>
                      {discountPct > 0 && (
                        <p className="text-xs text-emerald-700">{discountPct}% de descuento aplicado</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Servicio caído */}
              {(selected.type === 'service_down' || selected.type === 'service_recovered') && selected.metadata?.service && (
                <div className={`rounded-lg px-4 py-3 border ${selected.type === 'service_down' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-xs font-medium text-gray-500 mb-1">Servicio afectado</p>
                  <p className={`text-sm font-semibold ${selected.type === 'service_down' ? 'text-red-800' : 'text-emerald-800'}`}>{String(selected.metadata.service)}</p>
                </div>
              )}

              {/* Uso de créditos */}
              {(selected.type === 'high_usage' || selected.type === 'credits_exhausted') && selected.metadata?.used != null && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Generaciones usadas</span>
                    <span className="font-medium">{selected.metadata.used} / {selected.metadata.limit}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(selected.metadata.pct as number) >= 100 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, selected.metadata.pct as number)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Mensaje del cliente */}
              {selected.metadata?.clientMessage && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Mensaje del cliente:</p>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                    <p className="text-sm text-indigo-900 leading-relaxed italic">"{selected.metadata.clientMessage}"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              {(selected.type === 'plan_change_request' || selected.type === 'upgrade_request') && selected.brandId && selected.metadata?.toPlan && (
                <ApplyPlanChangeButton
                  brandId={selected.brandId}
                  toPlan={selected.metadata.toPlan as string}
                  onDone={() => { setSelected(null); fetchNotifications(); }}
                />
              )}
              {(selected.type === 'trial_expiring' || selected.type === 'trial_expired' || selected.type === 'subscription_expiring' || selected.type === 'suspended') && selected.brandId && (
                <a
                  href={`/admin/brands`}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  onClick={() => setSelected(null)}
                >
                  Ver marca
                </a>
              )}
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
