'use client';

import { motion } from 'framer-motion';
import { TrendData } from '@/services/agentApi';

interface AgentTrendChartProps {
  trends: TrendData[];
  title?: string;
}

export function AgentTrendChart({ trends, title = 'Tendencia (7 días)' }: AgentTrendChartProps) {
  if (!trends || trends.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Sin datos de tendencia
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...trends.map(t => t.count), 1);

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>

      {/* Line chart simulation with bars */}
      <div className="flex items-end gap-2" style={{ height: '120px' }}>
        {trends.map((day, i) => {
          const heightPct = (day.count / maxCount) * 100;
          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="w-full rounded-t-lg"
                style={{
                  backgroundColor: 'rgba(255,92,58,0.3)',
                  borderTop: '2px solid var(--accent)',
                  minHeight: '4px',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {trends.map((day) => (
          <span key={day.date} className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {new Date(day.date).toLocaleDateString('es-CO', { weekday: 'short' })}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-color)] pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Total Tasks
          </p>
          <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
            {trends.reduce((sum, t) => sum + t.count, 0)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Avg Success
          </p>
          <p className="text-lg font-black" style={{ color: '#22c55e' }}>
            {Math.round((trends.reduce((sum, t) => sum + t.successRate, 0) / trends.length) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}
