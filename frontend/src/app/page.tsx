import HomeLandingClient from '@/components/landing/HomeLandingClient';
import { PromoModal } from '@/components/landing/PromoModal';
import { getPricingConfig } from '@/lib/pricing';
import type { PublicReviewsResponse } from '@/types';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

async function fetchPublicReviews(): Promise<PublicReviewsResponse> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

  try {
    const response = await fetch(`${apiBase}/api/reviews/public`, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return { reviews: [], total_approved: 0 };
    }

    return response.json();
  } catch {
    return { reviews: [], total_approved: 0 };
  }
}


export default async function HomePage() {
  const pricing = await getPricingConfig();
  const publicReviews = await fetchPublicReviews();
  const MIN_REVIEWS_TO_SHOW = 3;
  const hasEnoughReviews = publicReviews.reviews.length >= MIN_REVIEWS_TO_SHOW;
  const reviewsToShow = hasEnoughReviews ? publicReviews.reviews : [];

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
        description:
          'Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamerica. Integra el widget en tu tienda en 10 minutos. Sin apps, sin desarrollo.',
        featureList: [
          'Probador virtual con inteligencia artificial',
          'Widget embebible para cualquier plataforma',
          'Compatible con Shopify, WooCommerce, Wix y HTML',
          'Generacion de imagenes en segundos',
          'Sin registro para clientes finales',
          'Analytics de uso incluido',
          'Templates de diseno personalizables',
          'Mini-landing publica con probador integrado',
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '120',
          bestRating: '5',
          worstRating: '1',
        },
        offers: [
          {
            '@type': 'Offer',
            name: 'Plan Basico',
            price: String(pricing.basic.precio_mensual_cop),
            priceCurrency: 'COP',
            priceValidUntil: '2026-12-31',
            description: '5 productos, 400 generaciones/mes, widget embebible, prueba 7 dias por $20.000',
            eligibleRegion: ['CO', 'MX', 'AR', 'CL', 'PE', 'VE'],
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/planes`,
          },
          {
            '@type': 'Offer',
            name: 'Plan Pro',
            price: String(pricing.pro.precio_mensual_cop),
            priceCurrency: 'COP',
            priceValidUntil: '2026-12-31',
            description: `15 productos, ${pricing.pro.generaciones_mensuales.toLocaleString('es-CO')} generaciones/mes, templates avanzados y soporte prioritario`,
            eligibleRegion: ['CO', 'MX', 'AR', 'CL', 'PE', 'VE'],
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/planes`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Como funciona el probador virtual?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'El cliente sube una foto suya, selecciona el producto que quiere probar y la IA genera en segundos una imagen realista mostrando como le quedaria la prenda o accesorio. Sin apps, sin registro.',
            },
          },
          {
            '@type': 'Question',
            name: 'Como integro el probador virtual en mi tienda?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tienes dos opciones: usar tu mini-landing publica (sin codigo) o copiar el widget embebible desde tu dashboard y pegarlo en tu sitio. Funciona en Shopify, WooCommerce, Wix o cualquier HTML.',
            },
          },
          {
            '@type': 'Question',
            name: 'Cuanto cuesta el probador virtual?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `El Plan Basico cuesta $${pricing.basic.precio_mensual_cop.toLocaleString('es-CO')} COP/mes con 7 dias de prueba por solo $20.000. El Plan Pro cuesta $${pricing.pro.precio_mensual_cop.toLocaleString('es-CO')} COP/mes con activacion inmediata.`,
            },
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
      <HomeLandingClient 
        pricing={pricing} 
        reviews={reviewsToShow} 
      />
      <PromoModal />
    </>
  );
}
