import dynamic from 'next/dynamic';

const ProbadorVirtualContent = dynamic(
  () => import('@/components/landing/ProbadorVirtualContent'),
  { ssr: false }
);

export const metadata = {
  title: 'Probador Virtual IA — Lookitry',
  description: 'Experimenta el futuro del retail con nuestro probador virtual potenciado por IA generativa.',
};

export default function ProbadorVirtualPage() {
  return <ProbadorVirtualContent />;
}
