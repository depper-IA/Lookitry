'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export const BlogHero: React.FC = () => {
  const { isDark, colors } = useTheme();

  return (
    <div className="relative overflow-hidden pt-32 pb-20 transition-colors duration-500">
      {/* Ambient glow effects - solo en dark mode */}
      {isDark ? (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[60%] bg-[#FF5C3A]/8 blur-[150px] rounded-full" />
          <div className="absolute top-[10%] right-[-10%] w-[40%] h-[50%] bg-[#FF5C3A]/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-30%] left-[20%] w-[60%] h-[40%] bg-[#FF5C3A]/3 blur-[180px] rounded-full opacity-50" />
        </div>
      ) : (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[60%] bg-[#FF5C3A]/5 blur-[120px] rounded-full opacity-30" />
          <div className="absolute top-[10%] right-[-10%] w-[40%] h-[50%] bg-indigo-500/5 blur-[100px] rounded-full opacity-20" />
        </div>
      )}

      {/* Decorative lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-40 left-0 w-32 h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/10' : 'via-black/5'} to-transparent`} />
        <div className={`absolute top-40 right-0 w-32 h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/10' : 'via-black/5'} to-transparent`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* Eyebrow label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <span className="w-8 h-px bg-[#FF5C3A]" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF5C3A]">
            Editorial
          </span>
          <span className="w-8 h-px bg-[#FF5C3A]" />
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`text-5xl md:text-7xl lg:text-8xl font-black mb-6 font-plus-jakarta tracking-tight leading-none ${isDark ? 'text-white' : 'text-zinc-900'}`}
        >
          Look<span className="text-[#FF5C3A]">itry</span>
          <span className={`block mt-2 text-3xl md:text-5xl lg:text-6xl font-light tracking-wide ${isDark ? 'text-white/80' : 'text-zinc-400'}`}>
            Editorial
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8"
          style={{ color: colors.textSecondary }}
        >
          El futuro del retail reimaginado. Insights profundos, guías prácticas y casos de éxito sobre la revolución del try-on virtual y la moda inteligente.
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-8 text-sm"
        >
          <div className="flex items-center gap-2" style={{ color: colors.textSecondary }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]" />
            <span>Fashion Tech</span>
          </div>
          <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
          <div className="flex items-center gap-2" style={{ color: colors.textSecondary }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]" />
            <span>Try-on Virtual</span>
          </div>
          <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
          <div className="flex items-center gap-2" style={{ color: colors.textSecondary }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]" />
            <span>eCommerce</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};