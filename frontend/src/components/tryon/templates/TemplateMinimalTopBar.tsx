import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps } from './types';
import { BrandHeader, ErrorBanner, FriendlyProductSelector, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, SelfieThumb, StepBar } from './shared';

export function TemplateMinimalTopBar(props: TryOnTemplateProps) {
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
    generatedProducts,
    onReset,
    onSelfieUpload,
    onProductSelect,
    onGenerate,
  } = props;

  if (step === 'generating') {
    return (
      <div className="flex flex-col" style={{ backgroundColor: secondaryColor }}>
        <BrandHeader config={config} onReset={onReset} showReset={false} />
        <div className="flex items-center justify-center py-16">
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen transition-colors duration-500" style={{ backgroundColor: secondaryColor }}>
      <BrandHeader config={config} onReset={onReset} showReset={step !== 'upload'} />
      <StepBar step={step} primaryColor={primaryColor} />

      <div className="max-w-lg mx-auto px-4 pt-3 md:pt-4">
        <div
          className="rounded-xl md:rounded-2xl px-4 py-2 md:py-3 text-center text-xs md:text-sm font-black uppercase italic tracking-tighter"
          style={{ backgroundColor: primaryColor + '10', color: primaryColor }}
        >
          {step === 'upload' && 'Sube o toma una foto'}
          {step === 'select' && 'Elige un producto'}
          {step === 'result' && 'Tu prueba virtual'}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 md:py-5">
        <ErrorBanner error={error} isService={errorIsService} />

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
                  className="w-full py-3.5 md:py-4 rounded-2xl font-bold text-white text-sm md:text-base shadow-[0_8px_20px_rgb(0,0,0,0.15)] hover:shadow-[0_12px_25px_rgb(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
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
    </div>
  );
}

