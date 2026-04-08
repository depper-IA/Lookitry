'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bot, Circle, Clock, AlertCircle } from 'lucide-react';
import { fetchActiveAgents, ActiveAgent } from '@/services/agentApi';

// Lista de todos los agentes configurados en el sistema
const ALL_AGENTS = [
  { name: 'sammy', description: 'Orquestador principal', model: 'Groq' },
  { name: 'webwizard', description: 'Frontend y UX', model: 'MiniMax' },
  { name: 'devguardian', description: 'Calidad y Seguridad', model: 'DeepSeek' },
  { name: 'dataalchemist', description: 'Base de Datos, IA y n8n', model: 'Gemini' },
  { name: 'growthpilot', description: 'CRM, Marketing y Leads', model: 'Groq' },
  { name: 'architectai', description: 'Infraestructura y DevOps', model: 'DeepSeek' },
  { name: 'docs-writter', description: 'Documentación', model: 'Groq' },
] as const;

type AgentName = typeof ALL_AGENTS[number]['name'];

const STATUS_COLORS = {
  active: '#22c55e',
  inactive: '#6b7280',
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

// Helper para verificar si un agente está vivo (heartbeat reciente)
function isAgentAlive(heartbeat: string | null): boolean {
  if (!heartbeat) return false;
  const lastHeartbeat = new Date(heartbeat).getTime();
  const now = Date.now();
  return now - lastHeartbeat < HEARTBEAT_TIMEOUT_MS;
}

// Interfaz para agente local con info de configuración
interface ConfiguredAgent {
  name: string;
  description: string;
  model: string;
  status: 'active' | 'inactive' | 'error';
  currentTask?: string | null;
  lastHeartbeat?: string | null;
}

export function ActiveAgentsPanel() {
  const [heartbeatData, setHeartbeatData] = useState<Map<string, ActiveAgent>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      const data = await fetchActiveAgents();
      // Crear mapa de heartbeat por nombre de agente
      const heartbeatMap = new Map<string, ActiveAgent>();
      data.agents.forEach((agent) => {
        heartbeatMap.set(agent.agent_name, agent);
      });
      setHeartbeatData(heartbeatMap);
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

  // Combinar configuración estática con datos de heartbeat
  const allAgents: ConfiguredAgent[] = ALL_AGENTS.map((agentConfig) => {
    const heartbeat = heartbeatData.get(agentConfig.name);
    
    if (!heartbeat) {
      return {
        ...agentConfig,
        status: 'inactive',
        currentTask: null,
        lastHeartbeat: null,
      };
    }

    const alive = isAgentAlive(heartbeat.last_heartbeat_at);
    return {
      name: agentConfig.name,
      description: agentConfig.description,
      model: agentConfig.model,
      status: alive ? 'active' : heartbeat.status === 'error' ? 'error' : 'inactive',
      currentTask: heartbeat.current_task_description,
      lastHeartbeat: heartbeat.last_heartbeat_at,
    };
  });

  const activeCount = allAgents.filter((a) => a.status === 'active').length;
  const totalCount = allAgents.length;

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
        {loading && heartbeatData.size === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <div
              className="h-8 w-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : error && heartbeatData.size === 0 ? (
          <div className="flex h-32 items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <span className="text-sm text-rose-500">{error}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {allAgents.map((agent) => {
              const statusColor = STATUS_COLORS[agent.status];
              const isActive = agent.status === 'active';

              return (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-xl border p-4 transition-colors"
                  style={{
                    borderColor: isActive ? `${statusColor}30` : 'var(--border-color)',
                    backgroundColor: isActive ? `${statusColor}08` : 'transparent',
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
                      {isActive && (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg-card)]"
                          style={{ backgroundColor: statusColor }}
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                          {agent.name}
                        </p>
                        {/* Badge ACTIVO/INACTIVO */}
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            borderColor: isActive ? '#22c55e' : 'var(--border-color)',
                            color: isActive ? '#22c55e' : 'var(--text-muted)',
                            backgroundColor: isActive ? '#22c55e15' : 'transparent',
                          }}
                        >
                          {isActive ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {agent.description}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">•</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                          {agent.model}
                        </span>
                      </div>
                      {agent.currentTask && isActive && (
                        <p className="mt-0.5 text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                          {agent.currentTask}
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
                      {agent.status === 'active' ? 'Activo' : agent.status === 'error' ? 'Error' : 'Inactivo'}
                    </span>

                    {/* Last heartbeat */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {agent.lastHeartbeat ? formatTimeAgo(agent.lastHeartbeat) : 'Sin heartbeat'}
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
