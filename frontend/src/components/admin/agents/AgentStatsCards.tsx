'use client';

import { motion } from 'framer-motion';
import { AgentStats } from '@/services/agentApi';

interface AgentStatsCardsProps {
  stats: AgentStats;
  onAgentClick: (agentName: string) => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function AgentStatsCards({ stats, onAgentClick }: AgentStatsCardsProps) {
  // Derivar unique agents from recentActivity
  const agentNames = [...new Set(stats.recentActivity.map(a => a.agent_name))];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Tasks totales
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {stats.totalTasks}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Success Rate
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight" style={{ color: '#22c55e' }}>
            {formatPercent(stats.successRate)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Avg Duration
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {formatDuration(stats.avgDuration)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Agentes activos
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {agentNames.length}
          </p>
        </motion.div>
      </div>

      {/* Agent Cards Grid */}
      {agentNames.length > 0 && (
        <div>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Agentes activos
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agentNames.map((agentName, i) => (
              <motion.button
                key={agentName}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onAgentClick(agentName)}
                className="group rounded-[1.8rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 text-left transition-all hover:border-[var(--accent)]/30 hover:shadow-lg hover:shadow-[var(--accent)]/5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                    <span className="text-lg font-black" style={{ color: 'var(--accent)' }}>
                      {agentName.charAt(0)}
                    </span>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                </div>

                <h3 className="mb-3 font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {agentName}
                </h3>

                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Click para ver detalle
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
