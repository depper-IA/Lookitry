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
    onReset,
    onSelfieUpload,
    onProductSelect,
    onGenerate,
  } = props;

  // Colores adaptativos según el fondo
  const bgLuminance = isLightBg(secondaryColor || '#ffffff');
  const textPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';
  const textMuted = bgLuminance ? '#666666' : '#ffffffcc';
  const cardBg = bgLuminance ? '#ffffff' : 'rgba(255,255,255,0.05)';
  const borderColor = bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)';

  const centerUploadInEmbed = isEmbed && step === 'upload';
  const isMinilandingOrPlugin = pluginView || (isEmbed && step === 'upload');

  return (
    <div
      className={`flex flex-col font-sans transition-all duration-700 ${isEmbed ? 'min-h-full' : 'h-full'}`}
      style={{ backgroundColor: secondaryColor }}
    >
      {step === 'generating' && (
        <div className={`flex-1 flex items-center justify-center ${pluginView ? 'min-h-[70vh] px-4 py-0' : 'py-8'}`}>
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      )}
      {step !== 'generating' && (
        <div className={`flex-1 w-full px-4 ${centerUploadInEmbed ? 'flex items-center justify-center py-6 md:py-8' : 'py-4 md:py-6'}`}>
          <div className={`${centerUploadInEmbed ? 'w-full max-w-md sm:max-w-lg' : (pluginView && step === 'result' ? 'mx-auto w-full max-w-5xl sm:max-w-6xl' : 'max-w-sm sm:max-w-lg mx-auto w-full')}`}>
            <ErrorBanner error={error} isService={errorIsService} />
            <NoticeBanner notice={notice} />

            {/* Paso Upload: Solo se muestra si estamos en minilanding/plugin (que fuerza step='upload') */}
             {step === 'upload' && (
               <div className="space-y-4">
                 {isMinilandingOrPlugin && selectedProduct && !pluginView && (
                    <div className="rounded-[24px] border p-4 shadow-sm" style={{ backgroundColor: cardBg, borderColor }}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: textMuted }}>Producto seleccionado</p>
                      <div className="mt-3 flex items-center gap-3">
                        <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-16 w-16 rounded-2xl object-cover" style={{ borderColor }} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black uppercase italic" style={{ color: textPrimary }}>{selectedProduct.name}</p>
                          <p className="text-xs mt-1" style={{ color: textMuted }}>{selectedProduct.category}</p>
                        </div>
                      </div>
                    </div>
                 )}
                 {pluginView && selectedProduct && (
                    <div className="rounded-[24px] border p-4 shadow-sm" style={{ backgroundColor: cardBg, borderColor }}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: textMuted }}>Producto fijado</p>
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="h-16 w-16 rounded-2xl object-cover"
                          style={{ borderColor }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black uppercase italic" style={{ color: textPrimary }}>{selectedProduct.name}</p>
                          <p className="mt-1 text-xs" style={{ color: textMuted }}>
                            Este producto ya fue seleccionado desde la pagina del producto en WooCommerce.
                          </p>
                        </div>
                      </div>
                    </div>
                 )}
                 <SelfieUploader 
                   onUpload={onSelfieUpload} 
                   primaryColor={primaryColor} 
                   welcomeMessage={welcomeMessage} 
                   privacyNotice="Tu selfie solo se usa en tu navegador y se elimina al subir una nueva foto" 
                   textColor={textPrimary} 
                   mutedColor={textMuted}
                   cardBg={cardBg}
                   cardBorder={borderColor}
                 />
                 {selectedProduct && selfiePreview && (
                    <div className="pt-2">
                      <button
                        onClick={onGenerate}
                        className="w-full py-3.5 md:py-4 rounded-2xl font-bold text-white text-sm md:text-base shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
                      </button>
                    </div>
                )}
               </div>
              )}

            {/* Paso Select: Implementación "Opción B" (Selector y Uploader en la misma pantalla) */}
            {step === 'select' && (
              <div className="space-y-8 md:space-y-10 pb-10">
                <SelfieThumb preview={selfiePreview} onReset={onReset} />
                
                {/* 1. Selector de Producto */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4" style={{ color: textPrimary }}>
                    1. Selecciona un producto
                  </h3>
                  <FriendlyProductSelector
                    products={config.products}
                    selected={selectedProduct}
                    onSelect={onProductSelect}
                    primaryColor={primaryColor}
                    generatedProducts={generatedProducts}
                  />
                </div>

                {/* 2. Subida de Foto (Opción B: en la misma vista, pero deshabilitado si no hay producto) */}
                <div className={`transition-opacity duration-300 ${!selectedProduct ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: textPrimary }}>
                    2. Sube tu foto frontal
                    {!selectedProduct && (
                      <span className="text-[10px] tracking-normal normal-case font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                        Requerido arriba
                      </span>
                    )}
                  </h3>
                  <SelfieUploader 
                    onUpload={onSelfieUpload} 
                    primaryColor={primaryColor} 
                    welcomeMessage={welcomeMessage} 
                    privacyNotice="Tu selfie solo se usa en tu navegador y se elimina al subir una nueva foto" 
                    textColor={textPrimary} 
                    mutedColor={textMuted}
                    cardBg={cardBg}
                    cardBorder={borderColor}
                  />
                </div>
                
                {/* 3. Acción */}
                {selectedProduct && selfiePreview && (
                  <div className="sticky bottom-4 pt-4 mt-6 z-10">
                    <button
                      onClick={onGenerate}
                      className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-white text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
                    </button>
                    <p className="text-center text-[10px] md:text-xs mt-3 font-medium" style={{ color: textMuted }}>
                      {generatedProducts.has(selectedProduct.id) ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
                    </p>
                  </div>
                )}
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
                pluginView={pluginView}
                textColor={textPrimary}
                mutedColor={textMuted}
                cardBg={cardBg}
                cardBorder={borderColor}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
