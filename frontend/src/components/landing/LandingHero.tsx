'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Clock, Sparkles, Camera, Check, Loader2, X, RotateCcw, Image } from 'lucide-react';
import { UpgradeModal } from '@/components/ui/UpgradeModal';

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] shadow-sm transition-all sm:mb-8 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.2em] ${light
      ? 'bg-black/5 border-black/10 text-black/40 dark:bg-white/5 dark:border-white/10 dark:text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
      } mb-6`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full animate-pulse ${light ? 'bg-black/20 dark:bg-white/40' : 'bg-[#FF5C3A]'}`}
      aria-hidden="true"
    />
    {text}
  </div>
);

interface Product {
  id: string;
  name: string;
  short_description: string | null;
  image_url: string;
  category: string;
  price: number | null;
}

// Memoized product item to prevent re-renders on unrelated state changes
const ProductItem = React.memo(({ prod, selectedProduct, onSelect }: {
  prod: Product;
  selectedProduct: Product | null;
  onSelect: (p: Product) => void;
}) => {
  const isSelected = selectedProduct?.id === prod.id;
  return (
    <div
      onClick={() => onSelect(prod)}
      className={`group/item flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all sm:gap-3 sm:rounded-xl sm:p-3 ${isSelected
        ? 'border-[#FF5C3A] bg-[#FF5C3A]/10 shadow-lg shadow-[#FF5C3A]/5'
        : 'border-white/10 bg-white/5 hover:border-white/20'
        }`}
      role="button"
      tabIndex={0}
      aria-label={`Seleccionar ${prod.name}`}
    >
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[#2a2a2a] sm:h-14 sm:w-14">
        <Image src={prod.image_url} alt={prod.name} fill className="object-cover" sizes="56px" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={`truncate text-[9px] font-bold sm:text-[11px] ${isSelected ? 'text-white' : 'text-white/60'}`}>
          {prod.name}
        </span>
        <span className="text-[7px] capitalize text-white/30 sm:text-[8px] truncate">{prod.category}</span>
        {prod.price && (
          <span className="text-[7px] font-bold text-[#FF5C3A] sm:text-[9px]">
            ${prod.price.toLocaleString('es-CO')}
          </span>
        )}
      </div>
      {isSelected && (
        <div className="ml-auto flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#FF5C3A] sm:h-5 sm:w-5" aria-hidden="true">
          <Check size={8} className="text-white sm:text-xs" />
        </div>
      )}
    </div>
  );
});
ProductItem.displayName = 'ProductItem';

interface HomeTryonConfig {
  brand: { id: string; name: string; slug: string };
  products: Product[];
}

type TryOnStep = 'select' | 'selfie' | 'loading' | 'result';

export default function LandingHero() {
  const [config, setConfig] = useState<HomeTryonConfig | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<TryOnStep>('select');
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean | undefined>(undefined);

  // Config loading deferred to let main thread breathe after initial render
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('[HomeTryon] Loading config...');
        const res = await fetch('/api/home/tryon/config');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log('[HomeTryon] Config loaded:', data);
        if (!data || !data.products) {
          throw new Error('No se pudieron cargar los productos de prueba.');
        }
        setConfig(data);
        if (data.products.length > 0) {
          setSelectedProduct(data.products[0]);
        }
      } catch (err: any) {
        console.error('[HomeTryon] Error loading config:', err);
        setError(err.message || 'Error al conectar con el servidor.');
      }
    };

    // Schedule config loading after initial render completes
    const timer1 = setTimeout(loadConfig, 0);

    return () => {
      clearTimeout(timer1);
    };
  }, []);

  // Fetch trial status only when needed (on user interaction)
  const fetchTrialStatus = useCallback(async () => {
    if (hasUsedTrial !== undefined) return; // Already checked
    try {
      const res = await fetch('/api/home/tryon/check');
      const data = await res.json();
      console.log('[HomeTryon] Trial status:', data);
      setHasUsedTrial(data.hasTrialed);
      return data.hasTrialed;
    } catch (err) {
      console.error('[HomeTryon] Error checking trial:', err);
      setHasUsedTrial(false);
      return false;
    }
  }, [hasUsedTrial]);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const handleSelfieChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setSelfie(base64.split(',')[1]);
      setSelfiePreview(base64);
      setStep('selfie'); // Auto-avanzar al paso de previsualización
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selfie || !selectedProduct) return;

    setIsGenerating(true);
    setError(null);
    setStep('loading');

    try {
      const res = await fetch('/api/home/tryon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          selfieBase64: selfie,
        }),
      });

      const data = await res.json();

      if (res.status === 429 || data.error === 'TRIAL_LIMIT_EXCEEDED') {
        setShowUpgradeModal(true);
        setStep('select');
        setHasUsedTrial(true);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error generando prueba');
      }

      setResultImage(data.resultImageUrl);
      setStep('result');
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Error en el servicio');
      setStep('selfie');
    } finally {
      setIsGenerating(false);
    }
  }, [selfie, selectedProduct]);

  const handleBack = useCallback(() => {
    setStep('select');
    // Keep selfie when going back to change product
    setResultImage(null);
    setError(null);
  }, []);

  // Separate handler for changing product (preserves selfie)
  const handleChangeProduct = useCallback(() => {
    setStep('select');
    setResultImage(null);
    setError(null);
  }, []);

  // Memoized product list to prevent recreating items on every render
  const productItems = useMemo(() => config ? config.products.map((prod) => (
    <ProductItem
      key={prod.id}
      prod={prod}
      selectedProduct={selectedProduct}
      onSelect={handleProductSelect}
    />
  )) : [], [config, selectedProduct, handleProductSelect]);

  // Memoized CTA handler to avoid inline function recreation on each render
  const handleCTA = useCallback(async () => {
    // Priority 1: No selfie? → Go take selfie (even if trial exhausted)
    if (!selfie) {
      setStep('selfie');
      return;
    }
    // Priority 2: Check trial status if not yet fetched
    if (hasUsedTrial === undefined) {
      const hasTrialed = await fetchTrialStatus();
      if (hasTrialed) {
        setShowUpgradeModal(true);
        return;
      }
    } else if (hasUsedTrial) {
      setShowUpgradeModal(true);
      return;
    }
    // Priority 3: Has product + selfie? → Generate directly
    if (selectedProduct) {
      handleGenerate();
    }
  }, [selfie, hasUsedTrial, selectedProduct, fetchTrialStatus, handleGenerate]);

  // Memoized CTA section to prevent recreation on every render and isolate paint
  const ctaSection = useMemo(() => (
    <div className="flex flex-col items-center gap-2" style={{ contain: 'layout style' }}>
      <button
        onClick={handleCTA}
        disabled={!hasUsedTrial && !selectedProduct}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#FF5C3A] py-3 px-6 text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles size={16} />
        {selfie ? 'Generar Prueba' : 'Ver Probador IA'}
      </button>
      {!hasUsedTrial && (
        <span className="flex items-center gap-1 rounded-full bg-[#ABABAB]/10 px-3 py-1 text-[9px] font-semibold text-[#FFFFFF]">
          <Sparkles size={10} />
          1 generación gratis
        </span>
      )}
    </div>
  ), [handleCTA, selfie, hasUsedTrial, selectedProduct]);

  // Memoized generate button content to avoid conditional renders inside button
  const generateButtonContent = useMemo(() => (
    isGenerating ? (
      <>
        <Loader2 size={16} className="animate-spin" />
        Generando...
      </>
    ) : (
      <>
        <Sparkles size={16} />
        Ver Probador IA
      </>
    )
  ), [isGenerating]);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-start overflow-hidden bg-white px-4 pt-20 pb-16 dark:bg-black sm:px-6 sm:pt-24 sm:pb-24 md:px-12 hero-gradient"
      aria-label="Seccion principal"
    >
      {/* Static gradient background replaces expensive animated blobs - same visual effect, zero GPU overhead */}

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* LEFT: Text Content */}
        <div className="text-center lg:text-left">
          <SectionTag text="Revolucion Visual con IA" />

          <h1 className="mb-6 font-jakarta text-3xl font-black leading-[1.1] tracking-[-0.03em] sm:mb-8 sm:text-[44px] sm:tracking-[-0.04em] md:text-[56px] lg:text-[64px]">
            <span className="block text-[#0a0a0a] dark:text-white">Vende más con el</span>
            <span className="block text-[#FF5C3A]">Probador Virtual</span>
            <span className="block text-[#0a0a0a] dark:text-white">N.1 de Latinoamerica.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl font-dm-sans text-base font-light leading-[1.6] text-[#555] dark:text-white/80 sm:mb-12 sm:text-lg lg:mx-0">
            Tu tienda online, <span className="font-bold text-[#FF5C3A]">sin pagar un diseñador.</span> Permite que tus clientes se prueben tu catálogo en segundos con IA.
          </p>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-5 lg:justify-start">
            <Link
              href="/trial-checkout"
              className="group relative flex items-center gap-2 rounded-xl bg-[#FF5C3A] px-6 py-4 text-sm font-bold text-white shadow-xl shadow-[#FF5C3A]/20 transition-all hover:scale-[1.03] hover:-translate-y-0.5 hover:bg-[#ff7b5e] active:scale-[0.97] sm:gap-3 sm:rounded-2xl sm:px-10 sm:py-5 sm:text-base overflow-hidden duration-200"
            >
              <span className="relative z-10">Obtén Acceso Premium</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>

            <Link
              href="#como-funciona"
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-black/5 px-6 py-4 text-sm font-bold text-[#0a0a0a] transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:bg-black/10 active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:rounded-2xl sm:px-10 sm:py-5 sm:text-base duration-200"
            >
              Ver cómo funciona
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 font-bold uppercase tracking-[0.2em] text-[#555] dark:text-white/80 sm:mt-16 sm:gap-10 sm:text-[10px] sm:tracking-[0.25em] lg:justify-start">
            <div className="flex items-center gap-2 transition-colors hover:text-[#FF5C3A] sm:gap-2.5">
              <ShieldCheck size={14} className="shrink-0 text-[#FF5C3A]" aria-hidden="true" /> 100% Seguro
            </div>
            <div className="flex items-center gap-2 transition-colors hover:text-[#FF5C3A] sm:gap-2.5">
              <Clock size={14} className="shrink-0 text-[#FF5C3A]" aria-hidden="true" /> Activación 10min
            </div>
            <div className="flex items-center gap-2 transition-colors hover:text-[#FF5C3A] sm:gap-2.5">
              <Sparkles size={14} className="shrink-0 text-[#FF5C3A]" aria-hidden="true" /> IA Generativa
            </div>
          </div>
        </div>

        {/* RIGHT: PROBADOR FUNCIONAL - Matching Wideframe Style */}
        {/* Notice - CTA to try */}

        <div className="flex w-full items-center justify-center lg:justify-end">

          <div className="group relative z-10 w-full max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.8)] sm:max-w-[500px] sm:rounded-[2rem] sm:p-4 lg:max-w-[620px]">
            <div className="mb-3 flex items-center justify-center gap-2 rounded-full bg-[#ABABAB]/10 px-4 py-2 text-center">
              <Sparkles size={15} className="text-[#FF5C3A]" aria-hidden="true" />
              <span className="text-[15px] font-bold uppercase tracking-wider text-[#FF5C3A]">Pruébalo ahora mismo</span>
            </div>

            {/* Browser Chrome */}
            <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3" aria-hidden="true">
              <div className="flex gap-1 sm:gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff5c5c] sm:h-2 sm:w-2"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffbd2e] sm:h-2 sm:w-2"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#28c840] sm:h-2 sm:w-2"></span>
              </div>
              <div className="flex-1 truncate rounded-md border border-white/5 bg-[#1c1c1c] px-2 py-1 text-center font-dm-sans text-[7px] uppercase tracking-widest text-[#C7C7C7] sm:px-4 sm:text-[9px]">
                lookitry.com/marca/tu-marca
              </div>
            </div>

            {/* STEP: SELECT - Wideframe layout: left selfie, right products */}
            {step === 'select' && config && (
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Left: Selfie Upload Area */}
                <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#1c1c1c] p-4 text-center sm:p-6">
                  <div className="absolute top-2 left-4 text-[6px] font-bold uppercase tracking-widest text-white/20 sm:top-3 sm:left-6 sm:text-[8px]">
                    Tu Foto
                  </div>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/10 bg-white/5 sm:h-16 sm:w-16 overflow-hidden">
                    {selfiePreview ? (
                      <img src={selfiePreview} alt="Preview" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <Camera size={24} strokeWidth={1} className="text-white/20" aria-hidden="true" />
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <label className="cursor-pointer rounded-lg bg-[#FF5C3A]/20 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#FF5C3A] transition-all hover:bg-[#FF5C3A]/30 sm:text-[11px] min-h-11 flex items-center justify-center gap-2">
                      <Camera size={14} strokeWidth={2} aria-hidden="true" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleSelfieChange}
                        className="hidden"
                      />
                      Tomar foto
                    </label>
                    <label className="cursor-pointer rounded-lg bg-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/70 transition-all hover:bg-white/20 sm:text-[11px] min-h-11 flex items-center justify-center gap-2">
                      <Image size={14} strokeWidth={2} aria-hidden="true" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSelfieChange}
                        className="hidden"
                      />
                      Subir foto
                    </label>
                  </div>
                  <p className="text-[8px] font-bold capitalize tracking-widest text-white/40 sm:text-[10px]">
                    preferiblemente cuerpo completo
                  </p>
                </div>

                {/* Right: Product Grid */}
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="px-0.5 text-[7px] font-bold uppercase tracking-[0.15em] text-white/30 sm:mb-1 sm:px-1 sm:text-[8px] sm:tracking-[0.2em]">
                    Elige un Producto
                  </div>
                  {productItems}
                </div>

                {/* CTA Button - using memoized section */}
                {ctaSection}
              </div>
            )}

            {/* STEP: SELFIE (with selected product) */}
            {step === 'selfie' && selectedProduct && (
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Left: Selfie Preview */}
                <div className="flex flex-col items-center rounded-xl border border-white/10 bg-[#1c1c1c] p-4 text-center sm:p-6">
                  <div className="absolute top-2 left-4 text-[6px] font-bold uppercase tracking-widest text-white/20 sm:top-3 sm:left-6 sm:text-[8px]">
                    Tu Foto
                  </div>
                  {selfiePreview ? (
                    <div className="relative mb-3 h-32 w-32 overflow-hidden rounded-xl sm:h-40 sm:w-40">
                      <img src={selfiePreview} alt="Tu selfie" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                      <button
                        onClick={() => { setSelfie(null); setSelfiePreview(null); }}
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 sm:h-40 sm:w-40">
                      <Camera size={32} className="text-white/20" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="cursor-pointer rounded-lg bg-[#FF5C3A]/20 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#FF5C3A] transition-all hover:bg-[#FF5C3A]/30 min-h-11 flex items-center justify-center gap-2">
                      <Camera size={14} strokeWidth={2} aria-hidden="true" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleSelfieChange}
                        className="hidden"
                      />
                      {selfiePreview ? 'Tomar otra' : 'Tomar foto'}
                    </label>
                    <label className="cursor-pointer rounded-lg bg-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/70 transition-all hover:bg-white/20 min-h-11 flex items-center justify-center gap-2">
                      <Image size={14} strokeWidth={2} aria-hidden="true" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSelfieChange}
                        className="hidden"
                      />
                      {selfiePreview ? 'Cambiar' : 'Subir foto'}
                    </label>
                  </div>
                </div>

                {/* Right: Selected Product */}
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1c1c1c] p-3">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[#2a2a2a]">
                    <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />
                  </div>
                  <div className="flex min-w-0 flex-1">
                    <div>
                      <p className="text-[11px] font-bold text-white truncate">{selectedProduct.name}</p>
                      <p className="text-[9px] capitalize text-white/40 truncate">{selectedProduct.category}</p>
                      {selectedProduct.short_description && (
                        <p className="mt-1 text-[8px] text-white/30 line-clamp-2 hidden sm:block">{selectedProduct.short_description}</p>
                      )}
                      {selectedProduct.price && (
                        <p className="mt-1 text-[10px] font-bold text-[#FF5C3A]">${selectedProduct.price.toLocaleString('es-CO')}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={handleChangeProduct} className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white">
                    <X size={14} />
                  </button>
                </div>

                {/* Generate Button - using memoized content */}
                <button
                  onClick={handleGenerate}
                  disabled={!selfie || isGenerating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#FF5C3A] py-3.5 text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                >
                  {generateButtonContent}
                </button>

                {error && (
                  <p className="text-center text-[10px] text-red-400">{error}</p>
                )}
              </div>
            )}

            {/* STEP: LOADING */}
            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/5 py-12">
                <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#FF5C3A]/20 border-t-[#FF5C3A]" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                  Generando tu prueba...
                </p>
                <p className="mt-2 text-[9px] text-white/30">
                  Puede tomar hasta 20 segundos
                </p>
              </div>
            )}

            {/* STEP: RESULT */}
            {step === 'result' && resultImage && (
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Solo imagen generada - sin selfie original */}
                <div className="relative overflow-hidden rounded-xl border border-[#FF5C3A]/30 shadow-lg shadow-[#FF5C3A]/10 aspect-square">
                  <img src={resultImage} alt="Resultado del probador" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  <div className="absolute top-2 left-2 rounded-full bg-[#FF5C3A] px-2 py-0.5 text-[6px] font-black uppercase tracking-tighter text-white shadow-xl sm:text-[8px]">
                    IA
                  </div>
                  <button
                    onClick={handleBack}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/60 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white"
                    aria-label="Limpiar"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>

                {/* Botones: Ver planes (gris) + Trial (naranja) */}
                <div className="flex gap-2">
                  <Link
                    href="/planes"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Ver planes
                  </Link>
                  <Link
                    href="/trial-checkout"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF5C3A] py-2.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl shadow-[#FF5C3A]/10 transition-all hover:bg-[#ff7b5e]"
                  >
                    <Sparkles size={12} />
                    Obtén Trial
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </section>
  );
}