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
          price: '150000',
          priceCurrency: 'COP',
          priceValidUntil: '2026-12-31',
          description: '5 productos, 400 generaciones/mes, widget embebible, 7 dias gratis',
          eligibleRegion: ['CO', 'MX', 'AR', 'CL', 'PE', 'VE'],
          availability: 'https://schema.org/InStock',
          url: `${BASE_URL}/planes`,
        },
        {
          '@type': 'Offer',
          name: 'Plan Pro',
          price: '250000',
          priceCurrency: 'COP',
          priceValidUntil: '2026-12-31',
          description: '15 productos, 1200 generaciones/mes, templates avanzados, soporte prioritario',
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
            text: 'El Plan Basico cuesta $150.000 COP/mes con 7 dias de prueba gratis. El Plan Pro cuesta $250.000 COP/mes con activacion inmediata. Hay descuentos de hasta 15% pagando varios meses.',
          },
        },
        {
          '@type': 'Question',
          name: 'Mis clientes necesitan crear una cuenta para usar el probador?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. El probador es completamente publico. Tus clientes solo necesitan subir una foto y elegir el producto. Sin registro, sin apps, sin friccion.',
          },
        },
        {
          '@type': 'Question',
          name: 'Que tipos de productos soporta el probador?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ropa (camisas, vestidos, pantalones, chaquetas), accesorios (bolsos, cinturones, sombreros) y calzado. La calidad del resultado depende de la claridad de la foto del producto.',
          },
        },
        {
          '@type': 'Question',
          name: 'Las fotos de mis clientes se almacenan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Las selfies se procesan de forma temporal y se eliminan automaticamente despues de generar el resultado. No almacenamos imagenes de los clientes de forma permanente.',
          },
        },
      ],
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
