'use client';

interface DesktopTopBarProps {
  step: string;
  primaryColor: string;
  primaryGlow: string;
  bgLuminance: boolean;
  mainTextPrimary: string;
  mainTextMuted: string;
  mainBorderColor: string;
  mainCardBg: string;
}

export function DesktopTopBar({
  step,
  primaryColor,
  primaryGlow,
  bgLuminance,
  mainTextPrimary,
  mainTextMuted,
  mainBorderColor,
  mainCardBg,
}: DesktopTopBarProps) {
  return (
    <div 
      className="sticky top-0 z-20 px-5 py-3 border-b backdrop-blur-xl transition-all duration-300 shrink-0"
      style={{ 
        backgroundColor: bgLuminance ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
        borderColor: mainBorderColor,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Step badge */}
          <div 
            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{ 
              backgroundColor: `${primaryColor}20`,
              color: primaryColor,
              boxShadow: `0 2px 10px ${primaryGlow}`
            }}
          >
            {step === 'select' && `Paso 1/3`}
            {step === 'upload' && `Paso 2/3`}
            {step === 'result' && `Paso 3/3`}
          </div>
          
          <h2 className="text-base font-bold tracking-tight" style={{ color: mainTextPrimary }}>
            {step === 'select' && 'Selecciona un producto'}
            {step === 'upload' && 'Sube tu foto'}
            {step === 'result' && 'Tu resultado'}
          </h2>
        </div>
        
        {/* Brand badge */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold"
          style={{ backgroundColor: mainCardBg, border: `1px solid ${mainBorderColor}` }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
          <span style={{ color: mainTextMuted }}>En vivo</span>
        </div>
      </div>
    </div>
  );
}
