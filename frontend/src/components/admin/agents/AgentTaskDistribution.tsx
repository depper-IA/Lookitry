'use client';

import { motion } from 'framer-motion';
import { TaskDistribution } from '@/services/agentApi';

interface AgentTaskDistributionProps {
  distribution: TaskDistribution[];
}

const COLORS = ['#FF5C3A', '#6366f1', '#22c55e', '#f59e0b', '#14b8a6', '#ec4899', '#8b5cf6'];

export function AgentTaskDistribution({ distribution }: AgentTaskDistributionProps) {
  if (!distribution || distribution.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Sin datos de distribución
        </p>
      </div>
    );
  }

  const total = distribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Simple bar chart */}
      <div className="space-y-3">
        {distribution.map((item, i) => (
          <motion.div
            key={item.taskType}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {item.taskType}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {item.count} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--bg-input)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="h-full rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {distribution.map((item, i) => (
          <div key={item.taskType} className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {item.taskType}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}