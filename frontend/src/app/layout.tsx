import type { Metadata } from 'next';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icon.png', type: 'image/png', sizes: '180x180' }],
  },
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
    googleBot: { index: true, follow: true },
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
    languages: {
      'es': BASE_URL,
      'es-CO': BASE_URL,
      'es-MX': BASE_URL,
      'es-AR': BASE_URL,
      'es-CL': BASE_URL,
      'es-PE': BASE_URL,
      'es-VE': BASE_URL,
    },
  },
};

import { CookieConsent } from '@/components/ui/CookieConsent';
import { MobileBottomNav } from '@/components/ui/MobileBottomNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      style={
        {
          '--font-jakarta': '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
          '--font-dm-sans': '"Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
          '--font-tech': '"Consolas", "SFMono-Regular", "Courier New", monospace',
          '--font-playfair': '"Georgia", "Times New Roman", serif',
        } as React.CSSProperties
      }
    >
      <head>
        {/* fb:app_id requerido por Facebook/WhatsApp scraper */}
        <meta property="fb:app_id" content="966242223397117" />
        {/* OG fallback explícito para scrapers que no ejecutan JS */}
        <meta property="og:site_name" content="Lookitry" />
        <meta property="og:locale" content="es_CO" />
        <meta name="twitter:site" content="@lookitry" />
        {/* Script de tema bloqueante: aplica dark/light ANTES del primer paint para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}else if(t==='light'){document.documentElement.classList.remove('dark');}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans">
        {children}
        <MobileBottomNav />
        <CookieConsent />
      </body>
    </html>
  );
}

