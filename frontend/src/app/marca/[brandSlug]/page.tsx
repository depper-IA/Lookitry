'use client';

import { TryOnWidget } from '@/components/tryon/TryOnWidget';

interface MarcaPageProps {
  params: {
    brandSlug: string;
  };
}

export default function MarcaPage({ params }: MarcaPageProps) {
  return (
    <div className="w-full min-h-screen overflow-auto">
      <TryOnWidget brandSlug={params.brandSlug} />
    </div>
  );
}
