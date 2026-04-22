'use client';

import { motion } from 'framer-motion';
import type { TryOnTemplateProps } from '../types';

interface SidebarHeaderProps {
  config: TryOnTemplateProps['config'];
  welcomeMessage?: string;
  isSmall: boolean;
  primaryColor: string;
  sidebarLuminance: boolean;
  sidebarText: string;
  sidebarMuted: string;
  sidebarSubtle: string;
}

export function SidebarHeader({
  config,
  welcomeMessage,
  isSmall,
  primaryColor,
  sidebarLuminance,
  sidebarText,
  sidebarMuted,
}: SidebarHeaderProps) {
  return (
    <>
      {/* Header - Stacked Centered */}
      <div className={`flex flex-col items-center text-center ${isSmall ? 'px-3 pt-4 pb-3' : 'px-4 py-4'} border-b`} style={{ borderColor: `${primaryColor}20` }}>
        <div className="relative group mb-2 animate-in zoom-in duration-700">
          <div 
            className="absolute inset-0 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 scale-150"
            style={{ background: primaryColor }}
          />
          {config.brand.logo ? (
            <img 
              src={config.brand.logo} 
              alt={config.brand.name} 
              className={`${isSmall ? 'h-12' : 'h-14 lg:h-16'} w-auto object-contain relative z-10 transition-transform duration-700 group-hover:scale-105`} 
              onError={e => { e.currentTarget.style.display = 'none'; }} 
            />
          ) : (
            <div className={`${isSmall ? 'h-16 w-16' : 'h-16 w-16 lg:h-20 lg:w-20'} rounded-2xl bg-white/10 flex items-center justify-center relative z-10 border border-white/10`}>
              <span className="font-black text-2xl lg:text-3xl italic" style={{ color: primaryColor }}>
                {config.brand.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-0.5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <h1 className={`${isSmall ? 'text-xl' : 'text-xl lg:text-2xl'} font-black tracking-tighter uppercase italic leading-tight`} style={{ color: sidebarText }}>
            {config.brand.name}
          </h1>
          <div className="flex flex-col items-center">
            <div className="w-5 h-0.5 rounded-full mb-1" style={{ backgroundColor: primaryColor }} />
            <p className="text-[8px] uppercase tracking-[0.2em] font-black opacity-35 italic" style={{ color: sidebarText }}>
              {welcomeMessage ? 'Tu Probador' : 'Tu Estilo'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

interface SidebarResetButtonProps {
  onReset: () => void;
  isSmall: boolean;
  sidebarLuminance: boolean;
  sidebarMuted: string;
}

export function SidebarResetButton({ onReset, isSmall, sidebarLuminance, sidebarMuted }: SidebarResetButtonProps) {
  if (isSmall) return null;
  
  return (
    <motion.button 
      onClick={onReset} 
      whileTap={{ scale: 0.97 }}
      className="w-full text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
      style={{ 
        color: sidebarMuted,
        backgroundColor: sidebarLuminance ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${sidebarLuminance ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      Reiniciar
    </motion.button>
  );
}
