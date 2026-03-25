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
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full space-y-8"
      >
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <div className="relative w-32 h-12">
            <Image 
              src="/logo.svg" 
              alt="Lookitry" 
              fill 
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#FF5C3A]">
              Mantenimiento Programado
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-light tracking-tight text-zinc-900 sm:text-4xl">
            Mejorando la <span className="font-medium">Experiencia</span>
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        {/* Minimal Illustration / Decorative element */}
        <div className="pt-8 opacity-20">
          <svg className="w-full h-1" viewBox="0 0 400 2">
            <line x1="0" y1="1" x2="400" y2="1" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Footer */}
        <div className="pt-8">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
            © {new Date().getFullYear()} Lookitry — Luxury Try-On AI
          </p>
        </div>
      </motion.div>

      {/* Background Decorative Gradient (Subtle) */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
