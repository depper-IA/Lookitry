'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { fetchPublicStats } from '@/services/public-config.service';

interface StatsData {
  brandsCount: number;
  generationsCount: number;
  responseTimeHours: number;
}

const FALLBACK_STATS: StatsData = {
  brandsCount: 500,
  generationsCount: 10000,
  responseTimeHours: 24,
};

function CountUp({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = typeof window !== 'undefined' && ref.current?.isConnected;

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let startTime: number;
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
      ))}
    </div>
  );
}

function StatsContent({ stats }: { stats: StatsData }) {
  const statItems = [
    { value: stats.brandsCount, suffix: '+', label: 'Marcas activas' },
    { value: stats.generationsCount >= 10000 ? Math.floor(stats.generationsCount / 1000) : stats.generationsCount, suffix: stats.generationsCount >= 10000 ? 'K+' : '+', label: 'Generaciones' },
    { value: stats.responseTimeHours, suffix: 'h', label: 'Respuesta máxima' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
      {statItems.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="text-center"
        >
          <p className="font-jakarta text-2xl md:text-3xl font-bold text-white">
            <CountUp end={stat.value} suffix={stat.suffix} />
          </p>
          <p className="text-xs text-white/50 mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default function HeroStatsClient() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicStats()
      .then((data) => {
        setStats({
          brandsCount: data.brandsCount,
          generationsCount: data.generationsCount,
          responseTimeHours: data.responseTimeHours,
        });
      })
      .catch(() => {
        setStats(FALLBACK_STATS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <StatsSkeleton />;
  }

  return (
    <motion.div
      key="stats"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StatsContent stats={stats || FALLBACK_STATS} />
    </motion.div>
  );
}