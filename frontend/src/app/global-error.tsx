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
    <html lang="es">
      <body className="antialiased">
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
          {/* Background effects */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF5C3A]/5 blur-[100px] rounded-full" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full"
          >
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8">
                  <Image src="/logo.svg" alt="Lookitry" fill className="object-contain" priority />
                </div>
                <span className="font-jakarta text-2xl font-black tracking-tighter text-[#0a0a0a] dark:text-white">
                  Look<span className="text-[#FF5C3A]">itry</span>
                </span>
              </div>
            </div>

            {/* Error Icon */}
            <div className="w-20 h-20 bg-[#FF5C3A]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertTriangle className="w-10 h-10 text-[#FF5C3A]" />
            </div>

            <h1 className="text-3xl font-black tracking-tighter text-[#0a0a0a] dark:text-white font-jakarta mb-4">
              Error Crítico de Sistema
            </h1>
            
            <p className="text-[#999] text-base font-medium mb-10 max-w-[300px] mx-auto">
              Lo sentimos, la plataforma ha experimentado un fallo inesperado. Por favor, intenta reiniciar la aplicación.
            </p>

            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-3 bg-[#FF5C3A] text-white font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-[#FF5C3A]/20"
            >
              <RefreshCw className="w-4 h-4" />
              Reiniciar Aplicación
            </button>

            {error.digest && (
              <p className="mt-8 text-[9px] font-mono text-[#bbb] uppercase tracking-widest opacity-50">
                Digest: {error.digest}
              </p>
            )}
          </motion.div>
        </div>
      </body>
    </html>
  );
}
