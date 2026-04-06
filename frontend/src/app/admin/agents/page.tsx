'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, RefreshCw, Bot, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { agentApi, AgentStats, AgentActivity, AgentStatsByAgent, TrendData, TaskDistribution } from '@/services/agentApi';
import { AgentStatsCards } from '@/components/admin/agents/AgentStatsCards';
import { AgentActivityTimeline } from '@/components/admin/agents/AgentActivityTimeline';
import { AgentTaskDistribution } from '@/components/admin/agents/AgentTaskDistribution';
import { AgentTrendChart } from '@/components/admin/agents/AgentTrendChart';
import { AgentFilterBar } from '@/components/admin/agents/AgentFilterBar';
import { ActiveAgentsPanel } from '@/components/admin/agents/ActiveAgentsPanel';

interface FiltersState {
  agent: string;
  status: string;
  startDate: string;
  endDate: string;
  taskType: string;
}

const DEFAULT_FILTERS: FiltersState = {
  agent: '',
  status: '',
  startDate: '',
  endDate: '',
  taskType: '',
};

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export default function AgentsActivityPage() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [distribution, setDistribution] = useState<TaskDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentDetail, setAgentDetail] = useState<AgentStatsByAgent | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [exporting, setExporting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, activitiesData, distributionData] = await Promise.all([
        agentApi.fetchAgentStats(),
        agentApi.fetchActivities(filters),
        agentApi.fetchTaskDistribution(),
      ]);

      setStats(statsData);
      setActivities(activitiesData);
      setDistribution(distributionData.distribution);
      setError('');
    } catch (e: any) {
      console.error('Error fetching agent data:', e);
      setError(e.message || 'Error cargando datos');
    }
  }, [filters]);

  const fetchAgentDetail = useCallback(async (agentName: string) => {
    setLoadingDetail(true);
    try {
      const [detail, trendsData] = await Promise.all([
        agentApi.fetchAgentDetail(agentName),
        agentApi.fetchAgentTrends(agentName, 7),
      ]);
      setAgentDetail(detail);
      setTrends(trendsData);
    } catch (e: any) {
      console.error('Error fetching agent detail:', e);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Polling every 30 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchData();
    }, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchData]);

  const handleAgentClick = (agentName: string) => {
    setSelectedAgent(agentName);
    fetchAgentDetail(agentName);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await agentApi.exportAgentData(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agents-activity-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Export error:', e);
      alert('Error exportando datos');
    } finally {
      setExporting(false);
    }
  };

  const availableAgents = stats ? [...new Set(stats.recentActivity.map(a => a.agent_name))] : [];
  const taskTypes = [...new Set(activities.map(a => a.task_type))];

  if (loading && !stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div
          className="h-12 w-12 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
        <p className="animate-pulse text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Cargando Agent Activity
        </p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <p className="text-sm font-medium text-rose-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 pb-20 md:px-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
              <Bot className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Agent Activity
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Monitoreo en tiempo real de todos los agentes IA
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Auto-refresh 30s
            </span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 text-sm font-medium transition-all hover:border-[var(--accent)]/30 disabled:opacity-50"
            style={{ color: 'var(--text-primary)' }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
        </div>
      </motion.div>

      {/* Active Agents Panel - prominente arriba del todo */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
      >
        <ActiveAgentsPanel />
      </motion.div>

      {/* Stats Cards & Agent Grid */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <AgentStatsCards stats={stats} onAgentClick={handleAgentClick} />
        </motion.div>
      )}

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AgentFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onExport={handleExport}
          agents={availableAgents}
          taskTypes={taskTypes}
          loading={exporting}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Activity Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                Timeline
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Actividad reciente
              </h2>
            </div>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {activities.length} actividades
            </span>
          </div>

          <AgentActivityTimeline activities={activities} loading={loading && activities.length === 0} />
        </motion.section>

        {/* Task Distribution */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
        >
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
              Distribución
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Tasks por tipo
            </h2>
          </div>

          <AgentTaskDistribution distribution={distribution} />
        </motion.section>
      </div>

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAgent(null)}
              className="fixed inset-0 z-40 bg-black/70"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 z-50 overflow-auto rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-base)] shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:mx-auto md:max-h-[85vh] md:w-full md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-base)] p-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition-all hover:border-[var(--accent)]/30"
                  >
                    <ArrowLeft className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {selectedAgent}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Detalle del agente
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition-all hover:border-rose-500/30 hover:text-rose-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {loadingDetail ? (
                  <div className="flex h-48 items-center justify-center">
                    <div
                      className="h-8 w-8 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                    />
                  </div>
                ) : agentDetail ? (
                  <div className="space-y-6">
                    {/* Agent Stats */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center">
                        <div className="mb-2 flex justify-center" style={{ color: 'var(--accent)' }}>
                          <Bot className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                          {agentDetail.totalTasks}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Tasks totales
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center">
                        <div className="mb-2 flex justify-center" style={{ color: '#22c55e' }}>
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black" style={{ color: '#22c55e' }}>
                          {formatPercent(agentDetail.successRate)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Success Rate
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center">
                        <div className="mb-2 flex justify-center" style={{ color: '#6366f1' }}>
                          <Clock className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                          {agentDetail.avgDuration < 1000 
                            ? `${agentDetail.avgDuration}ms` 
                            : `${(agentDetail.avgDuration / 1000).toFixed(1)}s`}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Avg Duration
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center">
                        <div className="mb-2 flex justify-center" style={{ color: '#f59e0b' }}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                          {agentDetail.recentActivity.filter(a => a.status === 'failed').length}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Errors
                        </p>
                      </div>
                    </div>

                    {/* Trend Chart */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
                      <AgentTrendChart trends={trends} title={`${selectedAgent} - Tendencia 7 días`} />
                    </div>

                    {/* Recent Activities */}
                    <div>
                      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                        Últimas actividades
                      </p>
                      <AgentActivityTimeline activities={agentDetail.recentActivity} />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Error cargando detalle del agente
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
