'use client';

import { Users } from 'lucide-react';
import { Stats } from '../types';
import { IconStar } from './LeadIcons';

interface LeadStatsCardsProps {
  stats: Stats;
}

export default function LeadStatsCards({ stats }: LeadStatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gray-500/10 p-2.5">
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 p-2.5">
            <IconStar className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.new}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nuevos</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-green-500/10 p-2.5">
            <IconStar className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.interested}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Interesados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
