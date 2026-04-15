// Mission Control - Real Agents API from OpenClaw
// v1.0 | Abril 2026

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/home/travis/.openclaw/agents';

interface AgentSession {
  sessionId: string;
  updatedAt: number;
  status?: string;
  channel?: string;
  origin?: {
    label: string;
    provider: string;
    surface: string;
  };
  deliveryContext?: {
    channel: string;
    to: string;
  };
}

function getAgentStatus(session: AgentSession): 'online' | 'busy' | 'offline' {
  const now = Date.now();
  const diff = now - session.updatedAt;
  const fiveMinutes = 5 * 60 * 1000;
  
  if (diff > 30 * 60 * 1000) return 'offline';
  if (session.status === 'running' || session.status === 'busy') return 'busy';
  if (diff < fiveMinutes) return 'online';
  return 'offline';
}

function formatLastActivity(updatedAt: number): string {
  const diff = Date.now() - updatedAt;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export async function GET() {
  try {
    const agentsDir = OPENCLAW_DIR;
    
    // Check if directory exists
    if (!fs.existsSync(agentsDir)) {
      return NextResponse.json({ 
        agents: [], 
        error: 'OpenClaw directory not found',
        lastUpdated: new Date().toISOString()
      });
    }

    const agentFolders = fs.readdirSync(agentsDir).filter((dir: string) => {
      return fs.statSync(path.join(agentsDir, dir)).isDirectory();
    });

    const agents = await Promise.all(
      agentFolders.map(async (agentId: string) => {
        try {
          const sessionsPath = path.join(agentsDir, agentId, 'sessions', 'sessions.json');
          
          if (!fs.existsSync(sessionsPath)) {
            return null;
          }

          const sessionsData = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
          const sessions = Object.values(sessionsData) as AgentSession[];
          
          if (sessions.length === 0) {
            return null;
          }

          // Get most recent session
          const latestSession = sessions.reduce((latest: AgentSession, current: AgentSession) => {
            return (current.updatedAt > latest.updatedAt) ? current : latest;
          }, sessions[0]);

          const status = getAgentStatus(latestSession);
          const lastActivity = formatLastActivity(latestSession.updatedAt);
          
          // Role mapping for display
          const roleMap: Record<string, { role: string; statusMessage: string; icon: string }> = {
            sammy: { role: 'Orquestadora', statusMessage: 'Coordinando operaciones Lookitry...', icon: '🎯' },
            main: { role: 'Principal', statusMessage: 'En espera', icon: '🏠' },
            dataalchemist: { role: 'Data/AI', statusMessage: 'Procesando datos y análisis', icon: '🧬' },
            devguardian: { role: 'Security', statusMessage: 'Vigilando código y vulnerabilidades', icon: '🛡️' },
            growthpilot: { role: 'Growth', statusMessage: 'Ejecutando campañas de crecimiento', icon: '📈' },
            webwizard: { role: 'Frontend', statusMessage: 'Desarrollando interfaces web', icon: '🎨' },
            rebecca: { role: 'UGC', statusMessage: 'Creando contenido visual', icon: '📸' },
          };

          const info = roleMap[agentId] || { 
            role: agentId.charAt(0).toUpperCase() + agentId.slice(1), 
            statusMessage: 'Activo',
            icon: '🤖'
          };

          return {
            id: agentId,
            name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
            role: info.role,
            status,
            lastActivity,
            statusMessage: info.statusMessage,
            icon: info.icon,
            metrics: [
              { label: 'Canal', value: latestSession.deliveryContext?.channel || latestSession.channel || 'webchat', type: 'text' },
              { label: 'Última sesión', value: lastActivity, type: 'text' },
              { label: 'Sesiones', value: sessions.length, type: 'count' },
            ],
          };
        } catch {
          return null;
        }
      })
    );

    const validAgents = agents.filter(Boolean);
    
    return NextResponse.json({
      agents: validAgents,
      totalAgents: validAgents.length,
      activeAgents: validAgents.filter((a: any) => a.status === 'online' || a.status === 'busy').length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agents API Error:', error);
    return NextResponse.json(
      { agents: [], error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
