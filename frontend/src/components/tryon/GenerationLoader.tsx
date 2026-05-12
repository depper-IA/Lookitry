'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// CSS-only animations for infinite loops (performance optimization)
// framer-motion repeat:Infinity is JS-driven and costly; CSS keyframes are GPU-accelerated
const spinnerStyles = `
  @keyframes spin-cw {
    to { transform: rotate(360deg); }
  }
  @keyframes spin-ccw {
    to { transform: rotate(-360deg); }
  }
  @keyframes pulse-scale {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
  }
  @keyframes dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }
  .gen-spin-outer {
    animation: spin-cw 1.2s linear infinite;
  }
  .gen-spin-inner {
    animation: spin-ccw 1.8s linear infinite;
  }
  .gen-pulse {
    animation: pulse-scale 2s ease-in-out infinite;
  }
  .gen-dot-pulse {
    animation: dot-pulse 1.5s ease-in-out infinite;
  }
`;

interface GenerationLoaderProps {
  productName: string;
  primaryColor?: string;
  messages?: string[];
  textColor?: string;
  mutedColor?: string;
}

const DEFAULT_MESSAGES = [
  'Analizando tu foto...',
  'Estudiando el producto...',
  'Aplicando el producto...',
  'Ajustando proporciones...',
  'Refinando detalles...',
  'Casi listo...',
];

export function GenerationLoader({ 
  productName, 
  primaryColor = '#FF5C3A', 
  messages = DEFAULT_MESSAGES,
  textColor = '#ffffff',
  mutedColor = '#999999',
}: GenerationLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [prevMsgIndex, setPrevMsgIndex] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 3500);

    // Smoother progress - starts slow, accelerates in middle, slows at end
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) {
          // Slow down near the end
          return Math.min(p + Math.random() * 0.5, 99);
        } else if (p > 60) {
          // Medium speed in middle
          return p + Math.random() * 2;
        } else if (p > 20) {
          // Faster in middle
          return p + Math.random() * 4;
        } else {
          // Slow start
          return p + Math.random() * 1.5;
        }
      });
    }, 800);

    return () => { 
      clearInterval(msgInterval); 
      clearInterval(progressInterval);
    };
  }, [messages.length]);

  // Track message change for animation
  useEffect(() => {
    if (msgIndex !== prevMsgIndex) {
      setPrevMsgIndex(msgIndex);
    }
  }, [msgIndex, prevMsgIndex]);

  return (
    <>
      {/* Inject CSS-only animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: spinnerStyles }} />

      <div className="flex flex-col items-center justify-center py-6 md:py-12 px-4 w-full max-w-sm mx-auto">
        {/* Skeleton shimmer effect */}
        <motion.div
          className="relative w-20 h-20 md:w-24 md:h-24 mb-5 md:mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 opacity-20" style={{ borderColor: mutedColor }} />

          {/* Spinning arc - CSS animation (was: repeat:Infinity framer-motion) */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent gen-spin-outer"
            style={{ borderTopColor: primaryColor }}
          />

          {/* Inner spinning arc (reverse) - CSS animation */}
          <div
            className="absolute inset-2 md:inset-3 rounded-full border-4 border-transparent gen-spin-inner"
            style={{ borderTopColor: `${primaryColor}50` }}
          />

          {/* Center icon - CSS animation for pulse */}
          <div className="absolute inset-0 flex items-center justify-center gen-pulse">
            <Sparkles className="w-7 h-7 md:w-9 md:h-9" style={{ color: primaryColor }} strokeWidth={1.5} />
          </div>
        </motion.div>

      {/* Title */}
      <motion.h2 
        className="text-base md:text-lg font-black uppercase italic tracking-tight text-center mb-1"
        style={{ color: textColor }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Generando look
      </motion.h2>
      
      {/* Product name */}
      <motion.p 
        className="text-[10px] md:text-xs text-center font-bold uppercase tracking-widest mb-5"
        style={{ color: mutedColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Probando <span style={{ color: textColor }}>{productName}</span>
      </motion.p>

      {/* Progress bar - smooth animation */}
      <motion.div 
        className="w-full max-w-[180px] md:max-w-[220px] h-1.5 rounded-full overflow-hidden mb-4 shadow-inner"
        style={{ backgroundColor: `${mutedColor}30` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div 
          className="h-full rounded-full"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 0 10px ${primaryColor}60`
          }}
          animate={{ 
            width: `${Math.min(progress, 100)}%`,
          }}
          transition={{ 
            duration: 0.8, 
            ease: 'easeOut'
          }}
        />
      </motion.div>

      {/* Percentage indicator */}
      <motion.div 
        className="text-[10px] md:text-xs font-medium mb-3"
        style={{ color: mutedColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {Math.round(progress)}%
      </motion.div>

      {/* Animated message */}
      <div className="h-5 md:h-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p 
            key={msgIndex}
            className="text-[10px] md:text-xs font-medium text-center uppercase tracking-tighter"
            style={{ color: mutedColor }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            {messages[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Brand indicator */}
      <motion.div
        className="mt-8 md:mt-10 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {/* CSS animation instead of framer-motion repeat:Infinity */}
        <div
          className="w-2 h-2 rounded-full gen-dot-pulse"
          style={{ backgroundColor: primaryColor }}
        />
        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: mutedColor }}>
          IA LOOKITRY ACTIVE
        </p>
      </motion.div>
    </div>
    </>
  );
}
