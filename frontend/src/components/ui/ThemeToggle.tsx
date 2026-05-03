'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="relative group"
    >
      <div className="relative flex items-center w-16 h-8 p-1 rounded-full transition-all duration-300 ease-out"
        style={{
          backgroundColor: isDark ? 'rgba(255, 92, 58, 0.15)' : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${isDark ? 'rgba(255, 92, 58, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
          boxShadow: isDark 
            ? '0 0 20px rgba(255, 92, 58, 0.15), inset 0 0 10px rgba(255, 92, 58, 0.05)' 
            : '0 0 10px rgba(0, 0, 0, 0.1), inset 0 0 5px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Track glow effect when dark */}
        <AnimatePresence>
          {isDark && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at 80% 50%, rgba(255, 92, 58, 0.2) 0%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Sliding knob */}
        <motion.div
          layout
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
          className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full"
          style={{
            backgroundColor: isDark ? 'var(--accent)' : '#ffffff',
            boxShadow: isDark 
              ? '0 2px 8px rgba(255, 92, 58, 0.5), 0 0 15px rgba(255, 92, 58, 0.3)' 
              : '0 2px 8px rgba(0, 0, 0, 0.2), 0 0 10px rgba(255, 255, 255, 0.1)',
          }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Moon 
                  className="w-3.5 h-3.5 text-white" 
                  strokeWidth={2.5}
                  fill="rgba(255,255,255,0.3)"
                />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ scale: 0, rotate: 90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Sun 
                  className="w-3.5 h-3.5 text-amber-500" 
                  strokeWidth={2.5}
                  fill="rgba(251,191,36,0.4)"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Decorative stars when dark */}
        <AnimatePresence>
          {isDark && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-3 flex gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(255, 92, 58, 0.6)',
                    boxShadow: '0 0 4px rgba(255, 92, 58, 0.5)',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative sun rays when light */}
        <AnimatePresence>
          {!isDark && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-3 flex gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(251, 191, 36, 0.5)',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 -m-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: isDark 
            ? 'radial-gradient(ellipse at center, rgba(255, 92, 58, 0.1) 0%, transparent 70%)' 
            : 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
        }}
      />
    </button>
  );
}
