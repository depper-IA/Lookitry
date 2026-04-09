'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';

const IDLE_TIMEOUT = 60 * 60 * 1000; // 60 minutos de inactividad
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Mostrar warning 5 min antes de expirar
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // Refrescar 5 min antes de expirar

function IdleTimeoutWarning({ 
  onStay, 
  onLeave, 
  remainingSeconds 
}: { 
  onStay: () => void; 
  onLeave: () => void;
  remainingSeconds: number;
}) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mx-auto">
          <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-center font-jakarta text-2xl font-bold text-white">
          Tu sesión está por expirar
        </h2>
        
        <p className="mt-3 text-center text-sm text-gray-400">
          Por inactividad, tu sesión expirará en <span className="font-semibold text-amber-500">{timeDisplay}</span>.
        </p>
        
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onStay}
            className="flex h-12 items-center justify-center rounded-2xl bg-[#FF5C3A] px-6 font-bold text-white transition-all hover:brightness-110"
          >
            Seguir conectado
          </button>
          <button
            onClick={onLeave}
            className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white"
          >
            Cerrar sesión ahora
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IdleTimer({ children }: { children: React.ReactNode }) {
  const { logout, brand } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      await authService.refreshSession();
      lastActivityRef.current = Date.now();
      console.log('[IdleTimer] Sesión refresheda');
    } catch (e) {
      console.error('[IdleTimer] Error al refresh sesión:', e);
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const hideWarning = useCallback(() => {
    setShowWarning(false);
    setRemainingSeconds(0);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const handleStay = useCallback(() => {
    hideWarning();
    refreshSession();
    lastActivityRef.current = Date.now();
  }, [hideWarning, refreshSession]);

  const handleLeave = useCallback(() => {
    hideWarning();
    console.log('[IdleTimer] Usuario eligió cerrar sesión');
    logout();
  }, [hideWarning, logout]);

  const resetTimer = useCallback(() => {
    clearAllTimers();

    const timeSinceLastActivity = Date.now() - lastActivityRef.current;

    if (timeSinceLastActivity > IDLE_TIMEOUT - REFRESH_BEFORE_MS) {
      refreshSession();
    }

    lastActivityRef.current = Date.now();

    warningTimerRef.current = setTimeout(() => {
      if (brand && !showWarning) {
        console.log('[IdleTimer] Mostrando warning de sesión');
        setShowWarning(true);
        setRemainingSeconds(WARNING_BEFORE_MS / 1000);
        
        countdownRef.current = setInterval(() => {
          setRemainingSeconds(prev => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              // Logout automático cuando el countdown llega a 0
              setShowWarning(false);
              setRemainingSeconds(0);
              logout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }, IDLE_TIMEOUT - WARNING_BEFORE_MS);

    timerRef.current = setTimeout(() => {
      if (brand && !showWarning) {
        console.log('[IdleTimer] Inactividad detectada (60 min). Cerrando sesión...');
        logout();
      }
    }, IDLE_TIMEOUT);
  }, [brand, logout, refreshSession, clearAllTimers, showWarning]);

  useEffect(() => {
    if (!brand) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'focus'];
    
    resetTimer();

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      clearAllTimers();
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [brand, resetTimer, clearAllTimers]);

  return (
    <>
      {children}
      {showWarning && (
        <IdleTimeoutWarning
          onStay={handleStay}
          onLeave={handleLeave}
          remainingSeconds={remainingSeconds}
        />
      )}
    </>
  );
}
