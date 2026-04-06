import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps, Product } from './types';
import { ErrorBanner, NoticeBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT } from './shared';

export function TemplateShowcase(props: TryOnTemplateProps) {
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

  const scrollContainerRef = React.useRef<HTMLDivElement>(null!);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, config.products]);

  if (step === 'generating') {
    return (
      <div className="flex flex-col" style={{ backgroundColor: secondaryColor }}>
        <MicroHeader config={config} onReset={onReset} showReset={false} />
        <div className="flex-1 flex items-center justify-center">
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col font-sans min-h-screen max-h-screen overflow-hidden"
      style={{ backgroundColor: secondaryColor }}
    >
      <MicroHeader config={config} onReset={onReset} showReset={step !== 'upload'} />

      <div className="flex-1 overflow-y-auto overscroll-contain pb-24">
        <ErrorBanner error={error} isService={errorIsService} />
        <NoticeBanner notice={notice} />

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
            <SelfieUploader
              onUpload={onSelfieUpload}
              primaryColor={primaryColor}
              welcomeMessage={welcomeMessage}
              privacyNotice="Tu selfie solo se usa en tu navegador y se elimina al subir una nueva foto"
            />
          </div>
        )}

        {step === 'select' && (
          <div className="px-4 pt-2">
            <SelfiePreviewBar preview={selfiePreview} onReset={onReset} primaryColor={primaryColor} />
            <ProductShowcase
              products={config.products}
              selected={selectedProduct}
              onSelect={onProductSelect}
              primaryColor={primaryColor}
              generatedProducts={generatedProducts}
              scrollRef={scrollContainerRef}
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onScrollCheck={checkScroll}
            />
          </div>
        )}

        {step === 'result' && resultImageUrl && (
          <div className="pb-20">
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
          </div>
        )}
      </div>

      {step === 'select' && selectedProduct && (
        <BottomCTA
          onGenerate={onGenerate}
          primaryColor={primaryColor}
          buttonText={buttonText}
          alreadyGenerated={generatedProducts.has(selectedProduct.id)}
        />
      )}
    </div>
  );
}

function MicroHeader({ config, onReset, showReset }: {
  config: TryOnTemplateProps['config'];
  onReset: () => void;
  showReset: boolean;
}) {
  return (
    <header
      className="flex items-center justify-between px-4 bg-white/80 backdrop-blur-md border-b border-gray-100/50"
      style={{ minHeight: 40, maxHeight: 40 }}
    >
      <div className="flex items-center gap-2">
        {config.brand.logo ? (
          <img
            src={config.brand.logo}
            alt={config.brand.name}
            className="h-5 w-auto object-contain"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="text-sm font-black text-gray-900">
            {config.brand.name}
          </span>
        )}
      </div>
      {showReset && (
        <button
          onClick={onReset}
          className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reiniciar
        </button>
      )}
    </header>
  );
}

function SelfiePreviewBar({ preview, onReset, primaryColor }: {
  preview: string | null;
  onReset: () => void;
  primaryColor: string;
}) {
  if (!preview) return null;
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 mb-3">
      <img src={preview} alt="Tu foto" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-900 uppercase italic leading-none">Tu foto está lista</p>
        <p className="text-[9px] text-gray-400 mt-0.5 font-medium uppercase tracking-wider leading-none">Selecciona un producto</p>
      </div>
      <button
        onClick={onReset}
        className="text-[9px] font-bold uppercase text-gray-400 hover:text-[#FF5C3A] transition-colors px-2 py-1 rounded-lg hover:bg-[#FF5C3A]/5"
      >
        Cambiar
      </button>
    </div>
  );
}

function ProductShowcase({
  products,
  selected,
  onSelect,
  primaryColor,
  generatedProducts,
  scrollRef,
  canScrollLeft,
  canScrollRight,
  onScrollCheck,
}: {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
  primaryColor: string;
  generatedProducts: Map<string, string>;
  scrollRef: React.RefObject<HTMLDivElement>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollCheck: () => void;
}) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={onScrollCheck}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(p => {
          const sel = selected?.id === p.id;
          const alreadyGenerated = generatedProducts.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`flex-shrink-0 w-36 snap-start rounded-2xl overflow-hidden border-2 text-left transition-all duration-200 ${
                sel ? 'scale-[1.02]' : 'border-gray-100 hover:border-gray-200 active:scale-[0.98]'
              }`}
              style={sel ? { borderColor: primaryColor, boxShadow: `0 8px 24px ${primaryColor}25` } : { backgroundColor: '#fff' }}
            >
              <div className="relative bg-gray-50 aspect-square">
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-2" />
                {alreadyGenerated && !sel && (
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: '#10b981' }}>
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {sel && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: primaryColor }}>
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-2.5 bg-white">
                <p className="font-black text-[10px] text-gray-900 uppercase italic tracking-tighter truncate leading-tight">{p.name}</p>
              </div>
            </button>
          );
        })}
      </div>

      {canScrollLeft && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-full bg-gradient-to-r from-gray-50/80 to-transparent pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-full bg-gradient-to-l from-gray-50/80 to-transparent pointer-events-none" />
      )}

      <p className="text-[9px] text-center text-gray-400 mt-2 font-medium uppercase tracking-widest">
        ← Desliza para ver más productos →
      </p>
    </div>
  );
}

function BottomCTA({
  onGenerate,
  primaryColor,
  buttonText,
  alreadyGenerated,
}: {
  onGenerate: () => void;
  primaryColor: string;
  buttonText: string;
  alreadyGenerated: boolean;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
      <button
        onClick={onGenerate}
        className="w-full py-4 rounded-2xl font-bold text-white text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        style={{ backgroundColor: primaryColor, boxShadow: `0 8px 24px ${primaryColor}40` }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        {alreadyGenerated ? 'Ver resultado' : buttonText}
      </button>
      <p className="text-center text-[9px] text-gray-400 mt-2 font-medium">
        {alreadyGenerated ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
      </p>
    </div>
  );
}

import React from 'react';
