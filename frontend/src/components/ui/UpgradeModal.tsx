'use client';

import React from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowRight, Zap } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-64 bg-[#FF5C3A]/20 blur-[80px]" aria-hidden="true" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="relative p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5C3A]/20 to-[#FF5C3A]/5 border border-[#FF5C3A]/20">
            <Sparkles size={36} className="text-[#FF5C3A]" />
          </div>

          {/* Title */}
          <h2 id="upgrade-modal-title" className="mb-3 font-jakarta text-2xl font-black text-white tracking-tight">
            ¡Ya usaste tu prueba gratis!
          </h2>

          {/* Description */}
          <p className="mb-8 font-dm-sans text-base leading-relaxed text-white/70">
            Has descubierto cómo funciona el probador virtual con IA. Ahora{' '}
            <span className="font-bold text-white">úsalo sin límites</span> en tu propia tienda con cualquiera de nuestros planes.
          </p>

          {/* Features preview */}
          <div className="mb-8 grid grid-cols-3 gap-3">
            {[
              { icon: '⚡', label: 'Pruebas ilimitadas' },
              { icon: '🎨', label: 'Tu catálogo completo' },
              { icon: '📱', label: 'Widget integrable' },
            ].map((feature, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[3%] p-3">
                <span className="mb-1 block text-xl">{feature.icon}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/50">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            href="/planes"
            onClick={onClose}
            className="group flex items-center justify-center gap-3 w-full rounded-2xl bg-[#FF5C3A] px-8 py-4 font-bold text-white shadow-xl shadow-[#FF5C3A]/20 transition-all hover:scale-[1.02] hover:bg-[#ff6c4d] active:scale-[0.98]"
          >
            <Zap size={20} />
            Ver Planes y Precios
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Small print */}
          <p className="mt-4 text-xs text-white/30">
            Desde $180.000 COP/mes · Sin compromiso · Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  );
}