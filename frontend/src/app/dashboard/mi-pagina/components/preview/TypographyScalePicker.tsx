'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface FontOption {
  id: string;
  name: string;
  desc: string;
  fontClass: string;
}

const FONTS: FontOption[] = [
  {
    id: 'font-jakarta',
    name: 'Jakarta',
    desc: 'Minimalista',
    fontClass: 'font-jakarta',
  },
  {
    id: 'font-playfair',
    name: 'Playfair',
    desc: 'Sartorial',
    fontClass: 'font-playfair',
  },
  {
    id: 'font-tech',
    name: 'Tech',
    desc: 'Innovadora',
    fontClass: 'font-tech',
  },
  {
    id: 'font-dm-sans',
    name: 'DM Sans',
    desc: 'Vanguardista',
    fontClass: 'font-dm-sans',
  },
];

interface TypographyScalePickerProps {
  value: string;
  onChange: (fontId: string) => void;
  label?: string;
  className?: string;
}

export function TypographyScalePicker({
  value,
  onChange,
  label,
  className = '',
}: TypographyScalePickerProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block leading-none opacity-80">
          {label}
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        {FONTS.map(f => {
          const isSelected = value === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onChange(f.id)}
              className={`px-5 py-4 rounded-2xl border transition-all text-left relative overflow-hidden group/font active:scale-95 ${
                isSelected
                  ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-xl shadow-[#FF5C3A]/5 scale-[1.02]'
                  : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[#FF5C3A]/30'
              }`}
            >
              {/* Live "Aa" preview */}
              <div className={`text-2xl font-black italic leading-none mb-2 transition-colors ${f.fontClass} ${
                isSelected ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'
              }`}>
                Aa
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs font-black italic tracking-tight ${f.fontClass} ${
                    isSelected ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'
                  }`}>
                    {f.name}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest block mt-0.5 opacity-40 ${
                    isSelected ? 'text-[#FF5C3A]' : 'text-[var(--text-muted)]'
                  }`}>
                    {f.desc}
                  </span>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#FF5C3A] flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Selected indicator bar */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF5C3A] to-[#ff8a70]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}