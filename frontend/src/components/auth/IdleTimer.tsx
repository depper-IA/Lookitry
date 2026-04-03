'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';

const IDLE_TIMEOUT = 60 * 60 * 1000; // 60 minutos de inactividad
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // Refrescar 5 min antes de expirar

export default function IdleTimer({ children }: { children: React.ReactNode }) {
  const { logout, brand } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const refreshSession = useCallback(async () => {
    try {
      await authService.refreshSession();
      lastActivityRef.current = Date.now();
      console.log('[IdleTimer] Sesión refresheda');
    } catch (e) {
      console.error('[IdleTimer] Error al refresh sesión:', e);
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const timeSinceLastActivity = Date.now() - lastActivityRef.current;

    if (timeSinceLastActivity > IDLE_TIMEOUT - REFRESH_BEFORE_MS) {
      refreshSession();
    }

    lastActivityRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      if (brand) {
        console.log('[IdleTimer] Inactividad detectada (60 min). Cerrando sesión...');
        logout();
      }
    }, IDLE_TIMEOUT);
  }, [brand, logout, refreshSession]);

  useEffect(() => {
    if (!brand) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'focus'];
    
    resetTimer();

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [brand, resetTimer]);

  return <>{children}</>;
}
