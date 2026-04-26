'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import { TermsCheckbox } from '../TermsCheckbox';
import type { TryOnTemplateProps } from './types';
import {
  ErrorBanner,
  FriendlyProductSelector,
  GENERATION_CACHED_HINT,
  GENERATION_TIME_HINT,
  NoticeBanner,
} from './shared';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Determina si un color hex es claro u oscuro */
function isLightBg(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// ── Indicador de progreso compacto para Bare ─────────────────────────────────

type Step = 'upload' | 'select' | 'generating' | 'result';

const BARE_STEPS: { key: Step | 'generating'; label: string }[] = [
  { key: 'select', label: 'Producto' },
  { key: 'upload', label: 'Tu foto' },
  { key: 'result', label: 'Resultado' },
];

function BareStepDots({
  step,
  primaryColor,
  textMuted,
}: {
  step: Step;
  primaryColor: string;
  textMuted: string;
}) {
  const currentIndex =
    step === 'generating'
      ? 1
      : BARE_STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {BARE_STEPS.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              {/* CSS transition instead of spring physics (performance optimization) */}
              <div
                className="rounded-full transition-all duration-200 ease-out"
                style={{
                  width: active ? 24 : done ? 8 : 6,
                  height: active ? 8 : done ? 8 : 6,
                  backgroundColor: done || active ? primaryColor : textMuted + '44',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

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
    onSelfieReset,
    onSelfieUpload,
    onProductSelect,
    onGenerate,
    termsAccepted,
    onTermsAccepted,
  } = props;

  // Tokens de color derivados del secondaryColor del brand
  const bgLuminance = isLightBg(secondaryColor || '#ffffff');
  const textPrimary = bgLuminance ? '#050505' : '#ffffff';
  const textMuted = bgLuminance ? '#666666' : '#ffffff99';
  const cardBg = bgLuminance ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
  const borderColor = bgLuminance ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
  const primaryGlow = `${primaryColor}40`;

  const alreadyGenerated = generatedProducts.has(selectedProduct?.id || '');

  return (
    <div
      className="flex flex-col font-sans min-h-screen min-h-[100dvh]"
      style={{ backgroundColor: secondaryColor }}
    >
      {/* Header — oculto en embed (la página del cliente ya tiene branding) */}
      {!isEmbed && (
        <motion.div
          className="pt-8 md:pt-10 px-4 text-center flex-shrink-0"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center gap-1.5">
            {config.brand.logo ? (
              <img
                src={config.brand.logo}
                alt={config.brand.name}
                className="h-14 w-auto object-contain"
                loading="lazy"
              />
            ) : (
              <div
                className="text-xl font-black italic uppercase tracking-tighter"
                style={{ color: textPrimary }}
              >
                Look<span style={{ color: primaryColor }}>itry</span>
              </div>
            )}
            <span
              className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 italic"
              style={{ color: textPrimary }}
            >
              {config.brand.name}
            </span>
          </div>
        </motion.div>
      )}

      {/* Indicador de progreso compacto — solo en pasos activos, no en generating/result */}
      {step !== 'generating' && step !== 'result' && (
        <BareStepDots step={step} primaryColor={primaryColor} textMuted={textMuted} />
      )}

      {/* Estado: generando */}
      {step === 'generating' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <GenerationLoader
              productName={selectedProduct?.name || ''}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      )}

      {/* Estados: select / upload / result */}
      {step !== 'generating' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-2 pb-12 overflow-y-auto overflow-x-hidden">
          <div className="max-w-md mx-auto w-full">
            {/* Banners de error y aviso */}
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

            {/* AnimatePresence: transición suave entre pasos */}
            <AnimatePresence mode="wait">

              {/* ── Paso 1: Selección de producto ─────────────────────────── */}
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
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

                  {/* FriendlyProductSelector tiene header, lo ocultamos aquí para evitar duplicación */}
                  <FriendlyProductSelector
                    products={config.products}
                    selected={selectedProduct}
                    onSelect={(p) => onProductSelect(p)}
                    primaryColor={primaryColor}
                    generatedProducts={generatedProducts}
                    textColor={textPrimary}
                    textMutedColor={textMuted}
                    showHeader={false}
                  />

                  <AnimatePresence>
                    {selectedProduct && (
                      <motion.div
                        key="next-btn"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.25 }}
                        className="pb-8"
                      >
                        <button
                          onClick={() => props.onProceedToUpload?.()}
                          aria-label="Continuar al siguiente paso"
                          className="w-full py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                          style={{
                            backgroundColor: primaryColor,
                            boxShadow: `0 8px 32px ${primaryGlow}`,
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          <span className="relative z-10">Siguiente paso</span>
                          <svg
                            className="w-4 h-4 relative z-10"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── Paso 2: Subida de selfie ───────────────────────────────── */}
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Resumen del producto elegido */}
                  {selectedProduct && (
                    <div
                      className="flex items-center gap-3 p-3 rounded-2xl border backdrop-blur-sm"
                      style={{ backgroundColor: cardBg, borderColor }}
                    >
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className="h-10 w-10 md:h-14 md:w-14 rounded-xl object-cover shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-0.5"
                          style={{ color: textPrimary }}
                        >
                          Producto seleccionado
                        </p>
                        <p
                          className="text-sm font-black italic uppercase truncate"
                          style={{ color: textPrimary }}
                        >
                          {selectedProduct.name}
                        </p>
                      </div>
                      <button
                        onClick={() => props.onBack?.()}
                        aria-label="Cambiar producto"
                        className="ml-auto text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border hover:bg-white/5 transition-colors flex-shrink-0"
                        style={{ borderColor, color: textMuted }}
                      >
                        Cambiar
                      </button>
                    </div>
                  )}

                  <div className="text-center space-y-1 mt-2">
                    <h2
                      className="text-2xl font-black italic uppercase tracking-tighter"
                      style={{ color: textPrimary }}
                    >
                      Sube tu Foto
                    </h2>
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ color: textMuted }}
                    >
                      Para procesar tu prueba virtual
                    </p>
                  </div>

                  <SelfieUploader
                    onUpload={onSelfieUpload}
                    onReset={onReset}
                    onSelfieReset={onSelfieReset}
                    currentPreview={selfiePreview}
                    selectedProduct={selectedProduct}
                    primaryColor={primaryColor}
                    welcomeMessage={welcomeMessage}
                    privacyNotice="Procesamiento local seguro"
                    textColor={textPrimary}
                    mutedColor={textMuted}
                    cardBg={cardBg}
                    cardBorder={borderColor}
                  />

                  {/* Vista previa de la selfie antes de generar */}
                  <AnimatePresence>
                    {selfiePreview && (
                      <motion.div
                        key="generate-cta"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-3 pt-1 pb-8"
                      >
                        {/* El thumbnail ahora se muestra dentro de SelfieUploader */}

                        {/* Botón de generación */}
                        <button
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                              navigator.vibrate(50);
                            }
                            onGenerate();
                          }}
                          disabled={!termsAccepted}
                          aria-label={alreadyGenerated ? 'Ver resultado guardado' : buttonText}
                          className="w-full py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-40"
                          style={{
                            backgroundColor: primaryColor,
                            boxShadow: `0 8px 32px ${primaryGlow}`,
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          <span className="relative z-10">
                            {alreadyGenerated ? 'Ver resultado' : buttonText}
                          </span>
                          <svg
                            className="w-4 h-4 relative z-10"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
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

                        <p
                          className="text-center text-[10px] font-black uppercase tracking-widest italic opacity-40"
                          style={{ color: textMuted }}
                        >
                          {alreadyGenerated ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── Paso 3: Resultado ──────────────────────────────────────── */}
              {step === 'result' && resultImageUrl && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
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
                    shareMessage={props.shareMessage}
                    pluginView={pluginView}
                    textColor={textPrimary}
                    mutedColor={textMuted}
                    cardBg={cardBg}
                    cardBorder={borderColor}
                    whatsappContact={config.brand.whatsappContact ?? null}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}