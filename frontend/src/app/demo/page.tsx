import dynamic from 'next/dynamic';

const DemoPageClient = dynamic(() => import('./DemoPageClient'), { ssr: false });

export const metadata = {
  title: 'Probador Virtual Gratis — Lookitry',
  description: 'Probate ropa con inteligencia artificial antes de comprar. Subí tu foto, elegí una prenda y la IA te muestra el resultado en 30 segundos. Gratis.',
};

export default function DemoPage() {
  return <DemoPageClient />;
}
