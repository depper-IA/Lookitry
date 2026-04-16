/* ─── COMMAND CENTER TYPES ──────────────────────────────────────────────────── */

/* ── Heartbeat ─────────────────────────────────────────────────────────────── */
export interface HeartbeatAgentEntry {
  id: string;
  name: string;
  status: 'ready' | 'busy' | 'idle' | 'error';
  lastTask: string;
  state?: 'sleep' | 'active';
  isWorking?: boolean;
  currentTask?: { description: string };
  uptime?: number;
}

export interface HeartbeatData {
  agents: HeartbeatAgentEntry[];
  stats: {
    agentsCount: number;
    totalTasks: number;
    successRate: number;
  };
  services: Record<string, string>;
}

export interface AgentStatus {
  status: 'sleep' | 'idle' | 'busy' | 'error';
  task: string;
  uptime: number;
}

export type AgentStatusMap = Record<string, AgentStatus>;

/* ── Agent config ──────────────────────────────────────────────────────────── */
export interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  themeColor: string;
  accentColor: string;
  roomType: string;
  patrol: { x: number; y: number }[];
  activity: string;
  metrics: Record<string, number | string>;
}

/* ── Particle ──────────────────────────────────────────────────────────────── */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string;
}

/* ── Supabase config ──────────────────────────────────────────────────────── */
export const SB_URL  = 'https://vkdooutklowctuudjnkl.supabase.co';
export const SB_ANON = '***REMOVED-SECRET***';
