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

  const centerUploadInEmbed = isEmbed && step === 'upload';

  return (
    <div
      className={`flex flex-col font-sans transition-all duration-700 ${isEmbed ? 'min-h-screen' : 'h-full min-h-[400px]'}`}
      style={{ backgroundColor: secondaryColor }}
    >
      {step === 'generating' && (
        <div className={`flex-1 flex items-center justify-center ${pluginView ? 'min-h-[70vh] px-4 py-0' : 'py-8'}`}>
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      )}
      {step !== 'generating' && (
        <div className={`flex-1 w-full px-4 ${centerUploadInEmbed ? 'flex items-center justify-center py-6 md:py-8' : 'py-4 md:py-6'}`}>
          <div className={`${centerUploadInEmbed ? 'w-full max-w-lg' : (pluginView && step === 'result' ? 'mx-auto w-full max-w-6xl' : 'max-w-lg mx-auto w-full')}`}>
            <ErrorBanner error={error} isService={errorIsService} />
            <NoticeBanner notice={notice} />
            {step === 'upload' && (
              <SelfieUploader onUpload={onSelfieUpload} primaryColor={primaryColor} welcomeMessage={welcomeMessage} />
            )}
            {step === 'select' && (
              <div className="space-y-3 md:space-y-4">
                <SelfieThumb preview={selfiePreview} onReset={onReset} />
                {pluginView && selectedProduct ? (
                  <div className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Producto fijado</p>
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className="h-16 w-16 rounded-2xl border border-gray-100 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black uppercase italic text-gray-900">{selectedProduct.name}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Este producto ya fue seleccionado desde la pagina del producto en WooCommerce.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <FriendlyProductSelector
                    products={config.products}
                    selected={selectedProduct}
                    onSelect={onProductSelect}
                    primaryColor={primaryColor}
                    generatedProducts={generatedProducts}
                  />
                )}
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
                pluginView={pluginView}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

