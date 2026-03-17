import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const BASE_URL = 'https://pruebalo.wilkiedevs.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Lookitry — Probador virtual con IA para tu marca',
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
    title: 'Lookitry — Probador virtual con IA para tu marca',
    description:
      'Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica. Intégralo en tu tienda en 10 minutos.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lookitry — Probador virtual con IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lookitry — Probador virtual con IA para tu marca',
    description:
      'Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '48x48' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
