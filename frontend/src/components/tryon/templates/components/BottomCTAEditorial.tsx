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
  textMuted,
  secondaryColor,
}: BottomCTAEditorialProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 z-50"
      style={{
        backgroundColor: bgLuminance ? secondaryColor : '#0a0a0a',
        borderTop: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
      }}
    >
      <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto space-y-2">
        <button
          onClick={onClick}
          className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.15em] text-white shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-3"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 8px 32px ${primaryColor}40`,
          }}
        >
          <span>{buttonText}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {caption && (
          <p className="text-center text-[9px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color: textMuted }}>
            {caption}
          </p>
        )}
      </div>
    </motion.div>
  );
}
