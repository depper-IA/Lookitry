'use client';

import { usePathname } from 'next/navigation';
import { CookieConsentModal } from '@/components/ui/CookieConsentModal';
import { MobileBottomNav } from '@/components/ui/MobileBottomNav';

export function RouteChrome() {
  const pathname = usePathname();

  if (!pathname) return null;
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/embed/') ||
    pathname.startsWith('/sitio/') ||
    pathname.startsWith('/marca/') ||
    pathname.startsWith('/trial-checkout') ||
    pathname.startsWith('/onboarding-post-pago') ||
    pathname.startsWith('/pago-exitoso') ||
    pathname.startsWith('/checkout')
  ) {
    return null;
  }

  return (
    <>
      <MobileBottomNav pathname={pathname} />
      <CookieConsentModal />
    </>
  );
}
