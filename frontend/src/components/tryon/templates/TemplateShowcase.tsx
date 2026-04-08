'use client';

import React from 'react';
import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps, Product } from './types';
import { ErrorBanner, NoticeBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT } from './shared';

// Helper para determinar si un color es claro u oscuro
function isLightBg(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

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
    onProceedToUpload,
    onGenerate,
  } = props;

  // Colores adaptativos según el fondo
  const bgLuminance = isLightBg(secondaryColor || '#ffffff');
  const textPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';
  const textMuted = bgLuminance ? '#666666' : '#ffffffcc';
  const textSubtle = bgLuminance ? '#999999' : '#ffffff99';
  const borderColor = bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)';
  const cardBg = bgLuminance ? '#ffffff' : 'rgba(255,255,255,0.05)';

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
        <MicroHeader config={config} onReset={onReset} showReset={false} primaryColor={primaryColor} />
        <div className="flex-1 flex items-center justify-center">
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col font-sans h-full min-h-full max-h-full overflow-hidden"
      style={{ backgroundColor: secondaryColor }}
    >
      <MicroHeader config={config} onReset={onReset} showReset={step !== 'upload'} primaryColor={primaryColor} />

      <div className="flex-1 overflow-y-auto overscroll-contain pb-24">
        <ErrorBanner error={error} isService={errorIsService} />
        <NoticeBanner notice={notice} />

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
            {welcomeMessage && (
              <p className="text-center text-lg font-semibold mb-6 animate-fade-in" style={{ color: primaryColor }}>
                {welcomeMessage}
              </p>
            )}
            <SelfieUploader
              onUpload={onSelfieUpload}
              primaryColor={primaryColor}
              privacyNotice="Tu selfie solo se usa en tu navegador y se elimina al subir una nueva foto"
              textColor={textPrimary}
              mutedColor={textMuted}
              cardBg={cardBg}
              cardBorder={borderColor}
            />
          </div>
        )}

        {step === 'select' && (
          <div className="px-4 pt-2">
            <SelfiePreviewBar preview={selfiePreview} onReset={onReset} primaryColor={primaryColor} textMuted={textMuted} textPrimary={textPrimary} />
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
              cardBg={cardBg}
              borderColor={borderColor}
              textPrimary={textPrimary}
              textMuted={textMuted}
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
              textColor={textPrimary}
              mutedColor={textMuted}
              cardBg={cardBg}
              cardBorder={borderColor}
            />
          </div>
        )}
      </div>

      {step === 'select' && selectedProduct && (
        <BottomCTA
          onClick={onProceedToUpload}
          primaryColor={primaryColor}
          buttonText="Siguiente: Subir foto"
          caption=""
          bgLuminance={bgLuminance}
          textMuted={textMuted}
        />
      )}
      
      {step === 'upload' && selfiePreview && selectedProduct && (
        <BottomCTA
          onClick={onGenerate}
          primaryColor={primaryColor}
          buttonText={generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
          caption={generatedProducts.has(selectedProduct.id) ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
          bgLuminance={bgLuminance}
          textMuted={textMuted}
        />
      )}
    </div>
  );
}

function MicroHeader({ config, onReset, showReset, primaryColor }: {
  config: TryOnTemplateProps['config'];
  onReset: () => void;
  showReset: boolean;
  primaryColor: string;
}) {
  return (
    <header
      className="flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex items-center gap-3">
        {config.brand.logo ? (
          <img
            src={config.brand.logo}
            alt={config.brand.name}
            className="h-8 w-auto object-contain"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="font-black text-white text-sm">{config.brand.name}</span>
        )}
      </div>
      {showReset && (
        <button
          onClick={onReset}
          className="text-white/80 hover:text-white text-[10px] font-semibold transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10"
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

function SelfiePreviewBar({ preview, onReset, primaryColor, welcomeMessage, textMuted, textPrimary }: {
  preview: string | null;
  onReset: () => void;
  primaryColor: string;
  welcomeMessage?: string;
  textMuted: string;
  textPrimary: string;
}) {
  if (!preview) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl p-2.5 shadow-sm mb-3"
      style={{ backgroundColor: '#ffffff', border: `1px solid ${primaryColor}20` }}>
      <img src={preview} alt="Tu foto" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase italic leading-none" style={{ color: primaryColor }}>
          {welcomeMessage || 'Tu foto está lista'}
        </p>
        <p className="text-[9px] mt-0.5 font-medium uppercase tracking-wider leading-none" style={{ color: textMuted }}>Selecciona un producto</p>
      </div>
      <button
        onClick={onReset}
        className="text-[9px] font-bold uppercase transition-colors px-2 py-1 rounded-lg"
        style={{ color: `${primaryColor}99` }}
        onMouseEnter={e => { e.currentTarget.style.color = primaryColor; e.currentTarget.style.backgroundColor = `${primaryColor}10`; }}
        onMouseLeave={e => { e.currentTarget.style.color = `${primaryColor}99`; e.currentTarget.style.backgroundColor = 'transparent'; }}
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
  cardBg,
  borderColor,
  textPrimary,
  textMuted,
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
  cardBg: string;
  borderColor: string;
  textPrimary: string;
  textMuted: string;
}) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: textMuted }}>No hay productos disponibles</p>
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
                sel ? 'scale-[1.02]' : 'active:scale-[0.98]'
              }`}
              style={sel ? { borderColor: primaryColor, boxShadow: `0 8px 24px ${primaryColor}25`, backgroundColor: cardBg } : { backgroundColor: cardBg, borderColor }}
            >
              <div className="relative aspect-square" style={{ backgroundColor: cardBg }}>
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
              <div className="p-2.5" style={{ backgroundColor: cardBg }}>
                <p className="font-black text-[10px] uppercase italic tracking-tighter truncate leading-tight" style={{ color: textPrimary }}>{p.name}</p>
              </div>
            </button>
          );
        })}
      </div>

      {canScrollLeft && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center backdrop-blur-sm shadow-lg rounded-full z-10" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: textPrimary }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center backdrop-blur-sm shadow-lg rounded-full z-10" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: textPrimary }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}

      <p className="text-[9px] text-center mt-3 font-medium uppercase tracking-widest" style={{ color: textMuted }}>
        ← Desliza para ver más productos →
      </p>
    </div>
  );
}

function BottomCTA({
  onClick,
  primaryColor,
  buttonText,
  caption,
  bgLuminance,
  textMuted,
}: {
  onClick?: () => void;
  primaryColor: string;
  buttonText: string;
  caption: string;
  bgLuminance: boolean;
  textMuted: string;
}) {
  const gradientFrom = bgLuminance ? '#ffffff' : 'rgba(0,0,0,0.8)';
  const gradientVia = bgLuminance ? '#ffffff' : 'rgba(0,0,0,0.4)';
  const gradientTo = 'transparent';
  
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: `linear-gradient(to top, ${gradientFrom}, ${gradientVia}, ${gradientTo})` }}>
      <button
        onClick={onClick}
        className="w-full py-4 rounded-2xl font-bold text-white text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        style={{ backgroundColor: primaryColor, boxShadow: `0 8px 24px ${primaryColor}40` }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        {buttonText}
      </button>
      {caption && (
        <p className="text-center text-[9px] mt-2 font-medium" style={{ color: textMuted }}>
          {caption}
        </p>
      )}
    </div>
  );
}
