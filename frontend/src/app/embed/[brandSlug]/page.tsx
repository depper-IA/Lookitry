'use client';

import { useSearchParams } from 'next/navigation';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import '@/app/globals.css';

interface EmbedPageProps {
  params: {
    brandSlug: string;
  };
}

export default function EmbedPage({ params }: EmbedPageProps) {
  const searchParams = useSearchParams();
  const externalId = searchParams.get('external_id');
  const isEmbed = searchParams.get('is_embed') !== 'false';
  const productId = searchParams.get('product_id');
  const pluginView = searchParams.get('plugin_view') === '1';

  return (
    <div 
      id="tryon-embed-root" 
      className="w-full min-h-screen"
      style={{ 
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0
      }}
    >
      <TryOnWidget 
        brandSlug={params.brandSlug}
        isEmbed={isEmbed}
        externalId={externalId}
        initialProductId={productId}
        pluginView={pluginView}
        lockProductSelection={pluginView}
      />
    </div>
  );
}
