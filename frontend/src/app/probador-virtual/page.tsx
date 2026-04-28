import dynamic from 'next/dynamic';

const ProbadorVirtualContent = dynamic(
  () => import('@/components/landing/ProbadorVirtualContent'),
  { ssr: false }
);

export const metadata = {
  title: 'Probador Virtual Embed — Integración IA | Lookitry',
  description: 'Integración del probador virtual de IA en Instagram, TikTok, WhatsApp y cualquier tienda online. Activa en menos de 3 minutos. Sin开发, sin fricción.',
  keywords: ['probador virtual', 'embed IA', 'integración ecommerce', 'widget try-on', 'instagram shopping', 'tiktok shop', 'whatsapp negocio'],
};

export default function ProbadorVirtualPage() {
  return <ProbadorVirtualContent />;
}
