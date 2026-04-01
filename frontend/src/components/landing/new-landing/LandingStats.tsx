'use client';

import React from 'react';
import { Store, Zap, MessageCircle, Check } from 'lucide-react';

export default function LandingStats() {
  const stats = [
    { val: '+50', label: 'Marcas activas', icon: <Store className="text-[#FF5C3A]" /> },
    { val: '400k', label: 'IA Generations', icon: <Zap className="text-[#FF5C3A]" /> },
    { val: '24/7', label: 'Soporte VIP', icon: <MessageCircle className="text-[#FF5C3A]" /> },
    { val: '4.9', label: 'Satisfaction score', icon: <Check className="text-[#FF5C3A]" /> },
  ];

  return (
    <section className="bg-[#0a0a0a] py-20 px-6">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-wrap justify-center md:justify-between items-center gap-12 md:gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              {stat.icon}
            </div>
            <div>
              <div className="font-jakarta text-3xl font-bold text-white mb-0.5">{stat.val}</div>
              <div className="font-dm-sans text-[10px] font-bold uppercase tracking-widest text-white/60">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
