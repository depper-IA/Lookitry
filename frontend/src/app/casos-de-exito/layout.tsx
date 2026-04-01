import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Casos de Éxito — Lookitry',
  description: 'Historias de marcas que venden más con el probador virtual de Lookitry.',
};

export default function CasosExitoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
