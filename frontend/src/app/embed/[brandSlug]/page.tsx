'use client';

import { useSearchParams } from 'next/navigation';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';

interface EmbedPageProps {
  params: {
    brandSlug: string;
  };
}

export default function EmbedPage({ params }: EmbedPageProps) {
  const searchParams = useSearchParams();
  const externalId = searchParams.get('external_id');
  const isEmbed = searchParams.get('is_embed') !== 'false'; // Por defecto true en esta ruta
  const productId = searchParams.get('product_id'); // ID interno como fallback

  return (
    <div className="w-full min-h-screen bg-transparent overflow-hidden">
      <TryOnWidget 
        brandSlug={params.brandSlug} 
        isEmbed={isEmbed} 
        externalId={externalId}
        initialProductId={productId}
      />
    </div>
  );
}
