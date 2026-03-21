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

export function DomainTab({ customDomain, setCustomDomain, brand, saving, handleSave, FRONTEND_URL }: DomainTabProps) {
  const isPro = brand?.plan === 'PRO';

  return (
    <div className="space-y-4">

      {/* Card principal */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="px-5 py-3.5 border-b flex items-center gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}>
            <svg className="w-4 h-4 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Dominio personalizado</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Usa tu propio dominio para tu mini-landing</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Tu dominio
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                placeholder="tienda.tumarca.com"
                disabled={!isPro}
                className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#FF5C3A40] disabled:opacity-40"
                style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleSave}
                disabled={saving || !isPro}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 hover:brightness-110 active:scale-95 cursor-pointer"
                style={{ backgroundColor: '#FF5C3A' }}
              >
                {saving ? <Spinner size="sm" /> : 'Guardar'}
              </button>
            </div>
          </div>

          {!isPro && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl border"
              style={{ backgroundColor: 'rgba(255,92,58,0.05)', borderColor: 'rgba(255,92,58,0.15)' }}
            >
              <svg className="w-4 h-4 text-[#FF5C3A] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Función exclusiva del plan PRO</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Personaliza tu marca al máximo con dominios propios.{' '}
                  <Link href="/dashboard/planes" className="font-semibold underline text-[#FF5C3A] cursor-pointer">
                    Actualizar ahora
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instrucciones DNS — solo PRO */}
      {isPro && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Configuración de DNS</p>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Agrega un registro <strong style={{ color: 'var(--text-primary)' }}>CNAME</strong> en tu proveedor de dominio con los siguientes valores:
            </p>
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre / Host</p>
                <code className="text-sm font-mono text-[#FF5C3A]">@</code>
                <span className="text-xs mx-2" style={{ color: 'var(--text-secondary)' }}>o</span>
                <code className="text-sm font-mono text-[#FF5C3A]">landing</code>
              </div>
              <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Valor / Destino</p>
                <code className="text-sm font-mono text-[#FF5C3A]">{FRONTEND_URL.replace('https://', '')}</code>
              </div>
            </div>
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
              Los cambios de DNS pueden tardar hasta 48 horas en propagarse.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
