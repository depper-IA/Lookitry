/* ─── COMMAND CENTER HELPERS ───────────────────────────────────────────────── */

import { Agent, HeartbeatData, AgentStatus, SB_URL, SB_ANON } from './types';

/* ── SAMMY (ONLY AGENT) ───────────────────────────────────────────────────── */
export const AGENTS: Agent[] = [
  {
    id: 'sammy', 
    name: 'Sammy', 
    role: 'COORDINATOR', 
    icon: '🧠',
    themeColor: '#00FFFF', 
    accentColor: '#FF5C3A', 
    roomType: 'control-tower',
    patrol: [{ x: 0.5, y: 0.55 }, { x: 0.3, y: 0.65 }, { x: 0.7, y: 0.6 }],
    activity: 'Coordinating agent operations',
    metrics: { tasks: 47, messages: 23, health: 94 },
  },
];

/* ── HEARTBEAT STATUS ──────────────────────────────────────────────────────── */
export function getAgentStatusFromHeartbeat(hb: HeartbeatData | null, agentId: string): AgentStatus {
  if (!hb) return { status: 'idle', task: 'Aguardo instrucciones...', uptime: 0 };
  const entry = hb.agents.find((a) => a.id === agentId);
  if (!entry) return { status: 'idle', task: 'Sin conexión', uptime: 0 };

  const raw = entry as any;
  const st: AgentStatus['status'] =
    raw.state === 'sleep' ? 'sleep'
    : raw.state === 'error' ? 'error'
    : raw.isWorking ? 'busy'
    : 'idle';

  const task = raw.currentTask?.description
    ?? (st === 'sleep' ? '💤 Modo ahorro'
      : st === 'idle' ? 'Aguardo instrucciones...'
      : 'Trabajando...');

  return { status: st, task, uptime: raw.uptime ?? 0 };
}

/* ── SUPABASE HELPERS ─────────────────────────────────────────────────────── */
export const supabase = {
  async fetchCount(table: string, filter?: string): Promise<number | null> {
    const filterStr = filter ? `&${filter}` : '';
    const url = `${SB_URL}/rest/v1/${table}?select=count${filterStr}`;
    try {
      const res = await fetch(url, {
        headers: {
          apikey: SB_ANON,
          Authorization: `Bearer ${SB_ANON}`,
          'Content-Type': 'application/json',
          Prefer: 'count=exact',
        },
      });
      if (!res.ok) return null;
      const count = res.headers.get('content-range')?.split('/')?.[1];
      return count ? parseInt(count, 10) : null;
    } catch {
      return null;
    }
  },

  async query<T = any>(table: string, select: string, filter?: string): Promise<T | null> {
    const filterStr = filter ? `&${filter}` : '';
    const url = `${SB_URL}/rest/v1/${table}?select=${select}${filterStr}`;
    try {
      const res = await fetch(url, {
        headers: {
          apikey: SB_ANON,
          Authorization: `Bearer ${SB_ANON}`,
          'Content-Type': 'application/json',
        },
      });
      return res.ok ? res.json() : null;
    } catch {
      return null;
    }
  },
};

/* ── AI SVG GENERATION ────────────────────────────────────────────────────── */
export async function fetchSVGFromAPI(agentId: string, type: 'character' | 'room'): Promise<string> {
  const res = await fetch('/api/command-center/generate-svg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, type }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.svg || '';
}
