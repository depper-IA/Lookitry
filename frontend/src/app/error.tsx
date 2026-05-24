'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
      {/* Background radial effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF5C3A]/[0.05] blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#6366f1]/[0.05] blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Brand Header */}
        <div className="flex justify-center mb-16">
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/logo.svg" alt="Lookitry" fill sizes="32px" className="object-contain" priority />
            </div>
            <span className="font-jakarta text-2xl font-black tracking-tighter text-white">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </div>
        </div>

        {/* Error Icon with Glassmorphism */}
        <div className="relative w-24 h-24 mx-auto mb-10">
          <div className="absolute inset-0 bg-[#FF5C3A]/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-[#FF5C3A]" strokeWidth={2.5} />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-black tracking-tighter text-white font-jakarta">
            Ups, algo salió <span className="text-[#FF5C3A] italic font-medium">mal</span>
          </h1>
          <p className="text-[#999] text-base font-medium max-w-[280px] mx-auto leading-relaxed">
            Ha ocurrido un error inesperado en la conexión. Por favor, intenta recargar la página.
          </p>
          {error.digest && (
            <p className="text-[10px] text-[#bbb] font-mono tracking-wider opacity-60 mt-4 uppercase">
              ID Error: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#0a0a0a] font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95 shadow-xl shadow-white/5 group"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Reintentar ahora
          </button>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-[#bbb] hover:text-white font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95"
          >
            <Home className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>

        {/* Help Link */}
        <p className="mt-12 text-[10px] text-[#bbb] font-bold uppercase tracking-widest">
          ¿El problema persiste?{' '}
          <a href="mailto:soporte@lookitry.com" className="text-[#FF5C3A] hover:underline">
            Contactar soporte
          </a>
        </p>
      </motion.div>
    </div>

  );
}
