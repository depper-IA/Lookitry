'use client';

import type { TryOnTemplateProps } from '../types';

interface EditorialHeaderProps {
  config: TryOnTemplateProps['config'];
  onReset: () => void;
  showReset?: boolean;
  primaryColor: string;
  bgLuminance: boolean;
  textMuted: string;
  secondaryColor: string;
}

export function EditorialHeader({ config, onReset, showReset, primaryColor, bgLuminance, textMuted, secondaryColor }: EditorialHeaderProps) {
  const textPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';
  
  return (
    <header
      className="relative z-20 px-4 sm:px-6 py-3 flex items-center justify-between backdrop-blur-xl"
      style={{
        backgroundColor: bgLuminance ? `${secondaryColor}ee` : 'rgba(10,10,10,0.8)',
        borderBottom: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <div className="flex items-center gap-3">
        {config.brand.logo ? (
          <img
            src={config.brand.logo}
            alt={config.brand.name}
            className="h-8 w-auto object-contain"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="font-black text-sm italic text-white">
              {config.brand.name.charAt(0)}
            </span>
          </div>
        )}
        <span
          className="text-[10px] font-black uppercase tracking-[0.2em] italic hidden sm:inline"
          style={{ color: textPrimary, opacity: 0.5 }}
        >
          {config.brand.name}
        </span>
      </div>

      {showReset && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all hover:bg-white/10"
          style={{ color: textMuted }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reiniciar
        </button>
      )}
    </header>
  );
}
