'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Truck } from 'lucide-react';
import type { LandingEditorState, LandingEditorActions } from '../../hooks/useLandingEditor';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

interface SocialSectionProps {
  state: Pick<LandingEditorState, 'whatsapp' | 'whatsappMessage' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'x' | 'cityDisplay' | 'rating' | 'totalReviews' | 'nationalShipping'>;
  actions: Pick<LandingEditorActions, 'updateField'>;
}

export function SocialSection({ state, actions }: SocialSectionProps) {
  const {
    whatsapp, whatsappMessage, instagram, facebook, tiktok, youtube, x,
    cityDisplay, rating, totalReviews, nationalShipping
  } = state;
  const { updateField } = actions;

  const sectionStyle = "p-6 md:p-8 xl:p-10 space-y-6 relative overflow-hidden group";
  const labelStyle = "text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 block leading-none opacity-80";
  const inputStyle = "w-full px-6 py-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm font-semibold text-[var(--text-primary)] focus:border-[#FF5C3A] hover:bg-[var(--bg-hover)] focus:ring-4 focus:ring-[#FF5C3A]/5 outline-none transition-all placeholder:text-[var(--text-muted)] shadow-sm";

  return (
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
            <input type="tel" value={whatsapp} onChange={e => updateField('whatsapp', e.target.value)} className={inputStyle} />
          </div>
          <div className="space-y-3">
            <label className={labelStyle}>Mensaje de WhatsApp</label>
            <input type="text" value={whatsappMessage} onChange={e => updateField('whatsappMessage', e.target.value)} className={inputStyle} />
          </div>
          <div className="space-y-3">
            <label className={labelStyle}>Instagram</label>
            <input type="text" value={instagram} onChange={e => updateField('instagram', e.target.value)} className={inputStyle} />
          </div>
          <div className="space-y-3">
            <label className={labelStyle}>Facebook</label>
            <input type="text" value={facebook} onChange={e => updateField('facebook', e.target.value)} className={inputStyle} />
          </div>
          <div className="space-y-3">
            <label className={labelStyle}>YouTube</label>
            <input type="text" value={youtube} onChange={e => updateField('youtube', e.target.value)} className={inputStyle} />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className={labelStyle}>TikTok</label>
            <input type="text" value={tiktok} onChange={e => updateField('tiktok', e.target.value)} className={inputStyle} />
          </div>
          <div className="space-y-3">
            <label className={labelStyle}>X</label>
            <input type="text" value={x} onChange={e => updateField('x', e.target.value)} className={inputStyle} />
          </div>
          <div className="space-y-3">
            <label className={labelStyle}>Dirección</label>
            <input type="text" value={cityDisplay} onChange={e => updateField('cityDisplay', e.target.value)} placeholder="Ej: calle 123 #45-67" className={inputStyle} />
          </div>
          <div className="space-y-3">
            <label className={labelStyle}>Rating</label>
            <input type="number" min="0" max="5" step="0.1" value={rating} onChange={e => updateField('rating', e.target.value)} className={inputStyle} />
          </div>
          <div className="space-y-3">
            <label className={labelStyle}>Total de reseñas</label>
            <input type="number" min="0" step="1" value={totalReviews} onChange={e => updateField('totalReviews', e.target.value)} className={inputStyle} />
          </div>
          <button
            type="button"
            onClick={() => updateField('nationalShipping', !nationalShipping)}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all w-full ${nationalShipping ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 text-[var(--text-primary)] shadow-xl shadow-[#FF5C3A]/5' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-[#FF5C3A]/30'}`}
          >
            <Truck className={`w-5 h-5 ${nationalShipping ? 'text-[#FF5C3A]' : 'opacity-50'}`} />
            <div className="text-left">
              <span className="text-xs font-black uppercase tracking-widest block leading-none">Envios nacionales</span>
              <span className="text-[9px] font-bold opacity-50 uppercase tracking-tighter mt-1 block italic">{nationalShipping ? 'Activo' : 'Oculto'}</span>
            </div>
          </button>
        </div>
      </div>
    </motion.section>
  );
}
