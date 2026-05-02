'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import { PremiumColorPicker } from '../preview';
import type { LandingEditorState, LandingEditorActions } from '../../hooks/useLandingEditor';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

interface ColorsSectionProps {
  state: Pick<LandingEditorState, 'primaryColor' | 'secondaryColor' | 'widgetBgColor' | 'coverBgColor'>;
  actions: Pick<LandingEditorActions, 'updateField'>;
}

export function ColorsSection({ state, actions }: ColorsSectionProps) {
  const { primaryColor, secondaryColor, widgetBgColor, coverBgColor } = state;
  const { updateField } = actions;

  const sectionStyle = "p-6 md:p-8 xl:p-10 space-y-6 relative overflow-hidden group";

  return (
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

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
        <PremiumColorPicker
          label="Primario"
          value={primaryColor}
          onChange={(v) => updateField('primaryColor', v)}
          tooltip="Botones y destacados."
          className="w-full"
        />
        <PremiumColorPicker
          label="Secundario"
          value={secondaryColor}
          onChange={(v) => updateField('secondaryColor', v)}
          tooltip="Bordes y sombras."
          className="w-full"
        />
        <PremiumColorPicker
          label="Probador"
          value={widgetBgColor || '#0a0a0a'}
          onChange={(v) => updateField('widgetBgColor', v)}
          tooltip="Fondo del probador virtual."
          className="w-full"
        />
        <PremiumColorPicker
          label="Respaldo"
          value={coverBgColor || '#0a0a0a'}
          onChange={(v) => updateField('coverBgColor', v)}
          tooltip="Fondo de secciones."
          className="w-full"
        />
      </div>
    </motion.section>
  );
}
