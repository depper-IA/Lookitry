import dynamic from 'next/dynamic';

const ProbadorVirtualContent = dynamic(
  () => import('@/components/landing/ProbadorVirtualContent'),
  { ssr: false }
);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

export const metadata = {
  title: 'Probador Virtual para tu Tienda Online | Lookitry',
  description: 'Integra el probador virtual con IA en tu tienda. Tus clientes se prueban la ropa desde Instagram, TikTok o WhatsApp en segundos. Sin apps, sin desarrollo.',
  keywords: [
    'probador virtual tienda online',
    'widget probador virtual',
    'integración probador IA',
    'probador ropa instagram',
    'probador virtual whatsapp',
    'try on virtual tienda',
    'plugin probador ropa woocommerce',
    'integrar probador virtual shopify',
  ],
  alternates: { canonical: `${BASE_URL}/probador-virtual` },
};

export default function ProbadorVirtualPage() {
  return <ProbadorVirtualContent />;
}
