'use client';

import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import { TermsCheckbox } from '../TermsCheckbox';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, FriendlyProductSelector, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner } from './shared';

// Helper para determinar si un color es claro u oscuro
function isLightBg(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function TemplateLandingEmbed(props: TryOnTemplateProps) {
  const {
    step,
    config,
    brandSlug,
    isEmbed,
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
    lockProductSelection,
    onReset,
    onSelfieReset,
    onSelfieUpload,
    onProductSelect,
    onProductReset,
    onGenerate,
    termsAccepted,
    onTermsAccepted,
  } = props;

  // Lógica exclusiva para Mini-landing: Siempre usamos variables CSS
  // Esto permite que el fondo sea manejado por el contenedor padre (sección de la landing)
  const textPrimary = 'var(--landing-text-primary, #ffffff)';
  const textMuted = 'var(--landing-text-muted, rgba(255,255,255,0.6))';
  const cardBg = 'var(--landing-card-bg, rgba(255,255,255,0.05))';
  const borderColor = 'var(--landing-border-color, rgba(255,255,255,0.1))';
  const primaryGlow = `${primaryColor}40`;

  const centerUploadInEmbed = step === 'upload';
  const isMinilandingOrPlugin = true; // Por definición, este widget es para landing/plugin

  return (
    <div className="flex flex-col font-sans transition-all duration-700 min-h-[500px]">
      {step === 'generating' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      )}

      {/* Paso Select: re-dirigir a upload si ya hay producto, sino mostrar selector minimalista */}
      {step === 'select' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto overflow-x-hidden">
          <div className="max-w-md mx-auto w-full">
            <ErrorBanner 
              error={error} 
              isService={errorIsService} 
              onDismiss={props.onDismissError}
              textColor={textPrimary}
              mutedColor={textMuted}
              cardBg={cardBg}
              cardBorder={borderColor}
            />
            <NoticeBanner notice={notice} onDismiss={props.onDismissNotice} />

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {selfiePreview && (
                <div className="mb-6">
                  <SelfieUploader
                    onUpload={onSelfieUpload}
                    onReset={onReset}
                    onSelfieReset={onSelfieReset}
                    currentPreview={selfiePreview}
                    selectedProduct={selectedProduct}
                    primaryColor={primaryColor}
                    textColor={textPrimary}
                    mutedColor={textMuted}
                    cardBg={cardBg}
                    cardBorder={borderColor}
                  />
                </div>
              )}

              {/* Selector de producto simple */}
              <FriendlyProductSelector
                products={config.products}
                selected={selectedProduct}
                onSelect={(p) => {
                  onProductSelect(p);
                }}
                primaryColor={primaryColor}
                generatedProducts={generatedProducts}
                textColor={textPrimary}
                textMutedColor={textMuted}
              />

              {selectedProduct && (
                <div className="pt-4 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <button
                    onClick={props.onProceedToUpload}
                    className="w-full py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                    style={{ 
                      backgroundColor: primaryColor,
                      boxShadow: `0 8px 32px ${primaryGlow}`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10">Siguiente paso</span>
                    <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step !== 'generating' && step !== 'select' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto overflow-x-hidden">
          <div className={`${centerUploadInEmbed ? 'w-full max-w-md' : (pluginView && step === 'result' ? 'mx-auto w-full max-w-5xl' : 'max-w-md mx-auto w-full')}`}>
            <ErrorBanner 
              error={error} 
              isService={errorIsService} 
              onDismiss={props.onDismissError}
              textColor={textPrimary}
              mutedColor={textMuted}
              cardBg={cardBg}
              cardBorder={borderColor}
            />
            <NoticeBanner notice={notice} onDismiss={props.onDismissNotice} />

            {/* Paso Upload */}
             {step === 'upload' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {selectedProduct && !pluginView && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative group overflow-hidden rounded-2xl border transition-all duration-300 mb-2"
                      style={{ 
                        backgroundColor: cardBg,
                        borderColor: borderColor
                      }}
                    >
                      <div className="p-3 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                          <img 
                            src={selectedProduct.imageUrl} 
                            alt={selectedProduct.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-[0.15em] opacity-40">
                            Prenda para probar
                          </span>
                          <h4 className="text-xs font-bold truncate pr-8" style={{ color: textPrimary }}>
                            {selectedProduct.name}
                          </h4>
                        </div>

                        {!lockProductSelection && (
                          <button
                            onClick={onProductReset}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                            title="Cambiar prenda"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                 
                 <div className="relative">
                    <SelfieUploader 
                      onUpload={onSelfieUpload} 
                      onReset={onReset}
                      onSelfieReset={onSelfieReset}
                      currentPreview={selfiePreview}
                      selectedProduct={selectedProduct}
                      primaryColor={primaryColor} 
                      welcomeMessage={welcomeMessage} 
                      privacyNotice="Tu selfie se elimina al instante tras procesar" 
                      textColor={textPrimary} 
                      mutedColor={textMuted}
                      cardBg="transparent"
                      cardBorder={borderColor}
                    />
                 </div>

{selectedProduct && selfiePreview && (
                     <div className="pt-4 py-8 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3">
                       <button
                         onClick={onGenerate}
                         disabled={!termsAccepted}
                         className="w-full py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-40"
                         style={{ 
                           backgroundColor: primaryColor,
                           boxShadow: `0 8px 32px ${primaryGlow}`
                         }}
                       >
                         <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                         <span className="relative z-10">{generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}</span>
                         <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                         </svg>
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
                     </div>
                  )}
               </div>
              )}

            {step === 'result' && resultImageUrl && (
              <div className="animate-in zoom-in-95 duration-500 pb-20">
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
                  cardBorder={borderColor}
                  whatsappContact={config.brand.whatsappContact ?? null}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
