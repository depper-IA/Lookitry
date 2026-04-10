'use client';

import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, FriendlyProductSelector, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner, SelfieThumb } from './shared';

// Helper para determinar si un color es claro u oscuro
function isLightBg(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function TemplateBare(props: TryOnTemplateProps) {
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
    onSelfieUpload,
    onProductSelect,
    onGenerate,
  } = props;

  // Lógica de diseño: Bare siempre es independiente y sólido
  const bgLuminance = isLightBg(secondaryColor || '#ffffff');
  const textPrimary = bgLuminance ? '#050505' : '#ffffff';
  const textMuted = bgLuminance ? '#666666' : '#ffffff99';
  const cardBg = bgLuminance ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
  const borderColor = bgLuminance ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
  const primaryGlow = `${primaryColor}40`;

  const centerUploadInEmbed = isEmbed && step === 'upload';
  const isMinilandingOrPlugin = lockProductSelection || pluginView || (isEmbed && step === 'upload');

  return (
    <div
      className="flex flex-col font-sans transition-all duration-700 min-h-screen min-h-[100dvh]"
      style={{ backgroundColor: secondaryColor }}
    >
      {/* Header con Marca */}
      <div className="pt-8 px-6 text-center animate-in fade-in duration-700">
        <div className="flex flex-col items-center gap-2">
          {config.brand.logo ? (
            <img 
              src={config.brand.logo} 
              alt={config.brand.name} 
              className="h-10 w-auto object-contain mb-1" 
            />
          ) : (
             <div className="text-xl font-black italic uppercase tracking-tighter" style={{ color: textPrimary }}>
              Look<span style={{ color: primaryColor }}>itry</span>
            </div>
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 italic" style={{ color: textPrimary }}>
            {config.brand.name}
          </span>
        </div>
      </div>

      {step === 'generating' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
          </div>
        </div>
      )}

      {step !== 'generating' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-4 pb-12 overflow-y-auto overflow-x-hidden">
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

            {/* Paso 1: Selección de Producto */}
            {step === 'select' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2 mb-8 mt-4">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter" style={{ color: textPrimary }}>
                    ¿Qué quieres probarte?
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: textMuted }}>
                    Toca el producto que más te guste
                  </p>
                </div>

                <FriendlyProductSelector
                  products={config.products}
                  selected={selectedProduct}
                  onSelect={(p) => {
                    onProductSelect(p);
                  }}
                  primaryColor={primaryColor}
                  generatedProducts={generatedProducts}
                />

                {selectedProduct && (
                  <div className="pt-4 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <button
                      onClick={() => props.onProceedToUpload?.()}
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
            )}

            {/* Paso 2: Subida de Selfie */}
            {step === 'upload' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 {/* Resumen del producto elegido */}
                 {selectedProduct && (
                   <div 
                    className="flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-sm"
                    style={{ backgroundColor: cardBg, borderColor }}
                   >
                     <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name} 
                      className="h-14 w-14 rounded-xl object-cover shrink-0" 
                     />
                     <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1" style={{ color: textPrimary }}>Producto seleccionado</p>
                        <p className="text-sm font-black italic uppercase truncate" style={{ color: textPrimary }}>{selectedProduct.name}</p>
                     </div>
                     <button 
                      onClick={() => props.onBack?.()}
                      className="ml-auto text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border hover:bg-white/5 transition-colors"
                      style={{ borderColor, color: textMuted }}
                     >
                      Cambiar
                     </button>
                   </div>
                 )}

                <div className="text-center space-y-2 mb-4 mt-4">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter" style={{ color: textPrimary }}>
                    Sube tu Foto
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: textMuted }}>
                    Para procesar tu prueba virtual
                  </p>
                </div>
                
                <SelfieUploader 
                  onUpload={onSelfieUpload} 
                  primaryColor={primaryColor} 
                  welcomeMessage={welcomeMessage} 
                  privacyNotice="Procesamiento local seguro" 
                  textColor={textPrimary} 
                  mutedColor={textMuted}
                  cardBg={cardBg}
                  cardBorder={borderColor}
                />

                {selfiePreview && (
                   <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <button
                      onClick={onGenerate}
                      className="w-full py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                      style={{ 
                        backgroundColor: primaryColor,
                        boxShadow: `0 8px 32px ${primaryGlow}`
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10">{generatedProducts.has(selectedProduct?.id || '') ? 'Ver resultado' : buttonText}</span>
                      <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                    <p className="text-center text-[10px] font-black uppercase tracking-widest mt-4 italic opacity-40" style={{ color: textMuted }}>
                      {generatedProducts.has(selectedProduct?.id || '') ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Paso 3: Resultado */}
            {step === 'result' && resultImageUrl && (
              <div className="animate-in zoom-in-95 duration-500">
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
                  pluginView={pluginView}
                  textColor={textPrimary}
                  mutedColor={textMuted}
                  cardBg={cardBg}
                  cardBorder={borderColor}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
