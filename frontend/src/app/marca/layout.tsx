import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Probador Virtual',
  description: 'Prueba productos virtualmente',
};

export default function MarcaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
