import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mini-Landing Pro | Tu vitrina profesional en segundos | Lookitry',
  description: 'Obtén un enlace único con tu catálogo, Probador Virtual con IA y botón de WhatsApp. La solución definitiva para vender por Instagram y TikTok sin saber de código.',
};

export default function MiniLandingProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
