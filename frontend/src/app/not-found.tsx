import Link from 'next/link';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col selection:bg-[#FF5C3A]/30">
      <LandingNav />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden py-20">
        {/* Decoración de fondo sutil */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-20 blur-[100px]"
          style={{ 
            background: 'radial-gradient(circle, #FF5C3A 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Icono visual */}
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#141414] border border-[#2a2a2a] text-[#FF5C3A] shadow-xl shadow-black/20">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <p className="text-[#FF5C3A] text-xs font-bold tracking-[0.2em] uppercase mb-4">
            Error 404
          </p>
          
          <h1 className="font-syne text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Página no <span className="text-[#FF5C3A]">encontrada</span>
          </h1>
          
          <p className="text-[#999] text-base md:text-lg max-w-md mx-auto mb-12 font-light leading-relaxed">
            Parece que te has perdido en el probador. La página que buscas no existe o fue movida.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto text-sm font-semibold bg-[#FF5C3A] hover:bg-[#e84d2c] text-white px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-[#FF5C3A]/20"
            >
              Volver al inicio
            </Link>
            <Link
              href="/planes"
              className="w-full sm:w-auto text-sm font-semibold border border-[#2a2a2a] hover:border-[#444] text-[#bbb] hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              Ver planes de IA
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

