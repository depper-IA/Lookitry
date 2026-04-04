'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased bg-[#0a0a0a]">
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
          {/* Background effects */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF5C3A]/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#6366f1]/0.05 blur-[100px] rounded-full" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full relative z-10"
          >
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8">
                  <Image src="/logo.svg" alt="Lookitry" fill className="object-contain" priority />
                </div>
                <span className="font-jakarta text-2xl font-black tracking-tighter text-white">
                  Look<span className="text-[#FF5C3A]">itry</span>
                </span>
              </div>
            </div>

            {/* Error Icon */}
            <div className="w-24 h-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
              <AlertTriangle className="w-10 h-10 text-[#FF5C3A]" strokeWidth={2} />
            </div>

            <div className="space-y-4 mb-12">
              <h1 className="text-4xl font-black tracking-tighter text-white font-jakarta">
                Error <span className="text-[#999] italic font-medium">Crítico</span>
              </h1>
              
              <p className="text-[#999] text-base font-medium max-w-[280px] mx-auto leading-relaxed">
                Lo sentimos, la plataforma ha experimentado un fallo inesperado. Por favor, intenta reiniciar la aplicación.
              </p>
            </div>

            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-3 bg-white text-[#0a0a0a] font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95 shadow-xl shadow-white/5"
            >
              <RefreshCw className="w-4 h-4" />
              Reiniciar Aplicación
            </button>

            {error.digest && (
              <p className="mt-12 text-[9px] font-mono text-[#bbb] uppercase tracking-widest opacity-40">
                Digest ID: {error.digest}
              </p>
            )}
          </motion.div>
        </div>
      </body>
    </html>
  );
}
