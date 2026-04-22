'use client';

import { motion } from 'framer-motion';

interface BottomCTAEditorialProps {
  onClick?: () => void;
  primaryColor: string;
  buttonText: string;
  caption?: string;
  bgLuminance: boolean;
  textMuted?: string;
  secondaryColor: string;
}

export function BottomCTAEditorial({
  onClick,
  primaryColor,
  buttonText,
  caption,
  bgLuminance,
  secondaryColor,
}: BottomCTAEditorialProps) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      {/* ── Desktop & Mobile: Sleek Floating Bar ── */}
      <div className="flex justify-center px-4 w-full">
        <motion.div
          className="relative flex items-center justify-between gap-3 rounded-2xl px-3 py-3 w-full max-w-md pointer-events-auto shadow-2xl"
          style={{
            backgroundColor: bgLuminance ? 'rgba(255,255,255,0.95)' : 'rgba(15,15,15,0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
          }}
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {caption && (
            <div className="pl-3 hidden sm:flex flex-col justify-center min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] opacity-50 truncate" style={{ color: bgLuminance ? '#000' : '#fff' }}>
                {caption}
              </span>
            </div>
          )}

          {/* Main CTA button */}
          <motion.button
            onClick={onClick}
            className="relative flex-1 flex justify-center items-center gap-2 px-4 sm:px-8 py-3.5 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-[0.15em] text-white overflow-hidden transition-all min-w-0"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 8px 24px ${primaryColor}40`,
            }}
            whileTap={{ scale: 0.98 }}
            whileHover={{ filter: 'brightness(1.1)' }}
          >
            <span className="relative z-10 truncate leading-none">{buttonText}</span>
            <svg className="relative z-10 w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
