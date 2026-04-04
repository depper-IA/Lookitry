'use client';

import { useCallback, useEffect, useState } from 'react';
import { brandsService } from '@/services/brands.service';
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

  const syncSession = useCallback(async () => {
    const storedSession = readStoredSession();
    if (storedSession) {
      setSession(storedSession);
    }

    try {
      const brand = await brandsService.getCurrentBrand();
      const nextSession = {
        name: brand.name || '',
        email: brand.email || '',
      };

      setSession(nextSession);
      localStorage.setItem('brand', JSON.stringify(brand));
    } catch {
      setSession(null);
      localStorage.removeItem('brand');
    }
  }, []);

  useEffect(() => {
    void syncSession();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void syncSession();
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
    };
  }, [syncSession]);

  return {
    session,
    isLoggedIn: !!session,
    refreshSession: syncSession,
  };
}
