'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-full
        border transition-all duration-300
        ${isDark 
          ? 'bg-[#1a1a1a] border-white/10 text-white hover:border-[#FF5C3A]/50 hover:text-[#FF5C3A]' 
          : 'bg-white border-black/10 text-black hover:border-[#FF5C3A]/50 hover:text-[#FF5C3A]'
        }
        focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/50
        ${className}
      `}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDark ? 0 : 180,
          scale: [0, 1.2, 1]
        }}
        transition={{ 
          rotate: { duration: 0.3, ease: 'easeInOut' },
          scale: { duration: 0.2 }
        }}
      >
        {isDark ? (
          <Moon size={18} />
        ) : (
          <Sun size={18} />
        )}
      </motion.div>
    </motion.button>
  );
}

export default ThemeToggle;
