import dynamic from 'next/dynamic';
import { getPricingConfig, type PricingConfig } from '@/lib/pricing';
import { organizationSchema, websiteSchema, reviewSchema, aggregateRatingSchema } from '@/lib/seo';

// Carga dinámica para code splitting (SSR habilitado para buen FCP/LCP)
const PremiumLanding = dynamic(
  () => import('@/components/landing/PremiumLanding'),
  { ssr: true }
);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

export const metadata = {
  title: 'Lookitry — Probador Virtual con IA para tu Tienda de Ropa',
  description: 'Probador virtual con IA para tiendas de ropa. Tus clientes prueban la ropa antes de comprar: menos devoluciones, más ventas. Sin apps, sin código. Activa en 10 minutos.',
  keywords: [
    'probador virtual IA',
    'probador virtual tienda ropa',
    'como vender ropa por whatsapp',
    'tienda virtual ropa instagram',
    'probador virtual sin app',
    'reducir devoluciones tienda online',
    'virtual try-on Colombia',
    'virtual try-on México',
    'probador virtual gratis',
    'IA para tienda de ropa',
    'probador ropa inteligencia artificial',
    'tienda virtual ropa sin web',
    'link bio instagram tienda ropa',
    'virtual try-on latam',
    'probador ropa online sin descargar',
  ],
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'Lookitry — Probador Virtual con IA para tu Tienda de Ropa',
    description: 'Tus clientes se prueban la ropa antes de comprar. Menos devoluciones, más ventas. Sin apps, sin código. Activa en 10 minutos.',
    url: BASE_URL,
    siteName: 'Lookitry',
    locale: 'es_CO',
    type: 'website',
    images: [{ url: `${BASE_URL}/og-image.webp`, width: 1200, height: 630, alt: 'Lookitry — Probador Virtual con IA para tiendas de ropa en Latinoamérica' }],
  },
};

export default async function HomePage() {
  let pricing;
  try {
    pricing = await getPricingConfig();
  } catch {
    pricing = null;
  }

  const basicPrice = pricing?.basic?.precio_mensual_cop ?? 180000;
  const proPrice = pricing?.pro?.precio_mensual_cop ?? 350000;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

  // Reviews: fetch asíncrono NO bloqueante
  const reviewsData = await fetch(`${API_URL}/api/reviews/public`, {
    next: { revalidate: 1800 }
  }).then(res => res.ok ? res.json().catch(() => ({ reviews: [] })) : { reviews: [] }).catch(() => ({ reviews: [] }));
  const dynamicReviews = reviewsData?.reviews ?? [];

  // Testimonios curados para la home premium como fallback si falla la bd o hay pocas
  const mockReviews = [
    {
      id: 'mock-1',
      rating: 5,
      comment: "Lookitry no solo nos dio una web, nos dio una herramienta de ventas real. La tasa de retorno de clientes que usan el probador es increíble.",
      reviewer_name: "Elena Martínez",
      reviewer_plan: "PRO",
      is_featured: true,
      created_at: new Date().toISOString(),
      avatar_url: null
    },
    {
      id: 'mock-2',
      rating: 5,
      comment: "Increíble cómo cambió la percepción de mi marca. Mis clientes de WhatsApp ahora entran al link, prueban y compran. ¡Ahorro horas!",
      reviewer_name: "Sofía Rodríguez",
      reviewer_plan: "BASIC",
      is_featured: true,
      created_at: new Date().toISOString(),
      avatar_url: null
    },
    {
      id: 'mock-3',
      rating: 5,
      comment: "El plugin de WooCommerce se instaló en 5 minutos. Mis ventas subieron un 30% en el primer mes de uso.",
      reviewer_name: "Carlos Gómez",
      reviewer_plan: "PRO",
      is_featured: true,
      created_at: new Date().toISOString(),
      avatar_url: null
    }
  ];

  const finalReviews = [...dynamicReviews];
  if (finalReviews.length < 5) {
      finalReviews.push(...mockReviews.slice(0, 5 - finalReviews.length));
  }


  const totalRating = finalReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0);
  const avgRating = finalReviews.length > 0 ? totalRating / finalReviews.length : 4.8;
  const reviewsSchemaList = finalReviews.slice(0, 5).map(r =>
    reviewSchema({ reviewerName: r.reviewer_name, rating: r.rating ?? 5, comment: r.comment ?? '', date: r.created_at })
  );
  const aggregateRating = aggregateRatingSchema(finalReviews.length, avgRating);

  const baseOrgSchema = organizationSchema();
  const baseWebSchema = websiteSchema();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        ...baseOrgSchema,
        '@id': `${BASE_URL}/#organization`,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+57-310-543-6281',
          contactType: 'customer service',
          areaServed: ['CO', 'MX', 'AR', 'CL', 'PE', 'VE'],
          availableLanguage: 'Spanish',
        },
      },
      {
        ...baseWebSchema,
        '@id': `${BASE_URL}/#website`,
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
        aggregateRating,
        offers: [
          {
            '@type': 'Offer',
            name: 'Plan Basico',
            price: String(basicPrice),
            priceCurrency: 'COP',
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/planes`,
          },
          {
            '@type': 'Offer',
            name: 'Plan Pro',
            price: String(proPrice),
            priceCurrency: 'COP',
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/planes`,
          },
        ],
      },
      ...reviewsSchemaList,
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: '¿Cómo funciona el probador virtual?',
            acceptedAnswer: { '@type': 'Answer', text: 'El cliente sube una foto suya (selfie o foto de cuerpo completo), selecciona el producto que quiere probar y la IA genera en segundos una imagen realista mostrando cómo le quedaría la prenda o accesorio.' },
          },
          {
            '@type': 'Question',
            name: '¿Mis clientes necesitan crear una cuenta para usar el probador?',
            acceptedAnswer: { '@type': 'Answer', text: 'No. El probador es completamente público. Tus clientes solo necesitan subir una foto y elegir el producto. Sin registro, sin apps, sin fricción.' },
          },
          {
            '@type': 'Question',
            name: '¿Cómo integro el probador en mi tienda o web?',
            acceptedAnswer: { '@type': 'Answer', text: 'Tienes dos opciones: usar tu propia Tienda Virtual de Lookitry (sin código) o conectar el probador directamente en tu sitio web. Funciona en Shopify, WordPress, Wix, etc.' },
          },
          {
            '@type': 'Question',
            name: '¿Las fotos de mis clientes se almacenan?',
            acceptedAnswer: { '@type': 'Answer', text: 'Las selfies se procesan de forma temporal y se eliminan automáticamente después de generar el resultado. No almacenamos imágenes de los clientes permanentemente.' },
          },
          {
            '@type': 'Question',
            name: '¿Necesito saber programar para usar Lookitry?',
            acceptedAnswer: { '@type': 'Answer', text: 'No. Todo se configura con formularios simples. No necesitas tocar código ni contratar desarrolladores.' },
          },
          {
            '@type': 'Question',
            name: '¿Tienen plugin para WooCommerce?',
            acceptedAnswer: { '@type': 'Answer', text: 'Sí, contamos con un plugin oficial para WordPress/WooCommerce que permite integrar el probador en minutos sin tocar código.' },
          },
          {
            '@type': 'Question',
            name: '¿Puedo cancelar en cualquier momento?',
            acceptedAnswer: { '@type': 'Answer', text: 'Sí. No hay contratos de permanencia. Puedes cancelar tu suscripción cuando quieras desde tu dashboard.' },
          },
          {
            '@type': 'Question',
            name: '¿Cuántas generaciones incluye cada plan?',
            acceptedAnswer: { '@type': 'Answer', text: 'El Plan Básico incluye 400 generaciones por mes. El Plan Pro incluye 1.200 generaciones por mes. El contador se reinicia el primer día de cada mes.' },
          },
          {
            '@type': 'Question',
            name: '¿Qué métodos de pago aceptan?',
            acceptedAnswer: { '@type': 'Answer', text: 'Aceptamos pagos a través de Wompi (Visa, Mastercard, PSE y Nequi) y PayPal para pagos en USD.' },
          },
          {
            '@type': 'Question',
            name: '¿Funciona en Shopify o Wix?',
            acceptedAnswer: { '@type': 'Answer', text: 'Sí. Puedes conectar el probador copiando y pegando el código en la sección de descripción o liquid de cualquier plataforma.' },
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
      <PremiumLanding 
        pricing={pricing as PricingConfig} 
        reviews={finalReviews} 
        realReviewsCount={dynamicReviews.length}
        usingMockReviews={finalReviews.some(r => r.id.startsWith('mock-'))}
      />
    </>
  );
}
