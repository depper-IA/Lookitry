'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function MaintenancePage() {
  const [message, setMessage] = useState('Estamos realizando mejoras en nuestra plataforma. Volveremos pronto.');

  useEffect(() => {
    // Intentar cargar el mensaje real desde el servidor
    const fetchSettings = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
        const res = await fetch(`${apiUrl}/api/payment-settings/public`);
        if (res.ok) {
          const data = await res.json();
          if (data.maintenanceMessage) {
            setMessage(data.maintenanceMessage);
          }
          // Si el mantenimiento se desactivó, redirigir a la home
          if (!data.maintenanceMode) {
            window.location.href = '/';
          }
        }
      } catch (error) {
        console.error('Error fetching maintenance status:', error);
      }
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 overflow-hidden">
      {/* Glow decorativo sutil */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none opacity-10 blur-[120px]"
        style={{ 
          background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
          top: '-10%',
          right: '-10%',
        }}
        aria-hidden="true"
      />
      <div 
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none opacity-10 blur-[120px]"
        style={{ 
          background: 'radial-gradient(circle, #FF5C3A 0%, transparent 70%)',
          bottom: '-10%',
          left: '-10%',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-xl w-full space-y-12 relative z-10"
      >
        {/* Logo con branding exacto */}
        <div className="flex justify-center mb-16">
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative h-10 w-10">
              <Image src="/logo.svg" alt="Lookitry" fill className="object-contain" priority />
            </div>
            <span className="font-jakarta text-3xl font-black tracking-tighter text-[#0a0a0a] dark:text-white">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </div>
        </div>

        {/* Indicator de estado premium */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse shadow-[0_0_10px_rgba(255,92,58,0.5)]" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#FF5C3A]">
              Mantenimiento Programado
            </span>
          </div>
        </div>

        {/* Content con tipografía Syne/Jakarta */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-neutral-900 dark:text-white font-jakarta leading-[0.95]">
            Mejorando la <span className="text-[#999] dark:text-[#bbb] italic">Experiencia</span>
          </h1>
          <p className="text-[#999] text-base md:text-lg leading-relaxed max-w-sm mx-auto font-medium">
            {message}
          </p>
        </div>

        {/* Divider sutil con gradiente */}
        <div className="pt-12">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-200 dark:via-white/10 to-transparent" />
        </div>

        {/* Footer legal brandeado */}
        <div className="pt-8">
          <p className="text-[10px] text-[#999] uppercase tracking-[0.25em] font-bold">
            © {new Date().getFullYear()} Lookitry · Luxury Try-On AI
          </p>
          <p className="mt-2 text-[9px] text-[#bbb] uppercase tracking-widest font-medium opacity-50">
            Una division de Wilkie Devs SAS
          </p>
        </div>
      </motion.div>
    </div>
  );
}

