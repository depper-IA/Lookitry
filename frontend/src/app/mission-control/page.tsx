'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './mission-control.module.css';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Agent {
  id: string;
  name: string;
  emoji: string;
  specialty: string;
  description: string;
  status: 'ready' | 'busy' | 'idle' | 'error';
  lastTask: string;
  color: string;
  gradient: string;
}

interface HealthItem {
  icon: string;
  label: string;
  sublabel: string;
  status: 'ok' | 'warn' | 'error';
}

interface CommitItem {
  hash: string;
  message: string;
  author: string;
  time: string;
}

interface ActivityItem {
  icon: string;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  status?: string;
}

interface MissionControlData {
  agents: Agent[];
  commits: CommitItem[];
  stats: {
    agentsCount: number;
    totalTasks: number;
    successRate: number;
    commitsWeek: number;
    pending: number;
    uptime: string;
  };
  services: {
    frontend: 'ok' | 'warn' | 'error';
    api: 'ok' | 'warn' | 'error';
    supabase: 'ok' | 'warn' | 'error';
    n8n: 'ok' | 'warn' | 'error';
  };
  recentActivity: ActivityItem[];
  timestamp: string;
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="relative group inline-block w-full">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1e293b] border border-[#334155] text-xs text-[#f8fafc] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e293b]" />
      </div>
    </div>
  );
}

function AgentModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const statusLabel = {
    ready: 'Activo — Listo',
    busy: 'Ocupado — En tarea',
    idle: 'Inactivo',
    error: 'Error detectado',
  }[agent.status];

  const statusColor = {
    ready: 'text-emerald-400',
    busy: 'text-amber-400',
    idle: 'text-[#64748b]',
    error: 'text-rose-400',
  }[agent.status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#0f172a] border border-[#334155] rounded-2xl p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-2xl shadow-lg`}>
            {agent.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#f8fafc]">{agent.name}</h3>
            <p className="text-sm text-[#64748b] mt-0.5">{agent.specialty}</p>
          </div>
        </div>

        <p className="text-sm text-[#94a3b8] mb-6 leading-relaxed">{agent.description}</p>

        <div className="bg-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#64748b]">Estado actual</span>
            <span className={`font-semibold ${statusColor}`}>{statusLabel}</span>
          </div>
          <div className="flex justify-between items-start text-sm gap-4">
            <span className="text-[#64748b] flex-shrink-0">Última tarea</span>
            <span className="text-[#f8fafc] text-right line-clamp-2">{agent.lastTask}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">ID del agente</span>
            <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{agent.id}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl border border-[#334155] text-sm font-semibold text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc] transition-all"
        >
          Cerrar
        </button>
      </motion.div>
    </motion.div>
  );
}

function HealthDrawer({ item, onClose }: { item: HealthItem; onClose: () => void }) {
  const statusColors = { ok: 'text-emerald-400', warn: 'text-amber-400', error: 'text-rose-400' };
  const statusBg = { ok: 'bg-emerald-500/20', warn: 'bg-amber-500/20', error: 'bg-rose-500/20' };
  const statusLabel = { ok: 'Operacional', warn: 'Advertencia', error: 'Sin respuesta' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#0f172a] border border-[#334155] rounded-2xl p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{item.icon}</span>
            <div>
              <h3 className="text-lg font-bold text-[#f8fafc]">{item.label}</h3>
              <p className="text-sm text-[#64748b]">{item.sublabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#f8fafc] text-2xl leading-none transition-colors">×</button>
        </div>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusBg[item.status]} ${statusColors[item.status]} mb-5`}>
          <span className="text-lg">{item.status === 'ok' ? '✓' : item.status === 'warn' ? '⚠' : '✗'}</span>
          <span className="font-semibold text-sm">{statusLabel[item.status]}</span>
        </div>

        <div className="p-4 bg-[#1e293b] rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Servicio</span>
            <span className="text-[#f8fafc] font-medium">{item.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Estado</span>
            <span className={`font-medium ${statusColors[item.status]}`}>{statusLabel[item.status]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Verificado</span>
            <span className="text-[#f8fafc]">Hace &lt;1 min</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActionToast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 bg-[#1e293b] border border-[#06b6d4]/40 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3"
    >
      <span className="text-lg">⚡</span>
      <span className="text-sm font-semibold text-[#f8fafc]">{message}</span>
    </motion.div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function MissionControlPage() {
  const [clock, setClock] = useState('--:--:--');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedHealth, setSelectedHealth] = useState<HealthItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [data, setData] = useState<MissionControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [overallStatus, setOverallStatus] = useState<'ok' | 'warn' | 'error'>('ok');

  /* Live clock */
  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  /* Fetch real data from our server-side proxy */
  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/agents/status', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MissionControlData = await res.json();
      setData(json);
      setLastRefresh(new Date());

      // Calcular estado general del sistema
      const serviceValues = Object.values(json.services);
      if (serviceValues.some(s => s === 'error')) setOverallStatus('error');
      else if (serviceValues.some(s => s === 'warn')) setOverallStatus('warn');
      else setOverallStatus('ok');
    } catch (e) {
      console.error('[MissionControl] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const id = setInterval(() => fetchData(false), 30_000); // auto-refresh 30s
    return () => clearInterval(id);
  }, [fetchData]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleRefresh = () => {
    showToast('Actualizando datos...');
    fetchData(false);
  };

  // Mapeo de services → health items con labels legibles
  const healthItems: HealthItem[] = data
    ? [
        { icon: '🌐', label: 'Frontend', sublabel: 'lookitry.com', status: data.services.frontend },
        { icon: '🦾', label: 'API Backend', sublabel: 'api.lookitry.com', status: data.services.api },
        { icon: '🗄️', label: 'Supabase', sublabel: 'Base de datos', status: data.services.supabase },
        { icon: '⚙️', label: 'n8n', sublabel: 'Automatización', status: data.services.n8n },
      ]
    : [];

  const statusColor = (status: Agent['status']) => {
    if (status === 'ready') return 'text-emerald-400';
    if (status === 'busy') return 'text-amber-400';
    if (status === 'error') return 'text-rose-400';
    return 'text-[#64748b]';
  };

  const statusDotColor = (status: Agent['status']) => {
    if (status === 'ready') return 'bg-emerald-400';
    if (status === 'busy') return 'bg-amber-400 animate-pulse';
    if (status === 'error') return 'bg-rose-400';
    return 'bg-[#475569]';
  };

  const statusLabel = (status: Agent['status']) => {
    if (status === 'ready') return 'Ready';
    if (status === 'busy') return 'Working';
    if (status === 'error') return 'Error';
    return 'Idle';
  };

  const healthStatusIcon = (status: HealthItem['status']) => {
    if (status === 'ok') return '✓';
    if (status === 'warn') return '⚠';
    return '✗';
  };

  const globalStatusLabel = {
    ok: 'All Systems Operational',
    warn: 'Degraded Performance',
    error: 'Service Disruption',
  }[overallStatus];

  const globalStatusStyle = {
    ok: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warn: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  }[overallStatus];

  const globalDotStyle = {
    ok: 'bg-emerald-400 mc-status-dot',
    warn: 'bg-amber-400 animate-pulse',
    error: 'bg-rose-400 animate-pulse',
  }[overallStatus];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-cyan-400 font-mono text-sm uppercase tracking-widest animate-pulse">
            Connecting to Mission Control...
          </p>
        </div>
      </div>
    );
  }

  const agents = data?.agents ?? [];
  const commits = data?.commits ?? [];
  const stats = data?.stats ?? { agentsCount: 0, totalTasks: 0, successRate: 0, commitsWeek: 0, pending: 0, uptime: '—' };
  const activity = data?.recentActivity ?? [];

  return (
    <div className="min-h-screen bg-[#030712] text-[#f8fafc] overflow-x-hidden relative">
      {/* Background effects */}
      <div className={`${styles['mc-bg-grid']} fixed inset-0 pointer-events-none z-0`} />
      <div className={`${styles['mc-glow-1']} absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none z-0`} />
      <div className={`${styles['mc-glow-2']} absolute -bottom-48 -right-32 w-96 h-96 rounded-full pointer-events-none z-0`} />

      <div className="relative z-10 max-w-[1700px] mx-auto px-6 lg:px-10 py-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 p-6 bg-[#0f172a]/80 border border-[#334155] rounded-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">
              🎛️
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#f8fafc] to-[#06b6d4] bg-clip-text text-transparent">
                Mission Control
              </h1>
              <p className="text-xs text-[#64748b] uppercase tracking-[3px] mt-1">Lookitry Operations Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Status badge dinámico */}
            <div className={`flex items-center gap-2.5 px-5 py-2.5 border rounded-full ${globalStatusStyle}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${globalDotStyle}`} />
              <span className="text-xs font-semibold">{globalStatusLabel}</span>
            </div>
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-full text-xs font-medium text-[#94a3b8] hover:border-cyan-500/40 hover:text-[#f8fafc] transition-all"
            >
              🔄 Refresh
            </button>
            {/* Clock */}
            <div className="text-sm font-medium text-[#94a3b8] font-mono tabular-nums">{clock}</div>
          </div>
        </motion.header>

        {/* ── Stats Bar ───────────────────────────────────────────── */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
        >
          {[
            { icon: '🤖', value: stats.agentsCount, label: 'Agentes Activos', color: 'text-cyan-400' },
            { icon: '📋', value: stats.totalTasks, label: 'Tasks (30d)', color: 'text-violet-400' },
            { icon: '✅', value: `${stats.successRate}%`, label: 'Tasa de Éxito', color: 'text-emerald-400' },
            { icon: '⚙️', value: stats.pending, label: 'En Progreso', color: 'text-amber-400' },
            { icon: '📦', value: stats.commitsWeek, label: 'Commits Recientes', color: 'text-blue-400' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="group p-5 bg-[#0f172a]/80 border border-[#334155] rounded-2xl hover:border-cyan-500/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1e293b] flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div className={`text-3xl lg:text-4xl font-extrabold mb-2 ${stat.color} tabular-nums`}>
                {stat.value}
              </div>
              <div className="text-[10px] text-[#64748b] uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 mb-6">

          {/* Agent Roster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0f172a]/80 border border-[#334155] rounded-2xl p-7"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <h2 className="text-base font-bold">Agent Roster</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  {agents.filter((a) => a.status === 'ready' || a.status === 'busy').length} Online
                </span>
                <span className="px-3.5 py-1.5 bg-[#1e293b] border border-[#334155] rounded-full text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                  {agents.filter((a) => a.status === 'busy').length} Working
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {agents.map((agent) => (
                <Tooltip key={agent.id} content={`Ver detalle de ${agent.name}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAgent(agent)}
                    className="text-left w-full p-4 bg-[#1e293b]/60 border border-[#334155] rounded-xl hover:border-cyan-500/50 transition-all duration-300 relative overflow-hidden group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300`} />
                    <div className="flex items-start gap-3 relative z-10">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-lg flex-shrink-0 shadow-lg`}>
                        {agent.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold mb-0.5 truncate">{agent.name}</h3>
                        <p className="text-[9px] text-[#64748b] leading-relaxed line-clamp-1">{agent.specialty}</p>
                        <div className="flex items-center justify-between mt-2.5">
                          <div className={`flex items-center gap-1.5 text-[9px] font-semibold ${statusColor(agent.status)}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusDotColor(agent.status)}`} />
                            {statusLabel(agent.status)}
                          </div>
                        </div>
                        {(agent.status === 'busy' || agent.status === 'ready') && agent.lastTask !== 'Sin actividad reciente' && (
                          <p className="text-[8px] text-[#64748b] mt-1 truncate italic">{agent.lastTask}</p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                </Tooltip>
              ))}
            </div>

            {/* Última actualización */}
            {lastRefresh && (
              <p className="text-[10px] text-[#475569] mt-5 text-right">
                Datos en tiempo real · Actualizado {lastRefresh.toLocaleTimeString('es-CO', { hour12: false })} · Auto-refresh 30s
              </p>
            )}
          </motion.div>

          {/* Right Panel */}
          <div className="flex flex-col gap-5">

            {/* Recent Commits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0f172a]/80 border border-[#334155] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">📦</span>
                <h2 className="text-base font-bold">Commits Recientes</h2>
                <span className="ml-auto text-[10px] text-[#64748b] font-mono">github.com</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {commits.length > 0 ? commits.map((c) => (
                  <div key={c.hash} className="flex items-start gap-3 p-3 bg-[#1e293b]/60 rounded-xl hover:bg-[#1e293b]/80 transition-colors">
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md font-semibold flex-shrink-0 mt-0.5">
                      {c.hash.substring(0, 7)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2 leading-relaxed">{c.message}</p>
                      <p className="text-[10px] text-[#64748b] mt-1">{c.time} — {c.author}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <span className="text-2xl opacity-40">📭</span>
                    <p className="text-xs text-[#64748b] italic">No se pudieron cargar los commits</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#0f172a]/80 border border-[#334155] rounded-2xl p-6 flex-1"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">📡</span>
                <h2 className="text-base font-bold">Agent Activity Feed</h2>
                <span className="ml-auto px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[9px] text-cyan-400 font-semibold uppercase">Live</span>
              </div>
              <div className="flex flex-col gap-3">
                {activity.length > 0 ? activity.map((a, i) => (
                  <div key={i} className="flex gap-3 pb-3 border-b border-[#1e293b] last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-lg ${a.iconBg} flex items-center justify-center text-sm flex-shrink-0 mt-0.5`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{a.title}</p>
                      <p className="text-[10px] text-[#64748b] leading-relaxed mt-0.5 line-clamp-1">{a.description}</p>
                      <span className="text-[9px] text-[#475569] mt-1 block">{a.time}</span>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <span className="text-2xl opacity-40">🤫</span>
                    <p className="text-xs text-[#64748b] italic">Sin actividad registrada aún</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Project Health ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0f172a]/80 border border-[#334155] rounded-2xl p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <h2 className="text-base font-bold">Infrastructure Health</h2>
            </div>
            <span className="text-[10px] text-[#64748b]">
              Verificado hace &lt;1 min
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {healthItems.map((item, i) => (
              <Tooltip key={i} content="Click para ver detalle">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedHealth(item)}
                  className="flex items-center gap-3 p-3.5 bg-[#1e293b]/60 rounded-xl hover:bg-[#1e293b] border border-transparent hover:border-[#334155] transition-all duration-300 text-left w-full"
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.label}</p>
                    <p className="text-[10px] text-[#64748b] truncate">{item.sublabel}</p>
                  </div>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    item.status === 'ok' ? 'bg-emerald-500/15 text-emerald-400' :
                    item.status === 'warn' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-rose-500/15 text-rose-400'
                  }`}>
                    {healthStatusIcon(item.status)}
                  </div>
                </motion.button>
              </Tooltip>
            ))}
          </div>
        </motion.div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="mt-8 py-5 text-center">
          <p className="text-xs text-[#475569]">
            Mission Control · Lookitry SaaS Operations Center · Datos en tiempo real desde Supabase & GitHub
            {lastRefresh && ` · Última sync: ${lastRefresh.toLocaleTimeString('es-CO', { hour12: false })}`}
          </p>
        </div>
      </div>

      {/* Modals & Toasts */}
      <AnimatePresence>
        {selectedAgent && (
          <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
        )}
        {selectedHealth && (
          <HealthDrawer item={selectedHealth} onClose={() => setSelectedHealth(null)} />
        )}
        {toast && <ActionToast message={toast} />}
      </AnimatePresence>
    </div>
  );
}
