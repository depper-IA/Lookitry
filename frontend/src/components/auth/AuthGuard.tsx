'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const PUBLIC_ROUTES = ['/', '/login', '/register', '/checkout', '/trial-checkout', '/pago-exitoso', '/onboarding-post-pago'];

export default function AuthGuard({ children, redirectTo = '/dashboard' }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const brandStr = localStorage.getItem('brand');
    
    if (brandStr) {
      try {
        const brand = JSON.parse(brandStr);
        if (brand && brand.id) {
          if (!PUBLIC_ROUTES.includes(pathname)) {
            return;
          }
          router.replace(redirectTo);
          return;
        }
      } catch {
        localStorage.removeItem('brand');
      }
    }
  }, [pathname, router, redirectTo]);

  return <>{children}</>;
}

export function useAuthRedirect(requireAuth: boolean, redirectAuthTo?: string) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const brandStr = localStorage.getItem('brand');
    const hasAuth = !!brandStr;

    if (requireAuth && !hasAuth) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!requireAuth && hasAuth) {
      router.replace(redirectAuthTo || '/dashboard');
      return;
    }
  }, [pathname, router, requireAuth, redirectAuthTo]);
}