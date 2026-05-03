'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Store, Zap, MessageCircle, Check } from 'lucide-react';

interface LandingStatsData {
  total_brands: number;
  total_generations: number;
  satisfaction_rating: number | null;
}

// Hook para animación de contador
function useCountUp(end: number, duration: number = 2000, delay: number = 0) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now() + delay;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (currentTime < startTime) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeOutExpo
      const easeProgress = 1 - Math.pow(2, -10 * progress);
      const currentValue = Math.round(startValue + (end - startValue) * easeProgress);

      setCount(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, delay, hasStarted]);

  return { count, start: () => setHasStarted(true) };
}

// Componente de número animado individual
function AnimatedNumber({ value, suffix = '', delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const { count, start } = useCountUp(value, 1800, delay);

  return (
    <motion.span
      onViewportEnter={start}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {count.toLocaleString()}{suffix}
    </motion.span>
  );
}

// Format brands: real data + 10 offset
function formatBrands(raw: number): number {
  return raw <= 0 ? 10 : raw + 10;
}

// Format generations: real data + 1000 offset
function formatGenerations(raw: number): number {
  return raw + 1000;
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function LandingStats() {
  const [stats, setStats] = useState<LandingStatsData | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/landing-stats');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching landing stats:', error);
      }
    }
    fetchStats();
  }, []);

  const displayStats = stats
    ? [
        { val: formatBrands(stats.total_brands), suffix: '+', label: 'Marcas activas', icon: <Store aria-hidden="true" /> },
        { val: formatGenerations(stats.total_generations), suffix: '+', label: 'Generaciones IA', icon: <Zap aria-hidden="true" /> },
        { val: 24, suffix: '/7', label: 'Soporte VIP', icon: <MessageCircle aria-hidden="true" /> },
        {
          val: stats.satisfaction_rating ? Number(stats.satisfaction_rating.toFixed(1)) : 4.8,
          suffix: '/5',
          label: 'satisfaccion',
          icon: <Check aria-hidden="true" />,
          isRating: true,
          rawRating: stats.satisfaction_rating ?? 4.8,
        },
      ]
    : [
        { val: 10, suffix: '+', label: 'Marcas activas', icon: <Store aria-hidden="true" /> },
        { val: 1000, suffix: '+', label: 'Generaciones IA', icon: <Zap aria-hidden="true" /> },
        { val: 24, suffix: '/7', label: 'Soporte VIP', icon: <MessageCircle aria-hidden="true" /> },
        { val: 4.8, suffix: '/5', label: 'satisfaccion', icon: <Check aria-hidden="true" />, isRating: true, rawRating: 4.8 },
      ];

  return (
    <section className="bg-white dark:bg-black py-12 sm:py-16 md:py-20 px-4 sm:px-6 relative overflow-hidden" aria-label="Estadisticas">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-7xl mx-auto px-0 sm:px-6 md:px-12"
      >
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 sm:gap-10 md:gap-8">
          {displayStats.map((stat, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              className="group relative flex items-center gap-3 sm:gap-4 md:gap-5 p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-accent/10 hover:border-accent/30 transition-all duration-300 cursor-default"
            >
              {/* Icon container */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-accent/10 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-accent transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent/30">
                <span className="text-accent group-hover:text-white transition-colors duration-300">
                  {React.cloneElement(stat.icon as React.ReactElement, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
                </span>
              </div>

              {/* Value */}
              <div className="relative">
                <div className="font-jakarta text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white mb-0.5 tabular-nums">
                  {stat.isRating ? (
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.15 }}
                    >
                      {stat.rawRating.toFixed(1)}{stat.suffix}
                    </motion.span>
                  ) : (
                    <AnimatedNumber value={stat.val} suffix={stat.suffix} delay={i * 0.15} />
                  )}
                </div>
                <div className="font-dm-sans text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-white/60 group-hover:text-accent transition-colors duration-300">
                  {stat.label}
                </div>
              </div>

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
