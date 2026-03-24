'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

const IDLE_TIME = 30 * 60 * 1000; // 30 minutos en milisegundos

export default function IdleTimer({ children }: { children: React.ReactNode }) {
  const { logout, brand } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (brand) {
        console.log('[IdleTimer] Inactividad detectada (30 min). Cerrando sesión...');
        logout();
      }
    }, IDLE_TIME);
  };

  useEffect(() => {
    if (!brand) return;

    // Eventos que resetean el contador de inactividad
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Iniciar el timer
    resetTimer();

    // Agregar listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Limpieza al desmontar
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [brand, logout]);

  return <>{children}</>;
}
