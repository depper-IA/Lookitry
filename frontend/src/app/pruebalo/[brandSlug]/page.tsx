import { Metadata } from 'next';
import { MiniLanding } from '@/components/mini-landing/MiniLanding';

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
  const title = `${brand.name} — Probador Virtual`;
  const description = brand.brand_description || `Pruébate los productos de ${brand.name} con inteligencia artificial.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: brand.cover_image_url ? [{ url: brand.cover_image_url }] : brand.logo ? [{ url: brand.logo }] : [],
    },
  };
}

export default async function TryOnPage({ params }: PageProps) {
  const data = await getBrandConfig(params.brandSlug);
  return <MiniLanding brandSlug={params.brandSlug} initialData={data} />;
}
