'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Plus, Trash2 } from 'lucide-react';
import { CoverImageUpload } from '../Uploaders';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

interface HeroSectionProps {
  coverImageUrl: string; setCoverImageUrl: (v: string) => void;
  coverBgColor: string; setCoverBgColor: (v: string) => void;
  coverOverlayOpacity: number; setCoverOverlayOpacity: (v: number) => void;
}

export function HeroSection({
  coverImageUrl, setCoverImageUrl,
  coverBgColor, setCoverBgColor,
  coverOverlayOpacity, setCoverOverlayOpacity,
}: HeroSectionProps) {
  const sectionStyle = "p-6 md:p-8 xl:p-10 space-y-6 relative overflow-hidden group";
  const labelStyle = "text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 block leading-none opacity-80";

  return (
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
          <div className="space-y-3">
            <label className={labelStyle}>Color de fondo</label>
            <div className="flex items-center gap-4 bg-white/60 p-2 rounded-3xl border border-[var(--border-color)] shadow-inner">
              <input
                type="color"
                value={coverBgColor || '#0a0a0a'}
                onChange={e => setCoverBgColor(e.target.value)}
                className="w-10 h-10 rounded-2xl overflow-hidden cursor-pointer border-0 bg-transparent flex-shrink-0 shadow-lg"
              />
              <input
                type="text"
                value={coverBgColor || '#0a0a0a'}
                onChange={e => setCoverBgColor(e.target.value)}
                className="flex-1 min-w-0 bg-transparent border-0 text-xs font-black font-mono text-[var(--text-primary)] outline-none uppercase tracking-widest"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Plus size={14} className="opacity-40" />
              <label className="text-[11px] font-[900] uppercase tracking-widest text-[var(--text-primary)] italic">Opacidad de la imagen</label>
            </div>
            <span className="text-[11px] font-black italic p-2 bg-[#FF5C3A] text-white rounded-lg">{Math.round(coverOverlayOpacity * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.05}
            value={coverOverlayOpacity}
            onChange={e => setCoverOverlayOpacity(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full cursor-pointer accent-[#FF5C3A] appearance-none bg-[var(--border-color)] border-0"
          />
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <span>0%: domina el color</span>
            <span>100%: domina la imagen</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}