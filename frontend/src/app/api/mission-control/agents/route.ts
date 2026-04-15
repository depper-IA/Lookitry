// Mission Control - OpenClaw Agents API - REAL DATA
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
  lastChannel?: string;
  origin?: {
    label: string;
    provider: string;
    surface: string;
  };
  deliveryContext?: {
    channel: string;
    to: string;
  };
  skillsSnapshot?: {
    skills: Array<{ name: string }>;
    prompt?: string;
  };
  startedAt?: number;
}

// Agent role definitions
const AGENT_ROLES: Record<string, { name: string; role: string; description: string; icon: string }> = {
  sammy: { 
    name: 'Sammy', 
    role: 'Orquestadora', 
    description: 'Coordinación general y administración de proyectos Lookitry',
    icon: '🎯'
  },
  rebecca: { 
    name: 'Rebecca', 
    role: 'UGC Creator', 
    description: 'Creación de contenido visual y gestión de redes sociales',
    icon: '📸'
  },
  dataalchemist: { 
    name: 'Data Alchemist', 
    role: 'Data & AI', 
    description: 'Análisis de datos, Machine Learning y automatización con n8n',
    icon: '🧪'
  },
  devguardian: { 
    name: 'Dev Guardian', 
    role: 'Security & QA', 
    description: 'Seguridad, testing E2E y revisión de código',
    icon: '🛡️'
  },
  growthpilot: { 
    name: 'Growth Pilot', 
    role: 'Marketing', 
    description: 'Campañas de email, CRM, leads y estrategias de crecimiento',
    icon: '📈'
  },
  webwizard: { 
    name: 'Web Wizard', 
    role: 'Frontend Dev', 
    description: 'Desarrollo de interfaces web, componentes React y diseño UI',
    icon: '🎨'
  },
};

function getAgentStatus(session: AgentSession): 'online' | 'busy' | 'offline' {
  const now = Date.now();
  const diff = now - session.updatedAt;
  
  // Active if updated in last 5 minutes
  if (diff < 5 * 60 * 1000) {
    if (session.status === 'running' || session.status === 'busy') return 'busy';
    return 'online';
  }
  // Idle if updated in last 30 minutes
  if (diff < 30 * 60 * 1000) return 'online';
  return 'offline';
}

function formatLastActivity(updatedAt: number): string {
  const diff = Date.now() - updatedAt;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function getSessionStats(sessions: AgentSession[]) {
  const totalSessions = sessions.length;
  const telegramSessions = sessions.filter(s => 
    s.lastChannel === 'telegram' || s.deliveryContext?.channel === 'telegram'
  ).length;
  const webchatSessions = sessions.filter(s => 
    s.lastChannel === 'webchat' || s.deliveryContext?.channel === 'webchat'
  ).length;
  const completedSessions = sessions.filter(s => s.status === 'done').length;
  const runningSessions = sessions.filter(s => s.status === 'running').length;
  
  // Get last session timestamp
  const latestSession = sessions.reduce((latest, current) => {
    return (current.updatedAt > latest.updatedAt) ? current : latest;
  }, sessions[0] || { updatedAt: 0 });

  return {
    totalSessions,
    telegramSessions,
    webchatSessions,
    completedSessions,
    runningSessions,
    lastActivity: formatLastActivity(latestSession.updatedAt),
    lastActivityTimestamp: latestSession.updatedAt,
  };
}

export async function GET() {
  try {
    const agentsDir = OPENCLAW_DIR;
    
    if (!fs.existsSync(agentsDir)) {
      return NextResponse.json({ 
        error: 'OpenClaw directory not found',
        agents: [],
        lastUpdated: new Date().toISOString()
      }, { status: 500 });
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

          const stats = getSessionStats(sessions);
          const latestSession = sessions.reduce((latest: AgentSession, current: AgentSession) => {
            return (current.updatedAt > latest.updatedAt) ? current : latest;
          }, sessions[0]);

          const status = getAgentStatus(latestSession);
          const roleInfo = AGENT_ROLES[agentId] || { 
            name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
            role: 'Agent',
            description: 'OpenClaw Agent',
            icon: '🤖'
          };

          // Get skills from latest session
          const skills = latestSession.skillsSnapshot?.skills?.map((s: any) => s.name) || [];

          return {
            id: agentId,
            ...roleInfo,
            status,
            lastActivity: stats.lastActivity,
            lastActivityTimestamp: stats.lastActivityTimestamp,
            channel: latestSession.lastChannel || latestSession.channel || 'webchat',
            stats: {
              totalSessions: stats.totalSessions,
              telegramSessions: stats.telegramSessions,
              webchatSessions: stats.webchatSessions,
              completedSessions: stats.completedSessions,
            },
            skills,
            currentTask: latestSession.status === 'running' ? 'Ejecutando tarea...' : 'En espera',
          };
        } catch (err) {
          console.error(`Error processing agent ${agentId}:`, err);
          return null;
        }
      })
    );

    const validAgents = agents.filter(Boolean);
    
    // Calculate global stats
    const totalSessions = validAgents.reduce((sum: number, a: any) => sum + a.stats.totalSessions, 0);
    const activeAgents = validAgents.filter((a: any) => a.status === 'online' || a.status === 'busy').length;
    const telegramAgents = validAgents.filter((a: any) => a.channel === 'telegram').length;
    const webchatAgents = validAgents.filter((a: any) => a.channel === 'webchat').length;
    
    return NextResponse.json({
      agents: validAgents,
      summary: {
        totalAgents: validAgents.length,
        activeAgents,
        totalSessions,
        telegramAgents,
        webchatAgents,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agents API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents', agents: [] },
      { status: 500 }
    );
  }
}
