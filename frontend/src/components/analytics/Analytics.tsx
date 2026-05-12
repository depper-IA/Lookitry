'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [gaId, setGaId] = useState<string>(GA_ID);

  // Obtener GA ID dinámicamente si no está en env (caso raro)
  useEffect(() => {
    if (GA_ID) return;
    const fetchGaId = async () => {
      try {
        // Usa el proxy de Next.js (/api/...) para evitar CORS con el backend
        const res = await fetch('/api/payment-settings/public');
        if (res.ok) {
          const data = await res.json();
          if (data.gaMeasurementId) setGaId(data.gaMeasurementId);
        }
      } catch {}
    };
    fetchGaId();
  }, []);

  // Track page views en cambios de ruta
  useEffect(() => {
    if (!gaId || typeof window === 'undefined' || !(window as any).gtag) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    (window as any).gtag('config', gaId, { page_path: url });
  }, [pathname, searchParams, gaId]);

  if (!gaId) return null;

  return (
    <>
      {/* GA4 — afterInteractive para no bloquear LCP mobile */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="ga-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_title: document.title,
              cookie_domain: 'lookitry.com',
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  );
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
