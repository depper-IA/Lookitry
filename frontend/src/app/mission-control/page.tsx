// Mission Control - Overview Page focused on OpenClaw Agents
// v2.0 | Abril 2026 - AGENTS REAL DATA from OpenClaw

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
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { MCLayout, StatusDot, Badge } from '@/components/mission-control';

// ============================================================================
// Types
// ============================================================================

interface AgentStats {
  totalSessions: number;
  telegramSessions: number;
  webchatSessions: number;
  completedSessions: number;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  status: 'online' | 'busy' | 'offline';
  lastActivity: string;
  lastActivityTimestamp: number;
  channel: string;
  stats: AgentStats;
  skills: string[];
  currentTask: string;
}

interface AgentsResponse {
  agents: Agent[];
  summary: {
    totalAgents: number;
    activeAgents: number;
    totalSessions: number;
    telegramAgents: number;
    webchatAgents: number;
  };
  lastUpdated: string;
}

// ============================================================================
// Quick Stats
// ============================================================================

const STAT_COLORS = ['#FF5C3A', '#00E5A0', '#FFB547', '#5C8AFF', '#BF5CFF', '#FF3A5C'];

// ============================================================================
// Page Component
// ============================================================================

export default function MissionControlPage() {
  const [agents, setAgents] = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch('/api/mission-control/agents');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setAgents(data);
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar los agentes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  const systemStatus = agents?.summary?.activeAgents > 0 ? 'healthy' : 'warning';

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={agents?.agents?.reduce((acc, a) => {
        acc[a.id] = a.status;
        return acc;
      }, {} as Record<string, 'online' | 'busy' | 'offline'>) || {}}
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#F0F0F0]">
              🎯 Mission Control
            </h1>
            <p className="mt-2 text-[#888888]">
              Centro de comando de agentes OpenClaw. Monitorea, coordina y delega tareas en tiempo real.
            </p>
          </div>
          {agents?.lastUpdated && (
            <div className="text-right text-xs text-[#555555]">
              <p>Actualizado: {new Date(agents.lastUpdated).toLocaleTimeString('es-CO')}</p>
              <p className="mt-1">Sesiones: {agents.summary.totalSessions}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#F0F0F0]">Estado General</h2>
            <p className="mt-1 text-sm text-[#888888]">Resumen de agentes OpenClaw</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 h-24" />
            ))}
          </div>
        ) : agents ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Agents */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-[#FF5C3A]/30 bg-gradient-to-br from-[#FF5C3A]/10 to-transparent p-4"
            >
              <div className="flex items-center gap-2">
                <Cpu className="h-6 w-6 text-[#FF5C3A]" />
                <div>
                  <p className="text-xs text-[#888888]">Total Agentes</p>
                  <p className="font-mono text-2xl font-bold text-[#FF5C3A]">{agents.summary.totalAgents}</p>
                </div>
              </div>
            </motion.div>

            {/* Active Agents */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border border-[#00E5A0]/30 bg-gradient-to-br from-[#00E5A0]/10 to-transparent p-4"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-[#00E5A0]" />
                <div>
                  <p className="text-xs text-[#888888]">Activos</p>
                  <p className="font-mono text-2xl font-bold text-[#00E5A0]">{agents.summary.activeAgents}</p>
                </div>
              </div>
            </motion.div>

            {/* Telegram */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-[#5C8AFF]" />
                <div>
                  <p className="text-xs text-[#888888]">Telegram</p>
                  <p className="font-mono text-2xl font-bold text-[#5C8AFF]">{agents.summary.telegramAgents}</p>
                </div>
              </div>
            </motion.div>

            {/* Total Sessions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-[#FFB547]" />
                <div>
                  <p className="text-xs text-[#888888]">Sesiones Totales</p>
                  <p className="font-mono text-2xl font-bold text-[#FFB547]">{agents.summary.totalSessions}</p>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="rounded-lg border border-[#FF3A5C]/30 bg-[#FF3A5C]/10 p-4 text-center">
            <p className="text-[#FF3A5C]">{error || 'Error cargando agentes'}</p>
          </div>
        )}
      </section>

      {/* Agent Cards Grid */}
      <section className="mb-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-[#F0F0F0]">
          Agentes OpenClaw
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents?.agents.map((agent, idx) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-lg border p-4 transition-all ${
                agent.status === 'online' ? 'border-[#00E5A0]/30 bg-[#00E5A0]/5' :
                agent.status === 'busy' ? 'border-[#FFB547]/30 bg-[#FFB547]/5' :
                'border-[#1e1e1e] bg-[#111111]'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{agent.icon}</div>
                  <div>
                    <h3 className="font-semibold text-[#F0F0F0]">{agent.name}</h3>
                    <p className="text-xs text-[#888888]">{agent.role}</p>
                  </div>
                </div>
                <StatusDot status={agent.status} size="md" />
              </div>
              
              <p className="text-xs text-[#555555] mb-3">{agent.description}</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#888888]">Última actividad</span>
                  <span className="text-[#F0F0F0]">{agent.lastActivity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#888888]">Canal</span>
                  <Badge variant={agent.channel === 'telegram' ? 'ok' : 'pending'}>
                    {agent.channel === 'telegram' ? '📱 Telegram' : '💻 Webchat'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#888888]">Sesiones</span>
                  <span className="text-[#F0F0F0]">{agent.stats.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#888888]">Completadas</span>
                  <span className="text-[#00E5A0]">{agent.stats.completedSessions}</span>
                </div>
              </div>

              {agent.skills.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#1e1e1e]">
                  <p className="text-xs text-[#555555] mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.slice(0, 4).map((skill) => (
                      <span 
                        key={skill}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#1e1e1e] text-[#888888]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-[#F0F0F0]">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 transition-all hover:border-[#FF5C3A]/30 hover:bg-[#161616]"
          >
            <Server className="h-5 w-5 text-[#FF5C3A]" />
            <span className="text-sm text-[#F0F0F0]">Admin Dashboard</span>
          </Link>
          <Link
            href="/admin/agents"
            className="flex items-center gap-2 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 transition-all hover:border-[#00E5A0]/30 hover:bg-[#161616]"
          >
            <Cpu className="h-5 w-5 text-[#00E5A0]" />
            <span className="text-sm text-[#F0F0F0]">Gestionar Agentes</span>
          </Link>
          <Link
            href="/admin/audit-log"
            className="flex items-center gap-2 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 transition-all hover:border-[#FFB547]/30 hover:bg-[#161616]"
          >
            <Activity className="h-5 w-5 text-[#FFB547]" />
            <span className="text-sm text-[#F0F0F0]">Audit Log</span>
          </Link>
          <Link
            href="/admin/health"
            className="flex items-center gap-2 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 transition-all hover:border-[#5C8AFF]/30 hover:bg-[#161616]"
          >
            <CheckCircle className="h-5 w-5 text-[#5C8AFF]" />
            <span className="text-sm text-[#F0F0F0]">System Health</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 border-t border-[#1e1e1e] pt-6 text-center"
      >
        <p className="text-xs text-[#555555]">
          Lookitry Mission Control v2.0 | OpenClaw Agent Control Center
          {agents?.lastUpdated && (
            <> | Última actualización: {new Date(agents.lastUpdated).toLocaleString('es-CO')}</>
          )}
        </p>
      </motion.footer>
    </MCLayout>
  );
}
