'use client';

import { useEffect, useRef, useCallback } from 'react';
import { authService } from '@/services/auth.service';

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 60 minutos
const CHECK_INTERVAL_MS = 60000; // Revisar cada minuto

export function useSessionTimeout(onTimeout: () => void) {
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/auth/refresh-session`, {
        method: 'POST',
        credentials: 'include',
      });
      lastActivityRef.current = Date.now();
    } catch (e) {
      console.error('Failed to refresh session:', e);
    }
  }, []);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      if (timeSinceLastActivity > INACTIVITY_LIMIT_MS - 300000) {
        refreshSession();
      }

      resetActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [refreshSession, resetActivity]);

  useEffect(() => {
    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      if (timeSinceLastActivity >= INACTIVITY_LIMIT_MS) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        authService.logout().then(() => {
          onTimeout();
        }).catch(() => {
          onTimeout();
        });
      }
    };

    timerRef.current = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [onTimeout]);

  return {
    refreshSession,
    resetActivity,
  };
}
