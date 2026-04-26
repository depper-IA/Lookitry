'use client';

import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner } from './shared';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarHeader } from './components/SidebarHeader';
import { SidebarResetButton } from './components/SidebarHeader';
import { SidebarProgressSteps } from './components/SidebarProgressSteps';
import { SidebarProductList } from './components/SidebarProductList';
import { DesktopTopBar } from './components/DesktopTopBar';
import { UploadStepContent } from './components/UploadStepContent';
import { MobileProductGrid } from './components/MobileProductGrid';
import { SelectedProductCard, DesktopEmptyState } from './components/SelectedProductCard';

// ── Neo-Luxury Modern Sidebar ────────────────────────────────────────────────

export function TemplateModernSidebar(props: TryOnTemplateProps) {
  const {
    step,
    config,
    brandSlug,
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
    onSelfieReset,
    onSelfieUpload,
    onProductSelect,
    onProceedToUpload,
    onGenerate,
    lockProductSelection = false,
    termsAccepted = false,
    onTermsAccepted,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    if (props.forcedLayout) {
      setIsSmall(props.forcedLayout === 'mobile');
    }
    
    const obs = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setIsSmall(width < 768);
    });

    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [props.forcedLayout]);

  const isLightBg = (hex: string): boolean => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  const bgLuminance = isLightBg(secondaryColor || '#ffffff');
  const mainTextPrimary = bgLuminance ? '#050505' : '#ffffff';
  const mainTextMuted = bgLuminance ? '#444444' : '#ffffffcc';
  const mainBorderColor = bgLuminance ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
  const mainCardBg = bgLuminance ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';

  // Sidebar colors should always be readable against the brand/secondary background
  const sidebarLuminance = isLightBg(secondaryColor || '#ffffff');
  const sidebarText = sidebarLuminance ? '#050505' : '#ffffff';
  const sidebarMuted = sidebarLuminance ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
  const sidebarSubtle = sidebarLuminance ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';

  // Generar paleta de color derivada
  const primaryGlow = `${primaryColor}40`;
  const primarySubtle = `${primaryColor}15`;

  // Force dark background for non-light mode, brand color for light mode
  const bgColor = bgLuminance ? secondaryColor : '#0a0a0a';

  if (step === 'generating') {
    return (
      <div className="flex flex-col min-h-screen min-h-[100dvh] items-center justify-center p-4 md:p-8 relative overflow-hidden" style={{ backgroundColor: bgColor }}>
        {config.brand.widgetCoverImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.06] mix-blend-luminosity"
            style={{ backgroundImage: `url(${config.brand.widgetCoverImage})` }}
          />
        )}
        {/* Ambient glow - responsive */}
        <div 
          className="absolute w-48 h-48 md:w-96 md:h-96 rounded-full blur-3xl opacity-20"
          style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
      </div>
    );
  }

  const steps = [
    ...(lockProductSelection ? [] : [
      { num: 1, label: isSmall ? 'Producto' : 'Elige un producto', active: step === 'select', done: step !== 'select' }
    ]),
    { 
      num: lockProductSelection ? 1 : 2, 
      label: isSmall ? '1' : 'Sube tu foto', 
      active: step === 'upload', 
      done: step === 'result' 
    },
    { 
      num: lockProductSelection ? 2 : 3, 
      label: isSmall ? '2' : 'Ve el resultado', 
      active: step === 'result', 
      done: false 
    },
  ];

  return (
    <div 
      ref={containerRef}
      className={`relative flex font-sans min-h-screen min-h-[100dvh] ${isSmall ? 'flex-col' : 'flex-row'}`} 
      style={{ 
        backgroundColor: bgColor,
        paddingLeft: isSmall ? 'max(16px, env(safe-area-inset-left))' : 0,
        paddingRight: isSmall ? 'max(16px, env(safe-area-inset-right))' : 0,
        paddingTop: isSmall ? 'max(16px, env(safe-area-inset-top))' : 0,
        paddingBottom: isSmall ? 'max(16px, env(safe-area-inset-bottom))' : 0,
      }}
    >
      {config.brand.widgetCoverImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.06] mix-blend-luminosity z-0"
          style={{ backgroundImage: `url(${config.brand.widgetCoverImage})` }}
        />
      )}
      {/* ── Sidebar / Header ───────────────────────────────────────────── */}
      <div
        className={`relative flex flex-col z-20 transition-all duration-500 overflow-hidden ${
          isSmall 
            ? 'w-full border-b shadow-lg' 
            : 'w-72 border-r shadow-2xl h-screen sticky top-0'
        }`}
        style={{
          paddingLeft: isSmall ? 'max(16px, env(safe-area-inset-left))' : 20,
          paddingRight: isSmall ? 'max(16px, env(safe-area-inset-right))' : 20,
          paddingTop: isSmall ? 'max(16px, env(safe-area-inset-top))' : 24,
          paddingBottom: isSmall ? 'max(16px, env(safe-area-inset-bottom))' : 24,
          background: isSmall 
            ? bgLuminance 
              ? `${secondaryColor}` 
              : `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor} 100%)`
            : bgLuminance
              ? `${secondaryColor}`
              : `linear-gradient(180deg, ${primaryColor}08 0%, ${secondaryColor} 100%)`,
        }}
      >
        {/* Decorative top accent - subtle solid bar, no gradient for mobile */}
        <div 
          className={`absolute ${isSmall ? 'top-0 left-0 right-0 h-0.5' : 'top-0 left-0 bottom-0 w-1'}`}
          style={{ 
            background: isSmall 
              ? primaryColor 
              : `linear-gradient(to bottom, ${primaryColor}, ${primaryColor}40)`
          }}
        />

        <SidebarHeader
          config={config}
          welcomeMessage={welcomeMessage}
          isSmall={isSmall}
          primaryColor={primaryColor}
          sidebarLuminance={sidebarLuminance}
          sidebarText={sidebarText}
          sidebarMuted={sidebarMuted}
          sidebarSubtle={sidebarSubtle}
        />
        
        {isSmall && step !== 'select' && (
          <div className="px-3 pb-2.5">
            <SidebarResetButton 
              onReset={onReset} 
              isSmall={isSmall} 
              sidebarLuminance={sidebarLuminance} 
              sidebarMuted={sidebarMuted}
            />
          </div>
        )}

        {/* Progress Steps */}
        <SidebarProgressSteps
          steps={steps}
          isSmall={isSmall}
          primaryColor={primaryColor}
          sidebarLuminance={sidebarLuminance}
          sidebarText={sidebarText}
          sidebarMuted={sidebarMuted}
          sidebarSubtle={sidebarSubtle}
          primaryGlow={primaryGlow}
        />

        {/* Product List (Desktop Sidebar) */}
        {!isSmall && step === 'select' && (
          <SidebarProductList
            products={config.products}
            selectedProduct={selectedProduct}
            generatedProducts={generatedProducts}
            onProductSelect={onProductSelect}
            primaryColor={primaryColor}
            sidebarLuminance={sidebarLuminance}
            sidebarText={sidebarText}
            sidebarSubtle={sidebarSubtle}
            sidebarMuted={sidebarMuted}
            primaryGlow={primaryGlow}
            secondaryColor={secondaryColor}
          />
        )}
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div 
        className="flex-1 flex flex-col overflow-hidden relative"
        style={{
          paddingLeft: isSmall ? 'max(16px, env(safe-area-inset-left))' : 0,
          paddingRight: isSmall ? 'max(16px, env(safe-area-inset-right))' : 0,
          paddingTop: isSmall ? 'max(16px, env(safe-area-inset-top))' : 0,
          paddingBottom: isSmall ? 'max(16px, env(safe-area-inset-bottom))' : 0,
        }}
      >
        {/* Top bar (desktop) */}
        {!isSmall && (
          <DesktopTopBar
            step={step}
            primaryColor={primaryColor}
            primaryGlow={primaryGlow}
            bgLuminance={bgLuminance}
            mainTextPrimary={mainTextPrimary}
            mainTextMuted={mainTextMuted}
            mainBorderColor={mainBorderColor}
            mainCardBg={mainCardBg}
          />
        )}

        {/* Content Area */}
        <div className={`flex-1 ${isSmall ? 'p-4 w-full' : 'p-6 lg:p-8 overflow-y-auto'} max-w-full`}>
          <ErrorBanner 
            error={error} 
            isService={errorIsService} 
            onDismiss={props.onDismissError}
            textColor={mainTextPrimary}
            mutedColor={mainTextMuted}
            cardBg={mainCardBg}
            cardBorder={mainBorderColor}
          />
          <NoticeBanner notice={notice} onDismiss={props.onDismissNotice} />

          {/* Welcome Message Header (PRO) */}
          {(step === 'upload' || step === 'select') && (
            <div className={`mb-4 ${isSmall ? 'text-left' : 'text-center'} animate-in fade-in slide-in-from-top-4 duration-700`}>
              <h3 className={`${isSmall ? 'text-lg' : 'text-2xl'} font-black tracking-tighter italic uppercase leading-tight`} style={{ color: mainTextPrimary }}>
                {step === 'upload' ? 'Sube tu foto' : 'Elige un look'}
              </h3>
              {welcomeMessage && (
                <p className="mt-1 text-xs font-medium opacity-50 uppercase tracking-widest" style={{ color: mainTextPrimary }}>
                  {welcomeMessage}
                </p>
              )}
            </div>
          )}

          {step === 'upload' && (
            <UploadStepContent
              selfiePreview={selfiePreview}
              selectedProduct={selectedProduct}
              onReset={onReset}
              onSelfieReset={onSelfieReset}
              onSelfieUpload={onSelfieUpload}
              onGenerate={onGenerate}
              onBack={props.onBack}
              primaryColor={primaryColor}
              primaryGlow={primaryGlow}
              welcomeMessage={welcomeMessage}
              buttonText={buttonText}
              mainTextPrimary={mainTextPrimary}
              mainTextMuted={mainTextMuted}
              mainCardBg={mainCardBg}
              mainBorderColor={mainBorderColor}
              generatedProducts={generatedProducts}
              termsAccepted={props.termsAccepted}
              onTermsAccepted={props.onTermsAccepted}
            />
          )}

          {step === 'select' && (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Mobile Product Grid */}
              {isSmall && (
                <MobileProductGrid
                  products={config.products}
                  selectedProduct={selectedProduct}
                  generatedProducts={generatedProducts}
                  onProductSelect={onProductSelect}
                  onProceedToUpload={onProceedToUpload}
                  onReset={onReset}
                  onSelfieReset={onSelfieReset}
                  selfiePreview={selfiePreview}
                  primaryColor={primaryColor}
                  primaryGlow={primaryGlow}
                  primarySubtle={primarySubtle}
                  mainTextPrimary={mainTextPrimary}
                  mainTextMuted={mainTextMuted}
                  mainCardBg={mainCardBg}
                  buttonText={buttonText}
                />
              )}

              {/* Selected Product Card (Desktop) */}
              {!isSmall && selectedProduct && (
                <SelectedProductCard
                  selectedProduct={selectedProduct}
                  onProceedToUpload={onProceedToUpload}
                  primaryColor={primaryColor}
                  primaryGlow={primaryGlow}
                  primarySubtle={primarySubtle}
                  mainTextPrimary={mainTextPrimary}
                  mainTextMuted={mainTextMuted}
                  buttonText={buttonText}
                />
              )}

              {/* Desktop Empty State */}
              {!isSmall && !selectedProduct && (
                <DesktopEmptyState
                  primaryColor={primaryColor}
                  primarySubtle={primarySubtle}
                  mainTextPrimary={mainTextPrimary}
                  mainTextMuted={mainTextMuted}
                />
              )}
            </div>
          )}

          {step === 'result' && resultImageUrl && (
            <div className="max-w-5xl mx-auto">
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
                pluginView={props.pluginView}
                textColor={mainTextPrimary}
                mutedColor={mainTextMuted}
                cardBg={mainCardBg}
                cardBorder={mainBorderColor}
                whatsappContact={config.brand.whatsappContact ?? null}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
