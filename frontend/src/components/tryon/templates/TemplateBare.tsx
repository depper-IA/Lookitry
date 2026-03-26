import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, FriendlyProductSelector, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner, SelfieThumb } from './shared';

export function TemplateBare(props: TryOnTemplateProps) {
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
    onGenerate,
  } = props;

  return (
    <div className={`flex flex-col font-sans h-full min-h-[400px] transition-all duration-700`} style={{ backgroundColor: secondaryColor }}>
      {step === 'generating' && (
        <div className="flex-1 flex items-center justify-center py-8">
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      )}
      {step !== 'generating' && (
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 md:py-6">
          <ErrorBanner error={error} isService={errorIsService} />
          <NoticeBanner notice={notice} />
          {step === 'upload' && (
            <SelfieUploader onUpload={onSelfieUpload} primaryColor={primaryColor} welcomeMessage={welcomeMessage} />
          )}
          {step === 'select' && (
            <div className="space-y-3 md:space-y-4">
              <SelfieThumb preview={selfiePreview} onReset={onReset} />
              <FriendlyProductSelector
                products={config.products}
                selected={selectedProduct}
                onSelect={onProductSelect}
                primaryColor={primaryColor}
                generatedProducts={generatedProducts}
              />
              {selectedProduct && (
                <div className="sticky bottom-4 pt-2">
                  <button
                    onClick={onGenerate}
                    className="w-full py-3.5 md:py-4 rounded-2xl font-bold text-white text-sm md:text-base shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
                  </button>
                  <p className="text-center text-[10px] md:text-xs text-gray-400 mt-2">
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
            />
          )}
        </div>
      )}
    </div>
  );
}

