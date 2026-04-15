import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase con service key (sin RLS, datos reales)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const GITHUB_REPO = 'depper-IA/lookitry';
const HEARTBEAT_TIMEOUT_MS = 30_000; // 30s

// Roster de agentes conocidos (fuente de verdad visual)
const AGENTS_ROSTER = [
  {
    id: 'sammy',
    name: 'Sammy',
    emoji: '🧠',
    specialty: 'Orquestación & Memoria Core',
    description: 'El cerebro principal. Distribuye tareas, gestiona agentes y mantiene la persistencia global del ecosistema.',
    color: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'rebecca',
    name: 'Rebecca',
    emoji: '📲',
    specialty: 'UGC Content & Social Media',
    description: 'Investiga productos y crea contenido para Twitter/X con su propio bot.',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'leo',
    name: 'Leo',
    emoji: '📈',
    specialty: 'Trading / "The Surgeon"',
    description: 'Analista financiero. Lee velas Heikin-Ashi y toma decisiones de mercado rigurosas.',
    color: '#eab308',
    gradient: 'from-yellow-400 to-amber-600',
  },
  {
    id: 'docs-writter',
    name: 'DocsWriter',
    emoji: '📝',
    specialty: 'Documentación & Obsidian',
    description: 'Organiza y redacta toda la documentación técnica del proyecto en el Brain Vault.',
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'webwizard',
    name: 'WebWizard',
    emoji: '🎨',
    specialty: 'Frontend — Next.js 14, Tailwind, Motion',
    description: 'Crea interfaces nivel Apple. Optimiza SEO y construye el widget del probador virtual.',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'devguardian',
    name: 'DevGuardian',
    emoji: '🛡️',
    specialty: 'QA & Integridad',
    description: 'Mantiene los tests en verde y audita la seguridad antes de cada deploy.',
    color: '#ef4444',
    gradient: 'from-red-500 to-rose-600',
  },
  {
    id: 'dataalchemist',
    name: 'DataAlchemist',
    emoji: '🧪',
    specialty: 'Backend & Bases de Datos',
    description: 'Gestiona Supabase con la Service Key, flujos n8n y almacenamiento MinIO.',
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-sky-600',
  },
  {
    id: 'growthpilot',
    name: 'GrowthPilot',
    emoji: '🛰️',
    specialty: 'Ventas & CRM',
    description: 'Controla CRM, correos a clientes y programas de referidos desde la base corporativa.',
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'architectai',
    name: 'ArchitectAI',
    emoji: '🏗️',
    specialty: 'DevOps & VPS',
    description: 'Infraestructura, Docker, systemd. Mantiene rodando todos los servicios en el VPS.',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'security-auditor',
    name: 'SecurityAuditor',
    emoji: '🔒',
    specialty: 'PenTesting & Audits',
    description: 'Revisa paquetes npm buscando vulnerabilidades antes de desplegar al mundo.',
    color: '#64748b',
    gradient: 'from-slate-500 to-gray-700',
  },
];

// Verifica si un servicio responde (server-side, sin CORS)
async function checkService(url: string, timeout = 5000): Promise<'ok' | 'warn' | 'error'> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(id);
    if (res.ok || res.status === 405) return 'ok';
    if (res.status >= 500) return 'error';
    return 'warn';
  } catch {
    return 'error';
  }
}

export async function GET() {
  try {
    // 1. Heartbeats reales de agentes desde Supabase
    const { data: heartbeatData } = await supabaseAdmin
      .from('agent_sessions')
      .select('agent_name, current_task_description, status, last_heartbeat_at')
      .order('last_heartbeat_at', { ascending: false });

    const heartbeatMap = new Map<string, any>();
    (heartbeatData ?? []).forEach((s: any) => {
      heartbeatMap.set(s.agent_name, s);
    });

    const now = Date.now();
    const agents = AGENTS_ROSTER.map((agent) => {
      const hb = heartbeatMap.get(agent.id);
      let status: 'ready' | 'busy' | 'idle' | 'error' = 'idle';
      let lastTask = 'Sin actividad reciente';

      if (hb) {
        const msSinceHeartbeat = now - new Date(hb.last_heartbeat_at).getTime();
        const alive = msSinceHeartbeat < HEARTBEAT_TIMEOUT_MS;

        if (alive && hb.status === 'working') status = 'busy';
        else if (alive) status = 'ready';
        else if (hb.status === 'error') status = 'error';
        else status = 'idle';

        lastTask = hb.current_task_description || 'Idle';
      }

      return { ...agent, status, lastTask };
    });

    // 2. Stats reales de actividades desde Supabase
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activitiesRaw } = await supabaseAdmin
      .from('agent_activities')
      .select('agent_name, status, duration_ms, task_type, task_description, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    const activities = activitiesRaw ?? [];
    const completed = activities.filter((a: any) => a.status !== 'running');
    const successes = completed.filter((a: any) => a.status === 'success');
    const successRate = completed.length > 0
      ? Math.round((successes.length / completed.length) * 100)
      : 0;

    const activeAgentCount = agents.filter(a => a.status === 'ready' || a.status === 'busy').length;

    const stats = {
      agentsCount: activeAgentCount,
      totalTasks: activities.length,
      successRate,
      commitsWeek: 0, // se llena con GitHub abajo
      pending: agents.filter(a => a.status === 'busy').length,
      uptime: successRate > 0 ? `${successRate}%` : '—',
    };

    // 3. Activity feed — últimas 8 actividades reales
    const recentActivity = activities.slice(0, 8).map((a: any) => ({
      icon: a.status === 'success' ? '✅' : a.status === 'failed' ? '❌' : a.status === 'running' ? '⚙️' : '📝',
      iconBg: a.status === 'success' ? 'bg-emerald-500/20' : a.status === 'failed' ? 'bg-rose-500/20' : 'bg-violet-500/20',
      title: `${a.agent_name} — ${a.task_type}`,
      description: a.task_description || a.task_type,
      time: formatTimeAgo(a.created_at),
      status: a.status,
    }));

    // 4. Commits recientes desde GitHub API pública
    let commits: any[] = [];
    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=5`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Lookitry-MissionControl/1.0',
          },
          next: { revalidate: 300 }, // cache 5 min
        }
      );
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        commits = ghData.map((c: any) => ({
          hash: c.sha,
          message: c.commit.message.split('\n')[0], // solo primera línea
          author: c.commit.author.name,
          time: formatTimeAgo(c.commit.author.date),
        }));
        stats.commitsWeek = commits.length;
      }
    } catch {
      // GitHub no disponible — dejamos commits vacío
    }

    // 5. Health checks server-side (sin CORS)
    const [frontendStatus, apiStatus, supabaseStatus, n8nStatus] = await Promise.all([
      checkService('https://lookitry.com'),
      checkService('https://api.lookitry.com/api/health'),
      checkService(`${SUPABASE_URL}/rest/v1/`),
      checkService('https://n8n.wilkiedevs.com'),
    ]);

    const services = {
      frontend: frontendStatus,
      api: apiStatus,
      supabase: supabaseStatus,
      n8n: n8nStatus,
    };

    return NextResponse.json({
      agents,
      commits,
      stats,
      services,
      recentActivity,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[MissionControl] Error fetching data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de Mission Control', details: error.message },
      { status: 500 }
    );
  }
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'ahora';
  if (diffSec < 60) return `hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `hace ${diffDay}d`;
}
