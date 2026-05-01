import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Script from 'next/script';
import { Suspense } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Lookitry — Probador virtual con IA para tu tienda online',
    template: '%s | Lookitry',
  },
  description:
    'Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica. Intégralo en tu tienda en 10 minutos. Sin apps, sin desarrollo.',
  keywords: [
    'probador virtual IA',
    'probador virtual tienda',
    'prueba ropa online',
    'widget probador virtual tienda',
    'probador virtual IA Latam',
    'virtual try-on Colombia',
    'probador virtual ropa',
    'IA moda Latinoamérica',
    'probador virtual Colombia',
    'probador virtual México',
    'probador virtual Venezuela',
    'probador virtual ropa online',
    'probador virtual para Instagram',
    'probador virtual para tienda Shopify',
    'probador virtual para WooCommerce',
    'aumentar ventas tienda ropa online',
    'reducir devoluciones tienda online',
    'virtual try-on Latam',
    'probador virtual sin app',
    'probador de ropa virtual Venezuela',
    'tienda ropa online Venezuela IA',
  ],
  authors: [{ name: 'Lookitry', url: BASE_URL }],
  creator: 'Lookitry',
  publisher: 'Lookitry',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: BASE_URL,
    siteName: 'Lookitry',
    title: 'Lookitry — Probador virtual con IA para tu tienda online',
    description:
      'Tu cliente se prueba la ropa antes de comprarla. Integra el probador virtual en tu tienda en 10 minutos. Sin apps, sin desarrollo.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Lookitry — Probador virtual con IA para tiendas de ropa en Latinoamérica',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lookitry — Probador virtual con IA para tu tienda online',
    description:
      'Tu cliente se prueba la ropa antes de comprarla. Sin apps, sin desarrollo. Para tiendas en Latinoamérica.',
    images: [`${BASE_URL}/og-image.png`],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

import { ThemeProvider } from '@/contexts/ThemeContext';
import { Analytics } from '@/components/analytics/Analytics';
import { RouteChrome } from '@/components/layout/RouteChrome';
import { Toaster } from 'sonner';
import { ExitIntentProvider } from '@/components/landing/ExitIntentProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html
      lang="es"
      className={`dark ${inter.variable} ${outfit.variable} scroll-smooth antialiased`}
      suppressHydrationWarning
style={
          {
            '--font-jakarta': 'var(--font-outfit), "Segoe UI", "Helvetica Neue", Arial, sans-serif',
            '--font-dm-sans': 'var(--font-inter), "Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
            '--font-tech': '"Consolas", "SFMono-Regular", "Courier New", monospace',
            '--font-playfair': '"Georgia", "Times New Roman", serif',
          } as React.CSSProperties
        }
    >
      <head>
        {/* fb:app_id requerido por Facebook/WhatsApp scraper */}
        <meta property="fb:app_id" content="966242223397117" />
        <meta name="google-site-verification" content="F-LW3EGCNrjEhNaAT56Qrioyo4-UD2CRWYyqgS-sExE" />
        {/* OG fallback explícito para scrapers que no ejecutan JS */}
        <meta property="og:site_name" content="Lookitry" />
        <meta property="og:locale" content="es_CO" />
        <meta name="twitter:site" content="@lookitry" />
        {/* DNS Prefetch y Preconnect para的性能优化 */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.lookitry.com" />
        <link rel="dns-prefetch" href="https://vkdooutklowctuudjnkl.supabase.co" />
        
        {/* Script de tema: aplica user preference (light) DESPUES del primer paint — dark ya viene por defecto en html class */}
        {/* dark es el UNICO default — light solo si el usuario lo elige explicitamente */}
        <Script id="theme-init" strategy="afterInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){document.documentElement.classList.add('dark');}})();`}
        </Script>
      </head>

      <body className="font-sans" suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            ></iframe>
          </noscript>
        )}
        {/* Google Tag Manager (script) — afterInteractive para no bloquear LCP mobile */}
        {GTM_ID && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag.js?id=${GTM_ID}`}
          />
        )}
        <ThemeProvider>
          <ExitIntentProvider>
            <Suspense fallback={null}>
              <Analytics />
            </Suspense>
            {children}
            <Suspense fallback={null}>
              <RouteChrome />
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                },
              }}
            />
          </ExitIntentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
