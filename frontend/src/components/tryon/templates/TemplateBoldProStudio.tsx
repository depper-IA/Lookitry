'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import { TermsCheckbox } from '../TermsCheckbox';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner } from './shared';
import { useRef } from 'react';
import { useDeviceSize } from './hooks/useDeviceSize';

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
    shareMessage,
    selfiePreview,
    selectedProduct,
    resultImageUrl,
    generationId,
    error,
    errorIsService,
    errorIsContentPolicy,
    notice,
    generatedProducts,
    onReset,
    onSelfieReset,
    onSelfieUpload,
    onProductSelect,
    onProductReset,
    onProceedToUpload,
    onGenerate,
    termsAccepted,
    onTermsAccepted,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const isSmall = useDeviceSize(props.forcedLayout);

  // Colores adaptativos según el fondo
  const bgLuminance = isLightBg(secondaryColor || '#050505');
  const textPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';
  const textMuted = bgLuminance ? '#666666' : '#ffffffcc';
  const textSubtle = bgLuminance ? '#999999' : '#ffffff99';
  const borderColor = bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)';
  const cardBg = bgLuminance ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
  const cardBorder = bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)';

  // Force dark background for non-light mode, brand color for light mode
  const bgColor = bgLuminance ? secondaryColor : '#0a0a0a';

  return (
    <div
      ref={containerRef}
      className="font-sans min-h-screen min-h-[100dvh] w-full relative overflow-hidden flex flex-col"
      style={{ backgroundColor: bgColor, color: textPrimary, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {config.brand.widgetCoverImage && (
        <div className="absolute top-0 left-0 right-0 h-[45vh] md:h-[55vh] pointer-events-none z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.85] mix-blend-luminosity"
            style={{ backgroundImage: `url(${config.brand.widgetCoverImage})` }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, transparent 0%, ${bgColor} 100%)` }}
          />
        </div>
      )}
      {/* Ambient background - responsive sizes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {!bgLuminance && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_40%)]" />}
      </div>


      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto relative z-10 flex flex-col items-center justify-center py-8 md:py-12">
        <div className={`w-full mx-auto ${isSmall ? 'px-4' : 'px-8 md:px-12'} animate-in fade-in slide-in-from-bottom-4 duration-700`}
          style={isSmall ? {} : { maxWidth: '1400px' }}
        >
          {/* Hero / Welcome */}
          <div className={`${isSmall ? 'mb-8' : 'mb-16'} flex flex-col items-center text-center`}>
            {/* Logo Container with Glow */}
            <div className={`relative group ${isSmall ? 'mb-6' : 'mb-10'} animate-in zoom-in duration-700`}>
              <div
                className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                style={{ background: primaryColor }}
              />
              <div className={`relative z-10 p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10 shadow-xl transition-transform duration-700 group-hover:scale-102`}>
                {config.brand.logo ? (
                  <img
                    src={config.brand.logo}
                    alt={config.brand.name}
                    className={`${isSmall ? 'h-16' : 'h-28 md:h-32'} w-auto object-contain`}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className={`${isSmall ? 'h-16 w-16' : 'h-28 w-28 md:h-32 md:w-32'} flex items-center justify-center`}>
                    <span className={`font-black italic ${isSmall ? 'text-4xl' : 'text-6xl md:text-7xl'}`} style={{ color: primaryColor }}>
                      {config.brand.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Brand Name & Title */}
            <div className={`space-y-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 ${isSmall ? 'delay-300' : 'w-full max-w-3xl'}`}>
              <h1
                className={`${isSmall ? 'text-2xl' : 'text-5xl md:text-6xl lg:text-7xl'} font-black tracking-tighter uppercase italic leading-none`}
                style={{ color: textPrimary }}
              >
                {config.brand.name}
              </h1>

              <div className="flex flex-col items-center gap-4 md:gap-6">
                <div className={`${isSmall ? 'w-12 h-1.5' : 'w-20 h-2'} rounded-full`} style={{ backgroundColor: primaryColor }} />
                <h2
                  className={`${isSmall ? 'text-sm' : 'text-2xl md:text-3xl'} font-bold tracking-[0.3em] uppercase opacity-70 italic max-w-2xl mx-auto`}
                  style={{ color: textPrimary }}
                >
                  {welcomeMessage || `Catálogo de ${config.brand.name}`}
                </h2>
              </div>
            </div>
          </div>

          {/* Content wrapper - full width on desktop, card in center on mobile */}
          <div className={isSmall ? '' : 'flex items-center justify-center'}>
            {/* Flow card */}
            <div className={`rounded-3xl border bg-white/5 shadow-xl transition-all duration-500 w-full mx-auto ${isSmall ? '' : 'max-w-5xl lg:max-w-6xl'}`} style={{ backgroundColor: cardBg, borderColor }}>
              {/* Step header with integrated controls */}
              <div className={`${isSmall ? 'p-4' : 'p-6 lg:p-8'} border-b`} style={{ borderBottomColor: borderColor }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black italic opacity-50" style={{ color: textPrimary }}>Paso Actual</p>
                    <p className={`mt-0.5 font-black tracking-tighter uppercase italic truncate ${isSmall ? 'text-base' : 'text-2xl md:text-3xl'}`}>
                      {step === 'upload' && 'Sube tu foto'}
                      {step === 'select' && 'Personaliza tu look'}
                      {step === 'generating' && 'Procesando...'}
                      {step === 'result' && 'Resultado'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {step !== 'upload' && (
                      <button
                        onClick={onReset}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: cardBg, color: textMuted, border: `1px solid ${borderColor}` }}
                      >
                        Reset
                      </button>
                    )}
                    <div className="px-3 py-1.5 rounded-xl border font-black uppercase tracking-widest text-[10px]" style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30`, color: primaryColor }}>
                      {props.lockProductSelection ? (
                        <>{step === 'upload' ? '1/2' : '2/2'}</>
                      ) : (
                        <>{step === 'select' ? '1/3' : step === 'upload' ? '2/3' : '3/3'}</>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className={`${isSmall ? 'p-4' : 'p-8 lg:p-10'}`}>
                <ErrorBanner
                  error={error}
                  isService={errorIsService}
                  isContentPolicy={errorIsContentPolicy}
                  onDismiss={props.onDismissError}
                  textColor={textPrimary}
                  mutedColor={textMuted}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                />
                <NoticeBanner notice={notice} onDismiss={props.onDismissNotice} />

                {/* Generating State */}
                {step === 'generating' && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <GenerationLoader
                      productName={selectedProduct?.name || ''}
                      primaryColor={primaryColor}
                      textColor={textPrimary}
                      mutedColor={textMuted}
                    />
                  </div>
                )}

                {step === 'upload' && (
                  <div className={`space-y-6 mx-auto ${isSmall ? '' : 'max-w-xl sm:max-w-2xl'}`}>
                    <SelfieUploader
                      onUpload={onSelfieUpload}
                      onReset={onReset}
                      onSelfieReset={onSelfieReset}
                      onBack={onProductReset}
                      currentPreview={selfiePreview}
                      selectedProduct={selectedProduct}
                      primaryColor={primaryColor}
                      welcomeMessage={welcomeMessage}
                      textColor={textPrimary}
                      mutedColor={textMuted}
                      cardBg="transparent"
                      cardBorder="transparent"
                    />
                  </div>
                )}

                {step === 'select' && (
                  <div className={`space-y-6 mx-auto ${isSmall ? '' : 'max-w-4xl'}`}>
                    {selfiePreview && (
                      <SelfieUploader
                        onUpload={onSelfieUpload}
                        onReset={onReset}
                        onSelfieReset={onSelfieReset}
                        currentPreview={selfiePreview}
                        selectedProduct={selectedProduct}
                        primaryColor={primaryColor}
                        textColor={textPrimary}
                        mutedColor={textMuted}
                        cardBg="transparent"
                        cardBorder="transparent"
                      />
                    )}

                    <div className={`rounded-2xl border ${isSmall ? 'p-3' : 'p-6 lg:p-8'}`} style={{ backgroundColor: 'rgba(0,0,0,0.1)', borderColor }}>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black mb-4 md:mb-6 italic" style={{ color: textSubtle }}>
                        Selecciona una prenda
                      </p>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 sm:gap-4 lg:gap-6 justify-center">
                        {config.products.map(p => {
                          const sel = selectedProduct?.id === p.id;
                          const alreadyGenerated = generatedProducts.has(p.id);

                          return (
                            <button
                              key={p.id}
                              onClick={() => onProductSelect(p)}
                              className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-300 relative group w-full`}
                              style={{
                                borderColor: sel ? primaryColor : borderColor,
                                backgroundColor: bgLuminance ? '#ffffff' : 'rgba(255,255,255,0.03)',
                                transform: sel ? 'scale(1.02)' : 'scale(1)',
                                boxShadow: sel ? `0 0 20px ${primaryColor}40` : '0 4px 12px rgba(0,0,0,0.15)'
                              }}
                            >
                              <div className="aspect-[1/1] bg-black/5 overflow-hidden relative">
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

                                {/* Badges superiores */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                                  {/* Badge de producto */}
                                  {p.badge && (
                                    <span className="px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-white shadow-lg"
                                      style={{ background: p.badge === 'nuevo' ? '#10B981' : p.badge === 'top' ? '#F59E0B' : '#EF4444' }}>
                                      {p.badge}
                                    </span>
                                  )}
                                  {/* Badge de visto */}
                                  {alreadyGenerated && (
                                    <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-1"
                                      style={{ backgroundColor: `${primaryColor}CC` }}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                      Visto
                                    </span>
                                  )}
                                </div>

                                {/* Precio */}
                                {p.price != null && (
                                  <div className="absolute top-2 right-2">
                                    <span className="px-2 py-1 rounded-lg text-[10px] font-black text-white shadow-lg"
                                      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                                      ${p.price.toLocaleString('es-CO')}
                                    </span>
                                  </div>
                                )}

                                {/* Overlay de selección */}
                                {sel && (
                                  <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-xl" style={{ backgroundColor: primaryColor }}>
                                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Info del producto */}
                              <div className={`p-2 md:p-3 text-center ${isSmall ? 'min-h-[48px]' : 'min-h-[60px] md:min-h-[72px]'} flex flex-col items-center justify-center`}>
                                <p className="text-[10px] md:text-xs font-black uppercase italic truncate max-w-full leading-tight" style={{ color: textPrimary }}>{p.name}</p>

                                {/* Categoría */}
                                {p.category && (
                                  <span className="mt-1.5 px-2 py-0.5 rounded text-[8px] md:text-[9px] font-semibold uppercase tracking-wider shadow" style={{ color: textMuted, backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                    {p.category}
                                  </span>
                                )}

                                {/* Descripción corta */}
                                {p.shortDescription && (
                                  <p className="mt-1 text-[8px] md:text-[9px] truncate max-w-full px-1 hidden sm:block" style={{ color: textMuted }}>{p.shortDescription}</p>
                                )}

                                {/* Atributos */}
                                {p.attributes && Object.keys(p.attributes).length > 0 && (
                                  <div className="mt-2 flex flex-wrap justify-center gap-1 px-1">
                                    {p.attributes.material && (
                                      <span className="text-[7px] md:text-[8px]" style={{ color: textMuted }}>{p.attributes.material}</span>
                                    )}
                                    {p.attributes.medida_pulgadas && (
                                      <span className="text-[7px] md:text-[8px]" style={{ color: textMuted }}>{p.attributes.medida_pulgadas}&quot;</span>
                                    )}
                                    {p.attributes.marca && (
                                      <span className="text-[7px] md:text-[8px]" style={{ color: textMuted }}>{p.attributes.marca}</span>
                                    )}
                                    {p.attributes.tallas && Array.isArray(p.attributes.tallas) && (
                                      <span className="text-[7px] md:text-[8px]" style={{ color: textMuted }}>{p.attributes.tallas.slice(0, 3).join(', ')}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {step === 'result' && resultImageUrl && (
                  <div className={isSmall ? '' : 'max-w-5xl mx-auto'}>
                    <ResultDisplay
                      imageUrl={resultImageUrl}
                      productName={selectedProduct?.name || ''}
                      productPrice={selectedProduct?.price}
                      selfiePreview={selfiePreview}
                      onReset={onReset}
                      primaryColor={primaryColor}
                      generationId={generationId ?? undefined}
                      brandSlug={brandSlug}
                      brandName={config.brand.name}
                      brandPlan={config.brand.plan}
                      shareMessage={shareMessage}
                      pluginView={props.pluginView}
                      textColor={textPrimary}
                      mutedColor={textMuted}
                      cardBg="transparent"
                      cardBorder="transparent"
                      whatsappContact={config.brand.whatsappContact ?? null}
                    />
                  </div>
                )}
              </div>

              {/* Bottom action bar with safe area */}
              {(step === 'select' || step === 'upload') && (
                <div
                  className={`${isSmall ? 'p-4' : 'p-8 lg:p-10'} border-t mt-auto`}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    borderTopColor: borderColor,
                    paddingBottom: isSmall ? 'max(env(safe-area-inset-bottom), 16px)' : undefined,
                  }}
                >
                  {step === 'select' ? (
                    <>
                      <button
                        onClick={onProceedToUpload}
                        disabled={!selectedProduct}
                        className="w-full py-4 md:py-5 lg:py-6 rounded-xl font-black uppercase tracking-[0.2em] text-sm md:text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-3 relative overflow-hidden group"
                        style={{ backgroundColor: primaryColor, color: '#ffffff', boxShadow: `0 15px 45px ${primaryColor}60` }}
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative z-10">{buttonText || 'Siguiente: Subir Foto'}</span>
                        <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={onGenerate}
                        disabled={!selfiePreview || !selectedProduct}
                        className="w-full py-4 md:py-5 lg:py-6 rounded-xl font-black uppercase tracking-[0.2em] text-sm md:text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-3"
                        style={{ backgroundColor: primaryColor, color: '#ffffff', boxShadow: `0 15px 35px ${primaryColor}60` }}
                      >
                        <span>{selectedProduct && generatedProducts.has(selectedProduct.id) ? 'Recuperar Look' : buttonText}</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </button>
                      {/* Terms checkbox - solo se muestra si NO está aceptado */}
                      {!termsAccepted && (
                        <TermsCheckbox
                          onAccepted={onTermsAccepted}
                          isAccepted={termsAccepted}
                          primaryColor={primaryColor}
                          textColor={textPrimary}
                          mutedColor={textMuted}
                        />
                      )}
                      <p className="text-center text-[11px] md:text-sm mt-4 font-medium" style={{ color: textMuted }}>
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
    </div>
  );
}
