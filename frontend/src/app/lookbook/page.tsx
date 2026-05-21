import LookBookShowcase from '@/components/lookbook/LookBookShowcase';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'LookBook AI — Generador de Fotografia de Moda con IA | Lookitry',
  description: 'Crea fotografias de moda profesionales con IA. Transforma cualquier prenda en imagenes de revista en segundos. Olvida el costoso estudio fotografico.',
};

export default function LookBookPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <LandingNav transparent={true} />
      <main>
        <LookBookShowcase />
      </main>
      <LandingFooter />
    </div>
  );
}