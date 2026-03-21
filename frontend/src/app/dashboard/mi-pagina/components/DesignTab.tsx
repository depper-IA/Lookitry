'use client';

import React from 'react';
import { LogoUpload, CoverImageUpload } from './Uploaders';
import { 
  Palette, 
  ImageIcon, 
  MessageSquare, 
  Star, 
  MapPin, 
  Clock, 
  Share2, 
  Type, 
  MousePointer2,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

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

  const sectionStyle = "bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] p-8 space-y-6 shadow-sm hover:border-[var(--text-muted)] transition-all";
  const labelStyle = "text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 block";
  const inputStyle = "w-full px-5 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:border-[#FF5C3A] outline-none transition-all placeholder:text-[var(--text-muted)]";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 1. Identidad Visual */}
      <section className={sectionStyle}>
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Identidad Visual</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">Logos, colores y marca</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className={labelStyle}>Logo Principal</label>
            <div className="flex items-end gap-4">
              <LogoUpload currentUrl={logoUrl} onUpload={setLogoUrl} />
              {logoUrl && (
                <button onClick={() => setLogoUrl('')} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className={labelStyle}>Variantes de Logo</label>
            <div className="flex gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Light</span>
                <LogoUpload currentUrl={logoLightUrl} onUpload={setLogoLightUrl} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Dark</span>
                <LogoUpload currentUrl={logoDarkUrl} onUpload={setLogoDarkUrl} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <label className={labelStyle}>Color Principal</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-color)]">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent" />
              <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 bg-transparent border-0 text-sm font-mono text-[var(--text-primary)] outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-4 px-2">
            <button 
              onClick={() => setShowBrandName(!showBrandName)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all w-full ${showBrandName ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 text-[var(--text-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
            >
              {showBrandName ? <Eye className="w-4 h-4 text-[#FF5C3A]" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-widest">Nombre en Header</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Hero y Portada */}
      <section className={sectionStyle}>
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Portada y Estilo</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">Visuales de alto impacto</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className={labelStyle}>Imagen de Portada</label>
          <CoverImageUpload currentUrl={coverImageUrl} onUpload={setCoverImageUrl} />
          {coverImageUrl && (
            <button onClick={() => setCoverImageUrl('')} className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest hover:opacity-70 transition-opacity">
              <Trash2 className="w-3 h-3" /> Eliminar imagen de portada
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className={labelStyle}>Oscurecer Imagen</label>
              <span className="text-[10px] font-bold text-[#FF5C3A]">{Math.round(coverOverlayOpacity * 100)}%</span>
            </div>
            <input 
              type="range" min={0} max={1} step={0.05} 
              value={coverOverlayOpacity} 
              onChange={e => setCoverOverlayOpacity(parseFloat(e.target.value))} 
              className="w-full h-1.5 rounded-full cursor-pointer accent-[#FF5C3A] appearance-none bg-[var(--bg-input)] border border-[var(--border-color)]" 
            />
          </div>
          <div className="space-y-2">
            <label className={labelStyle}>Fondo de Respaldo</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-color)]">
              <input type="color" value={coverBgColor || '#0a0a0a'} onChange={e => setCoverBgColor(e.target.value)} className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent" />
              <input type="text" value={coverBgColor} onChange={e => setCoverBgColor(e.target.value)} placeholder="#0a0a0a" className="flex-1 bg-transparent border-0 text-sm font-mono text-[var(--text-primary)] outline-none" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Contenido y Textos */}
      <section className={sectionStyle}>
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
            <Type className="w-5 h-5 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Contenido Editorial</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">Slogan, descripción y llamadas a la acción</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelStyle}>Slogan Principal</label>
            <input type="text" value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Ej: Nueva Colección 2026" className={inputStyle} />
          </div>
          <div className="space-y-2">
            <label className={labelStyle}>Texto del Botón (CTA)</label>
            <div className="relative">
              <MousePointer2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input type="text" value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} className={`${inputStyle} pl-12`} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelStyle}>Historia de la Marca</label>
          <textarea 
            value={description} onChange={e => setDescription(e.target.value)} 
            rows={4} 
            placeholder="Cuenta brevemente qué hace única a tu marca..." 
            className={`${inputStyle} resize-none`} 
          />
        </div>

        <div className="grid grid-cols-2 gap-6 p-6 bg-[var(--bg-base)] rounded-[2rem] border border-[var(--border-color)]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <label className={labelStyle}>Rating</label>
            </div>
            <input type="number" step="0.1" min="0" max="5" value={rating} onChange={e => setRating(e.target.value)} className={inputStyle} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3 h-3 text-[#FF5C3A]" />
              <label className={labelStyle}>Reseñas</label>
            </div>
            <input type="number" value={totalReviews} onChange={e => setTotalReviews(e.target.value)} className={inputStyle} />
          </div>
        </div>
      </section>

      {/* 4. Ubicación y Horarios */}
      <section className={sectionStyle}>
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Presencia Física</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">Dónde encontrarte y cuándo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={labelStyle}>Ciudad / Ubicación</label>
              <input type="text" value={cityDisplay} onChange={e => setCityDisplay(e.target.value)} placeholder="Ej: Medellín, Colombia" className={inputStyle} />
            </div>
            <button 
              onClick={() => setNationalShipping(!nationalShipping)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all w-full ${nationalShipping ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 text-[var(--text-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${nationalShipping ? 'border-[#FF5C3A]' : 'border-[var(--border-color)]'}`}>
                {nationalShipping && <div className="w-2.5 h-2.5 rounded-full bg-[#FF5C3A]" />}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Envíos Nacionales Activos</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
              <label className={labelStyle}>Horarios Semanales</label>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar bg-[var(--bg-input)] p-4 rounded-[2rem] border border-[var(--border-color)]">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-[9px] w-16 font-black uppercase text-[var(--text-muted)]">{day}</span>
                  <input
                    type="text"
                    value={schedule[day] || ''}
                    onChange={e => setSchedule(prev => {
                      const newSchedule = { ...prev };
                      newSchedule[day] = e.target.value;
                      return newSchedule;
                    })}
                    placeholder="Cerrado o 00:00 - 00:00"
                    className="flex-1 bg-transparent border-b border-[var(--border-color)] py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[#FF5C3A] transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Contacto y Redes */}
      <section className={sectionStyle}>
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Conexión Directa</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">Redes sociales y WhatsApp</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 bg-[var(--bg-base)] p-6 rounded-[2rem] border border-[var(--border-color)]">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-[#25D366]" />
              <span className="text-xs font-bold text-[#25D366] uppercase tracking-widest">Canal WhatsApp</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={labelStyle}>Número (Internacional)</label>
                <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="573001234567" className={inputStyle} />
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Mensaje de Bienvenida</label>
                <input type="text" value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)} className={inputStyle} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className={labelStyle}>Redes Sociales</label>
            <div className="space-y-3">
              {[
                { id: 'Instagram', val: instagram, set: setInstagram, color: '#E4405F' },
                { id: 'Facebook', val: facebook, set: setFacebook, color: '#1877F2' },
                { id: 'TikTok', val: tiktok, set: setTiktok, color: '#000000' }
              ].map(plat => (
                <div key={plat.id} className="flex items-center gap-3 bg-[var(--bg-input)] p-1.5 pl-4 rounded-2xl border border-[var(--border-color)] focus-within:border-[#FF5C3A]/30 transition-all">
                  <span className="text-[9px] font-black uppercase text-[var(--text-muted)] w-16">{plat.id}</span>
                  <input
                    type="url"
                    value={plat.val}
                    onChange={e => plat.set(e.target.value)}
                    placeholder={`https://${plat.id.toLowerCase()}.com/usuario`}
                    className="flex-1 bg-transparent border-0 text-[11px] text-[var(--text-primary)] font-mono outline-none py-2"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
