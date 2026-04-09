'use client';

import { usePathname } from 'next/navigation';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { MobileBottomNav } from '@/components/ui/MobileBottomNav';

export function RouteChrome() {
  const pathname = usePathname();

  if (!pathname) return null;
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/embed/') ||
    pathname.startsWith('/pruebalo/') ||
    pathname.startsWith('/sitio/') ||
    pathname.startsWith('/marca/')
  ) {
    return null;
  }

  return (
    <>
      <MobileBottomNav pathname={pathname} />
      <CookieConsent pathname={pathname} />
    </>
  );
}
