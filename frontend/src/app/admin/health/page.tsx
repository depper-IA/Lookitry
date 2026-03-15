'use client';

import { useEffect, useState, useCallback } from 'react';

type ServiceStatus = 'ok' | 'degraded' | 'down' | 'loading';

interface ServiceResult {
  status: ServiceStatus;
  latency: number;
}

interface HealthData {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  services: {
    supabase: ServiceResult;
    n8n: ServiceResult;
    email: ServiceResult;
  };
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const styles: Record<ServiceStatus, string> = {
    ok:       'bg-green-100 text-green-800 border-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    down:     'bg-red-100 text-red-800 border-red-200',
    loading:  'bg-gray-100 text-gray-500 border-gray-200',
  };
  const labels: Record<ServiceStatus, string> = {
    ok: 'Operativo', degraded: 'Degradado', down: 'Caído', loading: 'Verificando',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'loading' ? 'bg-gray-400 animate-pulse' : status === 'ok' ? 'bg-green-500' : status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
      {labels[status]}
    </span>
  );
}

function StatusIcon({ status }: { status: 'ok' | 'degraded' | 'down' | 'loading' }) {
  if (status === 'ok') return (
    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (status === 'degraded') return (
    <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
  if (status === 'down') return (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  return (
    <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

const SERVICE_LABELS: Record<string, { name: string; description: string }> = {
  supabase: { name: 'Base de datos', description: 'Supabase PostgreSQL' },
  n8n:      { name: 'Motor de IA',   description: 'n8n Webhook / Generación' },
  email:    { name: 'Email',         description: 'Servidor SMTP' },
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/health`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      // Si el servidor no responde, marcar todo como down
      setHealth({
        status: 'down',
        timestamp: new Date().toISOString(),
        uptime: 0,
        services: {
          supabase: { status: 'down', latency: 0 },
          n8n:      { status: 'down', latency: 0 },
          email:    { status: 'down', latency: 0 },
        },
      });
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const overallLabel: Record<string, string> = {
    ok:      'Todos los sistemas operativos',
    degraded:'Algunos servicios con problemas',
    down:    'Sistema no disponible',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-syne font-bold">Estado del Sistema</h1>
          <p style={{ color: 'var(--text-muted)' }} className="mt-1 text-sm">
            {lastChecked
              ? `Última verificación: ${lastChecked.toLocaleTimeString('es-CO')}`
              : 'Verificando servicios...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
            <div
              onClick={() => setAutoRefresh(v => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${autoRefresh ? 'bg-[#FF5C3A]' : 'bg-gray-400'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoRefresh ? 'translate-x-4' : ''}`} />
            </div>
            Auto-refresh (30s)
          </label>
          <button
            onClick={() => { setLoading(true); fetchHealth(); }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-[#FF5C3A] text-white text-sm font-medium rounded-xl hover:bg-[#e04e30] disabled:opacity-50 transition-colors"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Verificar ahora
          </button>
        </div>
      </div>

      {/* Banner de estado general */}
      {health && (
        <div style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
          className={`rounded-2xl border p-4 flex items-center gap-3 ${
            health.status === 'ok' ? 'border-emerald-500/30 bg-emerald-500/5' :
            health.status === 'degraded' ? 'border-amber-500/30 bg-amber-500/5' :
            'border-red-500/30 bg-red-500/5'
          }`}>
          <StatusIcon status={health.status} />
          <div className="flex-1">
            <p style={{ color: 'var(--text-primary)' }} className="font-semibold">
              {overallLabel[health.status] || 'Estado desconocido'}
            </p>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
              Uptime del servidor: {formatUptime(health.uptime)}
              {' · '}
              {new Date(health.timestamp).toLocaleString('es-CO')}
            </p>
          </div>
          <StatusBadge status={health.status} />
        </div>
      )}

      {/* Tarjetas de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {health
          ? Object.entries(health.services).map(([key, svc]) => {
              const info = SERVICE_LABELS[key] || { name: key, description: '' };
              return (
                <div key={key} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p style={{ color: 'var(--text-primary)' }} className="font-semibold">{info.name}</p>
                      <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">{info.description}</p>
                    </div>
                    <StatusIcon status={svc.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={svc.status} />
                    <span style={{ color: 'var(--text-muted)' }} className="text-xs font-mono">
                      {svc.latency > 0 ? `${svc.latency} ms` : '—'}
                    </span>
                  </div>
                  {svc.latency > 0 && (
                    <div className="mt-3">
                      <div style={{ background: 'var(--bg-hover)' }} className="h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${svc.status === 'ok' ? 'bg-emerald-500' : svc.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min((svc.latency / 2000) * 100, 100)}%` }}
                        />
                      </div>
                      <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">
                        {svc.latency < 200 ? 'Rápido' : svc.latency < 800 ? 'Normal' : 'Lento'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          : [1, 2, 3].map(i => (
              <div key={i} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border shadow-sm p-5 animate-pulse">
                <div style={{ background: 'var(--bg-hover)' }} className="h-4 rounded w-1/2 mb-2" />
                <div style={{ background: 'var(--bg-hover)' }} className="h-3 rounded w-3/4 mb-4" />
                <div style={{ background: 'var(--bg-hover)' }} className="h-6 rounded w-1/3" />
              </div>
            ))
        }
      </div>

      {/* Info adicional */}
      <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-4">
        <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-semibold mb-2">Referencia de estados</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span><strong style={{ color: 'var(--text-secondary)' }}>Operativo</strong> — responde correctamente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span><strong style={{ color: 'var(--text-secondary)' }}>Degradado</strong> — responde con errores o lentitud</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <span><strong style={{ color: 'var(--text-secondary)' }}>Caído</strong> — no responde o timeout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
