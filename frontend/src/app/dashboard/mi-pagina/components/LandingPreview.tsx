'use client';

import React from 'react';
import { ExternalLinkIcon } from './Icons';

interface LandingPreviewProps {
  landingTemplate: 'classic' | 'editorial' | 'moderno';
  setLandingTemplate: (t: 'classic' | 'editorial' | 'moderno') => void;
  primaryColor: string;
  headerColor: string;
  brandLogo: string | null;
  coverImageUrl: string | null;
  coverOverlayOpacity: number;
  pageUrl: string;
  coverBgColor: string;
}

export function LandingPreview({
  landingTemplate,
  setLandingTemplate,
  primaryColor,
  headerColor,
  brandLogo,
  coverImageUrl,
  coverOverlayOpacity,
  pageUrl,
  coverBgColor,
}: LandingPreviewProps) {
  return (
    <div className="space-y-6">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
        Vista previa del diseño
      </p>

      {/* Preview Classic */}
      <button
        type="button"
        onClick={() => setLandingTemplate('classic')}
        className="w-full text-left rounded-2xl overflow-hidden border-2 transition-all"
        style={{
          borderColor: landingTemplate === 'classic' ? primaryColor : 'var(--border-color)',
          boxShadow: landingTemplate === 'classic' ? `0 0 0 3px ${primaryColor}22` : 'none',
        }}
      >
          <div className="h-4 bg-white/80 border-b flex items-center px-2 justify-between" style={{ backgroundColor: headerColor ? `${headerColor}cc` : 'rgba(255,255,255,0.8)', borderColor: 'rgba(0,0,0,0.05)' }}>
            <div className="w-8 h-1.5 rounded-full bg-black/10" />
            <div className="w-3 h-3 rounded-full bg-black/5" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-1 relative overflow-hidden" style={{ background: coverImageUrl ? `url(${coverImageUrl}) center/cover no-repeat` : (coverBgColor || `#FAFAF9`), height: 80 }}>
            {coverImageUrl && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${coverOverlayOpacity})` }} />}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {brandLogo
                ? <img src={brandLogo} alt="" className="h-6 object-contain" />
                : <div className="w-12 h-2 rounded-full bg-black/20" />}
              <div className="w-16 h-1.5 rounded-full bg-black/10 mt-0.5" />
            </div>
          </div>
          <div className="flex gap-1.5 px-3 py-2 bg-gray-50">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex-1 bg-white rounded-md p-1.5 border border-gray-100 flex flex-col items-center gap-0.5" style={{ borderColor: 'var(--border-color)' }}>
                <div className="w-3 h-3 rounded-full text-white text-[6px] flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor }}>{n}</div>
                <div className="w-8 h-1 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 px-3 pb-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-md bg-gray-100 border border-gray-200" style={{ borderColor: 'var(--border-color)' }} />
            ))}
          </div>
          {landingTemplate === 'classic' && (
            <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm" style={{ backgroundColor: primaryColor }}>Activo</span>
            </div>
          )}
        <div className="px-3 py-2.5" style={{ backgroundColor: 'var(--bg-card)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Clásico</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Hero · Pasos · Catálogo · Probador</p>
        </div>
      </button>

      {/* Preview Editorial */}
      <button
        type="button"
        onClick={() => setLandingTemplate('editorial')}
        className="w-full text-left rounded-2xl overflow-hidden border-2 transition-all"
        style={{
          borderColor: landingTemplate === 'editorial' ? primaryColor : 'var(--border-color)',
          boxShadow: landingTemplate === 'editorial' ? `0 0 0 3px ${primaryColor}22` : 'none',
        }}
      >
        <div className="relative overflow-hidden" style={{ height: 200, background: coverBgColor || '#f7f5f2' }}>
          <div className="h-6 flex items-center px-2 justify-between border-b backdrop-blur-sm" style={{ backgroundColor: headerColor ? `${headerColor}cc` : 'rgba(255,255,255,0.9)', borderColor: 'rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-1">
              {brandLogo
                ? <img src={brandLogo} alt="" className="h-3 w-3 rounded object-cover" />
                : <div className="w-3 h-3 rounded bg-gray-900" />}
              <div className="w-10 h-1 rounded-full bg-gray-800" />
            </div>
            <div className="flex gap-0.5">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-black/5" />)}
            </div>
          </div>
          <div className="h-16 flex items-end px-2 pb-1.5 relative overflow-hidden" style={{ background: coverImageUrl ? `url(${coverImageUrl}) center/cover no-repeat` : 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}>
            {coverImageUrl && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${coverOverlayOpacity})` }} />}
            <div className="relative z-10 space-y-0.5">
              <div className="w-8 h-1 rounded-full bg-white/40" />
              <div className="w-16 h-2 rounded-full bg-white/90" />
            </div>
          </div>
          <div className="h-6 bg-white border-b border-gray-100 flex items-center gap-3 px-2">
            {['3 prod.', '4.8 ★', 'IA'].map(s => (
              <span key={s} className="text-[7px] text-gray-500 font-medium">{s}</span>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_80px] gap-1.5 px-2 pt-2">
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className={`aspect-square rounded bg-gray-200 border ${i === 0 ? 'border-[#FF5C3A]' : 'border-gray-200'}`} style={{ borderColor: i === 0 ? primaryColor : 'var(--border-color)' }} />
              ))}
            </div>
            <div className="bg-white rounded border border-gray-200 flex flex-col">
              <div className="h-4 rounded-t" style={{ backgroundColor: '#0a0a0a' }} />
              <div className="flex-1 p-1 space-y-1">
                <div className="w-full h-1 rounded-full bg-gray-100" />
                <div className="w-3/4 h-1 rounded-full bg-gray-100" />
              </div>
            </div>
          </div>
          {landingTemplate === 'editorial' && (
            <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm" style={{ backgroundColor: primaryColor }}>Activo</span>
            </div>
          )}
        </div>
        <div className="px-3 py-2.5" style={{ backgroundColor: 'var(--bg-card)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Editorial</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Header sticky · 2 columnas · Panel probador</p>
        </div>
      </button>

      {/* Preview Moderno */}
      <button
        type="button"
        onClick={() => setLandingTemplate('moderno')}
        className="w-full text-left rounded-2xl overflow-hidden border-2 transition-all"
        style={{
          borderColor: landingTemplate === 'moderno' ? primaryColor : 'var(--border-color)',
          boxShadow: landingTemplate === 'moderno' ? `0 0 0 3px ${primaryColor}22` : 'none',
        }}
      >
        <div className="relative overflow-hidden" style={{ height: 200, backgroundColor: coverBgColor || '#0f0f0f' }}>
          {coverImageUrl && <img src={coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 1 - coverOverlayOpacity }} />}
          <div className="relative z-10">
            <div className="h-9 flex items-center px-2 justify-between border-b border-white/10 backdrop-blur-xl" style={{ backgroundColor: headerColor ? `${headerColor}99` : 'rgba(15,15,15,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                  <div className="w-1.5 h-1.5 rounded-sm bg-white/80" />
                </div>
                <div className="w-12 h-1 rounded-full bg-white/60" />
              </div>
              <div className="w-4 h-4 rounded-full bg-white/10" />
            </div>
            <div className="flex flex-col items-center justify-center gap-1.5 py-4 px-3">
              <div className="w-28 h-2.5 rounded-full bg-white/80 mt-0.5" />
              <div className="w-20 h-2 rounded-full mt-0.5" style={{ backgroundColor: primaryColor + 'cc' }} />
            </div>
          </div>
          <div className="grid grid-cols-4 border-t border-b border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
            {['4.9', '847', '12s', '96%'].map(v => (
              <div key={v} className="flex flex-col items-center py-1.5 border-r border-white/10 last:border-r-0">
                <span className="text-[8px] font-bold text-white/80">{v}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 px-2 pt-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-lg border border-white/5" style={{ backgroundColor: '#2a2a2a', borderColor: i === 0 ? primaryColor : 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
          {landingTemplate === 'moderno' && (
            <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm" style={{ backgroundColor: primaryColor }}>Activo</span>
            </div>
          )}
        </div>
        <div className="px-3 py-2.5" style={{ backgroundColor: 'var(--bg-card)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Moderno</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Dark hero · Trust bar · Single col</p>
        </div>
      </button>

      {/* Botón ver página */}
      <a
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
      >
        <ExternalLinkIcon className="w-4 h-4" />
        Ver mi página en vivo
      </a>
    </div>
  );
}
