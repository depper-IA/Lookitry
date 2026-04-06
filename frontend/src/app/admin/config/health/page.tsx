'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CreditMetric, CreditProviderCard } from '@/components/admin/config/CreditComponents';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

type ServiceStatus = 'ok' | 'degraded' | 'down' | 'loading';
interface ServiceResult { status: ServiceStatus; latency: number; }
interface HealthData {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  services: { supabase: ServiceResult; n8n: ServiceResult; email: ServiceResult; minio: ServiceResult; };
}
interface SystemStats {
  ram: { total: number; free: number; used: number; percentage: number; };
  uptime: number; platform: string;
}
interface ProviderCredits {
  provider: 'openrouter' | 'replicate';
  status: 'ok' | 'partial' | 'not_configured';
  label: string | null;
  usage: number | null;
  limit: number | null;
  balance: number | null;
  usage_percent: number | null;
  estimated_generations_remaining: number | null;
  cost_per_generation: number;
  low_balance_alert: boolean;
  critical_balance_alert: boolean;
  can_top_up?: boolean;
  settings_url?: string | null;
  message?: string | null;
  configured?: boolean;
  is_free_tier?: boolean;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border shadow-sm overflow-hidden">
      <div style={{ borderColor: 'var(--border-color)' }} className="flex items-center gap-3 px-6 py-4 border-b">
        <div style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>
        <h2 style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function HealthDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = { ok: 'bg-emerald-500', degraded: 'bg-amber-500', down: 'bg-red-500', loading: 'bg-gray-400 animate-pulse' };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />;
}

const SERVICE_LABELS: Record<string, { name: string; desc: string }> = {
  supabase: { name: 'Base de datos', desc: 'Supabase PostgreSQL' },
  n8n:      { name: 'Motor de IA',   desc: 'n8n Webhook' },
  email:    { name: 'Email',         desc: 'Servidor SMTP' },
  minio:    { name: 'Archivos',      desc: 'MinIO Storage' },
};

function formatUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

function IconZap({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>; }
function IconServer({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>; }
function IconBrain({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>; }

export default function ConfigHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [openRouterCredits, setOpenRouterCredits] = useState<ProviderCredits | null>(null);
  const [replicateCredits, setReplicateCredits] = useState<ProviderCredits | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch(`${API_URL}/health`);
      setHealth(await res.json());
    } catch {
      setHealth({ status: 'down', timestamp: new Date().toISOString(), uptime: 0, services: { supabase: { status: 'down', latency: 0 }, n8n: { status: 'down', latency: 0 }, email: { status: 'down', latency: 0 }, minio: { status: 'down', latency: 0 } } });
    } finally { setLoadingHealth(false); }
  }, []);

  const loadSystemStats = useCallback(async () => {
    setLoadingSystem(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/system/stats`, { credentials: 'include' });
      if (res.ok) setSystemStats(await res.json());
    } catch {}
    finally { setLoadingSystem(false); }
  }, []);

  const loadCredits = useCallback(async () => {
    setLoadingCredits(true);
    try {
      const [openrouterRes, replicateRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/openrouter-credits`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/replicate-credits`, { credentials: 'include' }),
      ]);
      if (openrouterRes.ok) setOpenRouterCredits(await openrouterRes.json());
      else setOpenRouterCredits(null);
      if (replicateRes.ok) setReplicateCredits(await replicateRes.json());
      else setReplicateCredits(null);
    } catch {}
    finally { setLoadingCredits(false); }
  }, []);

  useEffect(() => {
    loadHealth();
    loadSystemStats();
    loadCredits();
  }, [loadHealth, loadSystemStats, loadCredits]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Link href="/admin/config" className="text-sm" style={{ color: 'var(--text-muted)' }}>Configuración</Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">Salud del sistema</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Estado de servicios, RAM y créditos de IA.</p>
      </div>

      <Section title="Estado de servicios" icon={<IconZap className="w-4 h-4" />}>
        {loadingHealth ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 animate-spin rounded-full border-2 border-[#FF5C3A] border-t-transparent" /></div>
        ) : health ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <HealthDot status={health.status} />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {health.status === 'ok' ? 'Todos los sistemas operativos' : health.status === 'degraded' ? 'Rendimiento degradado' : 'Sistema caído'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Uptime: {formatUptime(health.uptime)} · Última verificación: {new Date(health.timestamp).toLocaleString('es-CO')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(SERVICE_LABELS).map(([key, { name, desc }]) => {
                const svc = health.services[key as keyof typeof health.services];
                return (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)' }}>
                    <HealthDot status={svc?.status || 'down'} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc} · {svc?.latency > 0 ? `${svc.latency}ms` : '—'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Sistema" icon={<IconServer className="w-4 h-4" />}>
        {loadingSystem ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 animate-spin rounded-full border-2 border-[#FF5C3A] border-t-transparent" /></div>
        ) : systemStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <CreditMetric label="RAM usada" value={`${Math.round(systemStats.ram.used / 1024)}GB`} sub={`de ${Math.round(systemStats.ram.total / 1024)}GB total`} color={systemStats.ram.percentage > 80 ? '#ef4444' : '#10b981'} />
              <CreditMetric label="Uptime" value={formatUptime(systemStats.uptime)} sub={systemStats.platform} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Uso de RAM</span>
                <span className="text-xs font-mono font-bold" style={{ color: systemStats.ram.percentage > 80 ? '#ef4444' : '#10b981' }}>{systemStats.ram.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${systemStats.ram.percentage}%`, background: systemStats.ram.percentage > 80 ? '#ef4444' : '#10b981' }} />
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }} className="text-sm text-center py-4">No disponible</p>
        )}
      </Section>

      <Section title="Créditos de IA" icon={<IconBrain className="w-4 h-4" />}>
        <div className="space-y-4">
          <CreditProviderCard provider={openRouterCredits} loading={loadingCredits} onRefresh={loadCredits} fallbackProvider="openrouter" />
          <CreditProviderCard provider={replicateCredits} loading={loadingCredits} onRefresh={loadCredits} fallbackProvider="replicate" />
        </div>
      </Section>
    </div>
  );
}
