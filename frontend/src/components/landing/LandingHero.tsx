'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Clock, Sparkles, Camera, Check, Loader2, X, Upload, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import styles from './LandingHero.module.css';

// ── Parallax Hook ──────────────────────────────────────────────────────────────
function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current && ref.current) {
        ticking.current = true;
        requestAnimationFrame(() => {
          if (ref.current) {
            const scrollY = window.scrollY;
            ref.current.style.transform = `translateY(${scrollY * speed}px)`;
          }
          ticking.current = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return ref;
}

// ── Animation Variants ────────────────────────────────────────────────────────
const revealVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  }
};

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`${styles.sectionTag} ${light ? styles.sectionTagLight : styles.sectionTagAccent}`}>
    <span className={`${styles.sectionDot} ${light ? styles.lightDot : styles.accentDot}`} aria-hidden="true" />
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
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  // Parallax refs para blobs
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);

  // Parallax effect para blobs (con throttling para evitar lag)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (blob1Ref.current) {
            blob1Ref.current.style.transform = `translateY(${scrollY * 0.15}px)`;
          }
          if (blob2Ref.current) {
            blob2Ref.current.style.transform = `translateY(${scrollY * -0.1}px)`;
          }
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      ticking = false;
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    loadConfig();

    const checkTrial = async () => {
      try {
        const res = await fetch('/api/home/tryon/check');
        const data = await res.json();
        console.log('[HomeTryon] Trial status:', data);
        setHasUsedTrial(data.hasTrialed);
      } catch (err) {
        console.error('[HomeTryon] Error checking trial:', err);
      }
    };
    checkTrial();
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleGenerate = async () => {
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
  };

  const handleBack = () => {
    setStep('select');
    setResultImage(null);
    setError(null);
  };

  const handleChangeProduct = () => {
    setStep('select');
    setResultImage(null);
    setError(null);
  };

  return (
    <section className={styles.container} aria-label="Seccion principal">
      <div className={styles.blobContainer} aria-hidden="true">
        <div ref={blob1Ref} className={styles.blob1} />
        <div ref={blob2Ref} className={styles.blob2} />
        <div className={styles.blob3} />
        <div className={styles.glowCenter} />
      </div>

      <div className={styles.contentGrid}>
        {/* LEFT: Text Content */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className={styles.textSection}
        >
          <motion.div variants={revealVariants}>
            <SectionTag text="Revolucion Visual con IA" />
          </motion.div>

          <motion.div variants={revealVariants}>
            <h1 className={styles.heroTitle}>
              <span className={`${styles.titleDark}`}>Vende más con el</span>
              <span className={styles.titleAccent}>Probador Virtual</span>
              <span className={`${styles.titleDark}`}>N.1 de Latinoamerica.</span>
            </h1>
          </motion.div>

          <motion.div variants={revealVariants}>
            <p className={styles.heroDescription}>
              Tu tienda online, <span className={styles.highlightText}>sin pagar un diseñador.</span> Permite que tus clientes se prueben tu catálogo en segundos con IA.
            </p>
          </motion.div>

          <motion.div variants={revealVariants} className={styles.buttonContainer}>
            <motion.div>
              <Link href="/trial-checkout" className={styles.ctaPrimary}>
                <span className={styles.ctaPrimaryZIndex}>Obtén Acceso Premium</span>
                <div className={styles.shimmerEffect} />
                <ArrowRight size={18} className={styles.ctaPrimaryZIndex} aria-hidden="true" />
              </Link>
            </motion.div>

            <motion.div>
              <Link href="#como-funciona" className={styles.ctaSecondary}>
                Ver cómo funciona
              </Link>
            </motion.div>
          </motion.div>

          <motion.div variants={revealVariants} className={styles.featureBadges}>
            <div className={styles.badgeItem}>
              <ShieldCheck size={14} className={styles.badgeIcon} aria-hidden="true" /> 100% Seguro
            </div>
            <div className={styles.badgeItem}>
              <Clock size={14} className={styles.badgeIcon} aria-hidden="true" /> Activación 10min
            </div>
            <div className={styles.badgeItem}>
              <Sparkles size={14} className={styles.badgeIcon} aria-hidden="true" /> IA Generativa
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT: Widget */}
        <div className={styles.widgetContainer}>
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <Sparkles size={15} className={styles.widgetHeaderIcon} aria-hidden="true" />
              <span className={styles.widgetHeaderText}>Pruébalo ahora mismo</span>
            </div>

            {/* Browser Chrome */}
            <div className={styles.browserChrome} aria-hidden="true">
              <div className={styles.browserDots}>
                <span className={`${styles.browserDot} ${styles.dotRed}`} />
                <span className={`${styles.browserDot} ${styles.dotYellow}`} />
                <span className={`${styles.browserDot} ${styles.dotGreen}`} />
              </div>
              <div className={styles.browserUrl}>
                lookitry.com/marca/tu-marca
              </div>
            </div>

            {/* STEP: SELECT */}
            {step === 'select' && config && (
              <div className={styles.selectGrid}>
                {/* Left: Selfie Upload Area */}
                <div className={styles.selfieArea}>
                  <div className={styles.selfieAreaLabel}>Tu Foto</div>
                  <div className={styles.selfieCircle}>
                    {selfiePreview ? (
                      <img src={selfiePreview} alt="Preview" className={styles.selfieImage} loading="lazy" decoding="async" />
                    ) : (
                      <Camera size={24} strokeWidth={1} className={styles.selfieIcon} aria-hidden="true" />
                    )}
                  </div>

                  <label className={styles.uploadButton}>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieChange}
                      className={styles.hiddenInput}
                    />
                    Sube tu foto
                  </label>
                  <p className={styles.uploadHint}>preferiblemente cuerpo completo</p>
                </div>

                {/* Right: Product Grid */}
                <div className={styles.productGrid}>
                  <div className={styles.productGridHeader}>Elige un Producto</div>
                  {config.products.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleProductSelect(prod)}
                      className={`${styles.productItem} ${selectedProduct?.id === prod.id ? styles.productItemSelected : styles.productItemDefault}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Seleccionar ${prod.name}`}
                    >
                      <div className={styles.productImage}>
                        <Image src={prod.image_url} alt={prod.name} fill className={styles.objectCover} sizes="56px" />
                      </div>
                      <div className={styles.productInfo}>
                        <span className={`${styles.productName} ${selectedProduct?.id === prod.id ? styles.productNameDark : styles.productNameLight}`}>
                          {prod.name}
                        </span>
                        <span className={styles.productCategory}>{prod.category}</span>
                        {prod.price && (
                          <span className={styles.productPrice}>${prod.price.toLocaleString('es-CO')}</span>
                        )}
                      </div>
                      {selectedProduct?.id === prod.id && (
                        <div className={styles.productCheck} aria-hidden="true">
                          <Check size={8} className={styles.productCheckIcon} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className={styles.generateArea}>
                  <button
                    onClick={() => {
                      if (!selfie) {
                        setStep('selfie');
                      }
                      else if (hasUsedTrial) {
                        setShowUpgradeModal(true);
                      }
                      else if (selectedProduct) {
                        handleGenerate();
                      }
                    }}
                    disabled={!hasUsedTrial && !selectedProduct}
                    className={styles.generateButton}
                  >
                    <Sparkles size={16} />
                    {selfie ? 'Generar Prueba' : 'Ver Probador IA'}
                  </button>
                  {!hasUsedTrial && (
                    <span className={styles.trialBadge}>
                      <Sparkles size={10} />
                      1 generación gratis
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* STEP: SELFIE */}
            {step === 'selfie' && selectedProduct && (
              <div className={styles.selfieStep}>
                <div className={styles.selfiePreview}>
                  <div className={styles.selfieAreaLabel}>Tu Foto</div>
                  {selfiePreview ? (
                    <div className={styles.selfiePreviewImage}>
                      <img src={selfiePreview} alt="Tu selfie" className={styles.selfiePreviewImg} loading="lazy" decoding="async" />
                      <button
                        onClick={() => { setSelfie(null); setSelfiePreview(null); }}
                        className={styles.removeButton}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.emptySelfieCircle}>
                      <Camera size={32} className={styles.selfieIcon} />
                    </div>
                  )}
                  <label className={styles.uploadButton}>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieChange}
                      className={styles.hiddenInput}
                    />
                    {selfiePreview ? 'Cambiar' : 'Sube tu foto'}
                  </label>
                </div>

                <div className={styles.selectedProductCard}>
                  <div className={styles.selectedProductImage}>
                    <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className={styles.objectCover} />
                  </div>
                  <div className={styles.selectedProductInfo}>
                    <div>
                      <p className={styles.selectedProductName}>{selectedProduct.name}</p>
                      <p className={styles.selectedProductCategory}>{selectedProduct.category}</p>
                      {selectedProduct.short_description && (
                        <p className={styles.selectedProductDescription}>{selectedProduct.short_description}</p>
                      )}
                      {selectedProduct.price && (
                        <p className={styles.selectedProductPrice}>${selectedProduct.price.toLocaleString('es-CO')}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={handleChangeProduct} className={styles.changeProductButton}>
                    <X size={14} />
                  </button>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!selfie || isGenerating}
                  className={styles.generateButton}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className={styles.spinningIcon} />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Ver Probador IA
                    </>
                  )}
                </button>

                {error && (
                  <p className={styles.errorText}>{error}</p>
                )}
              </div>
            )}

            {/* STEP: LOADING */}
            {step === 'loading' && (
              <div className={styles.loadingStep}>
                <div className={styles.spinner} />
                <p className={styles.loadingText}>Generando tu prueba...</p>
                <p className={styles.loadingSubtext}>Puede tomar hasta 20 segundos</p>
              </div>
            )}

            {/* STEP: RESULT */}
            {step === 'result' && resultImage && (
              <div className={styles.resultStep}>
                <div className={styles.resultImage}>
                  <img src={resultImage} alt="Resultado del probador" className={styles.resultImg} loading="lazy" decoding="async" />
                  <div className={styles.resultBadge}>IA</div>
                  <button
                    onClick={handleBack}
                    className={styles.resetButton}
                    aria-label="Limpiar"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>

                <div className={styles.resultButtons}>
                  <Link href="/planes" className={styles.resultButtonSecondary}>
                    Ver planes
                  </Link>
                  <Link href="/trial-checkout" className={styles.resultButtonPrimary}>
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