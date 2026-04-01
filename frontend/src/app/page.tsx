// Página principal — redirige al diseño de mini-landing
// El JSON-LD de SEO se mantiene para que Google siga indexando el producto completo
import { getPricingConfig } from '@/lib/pricing';
import MiniLandingHomepage from '@/components/landing/MiniLandingHomepage';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

export const metadata = {
  title: 'Lookitry — Probador Virtual con IA para tu Tienda de Ropa',
  description: 'Activa el probador virtual con inteligencia artificial en tu tienda en 10 minutos. Sin apps, sin desarrollo. Para marcas que venden por Instagram o WhatsApp.',
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'Lookitry — Probador Virtual con IA',
    description: 'Tu tienda online profesional con probador virtual IA integrado, sin pagar un diseñador ni saber de código.',
    url: BASE_URL,
    siteName: 'Lookitry',
    locale: 'es_CO',
    type: 'website',
  },
};

export default async function HomePage() {
  const pricing = await getPricingConfig();

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
        '@id': `${BASE_URL}/#software`,
        name: 'Lookitry',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: BASE_URL,
        description: 'Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamerica.',
        offers: [
          {
            '@type': 'Offer',
            name: 'Plan Basico',
            price: String(pricing.basic.precio_mensual_cop),
            priceCurrency: 'COP',
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/planes`,
          },
          {
            '@type': 'Offer',
            name: 'Plan Pro',
            price: String(pricing.pro.precio_mensual_cop),
            priceCurrency: 'COP',
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/planes`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MiniLandingHomepage />
    </>
  );
}
