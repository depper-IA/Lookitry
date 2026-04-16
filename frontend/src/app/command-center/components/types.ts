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
export const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM';
