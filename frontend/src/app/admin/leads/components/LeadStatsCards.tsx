'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Stats } from '../types';
import { IconStar } from './LeadIcons';

interface LeadStatsCardsProps {
  stats: Stats;
}

export default function LeadStatsCards({ stats }: LeadStatsCardsProps) {
  const cards = [
    { label: 'Total', value: stats.total, icon: Users, color: 'gray', bgClass: 'bg-gray-500/10' },
    { label: 'Nuevos', value: stats.new, icon: IconStar, color: 'blue', bgClass: 'bg-blue-500/10' },
    { label: 'Interesados', value: stats.interested, icon: IconStar, color: 'green', bgClass: 'bg-green-500/10' },
  ];

  const colorMap: Record<string, string> = {
    gray: 'text-gray-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{
            y: -4,
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)",
            borderColor: "rgba(255,92,58,0.3)"
          }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-xl ${card.bgClass} p-2.5`}>
              <card.icon className={`h-5 w-5 ${colorMap[card.color]}`} />
            </div>
            <div>
              <motion.p
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
                animate={card.label === 'Interesados' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {card.value}
              </motion.p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
