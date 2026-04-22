'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, NoticeBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT } from './shared';
import { isLightBg } from './shared';
import { EditorialHeader } from './components/EditorialHeader';
import { SelfiePreviewEditorial } from './components/SelfiePreviewEditorial';
import { ProductGridEditorial } from './components/ProductGridEditorial';
import { BottomCTAEditorial } from './components/BottomCTAEditorial';

// ── Template Showcase: Editorial Fashion Vitrine ──────────────────────────────
export function TemplateShowcase(props: TryOnTemplateProps) {
  const {
    step,
    config,
    brandSlug,
    pluginView,
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
    if (props.forcedLayout) {
      setIsSmall(props.forcedLayout === 'mobile');
      return;
    }

    if (!containerRef.current) return;

    const obs = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setIsSmall(width < 768);
    });

    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [props.forcedLayout]);

  const bgLuminance = isLightBg(secondaryColor || '#ffffff');
  const textPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';
  const textMuted = bgLuminance ? '#666666' : '#ffffffcc';
  const cardBg = bgLuminance ? '#ffffff' : 'rgba(255,255,255,0.05)';

  const solidBg = bgLuminance ? secondaryColor : '#0a0a0a';

  if (step === 'generating') {
    return (
      <div className="flex flex-col min-h-screen min-h-[100dvh]" style={{ backgroundColor: solidBg }}>
        <EditorialHeader config={config} onReset={onReset} primaryColor={primaryColor} bgLuminance={bgLuminance} textMuted={textMuted} secondaryColor={secondaryColor} />
        <div className="flex-1 flex items-center justify-center">
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col font-sans min-h-screen min-h-[100dvh] overflow-y-auto overflow-x-hidden"
      style={{ backgroundColor: solidBg }}
    >
      <EditorialHeader
        config={config}
        onReset={onReset}
        showReset={step !== 'upload'}
        primaryColor={primaryColor}
        bgLuminance={bgLuminance}
        textMuted={textMuted}
        secondaryColor={secondaryColor}
      />

      <div className="flex-1 w-full relative">
        <ErrorBanner
          error={error}
          isService={errorIsService}
          onDismiss={props.onDismissError}
          textColor={textPrimary}
          mutedColor={textMuted}
          cardBg={cardBg}
        />
        <NoticeBanner notice={notice} onDismiss={props.onDismissNotice} />

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col min-h-[calc(100vh-64px)]"
            >
              {selfiePreview && selectedProduct && (
                <div className="w-full px-4 pt-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ backgroundColor: cardBg, border: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}` }}
                  >
                    <img src={selfiePreview} alt="Tu foto" className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase italic" style={{ color: primaryColor }}>
                        Foto lista
                      </p>
                      <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: textMuted }}>
                        {selectedProduct.name}
                      </p>
                    </div>
                    <button
                      onClick={onReset}
                      className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all hover:bg-white/10"
                      style={{ color: textMuted }}
                    >
                      Cambiar
                    </button>
                  </motion.div>
                </div>
              )}

              {isSmall ? (
                <div className="flex-1 flex flex-col">
                  <div className="relative w-full" style={{ minHeight: '45vh' }}>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(to bottom, transparent 40%, ${solidBg}), url(${config.brand.coverImageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />

                    <div className="absolute top-6 left-6 right-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {config.brand.logo ? (
                            <img src={config.brand.logo} alt={config.brand.name} className="h-10 w-auto object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                              <span className="font-black text-lg italic text-white">{config.brand.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 italic" style={{ color: textPrimary }}>Prueba Virtual</span>
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-[1px] flex-1 bg-current opacity-20" />
                        <div className="w-1.5 h-1.5 rounded-full rotate-45" style={{ backgroundColor: primaryColor }} />
                        <div className="h-[1px] flex-1 bg-current opacity-20" />
                      </div>
                      <h1 className="text-4xl font-black tracking-tight italic uppercase leading-none" style={{ color: textPrimary }}>
                        {config.brand.name}
                      </h1>
                    </div>
                  </div>

                  <div className="flex-1 px-6 py-8 space-y-6">
                    <div className="text-center space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.5em] opacity-30 italic" style={{ color: textPrimary }}>
                        Try it on
                      </p>
                      <p className="text-sm font-medium opacity-60" style={{ color: textMuted }}>
                        Upload your photo to see how it looks
                      </p>
                    </div>

                    <div className="w-full">
                      <SelfieUploader
                        onUpload={onSelfieUpload}
                        primaryColor={primaryColor}
                        privacyNotice="Tu selfie solo se usa en tu navegador y se elimina al instante"
                        textColor={textPrimary}
                        mutedColor={textMuted}
                        cardBg={cardBg}
                        cardBorder={bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    <div className="w-full flex justify-center pt-2">
                      <button
                        onClick={props.onBack}
                        className="group flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all border border-white/10 hover:bg-white/5 active:scale-95"
                        style={{ color: textMuted }}
                      >
                        <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver al catálogo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 sm:px-6 md:px-8 lg:px-12 py-12 w-full max-w-3xl mx-auto">
                  <div className={`relative ${isSmall ? 'mb-10' : 'mb-12'}`}>
                    <div className={`relative z-10 p-5 sm:p-6 rounded-2xl border shadow-[0_4px_24px_rgba(0,0,0,0.12)]`}
                      style={{
                        backgroundColor: bgLuminance ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.08)',
                        borderColor: bgLuminance ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'
                      }}>
                      {config.brand.logo ? (
                        <img
                          src={config.brand.logo}
                          alt={config.brand.name}
                          className={`${isSmall ? 'h-16' : 'h-20 sm:h-24 md:h-28'} w-auto object-contain`}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className={`${isSmall ? 'h-16 w-16' : 'h-20 sm:h-24 md:h-28 w-20 sm:w-24 md:w-28'} flex items-center justify-center`}>
                          <span className="font-black text-5xl sm:text-6xl italic" style={{ color: primaryColor }}>
                            {config.brand.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 px-4">
                    <h1
                      className={`${isSmall ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl'} font-black tracking-[-0.05em] uppercase italic leading-none`}
                      style={{ color: textPrimary }}
                    >
                      {config.brand.name}
                    </h1>

                    <div className="flex flex-col items-center gap-6">
                      <div className="flex items-center gap-4 w-full max-w-[200px]">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-current opacity-20" />
                        <div className="w-2 h-2 rounded-full rotate-45" style={{ backgroundColor: primaryColor }} />
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-current opacity-20" />
                      </div>

                      <p
                        className={`${isSmall ? 'text-xs' : 'text-xs sm:text-sm md:text-base'} font-black uppercase tracking-[0.4em] opacity-40 italic max-w-xs mx-auto`}
                        style={{ color: textPrimary }}
                      >
                        Prueba Virtual
                      </p>
                    </div>
                  </div>

                  <div className="w-full max-w-md px-4 mt-10">
                    <SelfieUploader
                      onUpload={onSelfieUpload}
                      primaryColor={primaryColor}
                      privacyNotice="Tu selfie solo se usa en tu navegador y se elimina al instante"
                      textColor={textPrimary}
                      mutedColor={textMuted}
                      cardBg={cardBg}
                      cardBorder={bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                  <div className="w-full mb-8 flex justify-center mt-6">
                    <button
                      onClick={props.onBack}
                      className="group flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 hover:bg-white/5 active:scale-95"
                      style={{ color: textMuted }}
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Volver al catálogo
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full flex flex-col items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-4 sm:pt-6"
            >
              <div className="text-center space-y-6 mb-8 sm:mb-12 w-full max-w-3xl">
                <div className="inline-block relative">
                  <h2 className={`${isSmall ? 'text-3xl' : 'text-5xl lg:text-6xl'} font-black tracking-tighter italic uppercase relative z-10`} style={{ color: textPrimary }}>
                    {welcomeMessage || 'Colección Real'}
                  </h2>
                  <div className="absolute -bottom-2 -right-4 w-10 h-10 rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.2 }} />
                </div>
                <p className="text-[10px] md:text-xs uppercase tracking-[0.5em] font-black opacity-30 italic" style={{ color: textPrimary }}>
                  Selecciona tu próxima pieza
                </p>
              </div>

              {selfiePreview && (
                <div className="w-full max-w-xl mb-6 sm:mb-8">
                  <SelfiePreviewEditorial
                    preview={selfiePreview}
                    onReset={onReset}
                    primaryColor={primaryColor}
                    textMuted={textMuted}
                    cardBg={cardBg}
                    bgLuminance={bgLuminance}
                  />
                </div>
              )}

              <div className="w-full max-w-7xl mx-auto">
                <ProductGridEditorial
                  products={config.products}
                  selected={selectedProduct}
                  onSelect={onProductSelect}
                  primaryColor={primaryColor}
                  generatedProducts={generatedProducts}
                  cardBg={cardBg}
                  bgLuminance={bgLuminance}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  isSmall={isSmall}
                />
              </div>
            </motion.div>
          )}

          {step === 'result' && resultImageUrl && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="pb-32 sm:pb-40"
            >
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
                pluginView={pluginView}
                textColor={textPrimary}
                mutedColor={textMuted}
                cardBg={cardBg}
                cardBorder={bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)'}
                whatsappContact={config.brand.whatsappContact ?? null}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step === 'select' && selectedProduct && (
        <BottomCTAEditorial
          onClick={onProceedToUpload}
          primaryColor={primaryColor}
          buttonText={`Siguiente: ${selectedProduct?.name || buttonText || 'Subir foto'}`}
          bgLuminance={bgLuminance}
          textMuted={textMuted}
          secondaryColor={secondaryColor}
        />
      )}

      {step === 'upload' && selfiePreview && selectedProduct && (
        <BottomCTAEditorial
          onClick={onGenerate}
          primaryColor={primaryColor}
          buttonText={generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
          caption={generatedProducts.has(selectedProduct.id) ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
          bgLuminance={bgLuminance}
          textMuted={textMuted}
          secondaryColor={secondaryColor}
        />
      )}
    </div>
  );
}
