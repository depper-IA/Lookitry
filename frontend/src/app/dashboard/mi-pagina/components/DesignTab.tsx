'use client';

import React from 'react';
import { LogoUpload, CoverImageUpload } from './Uploaders';
import { Spinner } from '@/components/ui/Spinner';

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
  landingTemplate: 'classic' | 'editorial' | 'moderno'; setLandingTemplate: (v: 'classic' | 'editorial' | 'moderno') => void;
  primaryColor: string; setPrimaryColor: (v: string) => void;
  rating: string; setRating: (v: string) => void;
  totalReviews: string; setTotalReviews: (v: string) => void;
  schedule: Record<string, string>; setSchedule: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  handleSave: () => void;
  saving: boolean;
  error: string | null;
  success: boolean;
  pageUrl: string;
}

export function DesignTab(props: DesignTabProps) {
  const {
    description, setDescription, slogan, setSlogan, whatsapp, setWhatsapp,
    whatsappMessage, setWhatsappMessage, ctaButtonText, setCtaButtonText,
    coverImageUrl, setCoverImageUrl, logoUrl, setLogoUrl, logoLightUrl, setLogoLightUrl,
    logoDarkUrl, setLogoDarkUrl, coverBgColor, setCoverBgColor, coverOverlayOpacity, setCoverOverlayOpacity,
    instagram, setInstagram, facebook, setFacebook, tiktok, setTiktok,
    cityDisplay, setCityDisplay, nationalShipping, setNationalShipping,
    showBrandName, setShowBrandName, landingTemplate, setLandingTemplate,
    primaryColor, setPrimaryColor, headerColor, setHeaderColor, rating, setRating, totalReviews, setTotalReviews,
    schedule, setSchedule, handleSave, saving, error, success, pageUrl
  } = props;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
          Cambios guardados correctamente
        </div>
      )}

      {/* Identidad */}
      <div className="rounded-2xl border bg-card p-5 space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Identidad de Marca</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Logo Principal</label>
            <div className="flex items-start gap-4">
              <LogoUpload currentUrl={logoUrl} onUpload={setLogoUrl} />
              {logoUrl && <button onClick={() => setLogoUrl('')} className="text-xs text-red-500 mt-2">Eliminar</button>}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Variantes de Logo</label>
            <div className="flex gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Modo Oscuro</p>
                <LogoUpload currentUrl={logoLightUrl} onUpload={setLogoLightUrl} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Modo Claro</p>
                <LogoUpload currentUrl={logoDarkUrl} onUpload={setLogoDarkUrl} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <input type="checkbox" id="show_brand_name" checked={showBrandName} onChange={e => setShowBrandName(e.target.checked)} className="w-4 h-4 rounded" />
            <label htmlFor="show_brand_name" className="text-sm" style={{ color: 'var(--text-primary)' }}>Mostrar nombre de marca en el encabezado</label>
        </div>
      </div>

      {/* Selección de Plantilla */}
      <div className="rounded-2xl border bg-card p-5 space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Diseño de la página</p>
        <div className="grid grid-cols-3 gap-3">
          {(['classic', 'editorial', 'moderno'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setLandingTemplate(t)}
              className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                landingTemplate === t ? 'border-[#FF5C3A] bg-[#FF5C3A10] text-[#FF5C3A]' : 'border-transparent bg-black/5 text-gray-400'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Hero / Apariencia */}
      <div className="rounded-2xl border bg-card p-5 space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Portada y Estilo</p>
        <div className="space-y-4">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Imagen de Portada</label>
          <CoverImageUpload currentUrl={coverImageUrl} onUpload={setCoverImageUrl} />
          {coverImageUrl && <button onClick={() => setCoverImageUrl('')} className="text-xs text-red-500">Eliminar portada</button>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Color de Marca</label>
            <div className="flex items-center gap-3">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer" />
              <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Opacidad Overlay ({Math.round(coverOverlayOpacity * 100)}%)</label>
            <input type="range" min={0} max={1} step={0.05} value={coverOverlayOpacity} onChange={e => setCoverOverlayOpacity(parseFloat(e.target.value))} className="w-full h-2 rounded-full cursor-pointer accent-[#FF5C3A]" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Color de Header (página pública)</label>
            <div className="flex items-center gap-3">
              <input type="color" value={headerColor} onChange={e => setHeaderColor(e.target.value)} className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer" />
              <input type="text" value={headerColor} onChange={e => setHeaderColor(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Color de Fondo Portada</label>
            <div className="flex items-center gap-3">
              <input type="color" value={coverBgColor || '#FAFAF9'} onChange={e => setCoverBgColor(e.target.value)} className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer" />
              <input type="text" value={coverBgColor || '#FAFAF9'} onChange={e => setCoverBgColor(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Información y Rating */}
      <div className="rounded-2xl border bg-card p-5 space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Información y Reputación</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Slogan</label>
              <input type="text" value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Ej: Moda que inspira" className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Botón de Acción (CTA)</label>
              <input type="text" value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} placeholder="Ej: Probarme esto" className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Rating (0 - 5)</label>
              <input type="number" step="0.1" min="0" max="5" value={rating} onChange={e => setRating(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Total Reseñas</label>
              <input type="number" value={totalReviews} onChange={e => setTotalReviews(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Ubicación y Horarios */}
      <div className="rounded-2xl border bg-card p-5 space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Ubicación y Horarios</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Ciudad / Ubicación</label>
                <input type="text" value={cityDisplay} onChange={e => setCityDisplay(e.target.value)} placeholder="Ej: Medellín, Colombia" className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
             </div>
             <div className="flex items-center gap-2">
                <input type="checkbox" id="nat_shipping" checked={nationalShipping} onChange={e => setNationalShipping(e.target.checked)} className="w-4 h-4 rounded" />
                <label htmlFor="nat_shipping" className="text-sm" style={{ color: 'var(--text-primary)' }}>Hacemos envíos nacionales</label>
             </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Horario de atención</label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(schedule).map(day => (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-[10px] w-14 font-bold text-gray-500 uppercase">{day}</span>
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

      {/* Contacto y Redes */}
      <div className="rounded-2xl border bg-card p-5 space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold border-b pb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Contacto y Redes Sociales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label>
              <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="573001234567" className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Mensaje Predeterminado</label>
              <input type="text" value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="space-y-3">
            {['Instagram', 'Facebook', 'TikTok'].map(plat => (
              <div key={plat} className="flex items-center gap-2">
                <span className="text-[10px] w-16 font-bold text-gray-500 uppercase">{plat}</span>
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

      {/* Los botones de Guardar y Ver página ahora están en la parte superior del editor principal para mayor visibilidad */}
    </div>
  );
}
