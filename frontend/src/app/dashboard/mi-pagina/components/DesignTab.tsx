'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
  EyeOff,
  Plus,
  Info,
  Layers,
  Sparkles,
  Phone,
  Check,
  Globe as GlobeIcon,
  Link as LinkIcon
} from 'lucide-react';

const Tooltip = ({ text }: { text: string }) => (
  <div className="group/tooltip relative inline-block ml-1.5 align-middle">
    <div className="w-4 h-4 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#FF5C3A] cursor-help transition-all shadow-sm">
      <Info className="w-2.5 h-2.5 transition-transform group-hover/tooltip:scale-110" />
    </div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 shadow-2xl z-[100] pointer-events-none border-b-4 border-b-[#FF5C3A]">
      <p className="text-[10px] leading-relaxed text-[var(--text-primary)] font-black uppercase tracking-wider italic">{text}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#FF5C3A]"></div>
    </div>
  </div>
);

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
  youtube: string; setYoutube: (v: string) => void;
  x: string; setX: (v: string) => void;
  cityDisplay: string; setCityDisplay: (v: string) => void;
  nationalShipping: boolean; setNationalShipping: (v: boolean) => void;
  showBrandName: boolean; setShowBrandName: (v: boolean) => void;
  primaryColor: string; setPrimaryColor: (v: string) => void;
  secondaryColor: string; setSecondaryColor: (v: string) => void;
  widgetBgColor: string; setWidgetBgColor: (v: string) => void;
  landingFont: string; setLandingFont: (v: string) => void;
  rating: string; setRating: (v: string) => void;
  totalReviews: string; setTotalReviews: (v: string) => void;
  schedule: Record<string, string>; setSchedule: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export function DesignTab(props: DesignTabProps) {
  const {
    description, setDescription, slogan, setSlogan, whatsapp, setWhatsapp,
    whatsappMessage, setWhatsappMessage, ctaButtonText, setCtaButtonText,
    coverImageUrl, setCoverImageUrl, logoUrl, setLogoUrl, logoLightUrl, setLogoLightUrl,
    logoDarkUrl, setLogoDarkUrl, coverBgColor, setCoverBgColor, coverOverlayOpacity, setCoverOverlayOpacity,
    instagram, setInstagram, facebook, setFacebook, tiktok, setTiktok,
    youtube, setYoutube, x, setX,
    cityDisplay, setCityDisplay, nationalShipping, setNationalShipping,
    showBrandName, setShowBrandName,
    primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor, widgetBgColor, setWidgetBgColor, landingFont, setLandingFont, headerColor, setHeaderColor, rating, setRating, totalReviews, setTotalReviews,
    schedule, setSchedule,
  } = props;

  const sectionStyle = "bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 md:p-8 space-y-6 shadow-3xl hover:border-[#FF5C3A]/30 transition-all duration-700 relative overflow-hidden group";
  const labelStyle = "text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-4 block italic leading-none";
  const inputStyle = "w-full px-6 py-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm font-bold text-[var(--text-primary)] focus:border-[#FF5C3A] hover:bg-[var(--bg-hover)] focus:ring-4 focus:ring-[#FF5C3A]/5 outline-none transition-all placeholder:text-[var(--text-muted)] placeholder:font-medium shadow-inner";

  return (
    <div className="space-y-12 pb-10">

      {/* 1. Identidad Visual */}
      <motion.section variants={itemVariants} className={sectionStyle}>
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Star size={45} fill="#FF5C3A" />
        </div>
        <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center shadow-inner">
            <Star className="w-6 h-6 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)] italic uppercase tracking-tighter leading-none">Identidad Visual</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest mt-1 opacity-60 italic">Logos y Tipografía</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
          <div className="space-y-6">
            <label className={labelStyle}>Logo Principal</label>
            <div className="flex items-end gap-5">
              <div className="p-2 bg-[var(--bg-input)] rounded-[2.5rem] border border-[var(--border-color)] shadow-inner">
                <LogoUpload currentUrl={logoUrl} onUpload={setLogoUrl} />
              </div>
              {logoUrl && (
                <button onClick={() => setLogoUrl('')} className="p-4 rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <label className={labelStyle}>Versiones Adaptativas</label>
            <div className="flex gap-8">
              <div className="flex flex-col items-center gap-3">
                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic opacity-50">Light</span>
                <div className="p-1.5 bg-white rounded-2xl border border-gray-100 shadow-xl">
                  <LogoUpload currentUrl={logoLightUrl} onUpload={setLogoLightUrl} />
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic opacity-50">Dark</span>
                <div className="p-1.5 bg-black rounded-2xl border border-white/10 shadow-xl">
                  <LogoUpload currentUrl={logoDarkUrl} onUpload={setLogoDarkUrl} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-[var(--border-color)] relative z-10">
          <div className="space-y-6">
            <label className={labelStyle}>Voz Tipográfica</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'font-jakarta', name: 'Jakarta', desc: 'Minimalista', class: 'font-jakarta' },
                { id: 'font-playfair', name: 'Playfair', desc: 'Sartorial', class: 'font-playfair' },
                { id: 'font-tech', name: 'Tech', desc: 'Innovadora', class: 'font-tech' },
                { id: 'font-dm-sans', name: 'DM Sans', desc: 'Vanguardista', class: 'font-dm-sans' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLandingFont(f.id)}
                  className={`px-6 py-4 rounded-2xl border transition-all text-left relative overflow-hidden group/font active:scale-95 ${landingFont === f.id ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-xl shadow-[#FF5C3A]/5 scale-[1.02]' : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[#FF5C3A]/30'}`}
                >
                  <span className={`block text-sm font-black italic tracking-tight mb-0.5 ${f.class} ${landingFont === f.id ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>{f.name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${landingFont === f.id ? 'text-[#FF5C3A]' : 'text-[var(--text-muted)]'}`}>{f.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <label className={labelStyle}>Configuración Header</label>
            <button 
              onClick={() => setShowBrandName(!showBrandName)}
              className={`flex items-center gap-4 px-8 py-5 rounded-2xl border transition-all w-full group/btn ${showBrandName ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 text-[var(--text-primary)] shadow-xl shadow-[#FF5C3A]/5' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-[#FF5C3A]/30'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showBrandName ? 'bg-[#FF5C3A] text-white shadow-lg' : 'bg-[var(--border-color)]'}`}>
                {showBrandName ? <Eye size={20} /> : <EyeOff size={20} />}
              </div>
              <div className="text-left">
                <span className="text-xs font-black uppercase tracking-widest block leading-none">Nombre en Header</span>
                <span className="text-[9px] font-bold opacity-50 uppercase tracking-tighter mt-1 block italic">{showBrandName ? 'Visible' : 'Oculto'}</span>
              </div>
            </button>
          </div>
        </div>
      </motion.section>

      {/* 2. Paleta de Colores */}
      <motion.section variants={itemVariants} className={sectionStyle}>
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Palette size={45} />
        </div>
        <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center shadow-inner">
            <Palette className="w-6 h-6 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)] italic uppercase tracking-tighter leading-none">Colores de Marca</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest mt-1 opacity-60 italic">Paleta de colores y contraste</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { label: 'Primario', val: primaryColor, set: setPrimaryColor, tip: 'Botones y destacados.' },
            { label: 'Secundario', val: secondaryColor, set: setSecondaryColor, tip: 'Bordes y sombras.' },
            { label: 'Probador', val: widgetBgColor || '#0a0a0a', set: setWidgetBgColor, tip: 'Fondo del probador virtual.' },
            { label: 'Respaldo', val: coverBgColor || '#0a0a0a', set: setCoverBgColor, tip: 'Fondo de secciones.' }
          ].map(c => (
            <div key={c.label} className="space-y-3">
              <div className="flex items-center">
                <label className={labelStyle}>{c.label}</label>
                <Tooltip text={c.tip} />
              </div>
              <div className="flex items-center gap-4 bg-[var(--bg-input)] p-2 rounded-3xl border border-[var(--border-color)] shadow-inner group/color transition-all active:scale-[0.98]">
                <input type="color" value={c.val} onChange={e => c.set(e.target.value)} className="w-10 h-10 rounded-2xl overflow-hidden cursor-pointer border-0 bg-transparent flex-shrink-0 shadow-lg" />
                <input type="text" value={c.val} onChange={e => c.set(e.target.value)} className="flex-1 min-w-0 bg-transparent border-0 text-xs font-black font-mono text-[var(--text-primary)] outline-none uppercase tracking-widest" />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 3. Hero y Portada */}
      <motion.section variants={itemVariants} className={sectionStyle}>
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <ImageIcon size={45} />
        </div>
        <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center shadow-inner">
            <ImageIcon className="w-6 h-6 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)] italic uppercase tracking-tighter leading-none">Imagen de Portada</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest mt-1 opacity-60 italic">Fondo y visual de cabecera</p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <label className={labelStyle}>Imagen de Portada</label>
          <div className="p-2 bg-[var(--bg-input)] rounded-[2.5rem] border border-[var(--border-color)] shadow-inner overflow-hidden">
            <CoverImageUpload currentUrl={coverImageUrl} onUpload={setCoverImageUrl} />
          </div>
          {coverImageUrl && (
            <button onClick={() => setCoverImageUrl('')} className="flex items-center gap-3 px-6 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all w-fit shadow-lg">
              <Trash2 size={12} /> Eliminar
            </button>
          )}
        </div>

        <div className="pt-6 border-t border-[var(--border-color)] relative z-10">
          <div className="space-y-5 bg-[var(--bg-input)] p-8 rounded-[2rem] border border-[var(--border-color)] shadow-inner">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Plus size={14} className="opacity-40" />
                <label className="text-[11px] font-[900] uppercase tracking-widest text-[var(--text-primary)] italic">Overlay Opacity</label>
              </div>
              <span className="text-[11px] font-black italic p-2 bg-[#FF5C3A] text-white rounded-lg">{Math.round(coverOverlayOpacity * 100)}%</span>
            </div>
            <input 
              type="range" min={0} max={1} step={0.05} 
              value={coverOverlayOpacity} 
              onChange={e => setCoverOverlayOpacity(parseFloat(e.target.value))} 
              className="w-full h-2 rounded-full cursor-pointer accent-[#FF5C3A] appearance-none bg-[var(--border-color)] border-0" 
            />
          </div>
        </div>
      </motion.section>

      {/* 4. Contenido */}
      <motion.section variants={itemVariants} className={sectionStyle}>
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Type size={45} />
        </div>
        <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center shadow-inner">
            <Type className="w-6 h-6 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)] italic uppercase tracking-tighter leading-none">Textos y Mensajes</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest mt-1 opacity-60 italic">Slogan y descripciones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-3">
            <label className={labelStyle}>Slogan</label>
            <input type="text" value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Ej: Eleva tu estilo" className={inputStyle} />
          </div>
          <div className="space-y-3">
            <label className={labelStyle}>Botón CTA</label>
            <input type="text" value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} className={inputStyle} />
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <label className={labelStyle}>Descripción</label>
          <textarea 
            value={description} onChange={e => setDescription(e.target.value)} 
            rows={4} 
            className={`${inputStyle} resize-none`} 
          />
        </div>
      </motion.section>

      {/* 5. Ubicación y Redes */}
      <motion.section variants={itemVariants} className={sectionStyle}>
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Share2 size={45} />
        </div>
        <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center shadow-inner">
            <Share2 className="w-5 h-5 text-[#FF5C3A]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)] italic uppercase tracking-tighter leading-none">Redes Sociales y Ubicación</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest mt-1 opacity-60 italic">Contacto y presencia online</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className={labelStyle}>WhatsApp</label>
              <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={inputStyle} />
            </div>
            <div className="space-y-3">
              <label className={labelStyle}>Instagram</label>
              <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} className={inputStyle} />
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className={labelStyle}>TikTok</label>
              <input type="text" value={tiktok} onChange={e => setTiktok(e.target.value)} className={inputStyle} />
            </div>
            <div className="space-y-3">
              <label className={labelStyle}>Ciudad</label>
              <input type="text" value={cityDisplay} onChange={e => setCityDisplay(e.target.value)} className={inputStyle} />
            </div>
          </div>
        </div>
      </motion.section>

    </div>
  );
}
