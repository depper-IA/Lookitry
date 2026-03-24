'use client';

import { TryOnWidget } from '@/components/tryon/TryOnWidget';

interface EmbedPageProps {
  params: {
    brandSlug: string;
  };
}

export default function EmbedPage({ params }: EmbedPageProps) {
  return (
    <div className="w-full min-h-screen bg-transparent overflow-hidden">
      <TryOnWidget brandSlug={params.brandSlug} isEmbed={true} />
    </div>
  );
}
