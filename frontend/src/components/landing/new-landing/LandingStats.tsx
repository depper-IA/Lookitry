'use client';

import React from 'react';
import { Store, Zap, MessageCircle, Check } from 'lucide-react';

export default function LandingStats() {
  const stats = [
    { val: '+50', label: 'Marcas activas', icon: <Store className="text-[#FF5C3A]" aria-hidden="true" /> },
    { val: '400k', label: 'IA Generations', icon: <Zap className="text-[#FF5C3A]" aria-hidden="true" /> },
    { val: '24/7', label: 'Soporte VIP', icon: <MessageCircle className="text-[#FF5C3A]" aria-hidden="true" /> },
    { val: '4.9', label: 'Satisfaction score', icon: <Check className="text-[#FF5C3A]" aria-hidden="true" /> },
  ];

  return (
    <section className="bg-white dark:bg-black py-12 sm:py-16 md:py-20 px-4 sm:px-6" aria-label="Estadísticas">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-12 flex flex-wrap justify-center md:justify-between items-center gap-8 sm:gap-10 md:gap-8">
        {stats.map((stat, i) => (
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
