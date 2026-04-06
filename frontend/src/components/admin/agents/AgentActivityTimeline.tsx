'use client';

import { motion } from 'framer-motion';
import { AgentActivity } from '@/services/agentApi';

interface AgentActivityTimelineProps {
  activities: AgentActivity[];
  loading?: boolean;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'success': return '#22c55e';
    case 'failed': return '#ef4444';
    case 'running': return '#f59e0b';
    default: return '#64748b';
  }
}

export function AgentActivityTimeline({ activities, loading }: AgentActivityTimelineProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div
          className="h-8 w-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Sin actividad reciente
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            <th className="pb-3 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              Agent
            </th>
            <th className="pb-3 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              Task
            </th>
            <th className="pb-3 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              Status
            </th>
            <th className="pb-3 text-right text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              Duration
            </th>
            <th className="pb-3 text-right text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, i) => (
            <motion.tr
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-[var(--border-color)]/50 transition-colors hover:bg-white/5"
            >
              <td className="py-3">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {activity.agent_name}
                </span>
              </td>
              <td className="py-3">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {activity.task_type}
                </span>
              </td>
              <td className="py-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: `${getStatusColor(activity.status)}20`,
                    color: getStatusColor(activity.status),
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: getStatusColor(activity.status) }}
                  />
                  {activity.status}
                </span>
              </td>
              <td className="py-3 text-right">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatDuration(activity.duration_ms ?? 0)}
                </span>
              </td>
              <td className="py-3 text-right">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatTime(activity.created_at)}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}