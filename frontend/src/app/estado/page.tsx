'use client';

import { useEffect, useState } from 'react';
import type { Metadata } from 'next';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

type ServiceStatus = 'ok' | 'degraded' | 'down';

interface ServiceResult {
  status: ServiceStatus;
  latency: number;
}

interface HealthResponse {
  status: ServiceStatus;
  timestamp: string;
  uptime: number;
  services: {
    supabase: ServiceResult;
    n8n: ServiceResult;
    email: ServiceResult;
    minio: ServiceResult;
  };
}

const SERVICE_LABELS: Record<string, string> = {
  supabase: 'Base de datos (Supabase)',
  n8n: 'Automatizaciones (n8n)',
  email: 'Servicio de email (SMTP)',
  minio: 'Almacenamiento (MinIO)',
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  supabase: 'Base de datos y autenticación',
  n8n: 'Procesamiento de imágenes IA',
  email: 'Envío de notificaciones y emails',
  minio: 'Almacenamiento de imágenes',
};

function statusLabel(status: ServiceStatus): string {
  switch (status) {
    case 'ok': return 'Operativo';
    case 'degraded': return 'Degradado';
    case 'down': return 'Caído';
  }
}

function statusColor(status: ServiceStatus): string {
  switch (status) {
    case 'ok': return 'text-emerald-400';
    case 'degraded': return 'text-amber-400';
    case 'down': return 'text-red-400';
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function EstadoPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const UPTIMEROBOT_STATUS_URL = 'https://stats.uptimerobot.com/CTEnSD7d1j';

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
        const res = await fetch(`${API_URL}/health`, { 
          next: { revalidate: 30 } 
        });
        if (!res.ok) throw new Error('Error al obtener estado');
        const data = await res.json();
        setHealth(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Transparencia</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight">
              Estado del servicio
            </h1>
              <p className="text-[#999] text-sm md:text-base mt-3 max-w-3xl">
                Monitoreo en tiempo real de todos los componentes de Lookitry.
              </p>
              <a 
                href={UPTIMEROBOT_STATUS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm text-[#FF5C3A] hover:underline"
              >
                Ver página de estado pública
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          {loading ? (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#FF5C3A] border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : error ? (
            <div className="max-w-5xl mx-auto">
              <div className="rounded-3xl border border-red-900/30 bg-red-900/10 p-6">
                <p className="text-red-400 font-semibold">No se pudo obtener el estado del servicio</p>
                <p className="text-red-300/60 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : health ? (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    health.status === 'ok' ? 'bg-emerald-400' :
                    health.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
                  } animate-pulse`} />
                  <p className={`text-lg font-semibold ${statusColor(health.status)}`}>
                    {statusLabel(health.status)}
                  </p>
                </div>
                <div className="text-[#666] text-sm">
                  Actualizado: {new Date(health.timestamp).toLocaleString('es-CO')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {Object.entries(health.services).map(([key, service]) => (
                  <div 
                    key={key} 
                    className={`rounded-3xl border p-6 ${
                      service.status === 'ok' ? 'border-[#2a2a2a] bg-[#111]' :
                      service.status === 'degraded' ? 'border-amber-900/30 bg-amber-900/10' :
                      'border-red-900/30 bg-red-900/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-[11px] uppercase tracking-wider font-semibold ${statusColor(service.status)}`}>
                        {statusLabel(service.status)}
                      </p>
                      {service.latency > 0 && (
                        <span className="text-[10px] text-[#666] font-mono">
                          {service.latency}ms
                        </span>
                      )}
                    </div>
                    <p className="text-white font-semibold mt-1">
                      {SERVICE_LABELS[key] || key}
                    </p>
                    <p className="text-[#888] text-xs mt-2">
                      {SERVICE_DESCRIPTIONS[key] || 'Servicio'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[#FF5C3A] text-[11px] uppercase tracking-wider font-semibold">Métricas del sistema</p>
                  <p className="text-[#666] text-xs">Uptime: {formatUptime(health.uptime)}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(health.services).map(([key, service]) => (
                    <div key={key} className="text-center">
                      <p className="text-2xl font-bold text-white">
                        {service.status === 'ok' ? '✓' : service.status === 'degraded' ? '⚠' : '✕'}
                      </p>
                      <p className="text-[10px] text-[#666] uppercase mt-1">
                        {SERVICE_LABELS[key]?.split(' ')[0] || key}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[#444] text-xs text-center">
                Esta página se actualiza automáticamente cada 30 segundos.
              </p>
            </div>
          ) : null}
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
