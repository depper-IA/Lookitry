import { TryOnWidget } from '@/components/tryon/TryOnWidget';

interface PageProps {
  params: {
    brandSlug: string;
  };
}

export default function TryOnPage({ params }: PageProps) {
  return <TryOnWidget brandSlug={params.brandSlug} />;
}
