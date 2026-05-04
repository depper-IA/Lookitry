import { Metadata } from 'next';
import { MiniLanding } from '@/components/mini-landing/MiniLanding';
import { brandPageSchema } from '@/lib/seo';

// Forzar renderizado dinámico — nunca cachear esta página
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { brandSlug: string };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

async function getBrandConfig(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/pruebalo/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getBrandConfig(params.brandSlug);
  if (!data) {
    return { title: 'Probador Virtual' };
  }
  const brand = data.brand;

  // Si la landing está suspendida (fue activada y luego suspendida), metadata genérica
  if (!brand.has_landing_page && brand.landing_suspended_at) {
    return { title: 'Tienda temporalmente inactiva' };
  }

  const title = `${brand.name} — Probador Virtual`;
  const description =
    brand.brand_description ||
    `Pruébate los productos de ${brand.name} con inteligencia artificial.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images:
        brand.cover_image_url
          ? [{ url: brand.cover_image_url }]
          : brand.logo
          ? [{ url: brand.logo }]
          : [],
    },
  };
}

// ── Página de suspensión ──────────────────────────────────────────────────────
function PaginaSuspendida({ brandName }: { brandName?: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#f5f2ee',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      {/* Icono de tienda cerrada */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FF5C3A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l1-5h16l1 5" />
          <path d="M3 9a2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2" />
          <path d="M5 11v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
          <line x1="9" y1="21" x2="9" y2="15" />
          <line x1="15" y1="21" x2="15" y2="15" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      </div>

      {/* Título */}
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#f5f2ee',
          margin: '0 0 0.75rem 0',
          textAlign: 'center',
        }}
      >
        {brandName ? brandName : 'Esta tienda'} está temporalmente inactiva
      </h1>

      {/* Subtítulo */}
      <p
        style={{
          fontSize: '0.9375rem',
          color: '#888',
          margin: '0 0 2.5rem 0',
          textAlign: 'center',
          maxWidth: 420,
          lineHeight: 1.6,
        }}
      >
        La mini-landing de esta marca se encuentra suspendida por falta de pago.
        Si eres el propietario, renueva tu suscripción para reactivarla.
      </p>

      {/* Separador acento */}
      <div
        style={{
          width: 40,
          height: 2,
          backgroundColor: '#FF5C3A',
          borderRadius: 2,
          marginBottom: '2.5rem',
        }}
      />

      {/* CTA de contacto */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
          ¿Eres el propietario? Contáctanos para reactivar tu cuenta
        </p>

        <a
          href="mailto:info@lookitry.com"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#FF5C3A',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {/* Icono email */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          Contactar soporte
        </a>
      </div>

      {/* Footer */}
      <p
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          fontSize: '0.75rem',
          color: '#333',
        }}
      >
        Probador virtual impulsado por{' '}
        <span style={{ color: '#FF5C3A' }}>Lookitry</span>
      </p>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default async function TryOnPage({ params }: PageProps) {
  const data = await getBrandConfig(params.brandSlug);

  // Si no existe la marca, mostrar página de suspensión genérica
  if (!data) {
    return <PaginaSuspendida />;
  }

  const brand = data.brand;

  // Si la landing está suspendida (fue activada y luego suspendida), mostrar página de suspensión
  // Si nunca fue activada (landing_suspended_at es null y has_landing_page es false),
  // mostrar el landing normal con el modal de compra
  if (!brand.has_landing_page && brand.landing_suspended_at) {
    return <PaginaSuspendida brandName={brand.name} />;
  }

  const schema = brandPageSchema({
    name: brand.name,
    slug: brand.slug,
    description: brand.brand_description,
    logo: brand.logo,
    city: brand.city,
    country: brand.country,
    phone: brand.phone
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <MiniLanding brandSlug={params.brandSlug} initialData={data} footerUrl={data.footer_brand_url} />
    </>
  );
}
