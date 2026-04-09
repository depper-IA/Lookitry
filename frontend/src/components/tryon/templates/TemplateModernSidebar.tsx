'use client';

import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner, SelfieThumb } from './shared';
import { useState, useEffect, useRef } from 'react';

// ── Neo-Luxury Modern Sidebar ────────────────────────────────────────────────

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
      setIsSmall(width < 768);
    });

    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

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
  const mainCardBg = bgLuminance ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)';

  // Generar paleta de color derivada
  const primaryDark = bgLuminance ? adjustBrightness(primaryColor, -30) : adjustBrightness(primaryColor, -20);
  const primaryGlow = `${primaryColor}40`;
  const primarySubtle = `${primaryColor}15`;

  if (step === 'generating') {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 relative overflow-hidden" style={{ backgroundColor: secondaryColor }}>
        {/* Ambient glow */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
      </div>
    );
  }

  const steps = [
    { num: 1, label: isSmall ? 'Producto' : 'Elige un producto', active: step === 'select', done: step === 'select' && selfiePreview !== null },
    { num: 2, label: isSmall ? 'Foto' : 'Sube tu foto', active: step === 'upload', done: step === 'result' },
    { num: 3, label: isSmall ? 'Listo' : 'Ve el resultado', active: step === 'result', done: false },
  ];

  return (
    <div 
      ref={containerRef}
      className={`flex font-sans h-full min-h-full ${isSmall ? 'flex-col' : 'flex-row'}`} 
      style={{ backgroundColor: secondaryColor }}
    >
      {/* ── Sidebar / Header ───────────────────────────────────────────── */}
      <div
        className={`relative flex flex-col z-20 transition-all duration-500 ${
          isSmall 
            ? 'w-full border-b shadow-lg' 
            : 'w-72 border-r shadow-2xl'
        }`}
        style={{
          background: isSmall 
            ? `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor} 100%)`
            : `linear-gradient(180deg, ${primaryColor}08 0%, ${secondaryColor} 100%)`,
        }}
      >
        {/* Decorative top accent */}
        <div 
          className={`absolute ${isSmall ? 'top-0 left-0 right-0 h-1' : 'top-0 left-0 bottom-0 w-1'}`}
          style={{ background: `linear-gradient(${isSmall ? 'to right' : 'to bottom'}, ${primaryColor}, ${primaryColor}40)` }}
        />

        {/* Header */}
        <div className={`flex items-center justify-between ${isSmall ? 'px-4 py-3' : 'px-5 py-5'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {config.brand.logo ? (
              <div className="relative">
                <img 
                  src={config.brand.logo} 
                  alt={config.brand.name} 
                  className={`${isSmall ? 'h-8' : 'h-10'} w-auto object-contain relative z-10`} 
                  onError={e => { e.currentTarget.style.display = 'none'; }} 
                />
                <div 
                  className="absolute inset-0 blur-xl opacity-30"
                  style={{ background: primaryColor }}
                />
              </div>
            ) : (
              <h1 className={`${isSmall ? 'text-sm' : 'text-base'} font-black truncate tracking-tight`} style={{ color: primaryColor }}>
                {config.brand.name}
              </h1>
            )}
          </div>
          {isSmall && step !== 'select' && (
            <button 
              onClick={onReset} 
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ 
                color: mainTextMuted,
                backgroundColor: mainCardBg,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              Reiniciar
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div 
          className={`${isSmall 
            ? 'flex items-center justify-between gap-2 px-4 py-3 border-t border-b' 
            : 'px-4 py-5 space-y-2'
          }`}
          style={{ borderColor: `${primaryColor}20` }}
        >
          {steps.map((s, idx) => (
            <div 
              key={s.num} 
              className={`flex items-center transition-all duration-300 ${
                isSmall 
                  ? `flex-1 justify-center gap-1.5 py-2 rounded-xl ${
                      s.active ? 'shadow-lg scale-105' : ''
                    }`
                  : `gap-3 px-3 py-2.5 rounded-xl ${
                      s.active ? 'shadow-md' : ''
                    }`
              }`}
              style={{
                backgroundColor: s.active 
                  ? `${primaryColor}20` 
                  : s.done 
                    ? `${primaryColor}10` 
                    : 'transparent',
                ...(s.active && !isSmall && { boxShadow: `0 4px 15px ${primaryGlow}` }),
              }}
            >
              {/* Step indicator */}
              <div 
                className={`flex-shrink-0 rounded-full flex items-center justify-center font-black transition-all ${
                  isSmall ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'
                } ${s.active ? 'text-white shadow-lg' : s.done ? 'text-white/80' : 'text-white/40'}`}
                style={{ 
                  backgroundColor: s.active 
                    ? primaryColor 
                    : s.done 
                      ? `${primaryColor}80` 
                      : 'rgba(255,255,255,0.1)',
                  boxShadow: s.active ? `0 4px 12px ${primaryGlow}` : 'none'
                }}
              >
                {s.done ? (
                  <svg className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s.num}
              </div>
              
              {!isSmall && (
                <span 
                  className={`text-sm font-semibold tracking-wide transition-colors ${
                    s.active ? 'text-white' : s.done ? 'text-white/70' : 'text-white/40'
                  }`}
                >
                  {s.label}
                </span>
              )}
              
              {/* Connector line (desktop only) */}
              {!isSmall && idx < steps.length - 1 && (
                <div 
                  className="absolute left-[22px] top-full h-4 w-0.5 -mt-1"
                  style={{ backgroundColor: s.done ? primaryColor : 'rgba(255,255,255,0.1)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Product List (Desktop Sidebar) */}
        {!isSmall && step === 'select' && (
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em] px-2 mb-3">
              <span style={{ color: primaryColor }}>↓</span> Toca para elegir
            </p>
            {config.products.map((p, idx) => {
              const isSelected = selectedProduct?.id === p.id;
              const wasGenerated = generatedProducts.has(p.id);
              
              return (
                <button
                  key={p.id}
                  onClick={() => onProductSelect(p)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left cursor-pointer transition-all duration-300 group ${
                    isSelected ? 'shadow-xl ring-2' : 'hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: isSelected 
                      ? `${primaryColor}25` 
                      : 'rgba(255,255,255,0.05)',
                    animationDelay: `${idx * 30}ms`,
                    transform: isSelected ? 'translateX(4px)' : 'none',
                    ['--tw-ring-color' as string]: primaryColor,
                  }}
                >
                  <div className="relative">
                    <img 
                      src={p.imageUrl} 
                      alt={p.name} 
                      className={`${isSelected ? 'ring-2' : ''} w-12 h-12 rounded-xl object-cover shadow-md transition-all`}
                      style={{ 
                        ringColor: primaryColor,
                        boxShadow: isSelected ? `0 4px 12px ${primaryGlow}` : '0 2px 8px rgba(0,0,0,0.2)'
                      }} 
                    />
                    {wasGenerated && !isSelected && (
                      <div 
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-md"
                        style={{ backgroundColor: '#10b981' }}
                      >
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[11px] font-black uppercase italic truncate tracking-tight">{p.name}</p>
                    {p.category && (
                      <p className="text-white/40 text-[9px] truncate tracking-wider uppercase mt-0.5">{p.category}</p>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-pulse"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
        {/* Top bar (desktop) */}
        {!isSmall && (
          <div 
            className="sticky top-0 z-20 px-6 py-4 border-b backdrop-blur-xl transition-all duration-300"
            style={{ 
              backgroundColor: bgLuminance ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
              borderColor: mainBorderColor,
              boxShadow: '0 4px 30px rgba(0,0,0,0.05)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Step badge */}
                <div 
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style={{ 
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                    boxShadow: `0 2px 10px ${primaryGlow}`
                  }}
                >
                  {step === 'select' && 'Paso 1'}
                  {step === 'upload' && 'Paso 2'}
                  {step === 'result' && 'Paso 3'}
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
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
                <span style={{ color: mainTextMuted }}>En vivo</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className={`flex-1 ${isSmall ? 'p-4' : 'p-6 lg:p-8'}`}>
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
                <div className="sticky bottom-4 pt-4 mt-6 z-20">
                  <button
                    onClick={onGenerate}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    style={{ 
                      backgroundColor: primaryColor,
                      boxShadow: `0 8px 30px ${primaryGlow}`,
                    }}
                  >
                    {generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <p className="text-center text-[10px] mt-3 font-medium" style={{ color: mainTextMuted }}>
                    {generatedProducts.has(selectedProduct.id) ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'select' && (
            <div className={`max-w-4xl mx-auto space-y-6 ${isSmall ? 'pb-32' : ''}`}>
              {/* Mobile Product Grid */}
              {isSmall && (
                <div className="space-y-4">
                  {/* Selfie Preview Card */}
                  {selfiePreview && (
                    <div 
                      className="relative p-4 rounded-2xl shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${primarySubtle} 0%, ${mainCardBg} 100%)`,
                        border: `1px solid ${primaryColor}30`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={selfiePreview} 
                          alt="Tu foto" 
                          className="w-14 h-14 rounded-xl object-cover shadow-md ring-2 ring-white/20" 
                        />
                        <div className="flex-1">
                          <p className="text-xs font-black uppercase italic" style={{ color: primaryColor }}>Foto lista</p>
                          <p className="text-[10px] font-medium mt-0.5" style={{ color: mainTextMuted }}>Selecciona un producto</p>
                        </div>
                        <button
                          onClick={onReset}
                          className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg"
                          style={{ 
                            color: mainTextMuted,
                            backgroundColor: 'rgba(0,0,0,0.05)'
                          }}
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section header */}
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: mainTextPrimary }}>
                      Catálogo
                    </p>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {config.products.length > 0 ? (
                      config.products.map((p, idx) => {
                        const isSelected = selectedProduct?.id === p.id;
                        const wasGenerated = generatedProducts.has(p.id);
                        
                        return (
                          <button
                            key={p.id}
                            onClick={() => onProductSelect(p)}
                            className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                              isSelected ? 'ring-2 scale-[1.03] shadow-xl' : 'hover:scale-[1.01] active:scale-[0.98]'
                            }`}
                            style={{
                              animationDelay: `${idx * 40}ms`,
                              '--ring-color': primaryColor,
                            } as React.CSSProperties}
                          >
                            {/* Glow effect when selected */}
                            {isSelected && (
                              <div 
                                className="absolute inset-0 -z-10"
                                style={{ 
                                  background: `radial-gradient(circle at center, ${primaryGlow}, transparent 70%)`,
                                  filter: 'blur(10px)'
                                }}
                              />
                            )}
                            
                            <div 
                              className="rounded-2xl overflow-hidden"
                              style={{ 
                                backgroundColor: mainCardBg,
                                boxShadow: isSelected 
                                  ? `0 8px 30px ${primaryGlow}, 0 0 0 2px ${primaryColor}` 
                                  : '0 4px 15px rgba(0,0,0,0.1)',
                              }}
                            >
                              <div className="relative aspect-square overflow-hidden">
                                <img 
                                  src={p.imageUrl} 
                                  alt={p.name} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                />
                                
                                {/* Badges */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                  {wasGenerated && !isSelected && (
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-emerald-500">
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-2.5">
                                <p 
                                  className="text-[11px] font-black uppercase italic truncate tracking-tight"
                                  style={{ color: isSelected ? primaryColor : mainTextPrimary }}
                                >
                                  {p.name}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-12">
                        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: mainCardBg }}>
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: mainTextMuted }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium" style={{ color: mainTextMuted }}>No hay productos cargados</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Product Card (Desktop) */}
              {!isSmall && selectedProduct && (
                <div 
                  className="relative p-6 rounded-3xl shadow-2xl overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${mainCardBg} 0%, ${primarySubtle} 100%)`,
                    border: `1px solid ${primaryColor}30`,
                    boxShadow: `0 20px 60px ${primaryGlow}`,
                  }}
                >
                  {/* Glow effect */}
                  <div 
                    className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-2xl opacity-20"
                    style={{ backgroundColor: primaryColor }}
                  />
                  
                  <div className="relative flex items-center gap-5">
                    <div className="relative">
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.name} 
                        className="w-20 h-20 rounded-2xl object-cover shadow-xl" 
                      />
                      <div 
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: primaryColor }}>Producto seleccionado</p>
                      <h3 className="text-lg font-black italic tracking-tight" style={{ color: mainTextPrimary }}>{selectedProduct.name}</h3>
                      {selectedProduct.category && (
                        <p className="text-xs font-medium mt-1" style={{ color: mainTextMuted }}>{selectedProduct.category}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={onProceedToUpload}
                      className="px-6 py-3 rounded-2xl font-black uppercase tracking-[0.1em] text-xs text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-100 transition-all flex items-center gap-2"
                      style={{ 
                        backgroundColor: primaryColor,
                        boxShadow: `0 8px 30px ${primaryGlow}`
                      }}
                    >
                      Siguiente
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop Empty State */}
              {!isSmall && !selectedProduct && (
                <div 
                  className="p-12 text-center rounded-3xl border-2 border-dashed"
                  style={{ borderColor: `${primaryColor}30`, backgroundColor: `${primarySubtle}` }}
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${primaryColor}10` }}>
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: primaryColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: mainTextPrimary }}>Selecciona un producto</h3>
                  <p className="text-sm font-medium" style={{ color: mainTextMuted }}>Toca cualquier producto en el panel izquierdo para comenzar</p>
                </div>
              )}
            </div>
          )}

          {step === 'result' && resultImageUrl && (
            <div className="max-w-5xl mx-auto">
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

// Helper para ajustar brillo de color
function adjustBrightness(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
