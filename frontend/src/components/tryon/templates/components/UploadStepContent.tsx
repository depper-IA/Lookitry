'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SelfieUploader } from '../../SelfieUploader';
import { GENERATION_CACHED_HINT, GENERATION_TIME_HINT } from '../shared';
import { TermsCheckbox } from '../../TermsCheckbox';
import type { TryOnTemplateProps, Product } from '../types';

interface UploadStepContentProps {
  selfiePreview: string | null;
  selectedProduct: Product | null;
  onReset: () => void;
  onSelfieReset?: () => void;
  onSelfieUpload: (file: File, preview: string) => void;
  onGenerate: () => void;
  onProductReset?: () => void;
  onBack?: () => void;
  primaryColor: string;
  primaryGlow: string;
  welcomeMessage?: string;
  buttonText?: string;
  mainTextPrimary: string;
  mainTextMuted: string;
  mainCardBg: string;
  mainBorderColor: string;
  generatedProducts: Map<string, string>;
  termsAccepted?: boolean;
  onTermsAccepted?: () => void;
}

export function UploadStepContent({
  selfiePreview,
  selectedProduct,
  onReset,
  onSelfieReset,
  onSelfieUpload,
  onGenerate,
  onProductReset,
  onBack,
  primaryColor,
  primaryGlow,
  welcomeMessage,
  buttonText,
  mainTextPrimary,
  mainTextMuted,
  mainCardBg,
  mainBorderColor,
  generatedProducts,
  termsAccepted = false,
  onTermsAccepted,
}: UploadStepContentProps) {
  return (
    <div className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto space-y-4">
      {/* Back Button (to selection) */}
      <div className="flex justify-start mb-1">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-white/5"
          style={{ color: mainTextMuted }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al catálogo
        </button>
      </div>

      <SelfieUploader 
        onUpload={onSelfieUpload} 
        onReset={onReset}
        onSelfieReset={onSelfieReset}
        currentPreview={selfiePreview}
        selectedProduct={selectedProduct}
        primaryColor={primaryColor} 
        welcomeMessage={welcomeMessage} 
        textColor={mainTextPrimary} 
        mutedColor={mainTextMuted}
        cardBg={mainCardBg}
        cardBorder={mainBorderColor}
      />
      {/* Generar Action */}
      {selfiePreview && selectedProduct && (
        <div className="sticky bottom-4 pt-3 mt-4 z-20">
          <motion.button
            onClick={onGenerate}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            disabled={!termsAccepted}
            className="w-full py-3.5 rounded-xl font-black uppercase tracking-[0.1em] text-xs text-white shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ 
              backgroundColor: primaryColor,
              boxShadow: `0 8px 30px ${primaryGlow}`,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={generatedProducts.has(selectedProduct.id) ? 'result' : 'generate'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
              </motion.span>
            </AnimatePresence>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>

          {/* Terms checkbox - solo se muestra si NO está aceptado */}
          {!termsAccepted && onTermsAccepted && (
            <TermsCheckbox
              onAccepted={onTermsAccepted}
              isAccepted={termsAccepted}
              primaryColor={primaryColor}
              textColor={mainTextPrimary}
              mutedColor={mainTextMuted}
            />
          )}

          <p className="text-center text-[10px] mt-3 font-medium" style={{ color: mainTextMuted }}>
            {generatedProducts.has(selectedProduct.id) ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
          </p>
        </div>
      )}
    </div>
  );
}
