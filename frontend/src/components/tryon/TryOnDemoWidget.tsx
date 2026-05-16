'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Camera, Check, Loader2, X, RotateCcw, ImageIcon } from 'lucide-react';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { PostDemoModal } from '@/components/landing/PostDemoModal';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  short_description: string | null;
  image_url: string;
  category: string;
  price: number | null;
}

interface HomeTryonConfig {
  brand: { id: string; name: string; slug: string };
  products: Product[];
}

type TryOnStep = 'select' | 'selfie' | 'loading' | 'result';

export interface TryOnDemoWidgetProps {
  /** Called with the result image URL after a successful generation */
  onResult?: (resultUrl: string) => void;
  /** Whether to show the browser chrome bar. Default: true */
  showBrowserChrome?: boolean;
}

// ── ProductItem ───────────────────────────────────────────────────────────────

const ProductItem = React.memo(({ prod, selectedProduct, onSelect }: {
  prod: Product;
  selectedProduct: Product | null;
  onSelect: (p: Product) => void;
}) => {
  const isSelected = selectedProduct?.id === prod.id;
  return (
    <div
      onClick={() => onSelect(prod)}
      className={`group/item flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all duration-200 sm:gap-3 sm:rounded-xl sm:p-3 ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg shadow-[var(--accent)]/5' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
      role="button"
      tabIndex={0}
      aria-label={`Seleccionar ${prod.name}`}
    >
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--border-color)] sm:h-14 sm:w-14">
        <Image src={prod.image_url} alt={prod.name} fill className="object-cover" sizes="56px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={`truncate text-[9px] font-bold sm:text-[11px] ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{prod.name}</span>
        <span className="text-[7px] capitalize text-[var(--text-muted)] sm:text-[8px] truncate">{prod.category}</span>
        {prod.price && <span className="text-[7px] font-bold text-[var(--accent)] sm:text-[9px]">${prod.price.toLocaleString('es-CO')}</span>}
      </div>
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] sm:h-5 sm:w-5" aria-hidden="true">
          <Check size={8} className="text-white sm:text-xs" />
        </motion.div>
      )}
    </div>
  );
});
ProductItem.displayName = 'ProductItem';

// ── TryOnDemoWidget ───────────────────────────────────────────────────────────

export default function TryOnDemoWidget({ onResult, showBrowserChrome = true }: TryOnDemoWidgetProps) {
  const [config, setConfig] = useState<HomeTryonConfig | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<TryOnStep>('select');
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPostDemoModal, setShowPostDemoModal] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/home/tryon/config');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!data?.products) throw new Error('No se pudieron cargar los productos de prueba.');
        setConfig(data);
        if (data.products.length > 0) setSelectedProduct(data.products[0]);
      } catch (err: any) {
        console.warn('[TryOnDemoWidget] Error loading config:', err.message);
        setError(err.message || 'Error al conectar con el servidor.');
      }
    };
    const timer = setTimeout(loadConfig, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (step === 'result' && resultImage) {
      onResult?.(resultImage);
      const captured = localStorage.getItem('lead_captured');
      if (!captured) {
        const timer = setTimeout(() => setShowPostDemoModal(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [step, resultImage, onResult]);

  const handleLeadCaptured = useCallback(() => {
    localStorage.setItem('lead_captured', 'true');
    setShowPostDemoModal(false);
  }, []);

  const fetchTrialStatus = useCallback(async () => {
    if (!selectedProduct) return false;
    if (hasUsedTrial !== undefined) return hasUsedTrial;
    try {
      const res = await fetch(`/api/home/tryon/check?productId=${selectedProduct.id}`);
      const data = await res.json();
      setHasUsedTrial(data.hasTrialed);
      return data.hasTrialed;
    } catch {
      setHasUsedTrial(false);
      return false;
    }
  }, [selectedProduct, hasUsedTrial]);

  const handleProductSelect = useCallback((product: Product) => setSelectedProduct(product), []);

  const handleSelfieChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setSelfie(base64.split(',')[1]);
      setSelfiePreview(base64);
      setStep('selfie');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selfie || !selectedProduct) return;
    setIsGenerating(true);
    setError(null);
    setStep('loading');
    try {
      const formData = new FormData();
      formData.append('productId', selectedProduct.id);
      const base64Data = selfie.split(',')[1] || selfie;
      const binaryData = Buffer.from(base64Data, 'base64');
      const blob = new Blob([binaryData], { type: 'image/jpeg' });
      formData.append('selfie', blob, 'selfie.jpg');
      const res = await fetch('/api/home/tryon/generate', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.status === 429 || data.error === 'TRIAL_LIMIT_EXCEEDED') {
        setShowUpgradeModal(true);
        setStep('select');
        setHasUsedTrial(true);
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.message || 'Error generando prueba');
      setResultImage(data.resultImageUrl);
      setStep('result');
    } catch (err: any) {
      console.warn('[TryOnDemoWidget] Generation error:', err.message);
      setError(err.message || 'Error en el servicio');
      setStep('selfie');
    } finally {
      setIsGenerating(false);
    }
  }, [selfie, selectedProduct]);

  const handleBack = useCallback(() => { setStep('select'); setResultImage(null); setError(null); }, []);
  const handleChangeProduct = useCallback(() => { setStep('select'); setResultImage(null); setError(null); }, []);

  const handleCTA = useCallback(async () => {
    if (!selfie) { setStep('selfie'); return; }
    if (hasUsedTrial === undefined) {
      const hasTrialed = await fetchTrialStatus();
      if (hasTrialed) { setShowUpgradeModal(true); return; }
    } else if (hasUsedTrial) { setShowUpgradeModal(true); return; }
    if (selectedProduct) handleGenerate();
  }, [selfie, hasUsedTrial, selectedProduct, fetchTrialStatus, handleGenerate]);

  const productItems = useMemo(() => config ? config.products.map((prod) => (
    <ProductItem key={prod.id} prod={prod} selectedProduct={selectedProduct} onSelect={handleProductSelect} />
  )) : [], [config, selectedProduct, handleProductSelect]);

  const ctaSection = useMemo(() => (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleCTA}
        disabled={!hasUsedTrial && !selectedProduct}
        className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 px-6 text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
      >
        <Sparkles size={16} />
        {selfie ? 'Generar Prueba' : 'Ver Probador IA'}
      </button>
      {!hasUsedTrial && (
        <span className="flex items-center gap-1 rounded-full bg-[var(--bg-card)] px-3 py-1 text-[9px] font-semibold text-[var(--text-secondary)]">
          <Sparkles size={10} /> 1 generación gratis
        </span>
      )}
    </div>
  ), [handleCTA, selfie, hasUsedTrial, selectedProduct]);

  return (
    <>
      <div className="group/widget relative z-10 w-full overflow-hidden rounded-2xl bg-[var(--bg-card)] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.3)] sm:rounded-[2rem] sm:p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-3 flex items-center justify-center gap-2 rounded-full bg-[var(--bg-base)] px-4 py-2 text-center sm:mb-6 sm:gap-3"
        >
          <Sparkles size={15} className="text-[var(--accent)]" aria-hidden="true" />
          <span className="text-[15px] font-bold uppercase tracking-wider text-[var(--accent)]">Pruébalo ahora mismo</span>
        </motion.div>

        {/* Browser Chrome */}
        {showBrowserChrome && (
          <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3" aria-hidden="true">
            <div className="flex gap-1 sm:gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 sm:h-2 sm:w-2" />
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 sm:h-2 sm:w-2" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] sm:h-2 sm:w-2" />
            </div>
            <div className="flex-1 truncate rounded-md border border-[var(--border-color)] bg-[var(--bg-base)] px-2 py-1 text-center font-dm-sans text-[7px] uppercase tracking-widest text-[var(--text-muted)] sm:px-4 sm:text-[9px]">
              lookitry.com/demo
            </div>
          </div>
        )}

        {/* Step: SELECT */}
        {step === 'select' && config && (
          <div className="flex flex-col gap-3 sm:gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
              className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-base)] p-4 text-center hover:border-[var(--text-muted)] sm:p-6"
            >
              <div className="absolute top-2 left-4 text-[6px] font-bold uppercase tracking-widest text-[var(--text-muted)] sm:text-[8px]">Tu Foto</div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden sm:h-16 sm:w-16">
                {selfiePreview ? <img src={selfiePreview} alt="Preview" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <Camera size={24} strokeWidth={1} className="text-[var(--text-muted)]" aria-hidden="true" />}
              </div>
              <div className="mt-3 flex gap-2">
                <label className="cursor-pointer rounded-lg bg-[var(--accent)]/15 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:bg-[var(--accent)]/25 sm:text-[11px] min-h-11 flex items-center justify-center gap-2">
                  <Camera size={14} strokeWidth={2} aria-hidden="true" />
                  <input type="file" accept="image/*" capture="user" onChange={handleSelfieChange} className="hidden" />
                  Tomar foto
                </label>
                <label className="cursor-pointer rounded-lg bg-[var(--bg-hover)] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:bg-[var(--border-color)] sm:text-[11px] min-h-11 flex items-center justify-center gap-2">
                  <ImageIcon size={14} strokeWidth={2} aria-hidden="true" />
                  <input type="file" accept="image/*" onChange={handleSelfieChange} className="hidden" />
                  Subir foto
                </label>
              </div>
              <p className="text-[8px] font-bold capitalize tracking-widest text-[var(--text-muted)] sm:text-[10px]">preferiblemente cuerpo completo</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="flex flex-col gap-2 sm:gap-3">
              <div className="px-0.5 text-[7px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] sm:text-[8px]">Elige un Producto</div>
              {productItems}
            </motion.div>
            {ctaSection}
          </div>
        )}

        {/* Step: SELFIE */}
        {step === 'selfie' && selectedProduct && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] p-4 text-center hover:border-[var(--text-muted)] sm:p-6">
              {selfiePreview ? (
                <div className="relative mb-3 h-32 w-32 overflow-hidden rounded-xl sm:h-40 sm:w-40">
                  <img src={selfiePreview} alt="Tu selfie" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  <button onClick={() => { setSelfie(null); setSelfiePreview(null); }} className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] backdrop-blur-sm hover:bg-[var(--bg-hover)]">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="mb-3 flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] sm:h-40 sm:w-40">
                  <Camera size={32} className="text-[var(--text-muted)]" />
                </div>
              )}
              <div className="flex gap-2">
                <label className="cursor-pointer rounded-lg bg-[var(--accent)]/15 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:bg-[var(--accent)]/25 min-h-11 flex items-center justify-center gap-2">
                  <Camera size={14} strokeWidth={2} aria-hidden="true" />
                  <input type="file" accept="image/*" capture="user" onChange={handleSelfieChange} className="hidden" />
                  {selfiePreview ? 'Tomar otra' : 'Tomar foto'}
                </label>
                <label className="cursor-pointer rounded-lg bg-[var(--bg-hover)] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:bg-[var(--border-color)] min-h-11 flex items-center justify-center gap-2">
                  <ImageIcon size={14} strokeWidth={2} aria-hidden="true" />
                  <input type="file" accept="image/*" onChange={handleSelfieChange} className="hidden" />
                  {selfiePreview ? 'Cambiar' : 'Subir foto'}
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] p-3 hover:border-[var(--text-muted)]">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--border-color)]">
                <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1">
                <div>
                  <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">{selectedProduct.name}</p>
                  <p className="text-[9px] capitalize text-[var(--text-muted)] truncate">{selectedProduct.category}</p>
                </div>
              </div>
              <button onClick={handleChangeProduct} className="rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><X size={14} /></button>
            </div>
            <button onClick={handleGenerate} disabled={!selfie || isGenerating}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50 hover:brightness-110 active:scale-[0.98]"
            >
              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generando...</> : <><Sparkles size={16} /> Ver Probador IA</>}
            </button>
            {error && <p className="text-center text-[10px] text-red-400">{error}</p>}
          </motion.div>
        )}

        {/* Step: LOADING */}
        {step === 'loading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] py-12">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[var(--accent)]/20 border-t-[var(--accent)]" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Generando tu prueba...</p>
            <p className="mt-2 text-[9px] text-[var(--text-muted)]">Puede tomar hasta 20 segundos</p>
          </motion.div>
        )}

        {/* Step: RESULT */}
        {step === 'result' && resultImage && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-3 sm:gap-4">
            <div className="relative overflow-hidden rounded-xl shadow-lg shadow-[var(--accent)]/10 aspect-square">
              <img src={selfiePreview || ''} alt="Tu foto original" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute top-2 left-2 rounded-full bg-[var(--text-muted)] px-2 py-0.5 text-[6px] font-black uppercase text-white shadow-xl sm:text-[8px]">Antes</div>
              <button onClick={handleBack} className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/60 backdrop-blur-sm hover:bg-black/60 hover:text-white" aria-label="Limpiar">
                <RotateCcw size={12} />
              </button>
            </div>
            <div className="flex gap-2">
              <Link href="/planes" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">Ver planes</Link>
              <Link href="/trial-checkout" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl shadow-[var(--accent)]/10 hover:brightness-110">
                <Sparkles size={12} /> Obtén Trial
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <PostDemoModal isOpen={showPostDemoModal} onClose={() => setShowPostDemoModal(false)} onLeadCaptured={handleLeadCaptured} />
    </>
  );
}
