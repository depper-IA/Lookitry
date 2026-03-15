'use client';

import { useState, useEffect } from 'react';

interface GenerationLoaderProps {
  productName: string;
  primaryColor?: string;
}

const MESSAGES = [
  'Analizando tu foto...',
  'Estudiando el producto...',
  'Aplicando el producto...',
  'Ajustando proporciones...',
  'Refinando detalles...',
  'Casi listo...',
];

export function GenerationLoader({ productName, primaryColor = '#6366f1' }: GenerationLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return p + Math.random() * 3;
      });
    }, 1000);

    return () => { clearInterval(msgInterval); clearInterval(progressInterval); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Animación central */}
      <div className="relative w-28 h-28 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: primaryColor, animationDuration: '1s' }} />
        <div className="absolute inset-3 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: `${primaryColor}60`, animationDuration: '1.5s', animationDirection: 'reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: primaryColor }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-1">Generando tu look</h2>
      <p className="text-sm text-gray-500 mb-6">
        Probando <span className="font-medium text-gray-700">{productName}</span>
      </p>

      {/* Barra de progreso */}
      <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%`, backgroundColor: primaryColor }} />
      </div>

      {/* Mensaje animado */}
      <p className="text-sm text-gray-400 h-5 transition-all duration-500">{MESSAGES[msgIndex]}</p>

      <p className="text-xs text-gray-300 mt-6">Esto puede tardar hasta 30 segundos</p>
    </div>
  );
}
