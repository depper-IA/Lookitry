'use client';

import { useRef } from 'react';
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
import { useDeviceSize } from './hooks/useDeviceSize';

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
    termsAccepted,
    onTermsAccepted,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const isSmall = useDeviceSize(props.forcedLayout);

  const bgLuminance = isLightBg(secondaryColor || '#ffffff');
  const textPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';
  const textMuted = bgLuminance ? '#666666' : '#ffffffcc';
  const cardBg = bgLuminance ? '#ffffff' : 'rgba(255,255,255,0.05)';

  const solidBg = bgLuminance ? secondaryColor : '#0a0a0a';

  if (step === 'generating') {
    return (
      <div className="flex flex-col min-h-screen min-h-[100dvh] w-full" style={{ backgroundColor: solidBg }}>
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
      className="flex flex-col font-sans min-h-screen min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden"
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

              <div className="flex flex-col items-center justify-center flex-1 px-4 sm:px-6 py-12 w-full max-w-2xl mx-auto min-h-[60vh]">
                <div className="text-center space-y-3 mb-10">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] opacity-40 italic" style={{ color: textPrimary }}>
                    Try it on
                  </p>
                  <h2 className="text-2xl md:text-4xl font-black tracking-tight italic uppercase" style={{ color: textPrimary }}>
                    Sube tu foto
                  </h2>
                  <div className="flex items-center justify-center gap-4 w-full max-w-[150px] mx-auto mt-4">
                    <div className="h-[1px] flex-1 bg-current opacity-20" style={{ color: textPrimary }} />
                    <div className="w-1.5 h-1.5 rounded-full rotate-45" style={{ backgroundColor: primaryColor }} />
                    <div className="h-[1px] flex-1 bg-current opacity-20" style={{ color: textPrimary }} />
                  </div>
                </div>

                <div className="w-full max-w-2xl mx-auto space-y-6">
                  <SelfieUploader
                    onUpload={onSelfieUpload}
                    onReset={onReset}
                    onSelfieReset={onSelfieReset}
                    onBack={onProductReset}
                    currentPreview={selfiePreview}
                    primaryColor={primaryColor}
                    privacyNotice="Tu selfie solo se usa en tu navegador y se elimina al instante"
                    textColor={textPrimary}
                    mutedColor={textMuted}
                    cardBg={cardBg}
                    cardBorder={bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)'}
                  />
                </div>


              </div>
            </motion.div>
          )}

          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full flex flex-col items-center pb-12"
            >
              {/* Hero Banner en Paso 1 */}
              <div className="w-full relative min-h-[50vh] lg:min-h-[60vh] flex items-center justify-center overflow-hidden mb-8 sm:mb-12 shadow-2xl py-12 px-4">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
                  style={config.brand.widgetCoverImage ? {
                    backgroundImage: `url(${config.brand.widgetCoverImage})`,
                  } : {
                    background: `radial-gradient(ellipse at top, ${primaryColor}66 0%, transparent 70%), ${solidBg}`,
                  }}
                />
                {/* Overlay Premium para contraste asegurado */}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)' }} />

                <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
                  {config.brand.logo ? (
                    <img
                      src={config.brand.logo}
                      alt={config.brand.name}
                      className="h-16 md:h-20 lg:h-24 w-auto object-contain mb-6 drop-shadow-xl"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="h-16 md:h-20 w-16 md:w-20 flex items-center justify-center rounded-2xl shadow-xl mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <span className="font-black text-4xl md:text-5xl italic text-white drop-shadow-md">
                        {config.brand.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="inline-block relative">
                    <h2 className={`${isSmall ? 'text-4xl' : 'text-5xl lg:text-7xl'} font-black tracking-[-0.03em] italic uppercase relative z-10 text-white drop-shadow-lg`}>
                      {welcomeMessage || 'Colección Real'}
                    </h2>
                    <div className="absolute -bottom-2 -right-4 w-12 h-12 rounded-full blur-xl" style={{ backgroundColor: primaryColor, opacity: 0.6 }} />
                  </div>

                  <div className="flex items-center gap-4 mt-6 max-w-[200px] w-full text-white">
                    <div className="h-[1px] flex-1 bg-white opacity-40" />
                    <div className="w-2 h-2 rounded-full rotate-45 shadow-sm" style={{ backgroundColor: primaryColor }} />
                    <div className="h-[1px] flex-1 bg-white opacity-40" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2 mb-8 sm:mb-12 w-full max-w-3xl px-4">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.5em] font-black opacity-40 italic" style={{ color: textPrimary }}>
                  Selecciona tu próxima pieza
                </p>
              </div>

              {selfiePreview && (
                <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl mb-6 sm:mb-8 mx-auto px-4">
                  <SelfieUploader
                    onUpload={onSelfieUpload}
                    onReset={onReset}
                    currentPreview={selfiePreview}
                    primaryColor={primaryColor}
                    textColor={textPrimary}
                    mutedColor={textMuted}
                    cardBg={cardBg}
                    cardBorder={bgLuminance ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}
                  />
                </div>
              )}

              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
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
          termsAccepted={termsAccepted}
          onTermsAccepted={onTermsAccepted}
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
          termsAccepted={termsAccepted}
          onTermsAccepted={onTermsAccepted}
        />
      )}
    </div>
  );
}
