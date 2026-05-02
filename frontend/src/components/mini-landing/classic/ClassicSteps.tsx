'use client';

import React from 'react';
import { BrandData } from '../shared';
import { useLandingTheme, useContrastTheme, getSmartBorderColor } from '../shared';

interface ClassicStepsProps {
  brand: BrandData;
  primaryColor: string;
  secondaryColor: string;
}

export function ClassicSteps({ brand, primaryColor, secondaryColor }: ClassicStepsProps) {
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.productsBg, primaryColor);
  const stepsDef = brand.landing_steps;
  const steps = [
    {
      n: '01',
      t: stepsDef?.select_label || 'Selecciona',
      d: stepsDef?.select_desc || 'Elige cualquier prenda de nuestro catálogo curado para comenzar.',
    },
    {
      n: '02',
      t: stepsDef?.photo_label || 'Fotografía',
      d: stepsDef?.photo_desc || 'Captura una selfie frontal. La iluminación es clave para el realismo.',
    },
    {
      n: '03',
      t: stepsDef?.result_label || 'Estrena',
      d: stepsDef?.result_desc || 'Nuestra IA renderiza la prenda sobre ti. Descarga y comparte.',
    },
  ];

  return (
    <section className="pt-24 pb-16 px-6 border-b" style={{ backgroundColor: theme.productsBg, borderColor: getSmartBorderColor(theme.productsBg) }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>¿Cómo funciona?</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none" style={{ color: localTheme.text }}>En tres simples pasos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col items-center md:items-start text-center md:text-left p-8 rounded-[2rem] border transition-all duration-500 group hover:shadow-xl hover:scale-[1.02]" style={{ backgroundColor: `${primaryColor}05`, borderColor: getSmartBorderColor(theme.productsBg) }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner mb-6 transition-transform duration-500 group-hover:-translate-y-2" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                {s.n}
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight italic mb-3" style={{ color: localTheme.text }}>{s.t}</h3>
              <p className="text-sm leading-relaxed font-medium" style={{ color: localTheme.muted }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
