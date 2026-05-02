'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Type } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

interface ContentSectionProps {
  description: string; setDescription: (v: string) => void;
  slogan: string; setSlogan: (v: string) => void;
  ctaButtonText: string; setCtaButtonText: (v: string) => void;
}

export function ContentSection({
  description, setDescription,
  slogan, setSlogan,
  ctaButtonText, setCtaButtonText,
}: ContentSectionProps) {
  const sectionStyle = "p-6 md:p-8 xl:p-10 space-y-6 relative overflow-hidden group";
  const labelStyle = "text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 block leading-none opacity-80";
  const inputStyle = "w-full px-6 py-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm font-semibold text-[var(--text-primary)] focus:border-[#FF5C3A] hover:bg-[var(--bg-hover)] focus:ring-4 focus:ring-[#FF5C3A]/5 outline-none transition-all placeholder:text-[var(--text-muted)] shadow-sm";

  return (
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
  );
}