// Lookitry Mission Control - Agents Status API
// Real-time agent status from OpenClaw sessions + active tracking
// v1.0 | Abril 2026

import { NextResponse } from 'next/server';
import { sessions_list } from '@/lib/openclaw/sessions';
import { readFileSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const AGENTS_CONFIG = [
  { id: 'sammantha', name: 'Sammantha', role: 'Orquestadora', icon: '🎯', defaultStatus: 'online' },
  { id: 'pixel', name: 'Pixel', role: 'Frontend Magician', icon: '🎨', defaultStatus: 'busy' },
  { id: 'kira', name: 'Kira', role: 'Guardiana de Calidad', icon: '🔬', defaultStatus: 'busy' },
  { id: 'nadia', name: 'Nadia', role: 'Alquimista de Datos', icon: '🧬', defaultStatus: 'busy' },
  { id: 'cipher', name: 'Cipher', role: 'Hacker Ético', icon: '🛡️', defaultStatus: 'busy' },
  { id: 'zephyr', name: 'Zephyr', role: 'Arquitecto de Infra', icon: '⚡', defaultStatus: 'busy' },
  { id: 'marlo', name: 'Marlo', role: 'Piloto de Crecimiento', icon: '📈', defaultStatus: 'busy' },
  { id: 'rebecca', name: 'Rebecca', role: 'UGC Creator', icon: '📸', defaultStatus: 'busy' },
  { id: 'leo', name: 'Leo', role: 'Agente de Trading', icon: '💹', defaultStatus: 'busy' },
  { id: 'lina', name: 'Lina', role: 'Documentadora', icon: '📚', defaultStatus: 'busy' },
];

// Leer agentes activos desde archivo de tracking
function getActiveAgentsFromTracking(): string[] {
  try {
    const trackingPath = path.join(process.cwd(), '..', 'Lookitry_Brain_Vault', 'Cerebro', 'Estado', 'active_agents.json');
    const data = readFileSync(trackingPath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.activeAgents?.map((a: any) => a.agentId) || [];
  } catch {
    return [];
  }
}

function getAgentStatus(agentId: string, sessions: any[]): 'online' | 'busy' | 'offline' {
  const activeSessions = sessions.filter((s: any) => {
    const key = s.key?.toLowerCase() || '';
    const label = s.label?.toLowerCase() || '';
    return (
      (key.includes(agentId) || label.includes(agentId)) &&
      s.status === 'running'
    );
  });

  if (activeSessions.length > 0) {
    const hasActiveTask = activeSessions.some((s: any) => {
      const label = s.label?.toLowerCase() || '';
      return label.includes('working') || label.includes('task') || label.includes('job');
    });
    return hasActiveTask ? 'busy' : 'online';
  }
  return 'offline';
}

function getAgentLastActivity(agentId: string, sessions: any[]): string {
  const agentSessions = sessions.filter((s: any) => {
    const key = s.key?.toLowerCase() || '';
    const label = s.label?.toLowerCase() || '';
    return key.includes(agentId) || label.includes(agentId);
  });

  if (agentSessions.length === 0) return 'hace más de 1 hora';

  const mostRecent = agentSessions.reduce((latest: any, s: any) => {
    if (!latest || s.updatedAt > latest.updatedAt) return s;
    return latest;
  }, null);

  if (!mostRecent) return 'hace más de 1 hora';

  const now = Date.now();
  const diffMs = now - mostRecent.updatedAt;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'justo ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  return `hace ${Math.floor(diffHours / 24)}d`;
}

function getStatusMessage(agentId: string, status: string): string {
  if (status === 'online') return 'Activo y listo para recibir tareas';
  if (status === 'busy') return 'Procesando tarea asignada';
  return 'Sin actividad reciente';
}

export async function GET() {
  try {
    // Obtener agentes activos desde tracking
    const activeAgentsTracking = getActiveAgentsFromTracking();
    
    // Intentar obtener sesiones de OpenClaw
    let sessionData: any[] = [];
    try {
      const sessions = await sessions_list({
        limit: 100,
        messageLimit: 1,
      });
      sessionData = sessions?.sessions || [];
    } catch (openclawError) {
      console.warn('[Agents API] OpenClaw no disponible:', openclawError);
    }

    // Combinar: agentes activos del tracking + sesiones de OpenClaw
    const activeAgentIds = new Set([
      ...activeAgentsTracking,
      ...sessionData
        .filter((s: any) => s.status === 'running')
        .map((s: any) => {
          const key = s.key?.toLowerCase() || '';
          const label = s.label?.toLowerCase() || '';
          // Detectar agente por session key o label
          for (const config of AGENTS_CONFIG) {
            if (key.includes(config.id) || label.includes(config.id)) {
              return config.id;
            }
          }
          return null;
        })
        .filter(Boolean),
    ]);

    // Si no hay sesiones reales, retornar agentes como OFFLINE
    if (activeAgentIds.size === 0) {
      console.log('[Agents API] Sin agentes activos, retornando OFFLINE');
      const offlineAgents = AGENTS_CONFIG.map((config) => ({
        id: config.id,
        name: config.name,
        role: config.role,
        status: 'offline' as const,
        lastActivity: 'Sin actividad',
        statusMessage: 'Esperando tareas',
        icon: config.icon,
        metrics: buildMetrics(config.id, 'offline'),
      }));
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        agents: offlineAgents,
        totalSessions: sessionData.length,
        activeSessions: 0,
        mode: 'offline',
      });
    }

    // Build agent data con estado real
    const agents = AGENTS_CONFIG.map((config) => {
      const isActive = activeAgentIds.has(config.id);
      const status = isActive ? 'busy' : 'offline';
      const statusMessage = isActive ? 'Trabajando en tarea asignada' : 'Esperando tareas';

      return {
        id: config.id,
        name: config.name,
        role: config.role,
        status,
        lastActivity: isActive ? 'Activo ahora' : 'Sin actividad',
        statusMessage,
        icon: config.icon,
        metrics: buildMetrics(config.id, status),
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      agents,
      totalSessions: sessionData.length,
      activeSessions: activeAgentIds.size,
      activeAgentsList: Array.from(activeAgentIds),
      mode: 'live',
    });
  } catch (error) {
    console.error('[Agents API] Error:', error);
    // En caso de error, retornar agentes como OFFLINE
    const offlineAgents = AGENTS_CONFIG.map((config) => ({
      id: config.id,
      name: config.name,
      role: config.role,
      status: 'offline' as const,
      lastActivity: 'Error de conexión',
      statusMessage: 'Gateway no disponible',
      icon: config.icon,
      metrics: buildMetrics(config.id, 'offline'),
    }));
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      agents: offlineAgents,
      totalSessions: 0,
      activeSessions: 0,
      mode: 'error-offline',
    });
  }
}

function buildMetrics(agentId: string, status: string): any[] {
  const baseMetrics = {
    sammantha: [
      { label: 'Tareas', value: 0, trend: '0%' },
      { label: 'Delegaciones', value: 0, trend: '0%' },
    ],
    pixel: [
      { label: 'Build', value: 'OK', type: 'status' },
      { label: 'Components', value: 0, trend: '0' },
    ],
    kira: [
      { label: 'Tests Pass', value: '0%', type: 'percent' },
      { label: 'Lint Errors', value: 0, type: 'count' },
    ],
    nadia: [
      { label: 'Queries/hora', value: 0, trend: '0%' },
      { label: 'AI Calls', value: 0, trend: '0%' },
    ],
    cipher: [
      { label: 'Alertas', value: 0, type: 'count' },
      { label: 'Audit Score', value: '0%', type: 'percent' },
    ],
    zephyr: [
      { label: 'Services Up', value: '0/0', type: 'ratio' },
      { label: 'Uptime', value: '0%', type: 'percent' },
    ],
    marlo: [
      { label: 'Leads Hoy', value: 0, trend: '0%' },
      { label: 'Open Rate', value: '0%', type: 'percent' },
    ],
    rebecca: [
      { label: 'Posts', value: 0, trend: '0%' },
      { label: 'Fiverr Orders', value: 0, type: 'count' },
    ],
    leo: [
      { label: 'PnL Hoy', value: 0, type: 'currency' },
      { label: 'Trades', value: 0, type: 'count' },
    ],
    lina: [
      { label: 'Docs Updated', value: 0, trend: '0%' },
      { label: 'Completeness', value: '0%', type: 'percent' },
    ],
  };

  return baseMetrics[agentId as keyof typeof baseMetrics] || [];
}
