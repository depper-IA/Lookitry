'use client';

import React from 'react';
import { LogoUpload, CoverImageUpload } from './Uploaders';

interface DesignTabProps {
  description: string; setDescription: (v: string) => void;
  slogan: string; setSlogan: (v: string) => void;
  whatsapp: string; setWhatsapp: (v: string) => void;
  whatsappMessage: string; setWhatsappMessage: (v: string) => void;
  ctaButtonText: string; setCtaButtonText: (v: string) => void;
  coverImageUrl: string; setCoverImageUrl: (v: string) => void;
  logoUrl: string; setLogoUrl: (v: string) => void;
  logoLightUrl: string; setLogoLightUrl: (v: string) => void;
  logoDarkUrl: string; setLogoDarkUrl: (v: string) => void;
  coverBgColor: string; setCoverBgColor: (v: string) => void;
  coverOverlayOpacity: number; setCoverOverlayOpacity: (v: number) => void;
  headerColor: string; setHeaderColor: (v: string) => void;
  instagram: string; setInstagram: (v: string) => void;
  facebook: string; setFacebook: (v: string) => void;
  tiktok: string; setTiktok: (v: string) => void;
  cityDisplay: string; setCityDisplay: (v: string) => void;
  nationalShipping: boolean; setNationalShipping: (v: boolean) => void;
  showBrandName: boolean; setShowBrandName: (v: boolean) => void;
  primaryColor: string; setPrimaryColor: (v: string) => void;
  rating: string; setRating: (v: string) => void;
  totalReviews: string; setTotalReviews: (v: string) => void;
  schedule: Record<string, string>; setSchedule: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export function DesignTab(props: DesignTabProps) {
  const {
    description, setDescription, slogan, setSlogan, whatsapp, setWhatsapp,
    whatsappMessage, setWhatsappMessage, ctaButtonText, setCtaButtonText,
    coverImageUrl, setCoverImageUrl, logoUrl, setLogoUrl, logoLightUrl, setLogoLightUrl,
    logoDarkUrl, setLogoDarkUrl, coverBgColor, setCoverBgColor, coverOverlayOpacity, setCoverOverlayOpacity,
    instagram, setInstagram, facebook, setFacebook, tiktok, setTiktok,
    cityDisplay, setCityDisplay, nationalShipping, setNationalShipping,
    showBrandName, setShowBrandName,
    primaryColor, setPrimaryColor, headerColor, setHeaderColor, rating, setRating, totalReviews, setTotalReviews,
    schedule, setSchedule,
  } = props;

  return (
    <div className="space-y-6">

      {/* Identidad */}
      <div className="rounded-2xl border p-5 space-y-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Identidad de marca</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Logo principal</label>
            <div className="flex items-start gap-3">
              <LogoUpload currentUrl={logoUrl} onUpload={setLogoUrl} />
              {logoUrl && <button onClick={() => setLogoUrl('')} className="text-xs text-red-500 mt-2 cursor-pointer">Eliminar</button>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Variantes de logo</label>
            <div className="flex gap-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Modo oscuro</p>
                <LogoUpload currentUrl={logoLightUrl} onUpload={setLogoLightUrl} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Modo claro</p>
                <LogoUpload currentUrl={logoDarkUrl} onUpload={setLogoDarkUrl} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="show_brand_name" checked={showBrandName} onChange={e => setShowBrandName(e.target.checked)} className="w-4 h-4 rounded cursor-pointer" />
          <label htmlFor="show_brand_name" className="text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>Mostrar nombre de marca en el encabezado</label>
        </div>
      </div>

      {/* Portada y estilo */}
      <div className="rounded-2xl border p-5 space-y-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Portada y estilo</p>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Imagen de portada</label>
          <CoverImageUpload currentUrl={coverImageUrl} onUpload={setCoverImageUrl} />
          {coverImageUrl && <button onClick={() => setCoverImageUrl('')} className="text-xs text-red-500 cursor-pointer">Eliminar portada</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Color de marca</label>
            <div className="flex items-center gap-3">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer border-0" />
              <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Opacidad overlay ({Math.round(coverOverlayOpacity * 100)}%)</label>
            <input type="range" min={0} max={1} step={0.05} value={coverOverlayOpacity} onChange={e => setCoverOverlayOpacity(parseFloat(e.target.value))} className="w-full h-2 rounded-full cursor-pointer accent-[#FF5C3A]" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Color de header</label>
            <div className="flex items-center gap-3">
              <input type="color" value={headerColor || '#ffffff'} onChange={e => setHeaderColor(e.target.value)} className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer border-0" />
              <input type="text" value={headerColor} onChange={e => setHeaderColor(e.target.value)} placeholder="#ffffff" className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Color de fondo portada</label>
            <div className="flex items-center gap-3">
              <input type="color" value={coverBgColor || '#FAFAF9'} onChange={e => setCoverBgColor(e.target.value)} className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer border-0" />
              <input type="text" value={coverBgColor || '#FAFAF9'} onChange={e => setCoverBgColor(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Información y reputación */}
      <div className="rounded-2xl border p-5 space-y-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Información y reputación</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Slogan</label>
            <input type="text" value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Ej: Moda que inspira" className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Botón CTA</label>
            <input type="text" value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} placeholder="Ej: Probarme esto" className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Rating (0–5)</label>
            <input type="number" step="0.1" min="0" max="5" value={rating} onChange={e => setRating(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total reseñas</label>
            <input type="number" value={totalReviews} onChange={e => setTotalReviews(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
        </div>
      </div>

      {/* Ubicación y horarios */}
      <div className="rounded-2xl border p-5 space-y-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Ubicación y horarios</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Ciudad / Ubicación</label>
              <input type="text" value={cityDisplay} onChange={e => setCityDisplay(e.target.value)} placeholder="Ej: Medellín, Colombia" className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="nat_shipping" checked={nationalShipping} onChange={e => setNationalShipping(e.target.checked)} className="w-4 h-4 rounded cursor-pointer" />
              <label htmlFor="nat_shipping" className="text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>Hacemos envíos nacionales</label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Horario de atención</label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {Object.keys(schedule).map(day => (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-[10px] w-14 font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{day}</span>
                  <input
                    type="text"
                    value={schedule[day]}
                    onChange={e => setSchedule(prev => ({ ...prev, [day]: e.target.value }))}
                    placeholder="8:00 AM - 6:00 PM"
                    className="flex-1 px-3 py-1.5 rounded-lg border text-xs"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contacto y redes */}
      <div className="rounded-2xl border p-5 space-y-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Contacto y redes sociales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>WhatsApp</label>
              <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="573001234567" className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Mensaje predeterminado</label>
              <input type="text" value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="space-y-3">
            {(['Instagram', 'Facebook', 'TikTok'] as const).map(plat => (
              <div key={plat} className="flex items-center gap-2">
                <span className="text-[10px] w-16 font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{plat}</span>
                <input
                  type="url"
                  value={plat === 'Instagram' ? instagram : plat === 'Facebook' ? facebook : tiktok}
                  onChange={e => plat === 'Instagram' ? setInstagram(e.target.value) : plat === 'Facebook' ? setFacebook(e.target.value) : setTiktok(e.target.value)}
                  placeholder={`URL de ${plat}`}
                  className="flex-1 px-4 py-2 rounded-xl border text-sm font-mono"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
