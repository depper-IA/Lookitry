'use client';

import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner, SelfieThumb } from './shared';
import { useState, useEffect, useRef } from 'react';

export function TemplateModernSidebar(props: TryOnTemplateProps) {
  const {
    step,
    config,
    brandSlug,
    primaryColor,
    secondaryColor,
    buttonText,
    welcomeMessage,
    selfiePreview,
    selectedProduct,
    resultImageUrl,
    generationId,
    error,
    errorIsService,
    notice,
    generatedProducts,
    onReset,
    onSelfieUpload,
    onProductSelect,
    onProceedToUpload,
    onGenerate,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const obs = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setIsSmall(width < 600);
    });

    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const isLightColor = (hex: string) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  };
  const sidebarTextColor = isLightColor(primaryColor) ? '#1a1a1a' : '#ffffff';

  const isLightBg = (hex: string): boolean => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  const bgLuminance = isLightBg(secondaryColor || '#ffffff');
  const mainTextPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';
  const mainTextMuted = bgLuminance ? '#666666' : '#ffffffcc';
  const mainBorderColor = bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)';
  const mainCardBg = bgLuminance ? '#ffffff' : 'rgba(255,255,255,0.05)';

  if (step === 'generating') {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8" style={{ backgroundColor: secondaryColor }}>
        <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
      </div>
    );
  }

  const steps = [
    { num: 1, label: isSmall ? 'Producto' : 'Elige un producto', active: step === 'select', done: step !== 'select' },
    { num: 2, label: isSmall ? 'Foto' : 'Sube tu foto',      active: step === 'upload', done: step === 'result' },
    { num: 3, label: isSmall ? 'Listo' : 'Ve el resultado',   active: step === 'result', done: false },
  ];

  return (
    <div 
      ref={containerRef}
      className={`flex font-sans h-full min-h-full transition-all duration-700 ${isSmall ? 'flex-col' : 'flex-row'}`} 
      style={{ backgroundColor: secondaryColor }}
    >
      <div
        className={`flex-shrink-0 flex flex-col relative z-20 backdrop-blur-3xl transition-all duration-700 ${
          isSmall 
            ? 'w-full border-b shadow-md' 
            : 'w-64 border-r overflow-y-auto'
        }`}
        style={{
          backgroundColor: `${primaryColor}${isSmall ? 'F2' : 'E6'}`,
          borderColor: `${primaryColor}30`,
        }}
      >
        <div className={`flex items-center justify-between ${isSmall ? 'px-4 py-3' : 'px-4 py-5 border-b border-white/10'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {config.brand.logo ? (
              <img src={config.brand.logo} alt={config.brand.name} className={`${isSmall ? 'h-7' : 'h-10'} object-contain`} onError={e => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <h1 className={`${isSmall ? 'text-sm' : 'text-base'} font-black truncate`} style={{ color: sidebarTextColor }}>{config.brand.name}</h1>
            )}
          </div>
          {isSmall && step !== 'select' && (
            <button 
              onClick={onReset} 
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-white/10"
              style={{ color: sidebarTextColor }}
            >
              Reiniciar
            </button>
          )}
        </div>

        <div className={`p-3 border-b border-white/10 ${isSmall ? 'flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide' : 'space-y-1'}`}>
          {steps.map(s => (
            <div 
              key={s.num} 
              className={`flex items-center transition-all ${
                isSmall 
                  ? `flex-1 justify-center gap-1.5 px-1 py-2 rounded-xl text-[10px] ${s.active ? 'bg-white/20 text-white font-bold ring-1 ring-white/30' : 'text-white/50'}`
                  : `gap-2.5 px-2 py-2.5 rounded-xl text-sm ${s.active ? 'bg-white/20 text-white font-semibold' : s.done ? 'text-white/70' : 'text-white/40'}`
              }`}
            >
              <span
                className={`flex-shrink-0 rounded-full flex items-center justify-center font-bold ${
                  isSmall ? 'w-4 h-4 text-[8px]' : 'w-6 h-6 text-xs'
                } ${s.active ? 'bg-white' : s.done ? 'bg-white/35' : 'bg-white/10'}`}
                style={s.active ? { color: primaryColor } : {}}
              >
                {s.done ? (
                  <svg className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : s.num}
              </span>
              <span className="truncate">{s.label}</span>
            </div>
          ))}
        </div>

        {!isSmall && step === 'select' && (
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.15em] px-1 mb-3">Toca para elegir</p>
            {config.products.map(p => (
              <button
                key={p.id}
                onClick={() => onProductSelect(p)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left cursor-pointer transition-all duration-300 ${selectedProduct?.id === p.id ? 'bg-white/25 shadow-xl translate-x-1 ring-1 ring-white/20' : 'bg-white/5 hover:bg-white/15'}`}
              >
                <img src={p.imageUrl} alt={p.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[11px] font-black uppercase italic truncate tracking-tight">{p.name}</p>
                  {p.category && <p className="text-white/40 text-[9px] truncate tracking-wider uppercase">{p.category}</p>}
                </div>
                {selectedProduct?.id === p.id && (
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={primaryColor} strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
        {!isSmall && (
          <div className="px-4 md:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 backdrop-blur-md"
            style={{ backgroundColor: bgLuminance ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.5)', borderBottom: `1px solid ${mainBorderColor}` }}>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-tight italic" style={{ color: mainTextPrimary }}>
                {step === 'select' && 'Paso 1 — Elige un producto'}
                {step === 'upload' && 'Paso 2 — Sube tu foto'}
                {step === 'result' && 'Listo — Tu resultado'}
              </p>
            </div>
          </div>
        )}

        <div className={`flex-1 ${isSmall ? 'p-4' : 'p-6'}`}>
          <ErrorBanner error={error} isService={errorIsService} />
          <NoticeBanner notice={notice} />

          {step === 'upload' && (
             <div className="max-w-xl mx-auto space-y-6">
               <SelfieThumb preview={selfiePreview} onReset={onReset} />
               <SelfieUploader 
                 onUpload={onSelfieUpload} 
                 primaryColor={primaryColor} 
                 welcomeMessage={welcomeMessage} 
                 textColor={mainTextPrimary} 
                 mutedColor={mainTextMuted}
                 cardBg={mainCardBg}
                 cardBorder={mainBorderColor}
               />
               {/* Generar Action */}
               {selfiePreview && selectedProduct && (
                 <div className="sticky bottom-4 pt-4 mt-6 z-10">
                   <button
                     onClick={onGenerate}
                     className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-white text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                     style={{ backgroundColor: primaryColor }}
                   >
                     {generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
                   </button>
                 </div>
               )}
             </div>
          )}

          {step === 'select' && (
            <div className={`max-w-2xl mx-auto space-y-4 ${isSmall ? 'pb-24' : ''}`}>
              {/* Product Selector for Mobile */}
              {isSmall && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: mainTextMuted }}>Catálogo de productos</p>
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    {config.products.length > 0 ? (
                      config.products.map(p => (
                        <button
                          key={p.id}
                          onClick={() => onProductSelect(p)}
                          className={`flex flex-col rounded-2xl border-2 transition-all p-2 gap-2 text-left ${selectedProduct?.id === p.id ? 'ring-2 ring-primary/20 scale-[1.02]' : ''}`}
                          style={{ 
                            backgroundColor: mainCardBg, 
                            borderColor: selectedProduct?.id === p.id ? primaryColor : mainBorderColor 
                          }}
                        >
                          <div className="aspect-square rounded-xl overflow-hidden bg-white/5">
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-[10px] font-black uppercase italic truncate" style={{ color: mainTextPrimary }}>{p.name}</p>
                        </button>
                      ))
                    ) : (
                      <p className="col-span-2 text-center py-8 text-xs italic" style={{ color: mainTextMuted }}>No hay productos cargados</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Area */}
              {selectedProduct ? (
                <div 
                  className={`${isSmall ? 'fixed bottom-0 left-0 right-0 p-4 border-t z-30' : 'p-5 rounded-3xl border shadow-xl'}`}
                  style={{ 
                    backgroundColor: isSmall ? (bgLuminance ? 'rgba(255,255,255,0.95)' : 'rgba(15,15,15,0.95)') : mainCardBg, 
                    borderColor: mainBorderColor,
                    backdropFilter: isSmall ? 'blur(12px)' : 'none'
                  }}
                >
                  {!isSmall && (
                    <div className="flex items-center gap-4 mb-5">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                      <div>
                        <p className="text-sm font-black uppercase italic tracking-tight" style={{ color: mainTextPrimary }}>{selectedProduct.name}</p>
                        <p className="text-[11px] font-medium" style={{ color: mainTextMuted }}>Producto seleccionado</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={onProceedToUpload}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-white text-xs shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 30px ${primaryColor}40` }}
                  >
                    Siguiente: Subir foto
                  </button>
                </div>
              ) : !isSmall && (
                <div className="p-8 text-center rounded-3xl border-2 border-dashed" style={{ borderColor: mainBorderColor }}>
                   <p className="text-sm font-medium" style={{ color: mainTextMuted }}>Selecciona un producto del panel izquierdo para comenzar</p>
                </div>
              )}
            </div>
          )}

          {step === 'result' && resultImageUrl && (
             <div className="max-w-4xl mx-auto">
                <ResultDisplay
                  imageUrl={resultImageUrl}
                  productName={selectedProduct?.name || ''}
                  selfiePreview={selfiePreview}
                  onReset={onReset}
                  primaryColor={primaryColor}
                  generationId={generationId ?? undefined}
                  brandSlug={brandSlug}
                  brandName={config.brand.name}
                  brandPlan={config.brand.plan}
                  textColor={mainTextPrimary}
                  mutedColor={mainTextMuted}
                  cardBg={mainCardBg}
                  cardBorder={mainBorderColor}
                />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
