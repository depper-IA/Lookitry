'use client';

import React from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowRight, Zap, Crown, Gift, Infinity as UnlimitedIcon, Palette, Smartphone } from 'lucide-react';

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden="true" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        {/* Premium glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-48 w-80 bg-gradient-to-b from-[#FF5C3A]/30 to-transparent blur-[100px]" aria-hidden="true" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="relative px-8 pt-10 pb-8 text-center">
          {/* Icon */}
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5C3A]/30 to-[#FF5C3A]/5 border border-[#FF5C3A]/30">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF5C3A]/20 to-transparent animate-pulse" />
            <Crown size={40} className="text-[#FF5C3A]" />
          </div>

          {/* Title */}
          <h2 id="upgrade-modal-title" className="mb-4 font-jakarta text-3xl font-black text-white tracking-tight">
            ¡Lleva tu tienda al{' '}
            <span className="text-[#FF5C3A]">
              siguiente nivel!
            </span>
          </h2>

          {/* Description */}
          <p className="mb-8 font-dm-sans text-base leading-relaxed text-white/60">
            Has experimentado el poder del probador virtual con IA.{' '}
            <span className="font-semibold text-white">Imagina esto en tu propia tienda</span> — con tu catálogo, tu marca y clientes reales.
          </p>

          {/* Features preview */}
          <div className="mb-8 grid grid-cols-3 gap-3">
            {[
              { icon: UnlimitedIcon, label: 'Pruebas reales en tu tienda' },
              { icon: Palette, label: 'Tu catálogo completo' },
              { icon: Smartphone, label: 'Widget integrable' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[3%] p-3">
                <Icon size={24} className="mx-auto mb-2 text-[#FF5C3A]" />
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/50">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA Principal - Trial Plan */}
          <Link
            href="/planes?trial=true"
            onClick={onClose}
            className="group relative mb-4 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#FF5C3A] px-8 py-5 font-bold text-white shadow-2xl shadow-[#FF5C3A]/30 transition-all hover:scale-[1.02] hover:bg-[#e64d2e] hover:shadow-[#FF5C3A]/40 active:scale-[0.98]"
          >
            <Gift size={22} />
            <span className="text-lg">Comenzar con Plan Trial</span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Secondary - Otros Planes */}
          <Link
            href="/planes"
            onClick={onClose}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[3%] px-6 py-3 font-medium text-white/70 transition-all hover:border-white/30 hover:bg-white/[6%] hover:text-white"
          >
            <Zap size={16} className="text-[#FF5C3A]" />
            <span>Ver todos los planes y precios</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Small print */}
          <p className="mt-6 text-xs text-white/30">
            Desde $180.000 COP/mes · Sin compromiso · Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  );
}
