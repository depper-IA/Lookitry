import type { Metadata } from 'next';
import PlanesClient from './PlanesClient';

const BASE_URL = 'https://pruebalo.wilkiedevs.com';

export const metadata: Metadata = {
  title: 'Planes y precios — Probador virtual IA para tiendas',
  description:
    'Elige el plan de probador virtual con IA para tu tienda. Plan Básico desde $150.000 COP/mes con 7 días gratis. Plan Pro desde $250.000 COP/mes. Sin apps, sin desarrollo.',
  alternates: {
    canonical: `${BASE_URL}/planes`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/planes`,
    title: 'Planes y precios — Lookitry',
    description:
      'Probador virtual con IA para tu tienda. Plan Básico $150.000 COP/mes · Plan Pro $250.000 COP/mes. 7 días gratis.',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
};

export default function PlanesPage() {
  return <PlanesClient />;
}
