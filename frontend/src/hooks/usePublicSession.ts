'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { brandsService } from '@/services/brands.service';
import { authService } from '@/services/auth.service';
import { AUTH_STATE_CHANGED_EVENT } from '@/lib/sessionEvents';

type PublicSession = {
  name: string;
  email: string;
} | null;

function readStoredSession(): PublicSession {
  if (typeof window === 'undefined') return null;

  try {
    const brand = JSON.parse(localStorage.getItem('brand') || 'null');
    if (brand?.name || brand?.email) {
      return {
        name: brand.name || '',
        email: brand.email || '',
      };
    }
  } catch {
    localStorage.removeItem('brand');
  }

  return null;
}

export function usePublicSession() {
  const [session, setSession] = useState<PublicSession>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const isAuthRouteRef = useRef<boolean>(false);

  // Detectar si estamos en una ruta de autenticación
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authRoutes = ['/login', '/register', '/auth/', '/registro-pro', '/onboarding', '/register/google-setup', '/checkout', '/trial-checkout'];
      isAuthRouteRef.current = authRoutes.some(route => window.location.pathname.startsWith(route));
    }
  }, []);

  const syncSession = useCallback(async () => {
    // IMPORTANTE: Si estamos en una ruta de autenticación, no hacer sync agresivo
    // Esto evita interrumpir el flujo de login/onboarding con múltiples 401s
    if (isAuthRouteRef.current) {
      const storedSession = readStoredSession();
      if (storedSession) {
        setSession(storedSession);
      }
      return;
    }

    // Debounce: evitar múltiples sincronizaciones en corto tiempo (500ms mínimo)
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 500) {
      return;
    }
    lastSyncTimeRef.current = now;

    const storedSession = readStoredSession();
    if (storedSession) {
      setSession(storedSession);
    }

    const hasLocalSession =
      !!storedSession || !!authService.getBrand() || !!authService.getToken();

    if (!hasLocalSession) {
      setSession(null);
      return;
    }

    try {
      const brand = await brandsService.getCurrentBrand();
      const nextSession = {
        name: brand.name || '',
        email: brand.email || '',
      };

      setSession(nextSession);
      localStorage.setItem('brand', JSON.stringify(brand));
    } catch (err: any) {
      // Si el error es 401, no limpiar la sesión local si estamos en auth route
      // Esto permite que el usuario complete el flujo de login/onboarding
      if (err?.response?.status !== 401) {
        setSession(null);
        localStorage.removeItem('brand');
      }
      // Si es 401 en auth route, simplemente ignorar el error
    }
  }, []);

  useEffect(() => {
    void syncSession();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Debounce: clear any pending timeout before scheduling a new one
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        syncTimeoutRef.current = setTimeout(() => {
          syncTimeoutRef.current = null;
          void syncSession();
        }, 500); // Increased from 100ms to reduce frequency of rapid tab switches
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || ['brand', 'token', 'brandToken'].includes(event.key)) {
        void syncSession();
      }
    };

    window.addEventListener('focus', syncSession);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, syncSession);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', syncSession);
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, syncSession);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [syncSession]);

  return {
    session,
    isLoggedIn: !!session,
    refreshSession: syncSession,
  };
}
