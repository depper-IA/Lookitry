'use client';

import React from 'react';
import Link from 'next/link';
import { Spinner } from '@/components/ui/Spinner';
import type { Brand } from '@/types';

interface DomainTabProps {
  customDomain: string;
  setCustomDomain: (v: string) => void;
  brand: Brand | null;
  saving: boolean;
  handleSave: () => void;
  FRONTEND_URL: string;
}

export function DomainTab({
  customDomain,
  setCustomDomain,
  brand,
  saving,
  handleSave,
  FRONTEND_URL,
}: DomainTabProps) {
  const isPro = brand?.plan === 'PRO';

  return (
    <div className="space-y-6">
      <div
        className="p-6 rounded-2xl border space-y-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FF5C3A]/10 text-[#FF5C3A]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Dominio Personalizado</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Usa tu propio dominio para tu mini-landing</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Tu dominio (ej: tienda.tumarca.com)
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="tienda.tumarca.com"
              disabled={!isPro}
              className="flex-1 px-4 py-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{ 
                borderColor: 'var(--border-color)', 
                color: 'var(--text-primary)',
                boxShadow: 'none'
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving || !isPro}
              className="px-6 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#FF5C3A]/20"
              style={{ backgroundColor: '#FF5C3A' }}
            >
              {saving ? (
                <div className="flex items-center gap-2"><Spinner size="sm" /><span>Guardando...</span></div>
              ) : 'Guardar Dominio'}
            </button>
          </div>
          {!isPro && (
            <div className="p-4 rounded-xl border border-[#FF5C3A20] bg-[#FF5C3A08] flex items-center gap-3">
              <svg className="w-5 h-5 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Función Exclusiva PRO</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Personaliza tu marca al máximo con dominios propios. 
                  <Link href="/dashboard/planes" className="underline ml-1 font-bold text-[#FF5C3A]">Actualizar ahora</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {isPro && (
          <div className="p-5 rounded-xl border bg-black/5" style={{ borderColor: 'var(--border-color)' }}>
            <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Configuración de DNS</h4>
            <div className="space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Agrega un registro **CNAME** en tu proveedor de dominio:
              </p>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-lg bg-black/5 border" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Nombre / Host</span>
                  <code className="text-sm text-[#FF5C3A]">@</code> o <code className="text-sm text-[#FF5C3A]">landing</code>
                </div>
                <div className="p-3 rounded-lg bg-black/5 border" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Valor / Destino</span>
                  <code className="text-sm text-[#FF5C3A]">{FRONTEND_URL.replace('https://', '')}</code>
                </div>
              </div>
              <p className="text-[10px] italic pt-2" style={{ color: 'var(--text-muted)' }}>
                * Los cambios pueden tardar unas horas en propagarse.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
