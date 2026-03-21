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
  mobileOnly?: boolean;
}

type PreviewProps = Omit<LandingPreviewProps, 'landingTemplate' | 'setLandingTemplate' | 'pageUrl' | 'mobileOnly'>;

// ── Template Clásico ──────────────────────────────────────────────────────────
function ClassicPreview({ primaryColor, headerColor, brandLogo, coverImageUrl, coverOverlayOpacity, coverBgColor }: PreviewProps) {
  const hdrBg = headerColor ? `${headerColor}cc` : 'rgba(255,255,255,0.95)';
  return (
    <div className="w-full rounded-xl overflow-hidden border-2" style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}>
      {/* Navbar BLANCA con borde inferior visible */}
      <div className="h-8 flex items-center px-3 justify-between border-b-2 border-gray-200" style={{ backgroundColor: hdrBg }}>
        <div className="flex items-center gap-1.5">
          {brandLogo
            ? <img src={brandLogo} alt="" className="h-4 object-contain" />
            : <div className="w-12 h-2.5 rounded-full bg-gray-300" />}
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => <div key={i} className="w-6 h-1.5 rounded-full bg-gray-300" />)}
        </div>
        <div className="w-14 h-5 rounded-md border border-gray-300" style={{ backgroundColor: primaryColor + '22' }} />
      </div>
      {/* Hero CENTRADO con fondo BEIGE claro */}
      <div
        className="relative flex flex-col items-center justify-center gap-2.5 py-10"
        style={{ background: coverImageUrl ? `url(${coverImageUrl}) center/cover no-repeat` : (coverBgColor || '#f5f2ee'), minHeight: 110 }}
      >
        {coverImageUrl && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${coverOverlayOpacity})` }} />}
        <div className="relative z-10 flex flex-col items-center gap-2.5 px-4">
          {brandLogo
            ? <img src={brandLogo} alt="" className="h-12 object-contain" />
            : <div className="w-28 h-3.5 rounded-full bg-gray-400" />}
          <div className="w-44 h-2.5 rounded-full bg-gray-400" />
          <div className="w-28 h-8 rounded-lg mt-1 shadow-sm" style={{ backgroundColor: primaryColor }} />
        </div>
      </div>
      {/* PASOS NUMERADOS - característica ÚNICA del clásico */}
      <div className="flex gap-2.5 px-4 py-5 bg-white border-t-2 border-gray-100">
        {[1, 2, 3].map(n => (
          <div key={n} className="flex-1 bg-gray-50 rounded-xl p-3 border-2 border-gray-200 flex flex-col items-center gap-2">
            <div className="w-7 h-7 rounded-full text-white text-[10px] flex items-center justify-center font-bold shadow-md" style={{ backgroundColor: primaryColor }}>{n}</div>
            <div className="w-14 h-2 rounded-full bg-gray-300" />
            <div className="w-12 h-1.5 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
      {/* Grid catálogo */}
      <div className="px-4 pb-5 bg-white">
        <div className="w-24 h-2.5 rounded-full bg-gray-500 mb-3" />
        <div className="grid grid-cols-4 gap-2.5">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="aspect-square rounded-lg bg-gray-100 border-2 border-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Template Editorial ────────────────────────────────────────────────────────
function EditorialPreview({ primaryColor, headerColor, brandLogo, coverImageUrl, coverOverlayOpacity, coverBgColor }: PreviewProps) {
  const hdrBg = headerColor ? `${headerColor}ee` : 'rgba(250,250,250,0.98)';
  return (
    <div className="w-full rounded-xl overflow-hidden border-2" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb' }}>
      {/* Header STICKY con SOMBRA FUERTE - característica única */}
      <div className="h-9 flex items-center px-3 justify-between border-b-2 border-gray-200 shadow-lg" style={{ backgroundColor: hdrBg }}>
        <div className="flex items-center gap-2">
          {brandLogo
            ? <img src={brandLogo} alt="" className="h-5 w-5 rounded-md object-cover border border-gray-300" />
            : <div className="w-5 h-5 rounded-md bg-gray-700 border border-gray-600" />}
          <div className="w-20 h-2 rounded-full bg-gray-700" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => <div key={i} className="w-9 h-1.5 rounded-full bg-gray-400" />)}
        </div>
        <div className="w-14 h-6 rounded-lg shadow-sm" style={{ backgroundColor: primaryColor }} />
      </div>
      {/* Hero banner HORIZONTAL con gradiente */}
      <div
        className="h-20 relative overflow-hidden flex items-end px-4 pb-3"
        style={{ background: coverImageUrl ? `url(${coverImageUrl}) center/cover no-repeat` : 'linear-gradient(135deg,#e8e4df 0%,#d4cfc8 100%)' }}
      >
        {coverImageUrl && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${coverOverlayOpacity})` }} />}
        <div className="relative z-10 space-y-1">
          <div className="w-14 h-1.5 rounded-full bg-black/50" />
          <div className="w-32 h-3 rounded-full bg-black/80 font-bold" />
          <div className="w-24 h-2 rounded-full bg-black/60" />
        </div>
      </div>
      {/* Stats bar con fondo blanco */}
      <div className="h-7 bg-white border-b-2 border-gray-200 flex items-center gap-5 px-4 shadow-sm">
        {['4.8 ★', '3 prod.', 'IA activo'].map(s => (
          <span key={s} className="text-[9px] text-gray-700 font-semibold">{s}</span>
        ))}
      </div>
      {/* LAYOUT 2 COLUMNAS - característica ÚNICA del editorial */}
      <div className="grid grid-cols-[1fr_90px] gap-3 px-4 py-3 bg-gray-50">
        <div className="space-y-2">
          <div className="w-20 h-2 rounded-full bg-gray-600" />
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="aspect-square rounded-lg bg-gray-200 border-2 shadow-sm" style={{ borderColor: i === 0 ? primaryColor : '#d1d5db' }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map(i => <div key={i} className="aspect-square rounded-lg bg-gray-100 border border-gray-300" />)}
          </div>
        </div>
        {/* Panel probador lateral GRANDE */}
        <div className="bg-white rounded-xl border-2 border-gray-400 flex flex-col overflow-hidden shadow-md">
          <div className="h-5 flex items-center justify-center bg-gray-900">
            <div className="w-12 h-1 rounded-full bg-white/60" />
          </div>
          <div className="flex-1 p-2 space-y-1.5">
            <div className="w-full h-8 rounded-md bg-gray-100 border border-gray-200" />
            <div className="w-full h-1.5 rounded-full bg-gray-200" />
            <div className="w-4/5 h-1.5 rounded-full bg-gray-200" />
            <div className="w-full h-5 rounded-lg mt-1 shadow-sm" style={{ backgroundColor: primaryColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template Moderno ──────────────────────────────────────────────────────────
function ModernoPreview({ primaryColor, headerColor, brandLogo, coverImageUrl, coverOverlayOpacity, coverBgColor }: PreviewProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/5 relative" style={{ backgroundColor: coverBgColor || '#0a0a0a' }}>
      {coverImageUrl && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 - coverOverlayOpacity }}
        />
      )}
      {/* Header OSCURO */}
      <div
        className="h-9 flex items-center px-3 justify-between border-b border-white/5 relative z-10"
        style={{ backgroundColor: headerColor ? `${headerColor}aa` : 'rgba(10,10,10,0.9)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
            {brandLogo
              ? <img src={brandLogo} alt="" className="w-4 h-4 object-contain rounded" />
              : <div className="w-2 h-2 rounded-sm bg-white/90" />}
          </div>
          <div className="w-16 h-1.5 rounded-full bg-white/70" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => <div key={i} className="w-6 h-1 rounded-full bg-white/15" />)}
        </div>
        <div className="w-5 h-5 rounded-full bg-white/10" />
      </div>
      {/* Hero OSCURO */}
      <div className="flex flex-col items-center justify-center gap-2 py-7 px-4 relative z-10">
        <div className="w-10 h-1 rounded-full bg-white/40" />
        <div className="w-40 h-3.5 rounded-full bg-white/90" />
        <div className="w-28 h-2 rounded-full" style={{ backgroundColor: primaryColor + 'dd' }} />
        <div className="w-24 h-7 rounded-lg mt-1.5" style={{ backgroundColor: primaryColor }} />
      </div>
      {/* TRUST BAR - característica única del moderno */}
      <div className="grid grid-cols-4 border-t border-b border-white/5 relative z-10" style={{ backgroundColor: 'rgba(20,20,20,0.95)' }}>
        {[['4.9', 'Rating'], ['847', 'Pruebas'], ['12s', 'Tiempo'], ['96%', 'Satisf.']].map(([v, l]) => (
          <div key={v} className="flex flex-col items-center py-2.5 border-r border-white/5 last:border-r-0">
            <span className="text-[10px] font-bold text-white/95">{v}</span>
            <span className="text-[7px] text-white/40">{l}</span>
          </div>
        ))}
      </div>
      {/* Grid productos */}
      <div className="grid grid-cols-4 gap-2 px-3 py-3 relative z-10">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="aspect-square rounded-lg border" style={{ backgroundColor: '#1a1a1a', borderColor: i === 0 ? primaryColor : 'rgba(255,255,255,0.04)', borderWidth: i === 0 ? 2 : 1 }} />
        ))}
      </div>
      {/* CTA */}
      <div className="px-3 pb-3 relative z-10">
        <div className="w-full h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
          <div className="w-24 h-1.5 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
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
  mobileOnly = false,
}: LandingPreviewProps) {
  const previewProps: PreviewProps = { primaryColor, headerColor, brandLogo, coverImageUrl, coverOverlayOpacity, coverBgColor };

  const templates = [
    { id: 'classic' as const, name: 'Clásico', desc: 'Hero · Pasos · Catálogo' },
    { id: 'editorial' as const, name: 'Editorial', desc: 'Header sticky · 2 col' },
    { id: 'moderno' as const, name: 'Moderno', desc: 'Dark hero · Trust bar' },
  ];

  return (
    <div className="space-y-4 px-1 pt-1">

      {/* Selector — solo en desktop */}
      {!mobileOnly && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Plantilla
            </p>
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:opacity-80 cursor-pointer"
              style={{ color: '#FF5C3A' }}
            >
              <ExternalLinkIcon className="w-3 h-3" />
              Ver en vivo
            </a>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setLandingTemplate(t.id)}
                className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-all cursor-pointer"
                style={{
                  borderColor: landingTemplate === t.id ? '#FF5C3A' : 'var(--border-color)',
                  backgroundColor: landingTemplate === t.id ? 'rgba(255,92,58,0.06)' : 'var(--bg-card)',
                }}
              >
                <span className="text-xs font-semibold" style={{ color: landingTemplate === t.id ? '#FF5C3A' : 'var(--text-primary)' }}>
                  {t.name}
                </span>
                <span className="text-[9px] leading-tight" style={{ color: 'var(--text-secondary)' }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Preview */}
      <div className="space-y-2">
        {!mobileOnly && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Vista previa
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}>
              {templates.find(t => t.id === landingTemplate)?.name}
            </span>
          </div>
        )}

        <div>
          {landingTemplate === 'classic' && <ClassicPreview {...previewProps} />}
          {landingTemplate === 'editorial' && <EditorialPreview {...previewProps} />}
          {landingTemplate === 'moderno' && <ModernoPreview {...previewProps} />}
        </div>

        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
          Guarda los cambios para verlos en tu página pública
        </p>
      </div>

    </div>
  );
}
