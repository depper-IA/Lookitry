import dynamic from 'next/dynamic';
import { getPricingConfig, type PricingConfig } from '@/lib/pricing';

// Carga dinámica para evitar errores de GSAP/Window en el build de servidor
const PremiumLanding = dynamic(
  () => import('@/components/landing/new-landing/PremiumLanding'),
  { ssr: false }
);

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
  let pricing;
  try {
    pricing = await getPricingConfig();
  } catch {
    pricing = null;
  }

  const basicPrice = pricing?.basic?.precio_mensual_cop ?? 150000;
  const proPrice = pricing?.pro?.precio_mensual_cop ?? 250000;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  
  let dynamicReviews: any[] = [];
  try {
    const res = await fetch(`${API_URL}/api/reviews/public`, { 
        next: { revalidate: 3600 } 
    });
    if (res.ok) {
        const data = await res.json();
        if (data.reviews && data.reviews.length > 0) {
            dynamicReviews = data.reviews;
        }
    }
  } catch (err) {
    console.error("Error fetching reviews", err);
  }

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
      comment: "Increíble cómo cambió la percepción de mi marca. Mis clientas de WhatsApp ahora entran al link, prueban y compran. ¡Ahorro horas!",
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

  const jsonLd = {
    // ... (rest of jsonLd remains the same)
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
