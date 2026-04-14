// Lookitry Mission Control - Overview Page with REAL DATA
// v1.0 | Abril 2026

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Cpu, 
  Zap, 
  TrendingUp, 
  Shield, 
  Megaphone, 
  Activity, 
  Bot, 
  Server,
  Users,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { MCLayout, StatusDot, Badge } from '@/components/mission-control';
import { MOCK_SYSTEM_STATUS } from '@/lib/mission-control/constants';

// ============================================================================
// Types
// ============================================================================

interface RealMetrics {
  metrics: {
    totalBrands: number;
    activeBrands: number;
    trialBrands: number;
    proBrands: number;
    revenueToday: number;
    revenueMonth: number;
    activeAgents: number;
  };
  planDistribution: {
    trial: number;
    basic: number;
    pro: number;
    enterprise: number;
  };
  subscriptionStatus: {
    active: number;
    expiringSoon: number;
    expired: number;
    suspended: number;
    trial: number;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  lastUpdated: string;
}

// ============================================================================
// Quick Stats
// ============================================================================

const QUICK_LINKS = [
  { id: 'agents', label: 'Agentes', icon: Cpu, count: 10, color: '#FF5C3A' },
  { id: 'product', label: 'Try-On', icon: Zap, color: '#00E5A0' },
  { id: 'business', label: 'Business', icon: TrendingUp, color: '#FFB547' },
  { id: 'security', label: 'Seguridad', icon: Shield, color: '#FF3A5C' },
  { id: 'growth', label: 'Growth', icon: Megaphone, color: '#5C8AFF' },
  { id: 'trading', label: 'Trading', icon: Activity, color: '#BF5CFF' },
  { id: 'autolookitry', label: 'Autolookitry', icon: Bot, color: '#FF5C3A' },
  { id: 'system', label: 'Sistema', icon: Server, color: '#00E5A0' },
];

// ============================================================================
// Page Component
// ============================================================================

export default function MissionControlPage() {
  const [metrics, setMetrics] = useState<RealMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const systemStatus = MOCK_SYSTEM_STATUS.overall;

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/mission-control/overview');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar las métricas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 60 seconds
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={{
        sammantha: 'online',
        pixel: 'online',
        kira: 'busy',
        nadia: 'online',
        cipher: 'online',
        zephyr: 'online',
        marlo: 'online',
        rebecca: 'busy',
        leo: 'online',
        lina: 'online',
      }}
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#F0F0F0]">
            Mission Control
          </h1>
          <p className="mt-2 text-[#888888]">
            Bienvenido al centro de comando de Lookitry. Aquí puedes monitorear todos los agentes, 
            métricas y operaciones en tiempo real.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg border border-[#1e1e1e] bg-[#111111] px-3 py-2 text-xs text-[#888888] transition-colors hover:bg-[#1a1a1a] hover:text-[#F0F0F0]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </motion.div>

      {/* Overview Stats - REAL DATA */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#F0F0F0]">Mission Control Overview</h2>
            <p className="mt-1 text-sm text-[#888888]">Resumen operativo en tiempo real</p>
          </div>
          {metrics?.lastUpdated && (
            <span className="text-xs text-[#555555]">
              Actualizado: {new Date(metrics.lastUpdated).toLocaleTimeString('es-CO')}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 h-24" />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Brands */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-[#FF5C3A]/30 bg-gradient-to-br from-[#FF5C3A]/10 to-transparent p-4"
            >
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-[#FF5C3A]" />
                <div>
                  <p className="text-xs text-[#888888]">Total Marcas</p>
                  <p className="font-mono text-2xl font-bold text-[#FF5C3A]">{metrics.metrics.totalBrands}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-[#00E5A0]">● {metrics.metrics.activeBrands} activas</span>
                <span className="text-[#FFB547]">● {metrics.metrics.trialBrands} trial</span>
              </div>
            </motion.div>

            {/* Revenue */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-[#00E5A0]" />
                <div>
                  <p className="text-xs text-[#888888]">Revenue (30d)</p>
                  <p className="font-mono text-2xl font-bold text-[#00E5A0]">
                    ${metrics.metrics.revenueMonth.toFixed(0)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#555555]">COP {(metrics.metrics.revenueMonth * 4200).toFixed(0)}</p>
            </motion.div>

            {/* Plan Distribution */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-[#FFB547]" />
                <div>
                  <p className="text-xs text-[#888888]">Planes</p>
                  <p className="font-mono text-2xl font-bold text-[#FFB547]">
                    {metrics.planDistribution.pro + metrics.planDistribution.basic}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-[#FFB547]">PRO {metrics.planDistribution.pro}</span>
                <span className="text-[#888888]">BASIC {metrics.planDistribution.basic}</span>
              </div>
            </motion.div>

            {/* Subscription Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-[#00E5A0]" />
                <div>
                  <p className="text-xs text-[#888888]">Suscripciones</p>
                  <p className="font-mono text-2xl font-bold text-[#F0F0F0]">
                    {metrics.subscriptionStatus.active}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                {metrics.subscriptionStatus.expiringSoon > 0 && (
                  <span className="text-[#FFB547]">⚠ {metrics.subscriptionStatus.expiringSoon} expiran</span>
                )}
                {metrics.subscriptionStatus.expired > 0 && (
                  <span className="text-[#FF3A5C]">✕ {metrics.subscriptionStatus.expired} vencidas</span>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="rounded-lg border border-[#FF3A5C]/30 bg-[#FF3A5C]/10 p-4 text-center">
            <p className="text-[#FF3A5C]">{error || 'Error cargando métricas'}</p>
          </div>
        )}
      </section>

      {/* Quick Access Grid */}
      <section className="mb-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-[#F0F0F0]">
          Acceso Rápido
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {QUICK_LINKS.map((link, idx) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                href={`/mission-control/${link.id}`}
                className="group flex flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-[#111111] p-6 transition-all duration-200 hover:border-[#FF5C3A]/30 hover:bg-[#161616] hover:shadow-[0_0_20px_rgba(255,92,58,0.1)]"
              >
                <div 
                  className="mb-3 rounded-xl p-3"
                  style={{ backgroundColor: `${link.color}20` }}
                >
                  <link.icon className="h-6 w-6" style={{ color: link.color }} />
                </div>
                <span className="font-medium text-[#F0F0F0]">{link.label}</span>
                {link.count && (
                  <span className="mt-1 text-xs text-[#555555]">{link.count} agentes</span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Agent Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#F0F0F0]">
              Estado de Agentes
            </h3>
            <Link 
              href="/mission-control/agents"
              className="text-xs text-[#FF5C3A] hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Sammantha', status: 'online', task: 'Coordinando operaciones' },
              { name: 'Pixel', status: 'online', task: 'Desarrollo frontend' },
              { name: 'Kira', status: 'busy', task: 'Ejecutando tests' },
              { name: 'Leo', status: 'online', task: 'Analizando trading' },
            ].map((agent, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg bg-[#0a0a0a] p-3">
                <StatusDot status={agent.status as 'online' | 'busy' | 'offline'} size="md" />
                <div className="flex-1">
                  <span className="font-medium text-[#F0F0F0]">{agent.name}</span>
                  <p className="text-xs text-[#555555]">{agent.task}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#F0F0F0]">
              Servicios Críticos
            </h3>
            <Link 
              href="/mission-control/system"
              className="text-xs text-[#FF5C3A] hover:underline"
            >
              Ver dashboard →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MOCK_SYSTEM_STATUS.services.slice(0, 4).map((svc, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 rounded-lg bg-[#0a0a0a] p-3"
              >
                <StatusDot status={svc.status as 'up' | 'down' | 'degraded'} size="sm" />
                <span className="text-sm text-[#F0F0F0]">{svc.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#888888]">Uptime General</span>
              <Badge variant="ok">99.8%</Badge>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1e1e1e]">
              <div className="h-full w-[99.8%] rounded-full bg-[#00E5A0]" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 border-t border-[#1e1e1e] pt-6 text-center"
      >
        <p className="text-xs text-[#555555]">
          Lookitry Mission Control v1.0 | 
          {metrics?.lastUpdated && (
            <> Última actualización: {new Date(metrics.lastUpdated).toLocaleString('es-CO')}</>
          )}
        </p>
      </motion.footer>
    </MCLayout>
  );
}
