'use client';

import { useState, useEffect, useRef } from 'react';
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

// ── Template Showcase: Editorial Fashion Vitrine ──────────────────────────────
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const obs = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setIsSmall(width < 768);
    });

    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const bgLuminance = isLightBg(secondaryColor || '#ffffff');
  const textPrimary = bgLuminance ? '#1a1a1a' : '#ffffff';
  const textMuted = bgLuminance ? '#666666' : '#ffffffcc';
  const cardBg = bgLuminance ? '#ffffff' : 'rgba(255,255,255,0.05)';

  // Generar gradiente sutil para atmosphere
  const gradientBg = bgLuminance
    ? `linear-gradient(180deg, ${secondaryColor} 0%, ${secondaryColor} 70%, ${primaryColor}08 100%)`
    : `linear-gradient(180deg, ${secondaryColor} 0%, ${secondaryColor} 70%, ${primaryColor}15 100%)`;

  // Generate explicit dark fallback background for non-embed mode
  const solidBg = bgLuminance ? secondaryColor : '#0a0a0a';
  const solidGradientBg = bgLuminance 
    ? secondaryColor 
    : '#0a0a0a';

  if (step === 'generating') {
    return (
      <div className="flex flex-col min-h-screen min-h-[100dvh]" style={{ backgroundColor: solidBg }}>
        <EditorialHeader config={config} onReset={onReset} primaryColor={primaryColor} bgLuminance={bgLuminance} textMuted={textMuted} />
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
      style={{ backgroundColor: solidGradientBg }}
    >
      <EditorialHeader 
        config={config} 
        onReset={onReset} 
        showReset={step !== 'upload'} 
        primaryColor={primaryColor} 
        bgLuminance={bgLuminance}
        textMuted={textMuted}
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

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 sm:px-6 md:px-8 lg:px-12 py-12">
            {/* Hero / Welcome - Stacked Centered Editorial */}
            <div className={`${isSmall ? 'mb-12' : 'mb-20'} flex flex-col items-center text-center animate-in fade-in slide-in-from-top-8 duration-1000`}>
              {/* Logo with Fashion Aura */}
              <div className={`relative group ${isSmall ? 'mb-8' : 'mb-10'}`}>
                <div 
                  className="absolute inset-0 blur-[60px] opacity-20 scale-150 animate-pulse"
                  style={{ background: primaryColor }}
                />
                <div className={`relative z-10 p-6 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all duration-700 hover:scale-105`}>
                  {config.brand.logo ? (
                    <img
                      src={config.brand.logo}
                      alt={config.brand.name}
                      className={`${isSmall ? 'h-20' : 'h-32'} w-auto object-contain`}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className={`${isSmall ? 'h-20 w-20' : 'h-32 w-32'} flex items-center justify-center`}>
                      <span className="font-black text-6xl italic" style={{ color: primaryColor }}>
                        {config.brand.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Refined Brand Identity */}
              <div className="space-y-4 max-w-2xl px-4">
                <h1 
                  className={`${isSmall ? 'text-3xl' : 'text-6xl'} font-black tracking-[-0.05em] uppercase italic leading-none`}
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
                    className={`${isSmall ? 'text-xs' : 'text-base'} font-black uppercase tracking-[0.4em] opacity-40 italic max-w-xs mx-auto`}
                    style={{ color: textPrimary }}
                  >
                    Digital Experience
                  </p>
                </div>
              </div>
            </div>

            {/* Back Button (Floating or Integrated) */}
            <div className="w-full max-w-lg mb-8 flex justify-center">
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
        )}

        {step === 'select' && (
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
            {/* Hero de selección - Editorial Accent */}
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 mb-12">
              <div className="inline-block relative">
                <h2 className={`${isSmall ? 'text-3xl' : 'text-7xl'} font-black tracking-tighter italic uppercase relative z-10`} style={{ color: textPrimary }}>
                  {welcomeMessage || 'Colección Real'}
                </h2>
                <div className="absolute -bottom-2 -right-4 w-12 h-12 rounded-full blur-2xl opacity-40 animate-pulse" style={{ backgroundColor: primaryColor }} />
              </div>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.5em] font-black opacity-30 italic" style={{ color: textPrimary }}>
                Selecciona tu próxima pieza
              </p>
            </div>

            {/* Selfie preview si existe */}
            {selfiePreview && (
              <SelfiePreviewEditorial 
                preview={selfiePreview} 
                onReset={onReset} 
                primaryColor={primaryColor}
                textMuted={textMuted}
              />
            )}

            {/* Grid de productos estilo magazine */}
            <div className="relative">
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
              />
            </div>
          </div>
        )}

        {step === 'result' && resultImageUrl && (
          <div className="pb-32 sm:pb-40">
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
              cardBorder={bgLuminance ? '#e5e5e5' : 'rgba(255,255,255,0.1)'}
            />
          </div>
        )}
      </div>

      {/* Bottom CTA Glassmorphism */}
      {step === 'select' && selectedProduct && (
        <BottomCTAEditorial
          onClick={onProceedToUpload}
          primaryColor={primaryColor}
          buttonText={`Siguiente: ${buttonText || 'Subir foto'}`}
          bgLuminance={bgLuminance}
        />
      )}
      
      {step === 'upload' && selfiePreview && selectedProduct && (
        <BottomCTAEditorial
          onClick={onGenerate}
          primaryColor={primaryColor}
          buttonText={generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
          caption={generatedProducts.has(selectedProduct.id) ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
          bgLuminance={bgLuminance}
        />
      )}
    </div>
  );
}

function EditorialHeader({ config, onReset, showReset, primaryColor, bgLuminance, textMuted }: {
  config: TryOnTemplateProps['config'];
  onReset: () => void;
  showReset?: boolean;
  primaryColor: string;
  bgLuminance: boolean;
  textMuted: string;
}) {
  return (
    <header 
      className="sticky top-0 z-40 backdrop-blur-3xl border-b"
      style={{ 
        backgroundColor: bgLuminance 
          ? 'rgba(255,255,255,0.7)' 
          : 'rgba(0,0,0,0.5)',
        borderColor: bgLuminance ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
      }}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          {config.brand.logo ? (
            <img
              src={config.brand.logo}
              alt={config.brand.name}
              className="h-8 w-auto object-contain"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10" style={{ backgroundColor: `${primaryColor}20` }}>
              <span className="font-black text-sm italic" style={{ color: primaryColor }}>
                {config.brand.name.charAt(0)}
              </span>
            </div>
          )}
          
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-tighter italic" style={{ color: bgLuminance ? '#000' : '#fff' }}>
              {config.brand.name}
            </span>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] opacity-40 italic mt-px" style={{ color: bgLuminance ? '#000' : '#fff' }}>
              Showcase
            </span>
          </div>
        </div>
        
        {showReset && (
          <button
            onClick={onReset}
            className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all border border-white/5 hover:bg-white/10"
            style={{ color: textMuted }}
          >
            <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </button>
        )}
      </div>
    </header>
  );
}

// ── Selfie Preview Editorial ───────────────────────────────────────────────────
function SelfiePreviewEditorial({ preview, onReset, primaryColor, textMuted }: {
  preview: string | null;
  onReset: () => void;
  primaryColor: string;
  textMuted: string;
}) {
  if (!preview) return null;
  return (
    <div 
      className="relative flex items-center gap-3 sm:gap-4 rounded-2xl p-3 sm:p-4 shadow-xl animate-fade-in"
      style={{ 
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        border: `1px solid rgba(255,255,255,0.1)`
      }}
    >
      {/* Glow effect */}
      <div 
        className="absolute -inset-px rounded-2xl opacity-20"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, transparent)` }}
      />
      
      <div className="relative flex items-center gap-3 sm:gap-4 w-full">
        <div className="relative shrink-0">
          <img 
            src={preview} 
            alt="Tu foto" 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-lg ring-2 ring-white/20" 
          />
          <div 
            className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-2 sm:w-2.5 h-2 sm:w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-black uppercase italic tracking-tight" style={{ color: primaryColor }}>
            Listo para probar
          </p>
          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider mt-0.5" style={{ color: textMuted }}>
            Escoge un producto
          </p>
        </div>
        
        <button
          onClick={onReset}
          className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all hover:bg-white/10 shrink-0"
          style={{ color: textMuted }}
        >
          Cambiar
        </button>
      </div>
    </div>
  );
}

// ── Product Grid Editorial (2 columnas, no scroll) ──────────────────────────────
function ProductGridEditorial({
  products,
  selected,
  onSelect,
  primaryColor,
  generatedProducts,
  cardBg,
  bgLuminance,
  textPrimary,
  textMuted,
}: {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
  primaryColor: string;
  generatedProducts: Map<string, string>;
  cardBg: string;
  bgLuminance: boolean;
  textPrimary: string;
  textMuted: string;
}) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: textMuted }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: textMuted }}>No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 pb-32">
      {products.map((p, index) => {
        const sel = selected?.id === p.id;
        const alreadyGenerated = generatedProducts.has(p.id);
        
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`
              group relative rounded-2xl overflow-hidden text-left transition-all duration-300
              ${sel ? 'ring-2 scale-[1.02]' : 'hover:scale-[1.01] active:scale-[0.99]'}
            `}
            style={{ 
              animationDelay: `${index * 50}ms`,
              '--ring-color': primaryColor,
            } as React.CSSProperties}
          >
            {/* Background glow cuando seleccionado */}
            {sel && (
              <div 
                className="absolute inset-0 opacity-30"
                style={{ background: `radial-gradient(circle at center, ${primaryColor}40, transparent 70%)` }}
              />
            )}
            
            {/* Card */}
            <div 
              className="relative rounded-2xl overflow-hidden"
              style={{ 
                backgroundColor: cardBg,
                boxShadow: sel 
                  ? `0 8px 32px ${primaryColor}30, 0 0 0 2px ${primaryColor}` 
                  : '0 4px 16px rgba(0,0,0,0.1)',
              }}
            >
              {/* Imagen */}
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={p.imageUrl} 
                  alt={p.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay gradient */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:opacity-0"
                  style={{ background: `linear-gradient(to top, ${primaryColor}30, transparent 50%)` }}
                />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {p.badge && (
                    <span className="px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-white shadow-lg"
                      style={{ background: p.badge === 'nuevo' ? '#10B981' : p.badge === 'top' ? '#F59E0B' : '#EF4444' }}>
                      {p.badge}
                    </span>
                  )}
                  {alreadyGenerated && !sel && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: primaryColor }}>
                      <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {sel && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: primaryColor }}>
                      <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Precio */}
                {p.price != null && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-black text-white shadow-lg"
                      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                      ${p.price.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
                
                {/* Nombre en overlay - solo visible en hover para tablet+ */}
                <div 
                  className="hidden md:block absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
                >
                  <p className="text-[10px] font-black uppercase italic tracking-tight text-white truncate">
                    {p.name}
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-2 sm:p-3 md:p-4" style={{ backgroundColor: cardBg }}>
                <p 
                  className={`text-[10px] sm:text-[11px] font-black uppercase italic tracking-tight truncate leading-tight transition-colors ${
                    sel ? '' : 'group-hover:text-opacity-70'
                  }`}
                  style={{ color: sel ? primaryColor : textPrimary }}
                >
                  {p.name}
                </p>
                
                <div className="flex items-center justify-between gap-1 mt-1">
                  {p.category && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider bg-black/10 text-black/70">
                      {p.category}
                    </span>
                  )}
                  {p.shortDescription && (
                    <span className="text-[8px] text-gray-500 truncate max-w-[60%]">{p.shortDescription}</span>
                  )}
                </div>
                
                {p.attributes && Object.keys(p.attributes).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.attributes.material && (
                      <span className="text-[8px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{p.attributes.material}</span>
                    )}
                    {p.attributes.medida_pulgadas && (
                      <span className="text-[8px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{p.attributes.medida_pulgadas}&quot;</span>
                    )}
                    {p.attributes.marca && (
                      <span className="text-[8px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{p.attributes.marca}</span>
                    )}
                    {p.attributes.tallas && Array.isArray(p.attributes.tallas) && (
                      <span className="text-[8px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{p.attributes.tallas.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Bottom CTA Glassmorphism ───────────────────────────────────────────────────
function BottomCTAEditorial({
  onClick,
  primaryColor,
  buttonText,
  caption,
  bgLuminance,
}: {
  onClick?: () => void;
  primaryColor: string;
  buttonText: string;
  caption?: string;
  bgLuminance: boolean;
}) {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 z-50 animate-fade-in-up"
      style={{ 
        background: bgLuminance 
          ? 'rgba(255,255,255,0.92)'
          : 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
      }}
    >
      <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto space-y-2">
        <button
          onClick={onClick}
          className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.15em] text-white shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-3"
          style={{ 
            backgroundColor: primaryColor, 
            boxShadow: `0 8px 32px ${primaryColor}40`,
          }}
        >
          <span>{buttonText}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {caption && (
          <p className="text-center text-[9px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color: bgLuminance ? '#666' : '#fff9' }}>
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
