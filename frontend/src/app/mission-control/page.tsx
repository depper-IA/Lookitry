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
}

interface QuickAction {
  emoji: string;
  label: string;
  action: () => void;
}

/* ── Components ───────────────────────────────────────────────────────────── */

/** Tooltip wrapper */
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1e293b] border border-[#334155] text-xs text-[#f8fafc] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e293b]" />
      </div>
    </div>
  );
}

/** Agent delegation modal */
function AgentModal({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  const [task, setTask] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!task.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setTask('');
      setSubmitted(false);
      onClose();
    }, 1800);
  };

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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-2xl`}>
            {agent.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#f8fafc]">{agent.name}</h3>
            <p className="text-sm text-[#64748b] mt-0.5">{agent.specialty}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#94a3b8] mb-6 leading-relaxed">{agent.description}</p>

        {/* Task input */}
        {!submitted ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                Delegar tarea
              </label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder={`Describe la tarea para ${agent.name}...`}
                rows={3}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[#334155] text-sm font-semibold text-[#94a3b8] hover:bg-[#1e293b] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!task.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delegar →
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl">
              ✅
            </div>
            <p className="text-[#10b981] font-semibold">Tarea enviada a {agent.name}</p>
            <p className="text-xs text-[#64748b]">Recibirás confirmación cuando esté lista</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

/** Health detail drawer */
function HealthDrawer({ item, onClose }: { item: HealthItem; onClose: () => void }) {
  const statusColors = { ok: 'text-emerald-400', warn: 'text-amber-400', error: 'text-rose-400' };
  const statusBg = { ok: 'bg-emerald-500/20', warn: 'bg-amber-500/20', error: 'bg-rose-500/20' };
  const statusLabel = { ok: 'Operacional', warn: 'Advertencia', error: 'Error' };

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
          <button onClick={onClose} className="text-[#64748b] hover:text-[#f8fafc] text-2xl leading-none">
            ×
          </button>
        </div>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusBg[item.status]} ${statusColors[item.status]}`}>
          <span className="text-lg">{item.status === 'ok' ? '✓' : item.status === 'warn' ? '⚠' : '✗'}</span>
          <span className="font-semibold text-sm">{statusLabel[item.status]}</span>
        </div>

        <div className="mt-6 p-4 bg-[#1e293b] rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Service</span>
            <span className="text-[#f8fafc] font-medium">{item.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Status</span>
            <span className={`font-medium ${statusColors[item.status]}`}>{statusLabel[item.status]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Last checked</span>
            <span className="text-[#f8fafc]">Hace ~2 min</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Quick action feedback */
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
  
  // Real State from API
  const [agents, setAgents] = useState<Agent[]>([]);
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [stats, setStats] = useState({ agentsCount: 0, filesTracked: 0, commitsWeek: 0, pending: 0, uptime: '100%' });
  const [health, setHealth] = useState<HealthItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* Live clock */
  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  /* Fetch real data */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/status');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
        setCommits(data.commits || []);
        setStats(data.stats || { agentsCount: 0, filesTracked: 0, commitsWeek: 0, pending: 0, uptime: '100%' });
        
        // Map health from services
        const healthMap: HealthItem[] = [
          { icon: '🌐', label: 'Frontend', sublabel: 'Next.js 14 — Active', status: data.services.frontend },
          { icon: '🦾', label: 'OpenClaw', sublabel: 'Orchestrator V2', status: data.services.openclaw },
          { icon: '🗄️', label: 'Supabase', sublabel: 'Cloud DB', status: data.services.supabase },
          { icon: '💬', label: 'Telegram', sublabel: 'Bot Integration', status: data.services.telegram },
        ];
        setHealth(healthMap);

        // Generate activity feed from commits or static
        const feed: ActivityItem[] = (data.commits || []).map((c: any) => ({
          icon: '📝',
          iconBg: 'bg-emerald-500/20',
          title: `Commit: ${c.hash}`,
          description: c.message,
          time: c.time
        }));
        if (feed.length === 0) {
            feed.push({
                icon: '✅',
                iconBg: 'bg-violet-500/20',
                title: 'Systems Heartbeat',
                description: 'OpenClaw Ecosystem is reporting normal status.',
                time: 'Active now'
            });
        }
        setActivity(feed);
      }
    } catch (e) {
      console.error('Failed to fetch status', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000); // Update every 30s
    return () => clearInterval(id);
  }, [fetchData]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const quickActions: QuickAction[] = [
    { emoji: '🔍', label: 'Full Audit', action: () => showToast('Audit iniciado...') },
    { emoji: '🚀', label: 'Deploy', action: () => showToast('Despliegue lanzado...') },
    { emoji: '🧪', label: 'Run Tests', action: () => showToast('Tests ejecutándose...') },
    { emoji: '📊', label: 'Analytics', action: () => showToast('Abriendo analytics...') },
  ];

  const statusColor = (status: Agent['status']) => {
    if (status === 'ready') return 'text-emerald-400';
    if (status === 'busy') return 'text-amber-400';
    if (status === 'error') return 'text-rose-400';
    return 'text-[#64748b]';
  };

  const statusLabel = (status: Agent['status']) => {
    if (status === 'ready') return 'Ready';
    if (status === 'busy') return 'Busy';
    if (status === 'error') return 'Error';
    return 'Idle';
  };

  const healthStatusIcon = (status: HealthItem['status']) => {
    if (status === 'ok') return '✓';
    if (status === 'warn') return '⚠';
    return '✗';
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <p className="text-cyan-400 font-mono text-sm uppercase tracking-widest animate-pulse">Initializing Mission Control...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-[#f8fafc] overflow-x-hidden relative">
      {/* Background effects */}
      <div className="mc-bg-grid fixed inset-0 pointer-events-none z-0" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full mc-glow-1 pointer-events-none z-0" />
      <div className="absolute -bottom-48 -right-32 w-96 h-96 rounded-full mc-glow-2 pointer-events-none z-0" />

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
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mc-status-dot" />
              <span className="text-xs font-semibold text-emerald-400">All Systems Operational</span>
            </div>
            <div className="text-sm font-medium text-[#94a3b8] font-mono tabular-nums">{clock}</div>
          </div>
        </motion.header>

        {/* ── Stats Bar ───────────────────────────────────────────── */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
        >
          {[
            { icon: '🤖', value: stats.agentsCount, label: 'Active Agents', color: 'text-cyan-400' },
            { icon: '📦', value: stats.filesTracked, label: 'Files Tracked', color: 'text-violet-400' },
            { icon: '🚀', value: stats.commitsWeek, label: 'Recent Commits', color: 'text-emerald-400' },
            { icon: '⚠️', value: stats.pending, label: 'Pending Changes', color: 'text-amber-400' },
            { icon: '⏱️', value: stats.uptime, label: 'Uptime', color: 'text-blue-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
              className="group p-5 bg-[#0f172a]/80 border border-[#334155] rounded-2xl hover:border-cyan-500/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1e293b] flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div className={`text-3xl lg:text-4xl font-extrabold mb-2 ${stat.color} tabular-nums`}>{stat.value}</div>
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
              <span className="px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                {agents.filter((a) => a.status === 'ready').length} Ready
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Tooltip key={agent.id} content="Click para delegar tarea">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAgent(agent)}
                    className="text-left w-full p-4 bg-[#1e293b]/60 border border-[#334155] rounded-xl hover:border-cyan-500 transition-all duration-300 relative overflow-hidden group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300`} />
                    <div className="flex items-start gap-3 relative z-10">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-lg flex-shrink-0`}>
                        {agent.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold mb-0.5 truncate">{agent.name}</h3>
                        <p className="text-[9px] text-[#64748b] leading-relaxed line-clamp-1">{agent.specialty}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className={`flex items-center gap-1.5 text-[9px] font-semibold ${statusColor(agent.status)}`}>
                            <div className={`w-1 h-1 rounded-full ${agent.status === 'busy' ? 'bg-amber-400' : agent.status === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                            {statusLabel(agent.status)}
                          </div>
                          <span className="text-[8px] text-[#64748b] truncate ml-2">Task: {agent.lastTask}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </Tooltip>
              ))}
            </div>
          </motion.div>

          {/* Right Panel */}
          <div className="flex flex-col gap-5">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0f172a]/80 border border-[#334155] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">⚡</span>
                <h2 className="text-base font-bold">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((qa) => (
                  <motion.button
                    key={qa.label}
                    whileHover={{ scale: 1.03, borderColor: '#06b6d4' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={qa.action}
                    className="flex flex-col items-center gap-2.5 p-5 bg-[#1e293b]/60 border border-[#334155] rounded-xl hover:bg-cyan-500/5 transition-all duration-300"
                  >
                    <span className="text-2xl">{qa.emoji}</span>
                    <span className="text-xs font-semibold">{qa.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Recent Commits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#0f172a]/80 border border-[#334155] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">📝</span>
                <h2 className="text-base font-bold">Recent Commits</h2>
              </div>
              <div className="flex flex-col gap-3">
                {commits.length > 0 ? commits.map((c) => (
                  <div key={c.hash} className="flex items-center gap-3.5 p-3.5 bg-[#1e293b]/60 rounded-xl hover:bg-[#1e293b]/80 transition-colors">
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md font-semibold flex-shrink-0">
                      {c.hash.substring(0, 7)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.message}</p>
                      <p className="text-[10px] text-[#64748b] mt-0.5">{c.time} — {c.author}</p>
                    </div>
                  </div>
                )) : (
                    <p className="text-xs text-[#64748b] text-center py-4 italic">No recent commits found.</p>
                )}
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#0f172a]/80 border border-[#334155] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">📡</span>
                <h2 className="text-base font-bold">Activity Feed</h2>
              </div>
              <div className="flex flex-col gap-4">
                {activity.map((a, i) => (
                  <div key={i} className="flex gap-3.5 pb-4 border-b border-[#334155] last:border-0 last:pb-0">
                    <div className={`w-9 h-9 rounded-lg ${a.iconBg} flex items-center justify-center text-sm flex-shrink-0`}>
                      {a.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="text-xs text-[#64748b] leading-relaxed mt-0.5">{a.description}</p>
                      <span className="text-[10px] text-[#64748b] mt-1.5 block">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Project Health ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#0f172a]/80 border border-[#334155] rounded-2xl p-7"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🏥</span>
            <h2 className="text-base font-bold">Project Health</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {health.map((item, i) => (
              <Tooltip key={i} content="Click para ver detalles">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedHealth(item)}
                  className="flex items-center gap-3 p-3.5 bg-[#1e293b]/60 rounded-xl hover:bg-[#1e293b] border border-transparent hover:border-[#334155] transition-all duration-300 text-left"
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
          <p className="text-xs text-[#64748b]">Mission Control — Lookitry SaaS Operations Center • Built with precision</p>
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
