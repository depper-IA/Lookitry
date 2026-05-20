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

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <motion.div
      className="flex flex-col h-full w-full max-w-xs mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Spinner + mensaje — centrado verticalmente en el espacio disponible */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Spinner delgado */}
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: `${primaryColor}25`,
            borderTopColor: primaryColor,
          }}
        />

        {/* Mensaje rotativo */}
        <div className="h-5 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              className="text-sm font-medium text-center"
              style={{ color: mutedColor }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {messages[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Disclaimer — fijo al fondo del espacio disponible */}
      <p
        className="text-[10px] text-center leading-relaxed pb-2"
        style={{ color: mutedColor, opacity: 0.65 }}
      >
        Las imagenes generadas por IA pueden incluir errores. El ajuste y apariencia no seran exactos.
      </p>
    </motion.div>
  );
}
