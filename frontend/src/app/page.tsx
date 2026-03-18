import LandingClient from '@/components/landing/LandingClient';

const BASE_URL = 'https://pruebalo.wilkiedevs.com';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'Lookitry',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.svg` },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+57-310-543-6281',
        contactType: 'customer service',
        areaServed: ['CO', 'MX', 'AR', 'CL', 'PE', 'VE'],
        availableLanguage: 'Spanish',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'Lookitry',
      publisher: { '@id': `${BASE_URL}/#organization` },
      inLanguage: 'es',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Lookitry',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: [
        {
          '@type': 'Offer',
          name: 'Plan Básico',
          price: '150000',
          priceCurrency: 'COP',
          description: '5 productos, 400 generaciones/mes',
        },
        {
          '@type': 'Offer',
          name: 'Plan Pro',
          price: '250000',
          priceCurrency: 'COP',
          description: '15 productos, 1.200 generaciones/mes',
        },
      ],
      description:
        'Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica.',
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient />
    </>
  );
}
