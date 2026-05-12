'use client';

import { motion } from 'framer-motion';
import type { TryOnTemplateProps } from '../types';

interface EditorialHeaderProps {
  config: TryOnTemplateProps['config'];
  onReset: () => void;
  showReset?: boolean;
  primaryColor: string;
  bgLuminance: boolean;
  textMuted: string;
  secondaryColor: string;
}

export function EditorialHeader({
  config,
  onReset,
  showReset,
  primaryColor,
  bgLuminance,
  textMuted,
  secondaryColor,
}: EditorialHeaderProps) {
  const textPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-40 backdrop-blur-xl"
      style={{
        backgroundColor: bgLuminance ? `${secondaryColor}f0` : 'rgba(10,10,10,0.85)',
        borderBottom: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: bgLuminance
          ? '0 1px 24px rgba(0,0,0,0.06)'
          : '0 1px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        {/* Left: Logo + Brand Identity */}
        <div className="flex items-center gap-3">
          {/* Logo / Monogram */}
          {config.brand.logo ? (
            <div className="relative flex-shrink-0">
              <img
                src={config.brand.logo}
                alt={config.brand.name}
                className="h-7 sm:h-8 lg:h-9 w-auto object-contain"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                boxShadow: `0 4px 12px ${primaryColor}40`,
              }}
            >
              <span className="font-black text-sm italic text-white leading-none">
                {config.brand.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Separator dot */}
          <motion.div
            className="w-1 h-1 rounded-full flex-shrink-0 hidden sm:block"
            style={{ backgroundColor: primaryColor }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Brand name + plan */}
          <div className="flex flex-col leading-none hidden sm:flex">
            <span
              className="text-[11px] sm:text-xs font-black uppercase tracking-[0.12em] italic"
              style={{ color: textPrimary }}
            >
              {config.brand.name}
            </span>
            {config.brand.plan && (
              <span
                className="text-[7px] font-black uppercase tracking-[0.3em] mt-0.5"
                style={{ color: primaryColor, opacity: 0.7 }}
              >
                {config.brand.plan}
              </span>
            )}
          </div>
        </div>

        {/* Center: "Prueba Virtual" label — visible on tablet+ */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2">
          <div className="h-px w-6" style={{ backgroundColor: textPrimary, opacity: 0.15 }} />
          <span
            className="text-[8px] font-black uppercase tracking-[0.4em] italic"
            style={{ color: textPrimary, opacity: 0.3 }}
          >
            Prueba Virtual
          </span>
          <div className="h-px w-6" style={{ backgroundColor: textPrimary, opacity: 0.15 }} />
        </div>

        {/* Right: Reset button */}
        {showReset && (
          <motion.button
            onClick={onReset}
            className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] transition-all"
            style={{
              color: textMuted,
              border: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            }}
            whileHover={{
              backgroundColor: bgLuminance ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </motion.svg>
            <span className="hidden sm:inline">Reiniciar</span>
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
