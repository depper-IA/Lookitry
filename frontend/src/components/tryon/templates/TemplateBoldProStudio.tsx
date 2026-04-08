'use client';

import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner, SelfieThumb } from './shared';
import { useState, useEffect, useRef } from 'react';

// Helper para determinar si un color es claro u oscuro
function isLightBg(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function TemplateBoldProStudio(props: TryOnTemplateProps) {
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

  // Colores adaptativos según el fondo
  const bgLuminance = isLightBg(secondaryColor || '#050505');
  const textPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';
  const textMuted = bgLuminance ? '#666666' : '#ffffffcc';
  const textSubtle = bgLuminance ? '#999999' : '#ffffff99';
  const borderColor = bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)';
  const cardBg = bgLuminance ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
  const cardBorder = bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)';

  return (
    <div 
      ref={containerRef}
      className="font-sans h-full min-h-full relative overflow-hidden flex flex-col" 
      style={{ backgroundColor: secondaryColor || '#050505', color: textPrimary }}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 opacity-100 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl transition-all duration-1000" style={{ background: `${primaryColor}25` }} />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl transition-all duration-1000" style={{ background: `${primaryColor}18` }} />
        {!bgLuminance && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />}
      </div>

      {/* Top bar (glass) */}
      <div className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ backgroundColor: bgLuminance ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)', borderColor }}>
        <div className={`w-full max-w-4xl mx-auto flex items-center justify-between gap-3 ${isSmall ? 'px-4 py-3' : 'px-6 py-4'}`}>
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            {config.brand.logo ? (
              <img
                src={config.brand.logo}
                alt={config.brand.name}
                className={`${isSmall ? 'h-7' : 'h-10'} w-auto object-contain`}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className={`font-black tracking-tight ${isSmall ? 'text-sm' : 'text-xl'}`} style={{ color: primaryColor }}>{config.brand.name}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {step !== 'upload' && (
              <button
                onClick={onReset}
                className={`uppercase tracking-widest font-black transition-all ${isSmall ? 'text-[9px] px-2 py-1' : 'text-[10px] px-3 py-1.5'} rounded-xl`}
                style={{ color: textMuted }}
                onMouseEnter={e => { e.currentTarget.style.color = textPrimary; e.currentTarget.style.backgroundColor = bgLuminance ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = textMuted; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Reset
              </button>
            )}
            <div className={`rounded-xl border font-black uppercase tracking-widest ${isSmall ? 'text-[8px] px-2 py-1' : 'text-[10px] px-3 py-1.5'}`} style={{ backgroundColor: bgLuminance ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', borderColor, color: textMuted }}>
              {step === 'upload' && '1/3'}
              {step === 'select' && '2/3'}
              {(step === 'result' || step === 'generating') && '3/3'}
            </div>
          </div>
        </div>
      </div>

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className={`w-full max-w-4xl mx-auto ${isSmall ? 'px-4 py-5' : 'px-6 py-10'}`}>
          {/* Hero */}
          <div className={`${isSmall ? 'mb-5' : 'mb-8'}`}>
            <h2 className={`${isSmall ? 'text-2xl' : 'text-5xl'} font-black tracking-tighter leading-none italic uppercase`} style={{ color: primaryColor }}>
              {welcomeMessage || 'Premium Try-On'}
            </h2>
            <p className={`mt-2 font-medium ${isSmall ? 'text-xs' : 'text-lg'} max-w-lg`} style={{ color: textMuted }}>
              Sube tu foto y descubre cómo te queda nuestra colección en tiempo real.
            </p>
          </div>

          {/* Flow card */}
          <div className={`rounded-3xl border backdrop-blur-2xl shadow-2xl transition-all duration-500`} style={{ backgroundColor: cardBg, borderColor }}>
            {/* Step header */}
            <div className={`${isSmall ? 'p-4' : 'p-6'} border-b`} style={{ borderBottomColor: borderColor }}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black italic" style={{ color: textSubtle }}>Fase Proceso</p>
                  <p className={`mt-1 font-black tracking-tighter uppercase italic ${isSmall ? 'text-base' : 'text-2xl'}`}>
                    {step === 'upload' && 'Captura tu Estilo'}
                    {step === 'select' && 'Personaliza Look'}
                    {step === 'generating' && 'Renderizando…'}
                    {step === 'result' && 'Masterpiece'}
                  </p>
                </div>
                <div className={`${isSmall ? 'w-20' : 'w-32'} h-2 rounded-full overflow-hidden mb-1 flex-shrink-0`} style={{ backgroundColor: borderColor }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: step === 'upload' ? '33.3%' : step === 'select' ? '66.6%' : '100%',
                      backgroundColor: primaryColor,
                      transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className={`${isSmall ? 'p-4' : 'p-8'}`}>
              <ErrorBanner error={error} isService={errorIsService} />
              <NoticeBanner notice={notice} />

              {step === 'upload' && (
                <SelfieUploader
                  onUpload={onSelfieUpload}
                  primaryColor={primaryColor}
                  welcomeMessage={welcomeMessage}
                  textColor={textPrimary}
                  mutedColor={textMuted}
                  cardBg="transparent"
                  cardBorder="transparent"
                />
              )}

              {step === 'select' && (
                <div className="space-y-6">
                  <SelfieThumb preview={selfiePreview} onReset={onReset} />
                  
                  <div className={`rounded-2xl border ${isSmall ? 'p-3' : 'p-5'}`} style={{ backgroundColor: 'rgba(0,0,0,0.1)', borderColor }}>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black mb-4 italic" style={{ color: textSubtle }}>
                      Selecciona una prenda
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
                      {config.products.map(p => {
                        const sel = selectedProduct?.id === p.id;
                        const alreadyGenerated = generatedProducts.has(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => onProductSelect(p)}
                            className={`flex-shrink-0 ${isSmall ? 'w-28' : 'w-36'} rounded-2xl overflow-hidden border-2 transition-all duration-300 relative group`}
                            style={{
                              borderColor: sel ? primaryColor : borderColor,
                              backgroundColor: bgLuminance ? '#ffffff' : 'rgba(255,255,255,0.03)',
                              transform: sel ? 'scale(1.05)' : 'scale(1)',
                              boxShadow: sel ? `0 0 20px ${primaryColor}40` : 'none'
                            }}
                          >
                            <div className="aspect-[4/5] bg-black/20 overflow-hidden">
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              {alreadyGenerated && (
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-black text-white border border-white/20">
                                  Visto
                                </div>
                              )}
                              {sel && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={primaryColor} strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-2 text-center">
                              <p className="text-[10px] font-black uppercase italic truncate" style={{ color: textPrimary }}>{p.name}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 'result' && resultImageUrl && (
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
                  textColor={textPrimary}
                  mutedColor={textMuted}
                  cardBg="transparent"
                  cardBorder="transparent"
                />
              )}
            </div>

            {/* Bottom action bar */}
            {(step === 'select' || step === 'upload') && (
              <div className={`${isSmall ? 'p-4' : 'p-8'} border-t mt-auto`} style={{ backgroundColor: 'rgba(0,0,0,0.15)', borderTopColor: borderColor }}>
                {step === 'select' ? (
                  <>
                    <button
                      onClick={onProceedToUpload}
                      disabled={!selectedProduct}
                      className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                      style={{ backgroundColor: primaryColor, color: '#ffffff', boxShadow: `0 15px 35px ${primaryColor}60` }}
                    >
                      <span className="mb-0.5">Siguiente: Subir Foto</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onGenerate}
                      disabled={!selfiePreview || !selectedProduct}
                      className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                      style={{ backgroundColor: primaryColor, color: '#ffffff', boxShadow: `0 15px 35px ${primaryColor}60` }}
                    >
                      <span className="mb-0.5">{selectedProduct && generatedProducts.has(selectedProduct.id) ? 'Recuperar Look' : buttonText}</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                    <p className="text-center text-[9px] mt-4 font-black uppercase tracking-widest opacity-50">
                      {selectedProduct && generatedProducts.has(selectedProduct.id) ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
