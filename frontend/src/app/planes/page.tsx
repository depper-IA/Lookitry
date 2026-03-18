import type { Metadata } from 'next';
import { getPricingConfig, getPriceOverrides } from '@/lib/pricing';
import PlanesClient from './PlanesClient';

// ISR: revalidar cada 5 minutos para reflejar overrides de precio
export const revalidate = 300;

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

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Planes', item: `${BASE_URL}/planes` },
  ],
};

export default async function PlanesPage() {
  const [pricing, overrides] = await Promise.all([
    getPricingConfig(),
    getPriceOverrides(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PlanesClient pricing={pricing} overrides={overrides} />
    </>
  );
}
