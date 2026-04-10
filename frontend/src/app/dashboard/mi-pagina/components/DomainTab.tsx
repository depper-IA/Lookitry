'use client';

import React from 'react';
import Link from 'next/link';
import { Spinner } from '@/components/ui/Spinner';
import type { Brand } from '@/types';
import { Globe, Zap, Info } from 'lucide-react';

interface DomainTabProps {
  customDomain: string;
  setCustomDomain: (v: string) => void;
  brand: Brand | null;
  saving: boolean;
  handleSave: () => void;
  FRONTEND_URL: string;
}

export function DomainTab({ customDomain, setCustomDomain, brand, saving, handleSave, FRONTEND_URL }: DomainTabProps) {
  const isPro = brand?.plan === 'PRO';

  return (
    <div className="space-y-6">

      {/* Card principal */}
      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xl shadow-black/5">
        <div className="px-8 py-6 border-b border-[var(--border-color)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center shrink-0 shadow-inner">
            <Globe className="w-6 h-6 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Dominio personalizado</h3>
            <p className="text-[11px] font-medium text-[var(--text-secondary)] opacity-60">Usa tu propio dominio para tu mini-landing</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] opacity-80">
              Tu dominio
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                placeholder="tienda.tumarca.com"
                disabled={!isPro}
                className="flex-1 px-5 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm font-semibold text-[var(--text-primary)] focus:border-[#FF5C3A] outline-none transition-all disabled:opacity-40 shadow-sm"
              />
              <button
                onClick={handleSave}
                disabled={saving || !isPro}
                className="px-8 py-3.5 rounded-xl bg-[#FF5C3A] text-white text-sm font-bold transition-all disabled:opacity-40 hover:brightness-110 active:scale-95 shadow-lg shadow-[#FF5C3A]/20"
              >
                {saving ? <Spinner size="sm" /> : 'Guardar dominio'}
              </button>
            </div>
          </div>

          {!isPro && (
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FF5C3A]/5 border border-[#FF5C3A]/10">
              <Zap className="w-5 h-5 text-[#FF5C3A] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Función exclusiva del plan pro</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-80 leading-relaxed">
                  Personaliza tu marca al máximo con dominios propios. <Link href="/dashboard/subscription" className="font-bold underline text-[#FF5C3A] hover:opacity-80 transition-opacity">Mejorar ahora</Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instrucciones DNS — solo PRO */}
      {isPro && (
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xl shadow-black/5">
          <div className="px-8 py-6 border-b border-[var(--border-color)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Configuración de DNS</h3>
          </div>
          <div className="p-8 space-y-6">
            <p className="text-sm font-medium text-[var(--text-secondary)] opacity-80">
              Agrega un registro <span className="font-bold text-[var(--text-primary)] uppercase">CNAME</span> en tu proveedor de dominio con los siguientes valores:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] shadow-inner">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Nombre / Host</p>
                <code className="text-sm font-mono font-bold text-[#FF5C3A]">@</code>
                <span className="text-xs mx-2 text-[var(--text-muted)]">o</span>
                <code className="text-sm font-mono font-bold text-[#FF5C3A]">landing</code>
              </div>
              <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] shadow-inner">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Valor / Destino</p>
                <code className="text-sm font-mono font-bold text-[#FF5C3A]">{FRONTEND_URL.replace('https://', '')}</code>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-4">
               <Info size={14} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
               <p className="text-[10px] font-medium text-[var(--text-muted)] leading-relaxed">
                 Los cambios de DNS pueden tardar hasta 48 horas en propagarse por completo a nivel global.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
