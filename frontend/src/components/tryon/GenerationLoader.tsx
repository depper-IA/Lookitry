'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GenerationLoaderProps {
  productName: string;
  primaryColor?: string;
  messages?: string[];
  textColor?: string;
  mutedColor?: string;
}

const DEFAULT_MESSAGES = [
  'Creando tu look...',
  'Aplicando la prenda...',
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

  const orbStyles = `
    @keyframes orb-breathe {
      0%, 100% { transform: scale(1);    opacity: 0.85; }
      50%       { transform: scale(1.1); opacity: 1;    }
    }
    @keyframes orb-glow {
      0%, 100% { box-shadow: 0 0 24px 6px ${primaryColor}40; }
      50%       { box-shadow: 0 0 48px 18px ${primaryColor}65; }
    }
    .orb-animated {
      animation: orb-breathe 2.5s ease-in-out infinite, orb-glow 2.5s ease-in-out infinite;
    }
  `;

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: orbStyles }} />

      <div className="flex flex-col items-center justify-center py-12 px-4 w-full max-w-sm mx-auto">
        {/* Orb de entrada */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <div
            className="w-20 h-20 rounded-full orb-animated"
            style={{
              ['--orb-color' as string]: primaryColor,
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}90)`,
            }}
          />
        </motion.div>

        {/* Mensaje rotativo */}
        <div className="h-6 flex items-center justify-center mb-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              className="text-sm font-medium text-center"
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

        {/* Separador */}
        <div
          className="w-16 h-px mb-6"
          style={{ backgroundColor: `${mutedColor}30` }}
        />

        {/* Disclaimer */}
        <p
          className="text-[9px] text-center leading-relaxed max-w-[200px]"
          style={{ color: mutedColor, opacity: 0.4 }}
        >
          Las imagenes generadas por IA pueden incluir errores. El ajuste y apariencia no seran exactos.
        </p>
      </div>
    </>
  );
}
