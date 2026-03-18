import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <LandingNav />
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[#FF5C3A] text-sm font-medium tracking-widest uppercase mb-4">
          Error 404
        </p>
        <h1 className="font-syne text-4xl md:text-5xl font-bold text-white mb-4">
          Página no encontrada
        </h1>
        <p className="text-[#999] text-base max-w-md mb-10">
          La página que buscas no existe o fue movida. Puedes volver al inicio o revisar nuestros planes.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium bg-[#FF5C3A] hover:bg-[#e84d2c] text-white px-5 py-2.5 rounded-md transition-colors"
          >
            Ir al inicio
          </Link>
          <Link
            href="/planes"
            className="text-sm font-medium border border-[#2a2a2a] hover:border-[#444] text-[#bbb] hover:text-white px-5 py-2.5 rounded-md transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
