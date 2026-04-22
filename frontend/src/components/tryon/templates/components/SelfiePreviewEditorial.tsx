'use client';

interface SelfiePreviewEditorialProps {
  preview: string | null;
  onReset: () => void;
  primaryColor: string;
  textMuted: string;
  cardBg?: string;
  bgLuminance?: boolean;
}

export function SelfiePreviewEditorial({
  preview,
  onReset,
  primaryColor,
  textMuted,
  cardBg,
  bgLuminance
}: SelfiePreviewEditorialProps) {
  if (!preview) return null;

  return (
    <div
      className="relative flex items-center gap-3 sm:gap-4 rounded-2xl p-3 sm:p-4 shadow-xl"
      style={{
        backgroundColor: bgLuminance ? '#ffffff' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute -inset-px rounded-2xl opacity-20"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, transparent)` }}
      />

      <div className="relative flex items-center gap-3 sm:gap-4 w-full">
        <div className="relative shrink-0">
          <img
            src={preview}
            alt="Tu foto"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-lg ring-2 ring-white/20"
          />
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-black uppercase italic tracking-tight" style={{ color: primaryColor }}>
            Listo para probar
          </p>
          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider mt-0.5" style={{ color: textMuted }}>
            Escoge un producto
          </p>
        </div>

        <button
          onClick={onReset}
          className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all hover:bg-white/10 shrink-0"
          style={{ color: textMuted }}
        >
          Cambiar
        </button>
      </div>
    </div>
  );
}
