import Link from 'next/link';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col selection:bg-[#FF5C3A]/30 transition-colors duration-300">
      <LandingNav />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden pt-40 pb-32 md:pt-48 md:pb-40">
        {/* Decoración de fondo sutil */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.08] dark:opacity-20 blur-[120px]"
          style={{ 
            background: 'radial-gradient(circle, #FF5C3A 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          {/* Icono visual con efecto glassmorphism sutil */}
          <div className="mb-10 inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#2a2a2a] text-[#FF5C3A] shadow-2xl shadow-black/5 dark:shadow-black/40 transition-all duration-300 hover:scale-105">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[#FF5C3A] text-sm font-black tracking-[0.3em] uppercase mb-4">
                Error 404
              </p>
              
              <h1 className="font-jakarta text-4xl sm:text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter leading-[0.95] mb-8">
                Página no <span className="text-[#FF5C3A]">encontrada</span>
              </h1>
            </div>
            
            <p className="text-[#999] dark:text-[#999] text-base md:text-xl max-w-md mx-auto mb-16 font-medium leading-relaxed">
              Parece que te has perdido en el probador. La página que buscas no existe o fue movida.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link
                href="/"
                className="w-full sm:w-auto text-xs font-black uppercase tracking-widest bg-[#FF5C3A] hover:bg-[#e84d2c] text-white px-10 py-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95 shadow-xl shadow-[#FF5C3A]/25"
              >
                Volver al inicio
              </Link>
              <Link
                href="/planes"
                className="w-full sm:w-auto text-xs font-black uppercase tracking-widest border border-neutral-200 dark:border-[#2a2a2a] hover:border-neutral-900 dark:hover:border-[#444] text-[#888] dark:text-[#bbb] hover:text-neutral-900 dark:hover:text-white px-10 py-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95 hover:bg-neutral-50 dark:hover:bg-[#1a1a1a]"
              >
                Ver planes de IA
              </Link>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}


