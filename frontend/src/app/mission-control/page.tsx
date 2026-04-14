// Lookitry Mission Control - Overview Page
// v1.0 | Abril 2026

'use client';

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
  ArrowRight,
} from 'lucide-react';
import { MCLayout, OverviewStats, AgentsGrid, TryOnQueue, SystemStatusGrid, BusinessKPIs } from '@/components/mission-control';
import { StatusDot, Badge } from '@/components/mission-control';
import { MOCK_SYSTEM_STATUS } from '@/lib/mission-control/constants';

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
  const systemStatus = MOCK_SYSTEM_STATUS.overall;

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
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#F0F0F0]">
          Mission Control
        </h1>
        <p className="mt-2 text-[#888888]">
          Bienvenido al centro de comando de Lookitry. Aquí puedes monitorear todos los agentes, 
          métricas y operaciones en tiempo real.
        </p>
      </motion.div>

      {/* Overview Stats */}
      <OverviewStats
        agentCount={10}
        systemStatus={systemStatus}
        tryons24h={847}
        activeUsers={847}
        pnlToday={120}
      />

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
                <ArrowRight className="mt-3 h-4 w-4 text-[#555555] transition-transform group-hover:translate-x-1 group-hover:text-[#FF5C3A]" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Activity - Preview Cards */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Agent Status Preview */}
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
              { name: 'Sammantha', status: 'online', task: 'Coordinando daily sync' },
              { name: 'Kira', status: 'busy', task: 'Ejecutando tests E2E' },
              { name: 'Leo', status: 'online', task: 'Analizando posiciones' },
              { name: 'Zephyr', status: 'online', task: 'Monitoreando servicios' },
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

        {/* System Status Preview */}
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
        transition={{ delay: 0.5 }}
        className="mt-12 border-t border-[#1e1e1e] pt-6 text-center"
      >
        <p className="text-sm text-[#555555]">
          Lookitry Mission Control v1.0 • 
          <span className="mx-2">•</span>
          Actualizado en tiempo real
        </p>
        <p className="mt-1 text-xs text-[#444444]">
          Powered by Sammantha + 10 Agentes IA
        </p>
      </motion.footer>
    </MCLayout>
  );
}