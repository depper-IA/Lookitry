'use client';

import { motion } from 'framer-motion';

interface SelfiePreviewEditorialProps {
  preview: string | null;
  onReset: () => void;
  primaryColor: string;
  textMuted: string;
  cardBg?: string;
  bgLuminance?: boolean;
}

export function SelfiePreviewEditorial({
  preview,
  onReset,
  primaryColor,
  textMuted,
  cardBg,
  bgLuminance,
}: SelfiePreviewEditorialProps) {
  if (!preview) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative flex items-center gap-3 sm:gap-4 rounded-2xl p-3 sm:p-4 overflow-hidden"
      style={{
        backgroundColor: bgLuminance ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: bgLuminance
          ? `0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)`
          : `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)`,
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Accent glow strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
        style={{ background: `linear-gradient(to bottom, ${primaryColor}, ${primaryColor}44)` }}
      />

      {/* Subtle top-left gradient bleed */}
      <div
        className="absolute top-0 left-0 w-20 h-full opacity-10 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${primaryColor}, transparent)` }}
      />

      {/* Avatar with animated checkmark */}
      <div className="relative shrink-0 ml-1">
        <motion.img
          src={preview}
          alt="Tu foto"
          className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl object-cover shadow-md"
          style={{
            outline: `2px solid ${primaryColor}40`,
            outlineOffset: '2px',
          }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
        />
        {/* Checkmark badge */}
        <motion.div
          className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: primaryColor }}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 20, delay: 0.2 }}
        >
          <svg className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] sm:text-[11px] font-black uppercase italic tracking-tight leading-none"
          style={{ color: primaryColor }}
        >
          ✦ Foto lista
        </p>
        <p
          className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.15em] mt-1 opacity-60"
          style={{ color: bgLuminance ? '#333' : '#fff' }}
        >
          Escoge un producto
        </p>
      </div>

      {/* Change button */}
      <motion.button
        onClick={onReset}
        className="shrink-0 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.12em] px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
        style={{
          color: textMuted,
          border: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
        }}
        whileHover={{ backgroundColor: bgLuminance ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.94 }}
      >
        Cambiar
      </motion.button>
    </motion.div>
  );
}
