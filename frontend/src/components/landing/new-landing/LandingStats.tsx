'use client';

import React, { useEffect, useState } from 'react';
import { Store, Zap, MessageCircle, Check } from 'lucide-react';

interface LandingStatsData {
  total_brands: number;
  total_generations: number;
  satisfaction_rating: number | null;
}

// Format brands with + prefix (real data from DB)
function formatBrands(raw: number): string {
  if (raw <= 0) return '+0';
  return `+${raw}`;
}

// Format generations: real DB data + 1000 offset, then format k/M
function formatGenerations(raw: number): string {
  const adjusted = raw + 1000;
  if (adjusted >= 1000000) {
    return `${(adjusted / 1000000).toFixed(1)}M`;
  }
  if (adjusted >= 1000) {
    return `${(adjusted / 1000).toFixed(0)}k`;
  }
  return adjusted.toString();
}

export default function LandingStats() {
  const [stats, setStats] = useState<LandingStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/landing-stats');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching landing stats:', error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const displayStats = stats ? [
    {
      val: formatBrands(stats.total_brands),
      label: 'Marcas activas',
      icon: <Store className="text-[#FF5C3A]" aria-hidden="true" />
    },
    {
      val: formatGenerations(stats.total_generations),
      label: 'Generaciones IA',
      icon: <Zap className="text-[#FF5C3A]" aria-hidden="true" />
    },
    {
      val: '24/7',
      label: 'Soporte VIP',
      icon: <MessageCircle className="text-[#FF5C3A]" aria-hidden="true" />
    },
    {
      val: stats.satisfaction_rating ? stats.satisfaction_rating.toFixed(1) : 'N/A',
      label: 'satisfaccion',
      icon: <Check className="text-[#FF5C3A]" aria-hidden="true" />
    },
  ] : [
    { val: '+0', label: 'Marcas activas', icon: <Store className="text-[#FF5C3A]" aria-hidden="true" /> },
    { val: '1k', label: 'Generaciones IA', icon: <Zap className="text-[#FF5C3A]" aria-hidden="true" /> },
    { val: '24/7', label: 'Soporte VIP', icon: <MessageCircle className="text-[#FF5C3A]" aria-hidden="true" /> },
    { val: 'N/A', label: 'satisfaccion', icon: <Check className="text-[#FF5C3A]" aria-hidden="true" /> },
  ];

  return (
    <section className="bg-white dark:bg-black py-12 sm:py-16 md:py-20 px-4 sm:px-6" aria-label="Estadisticas">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-12 flex flex-wrap justify-center md:justify-between items-center gap-8 sm:gap-10 md:gap-8">
        {displayStats.map((stat, i) => (
          <div key={i} className="flex items-center gap-3 sm:gap-4 md:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FF5C3A]/5 dark:bg-white/5 flex items-center justify-center shrink-0">
              {stat.icon}
            </div>
            <div>
              <div className="font-jakarta text-2xl sm:text-3xl font-bold text-black dark:text-white mb-0.5">{stat.val}</div>
              <div className="font-dm-sans text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#666] dark:text-white/60">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
