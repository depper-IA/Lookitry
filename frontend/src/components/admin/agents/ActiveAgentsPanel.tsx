'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bot, Circle, Clock, AlertCircle } from 'lucide-react';
import { fetchActiveAgents, ActiveAgent } from '@/services/agentApi';

const STATUS_COLORS = {
  working: '#22c55e',
  idle: '#eab308',
  error: '#ef4444',
} as const;

const HEARTBEAT_TIMEOUT_MS = 30000; // 30s sin heartbeat = inactivo

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'ahora';
  if (diffSec < 60) return `hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  return `hace ${diffHr}h`;
}

function getAgentStatus(agent: ActiveAgent): 'working' | 'idle' | 'error' {
  return agent.status;
}

function isAgentAlive(agent: ActiveAgent): boolean {
  const lastHeartbeat = new Date(agent.last_heartbeat_at).getTime();
  const now = Date.now();
  return now - lastHeartbeat < HEARTBEAT_TIMEOUT_MS;
}

export function ActiveAgentsPanel() {
  const [agents, setAgents] = useState<ActiveAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      const data = await fetchActiveAgents();
      setAgents(data.agents);
      setLastUpdate(new Date());
      setError('');
    } catch (e: any) {
      console.error('Error fetching active agents:', e);
      setError(e.message || 'Error cargando agentes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Polling cada 5 segundos
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      loadAgents();
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadAgents]);

  const aliveAgents = agents.filter(isAgentAlive);
  const activeCount = aliveAgents.length;
  const totalCount = agents.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header con stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Bot className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Agentes Activos
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Monitoreo en tiempo real
            </p>
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5">
            <Circle className="h-2 w-2 fill-[#22c55e] text-[#22c55e]" />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {activeCount}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>activos</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5">
            <Circle className="h-2 w-2 fill-[var(--text-muted)] text-[var(--text-muted)]" />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {totalCount - activeCount}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>inactivos</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        {loading && agents.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <div
              className="h-8 w-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : error && agents.length === 0 ? (
          <div className="flex h-32 items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <span className="text-sm text-rose-500">{error}</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <Bot className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay agentes activos
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Los agentes aparecerán aquí cuando envíen su heartbeat
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => {
              const alive = isAgentAlive(agent);
              const status = getAgentStatus(agent);
              const statusColor = STATUS_COLORS[status];

              return (
                <motion.div
                  key={agent.agent_name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-xl border p-4 transition-colors"
                  style={{
                    borderColor: alive ? `${statusColor}30` : 'var(--border-color)',
                    backgroundColor: alive ? `${statusColor}08` : 'transparent',
                  }}
                >
                  {/* Agent info */}
                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div
                      className="relative flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${statusColor}15` }}
                    >
                      <Bot className="h-5 w-5" style={{ color: statusColor }} />
                      {alive && (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg-card)]"
                          style={{ backgroundColor: statusColor }}
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {agent.agent_name}
                        </p>
                        {/* Badge VIVO/SILENCIOSO */}
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            borderColor: alive ? '#22c55e' : 'var(--border-color)',
                            color: alive ? '#22c55e' : 'var(--text-muted)',
                            backgroundColor: alive ? '#22c55e15' : 'transparent',
                          }}
                        >
                          {alive ? 'VIVO' : 'SILENCIOSO'}
                        </span>
                      </div>
                      {agent.current_task_description && alive && (
                        <p className="mt-0.5 text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                          {agent.current_task_description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Time & status */}
                  <div className="flex items-center gap-3">
                    {/* Status label */}
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${statusColor}15`,
                        color: statusColor,
                      }}
                    >
                      {status === 'working' ? 'Trabajando' : status === 'idle' ? 'Idle' : 'Error'}
                    </span>

                    {/* Last heartbeat */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatTimeAgo(agent.last_heartbeat_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer con last update */}
        {lastUpdate && (
          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-color)] pt-3">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Actualizado {formatTimeAgo(lastUpdate.toISOString())}
            </span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Auto-refresh 5s
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
