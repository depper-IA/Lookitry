'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react';
import { LogoUpload } from '../Uploaders';
import { TypographyScalePicker } from '../preview';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

interface BrandIdentitySectionProps {
  logoUrl: string; setLogoUrl: (v: string) => void;
  logoLightUrl: string; setLogoLightUrl: (v: string) => void;
  logoDarkUrl: string; setLogoDarkUrl: (v: string) => void;
  landingFont: string; setLandingFont: (v: string) => void;
  showBrandName: boolean; setShowBrandName: (v: boolean) => void;
}

export function BrandIdentitySection({
  logoUrl, setLogoUrl,
  logoLightUrl, setLogoLightUrl,
  logoDarkUrl, setLogoDarkUrl,
  landingFont, setLandingFont,
  showBrandName, setShowBrandName,
}: BrandIdentitySectionProps) {
  const sectionStyle = "p-6 md:p-8 xl:p-10 space-y-6 relative overflow-hidden group";
  const labelStyle = "text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 block leading-none opacity-80";

  return (
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
        <TypographyScalePicker
          label="Voz Tipográfica"
          value={landingFont}
          onChange={setLandingFont}
        />
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
  );
}