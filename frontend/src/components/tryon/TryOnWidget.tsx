'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { tryonService } from '@/services/tryon.service';
import type { TryOnConfigResponse } from '@/types';
import { TemplateBare } from './templates/TemplateBare';
import { TemplateLandingEmbed } from './templates/TemplateLandingEmbed';
import { TemplateShowcase } from './templates/TemplateShowcase';
import { TemplateModernSidebar } from './templates/TemplateModernSidebar';
import { TemplateBoldProStudio } from './templates/TemplateBoldProStudio';
import { LegalDisclaimerModal } from './LegalDisclaimerModal';
import type { Layout, Product, Step } from './templates/types';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import FingerJS from '@fingerprintjs/fingerprintjs';

const TERMS_STORAGE_KEY = 'tryon_terms_accepted';
const getResultStorageKey = (slug: string) => `tryon_result_${slug}`;

interface TryOnWidgetProps {
  brandSlug: string;
  isEmbed?: boolean;
  initialProductId?: string | null;
  externalId?: string | null; // ID de plataforma externa
  forceLayout?: 'top-bar' | 'sidebar' | 'centered' | 'bare';
  pluginView?: boolean;
  lockProductSelection?: boolean;
}

function templateToLayout(template?: string): Layout {
  switch (template) {
    case 'modern':   return 'sidebar';
    case 'bold':     return 'centered';
    case 'bare':     return 'bare';
    case 'showcase':
    case 'minimal':
    case 'top-bar':
      return 'showcase';
    case undefined:
      return 'bare';
    default:
      return 'bare';
  }
}

// ── Componente principal ──────────────────────────────────────────────────────
export function TryOnWidget({ 
  brandSlug, 
  isEmbed = false, 
  initialProductId = null, 
  externalId = null, 
  forceLayout, 
  pluginView = false,
  lockProductSelection = false 
}: TryOnWidgetProps) {
  const isLocked = lockProductSelection || pluginView;
  const hasLockedProduct = isLocked && !!(initialProductId || externalId);
  // Nuevo flujo: Comenzamos en 'select' para que el usuario elija primero el producto.
  const [step, setStep] = useState<Step>('select');
  const [config, setConfig] = useState<TryOnConfigResponse | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [generationId, setGenerationId]     = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorIsService, setErrorIsService] = useState(false);
  const [errorIsContentPolicy, setErrorIsContentPolicy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadPrivacyNotice, setUploadPrivacyNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  // Productos ya generados en esta sesión: productId → imageUrl
  const [generatedProducts, setGeneratedProducts] = useState<Map<string, string>>(new Map());
  // Hash de la selfie actual para cachear resultados por selfie específica
  const [selfieHash, setSelfieHash] = useState<string>('');
  // Términos aceptados en esta sesión
  const [termsAccepted, setTermsAccepted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(TERMS_STORAGE_KEY) === 'true';
  });

  // Fingerprint del cliente para límite de intentos por usuario
  const [clientFingerprint, setClientFingerprint] = useState<string>('');

  // Cargar FingerprintJS al montar el componente
  useEffect(() => {
    const loadFingerprint = async () => {
      try {
        const fp = await FingerJS.load();
        const result = await fp.get();
        setClientFingerprint(result.visitorId);
      } catch (e) {
        console.warn('[TryOnWidget] FingerprintJS no disponible:', e);
      }
    };
    loadFingerprint();
  }, []);

  // Generar hash SHA-256 de un archivo
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Key del caché incluye hash de selfie para evitar resultados de selfies distintas
  const getCacheKey = (slug: string, hash: string) => `tryon_gen_${slug}_${hash.substring(0, 8)}`;

  // Cargar productos generados previos de localStorage al montar o cambiar selfie
  useEffect(() => {
    if (!brandSlug || !selfieHash) return;
    const key = getCacheKey(brandSlug, selfieHash);
    const saved = localStorage.getItem(key);
      if (saved) {
      try {
        const { products } = JSON.parse(saved);
        if (products) setGeneratedProducts(new Map(Object.entries(products)));
      } catch {
        // Cache corrupto, limpiar
        localStorage.removeItem(key);
      }
    }
  }, [brandSlug, selfieHash]);

  // Guardar productos generados en localStorage
  useEffect(() => {
    if (!brandSlug || generatedProducts.size === 0 || !selfieHash) return;
    const key = getCacheKey(brandSlug, selfieHash);
    try {
      localStorage.setItem(key, JSON.stringify({ products: Object.fromEntries(generatedProducts) }));
      } catch {
      // localStorage lleno o no disponible, continuar sin caché
    }
  }, [generatedProducts, brandSlug, selfieHash]);

  const loadConfig = useCallback(async () => {
    if (!brandSlug) return;
    try {
      setLoading(true);
      const data = await tryonService.getConfig(brandSlug);
      setConfig(data);
      setError(null);

      // Pre-seleccionar producto si viene por props
      if (data.products) {
        let found = null;
        if (externalId) {
          found = data.products.find((p: any) => String(p.externalId) === String(externalId));
        }
        if (!found && initialProductId) {
          found = data.products.find((p: any) => p.id === initialProductId);
        }

        if (found) {
          setSelectedProduct(found);
          // Si estamos inyectando un producto pre-seleccionado, pasamos automáticamente al paso de subida.
          setStep('upload');
        }

        // Auto-select first product if lockProductSelection but no initialProductId
        // This ensures the widget has something to show even when no product is pre-selected
        if (isLocked && !initialProductId && !externalId && data.products?.length > 0) {
          setSelectedProduct(data.products[0]);
          setStep('upload'); // Jump to upload since product is pre-selected
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [brandSlug, initialProductId, externalId]);

  useEffect(() => {
    // Don't call API with empty slug
    if (!brandSlug) return;
    loadConfig();
  }, [loadConfig, brandSlug]);

  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [selfiePreview]);

  // Restaurar último resultado al montar (persiste a través de refreshes de página)
  useEffect(() => {
    if (!brandSlug || loading) return;
    const saved = sessionStorage.getItem(getResultStorageKey(brandSlug));
    if (!saved) return;
    try {
      const { resultImageUrl: savedUrl, generationId: savedGenId, selectedProduct: savedProduct } = JSON.parse(saved);
      if (savedUrl && savedProduct) {
        setResultImageUrl(savedUrl);
        setGenerationId(savedGenId ?? null);
        setSelectedProduct(savedProduct);
        setStep('result');
      }
    } catch {
      sessionStorage.removeItem(getResultStorageKey(brandSlug));
    }
  }, [brandSlug, loading]);

  // Guardar resultado en sessionStorage cuando el usuario llega al paso 'result'
  useEffect(() => {
    if (step !== 'result' || !resultImageUrl || !selectedProduct) return;
    try {
      sessionStorage.setItem(getResultStorageKey(brandSlug), JSON.stringify({
        resultImageUrl,
        generationId,
        selectedProduct,
      }));
    } catch {
      // sessionStorage no disponible
    }
  }, [step, resultImageUrl, generationId, selectedProduct, brandSlug]);

  const handleSelfieReset = useCallback(() => {
    sessionStorage.removeItem(getResultStorageKey(brandSlug));
    setSelfiePreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSelfieFile(null);
    setSelfieHash('');
    setResultImageUrl(null);
    setGenerationId(null);
    setNotice(null);
    setGeneratedProducts(new Map());
    setStep('upload');
  }, [brandSlug]);

  const handleProductReset = useCallback(() => {
    sessionStorage.removeItem(getResultStorageKey(brandSlug));
    setSelectedProduct(null);
    setStep('select');
  }, [brandSlug]);

  const handleReset = useCallback(() => {
    sessionStorage.removeItem(getResultStorageKey(brandSlug));
    if (selfieHash) {
      const key = getCacheKey(brandSlug, selfieHash);
      localStorage.removeItem(key);
    }

    setSelfiePreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    setSelfieFile(null);
    setSelfieHash('');
    setSelectedProduct(prev => (hasLockedProduct ? prev : null));
    setResultImageUrl(null); setGenerationId(null); setError(null); setErrorIsService(false); setErrorIsContentPolicy(false);
    setNotice(null);
    setGeneratedProducts(new Map());
    setStep(hasLockedProduct ? 'upload' : 'select');
  }, [brandSlug, selfieHash, hasLockedProduct]);

  const handleSelfieUpload = async (file: File, preview: string) => {
    setSelfiePreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    setSelfieFile(file); 
    setNotice(null);
    setUploadPrivacyNotice('Tu selfie solo se usa en tu navegador y se devuelve al subir una nueva foto');
    
    // Generar hash de la selfie para cachear resultados específicos por selfie
    let newHash = '';
    try {
      newHash = await generateFileHash(file);
      setSelfieHash(newHash);
      
      // Invalida el caché cuando se sube una COMPLETAMENTE NUEVA selfie
      const key = getCacheKey(brandSlug, newHash);
      localStorage.removeItem(key);
    } catch {
      // Hash falló, continuar sin caché por selfie específica
    }
    setGeneratedProducts(new Map());
    
    if (!selectedProduct) {
      setStep('select');
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    // En las plantillas donde los pasos están muy divididos (PRO), avanzamos automáticamente?
    // Es mejor dejar que el botón "Siguiente" lo haga para mejorar UX.
  };

  /**
   * Hacer polling del estado de una generación hasta que esté lista
   * Maximum ~135s (15 polls × ~9s average with exponential backoff)
   */
  const pollGeneration = useCallback(async (generationId: string) => {
    const MAX_POLLS = 30;
    for (let i = 0; i < MAX_POLLS; i++) {
      // Dynamic polling: faster at first, then slower
      const delay = i < 5 ? 1000 : i < 10 ? 2000 : 3000;
      await new Promise(resolve => setTimeout(resolve, delay));

      let status;
      try {
        // IMPORTANTE: pasar brandSlug para usar la ruta pública de polling
        status = await tryonService.getGenerationStatus(generationId, brandSlug);
      } catch {
        // Error de red — continuar polleando silenciosamente
        continue;
      }

      if (status.status === 'SUCCESS' && status.imageUrl) {
        return status;
      }
      if (status.status === 'FAILED') {
        throw new Error(status.error || 'La generación falló. Por favor intenta de nuevo.');
      }
      // PENDING — seguir esperando
    }
    throw new Error('Timeout esperando resultado. Por favor intenta de nuevo.');
  }, [brandSlug]);

  const handleGenerate = async (fileOverride?: File, productOverride?: Product, force = false) => {
    const activeFile = fileOverride || selfieFile;
    const activeProduct = productOverride || selectedProduct;
    if (!activeFile || !activeProduct) return;

    // Si términos no aceptados, mostrar modal en lugar de proceder
    if (!termsAccepted && !force) {
      setShowDisclaimerModal(true);
      return;
    }

    const cached = generatedProducts.get(activeProduct.id);
    if (cached && !force) {
      setNotice('Ya habías probado este producto con tu foto actual. Te mostramos el resultado guardado para que sigas sin costo adicional.');
      setResultImageUrl(cached);
      setStep('result');
      return;
    }

    try {
      setStep('generating');
      setError(null);
      setErrorIsService(false);
      setNotice(null);

      let imageUrl: string | undefined;
      let genId: string | null = null;
      let reused = false;
      let processingTime: number | undefined;

      try {
        const result = await tryonService.generate(brandSlug, { productId: activeProduct.id, selfieFile: activeFile, clientFingerprint, termsAccepted });
        imageUrl = result.imageUrl;
        genId = result.generationId ?? null;
        reused = result.reused ?? false;
        processingTime = result.processingTime;
      } catch (err: any) {
        const isService = err.isServiceError === true || err.message === 'SERVICE_CREDITS_EXHAUSTED';
        const isClientLimit = err.clientAttemptLimit === true;
        const isContentPolicy = err.isContentPolicy === true;
        setErrorIsService(isService);
        setErrorIsContentPolicy(isContentPolicy);
        if (isService) {
          setShowUpgradeModal(true);
          setError('SERVICE_CREDITS_EXHAUSTED');
        } else if (isContentPolicy) {
          setError('IMAGE_CONTENT_POLICY');
        } else if (isClientLimit) {
          setError(err.message || 'Ya usaste tus 3 intentos para este producto.');
        } else {
          setError(err.message || 'Algo salió mal. Intenta de nuevo.');
        }
        setStep('upload');
        if (isEmbed) window.parent?.postMessage({ type: 'TRYON_ERROR', data: { error: err.message } }, EMBED_ORIGIN);
        return;
      }

      // Si el backend nos dio imageUrl directamente, usar directamente
      if (imageUrl) {
        setResultImageUrl(imageUrl);
        setGenerationId(genId);
        if (reused) {
          setNotice('Ya existía un resultado para esta foto y este producto. Te mostramos el guardado sin costo adicional.');
        }
        setGeneratedProducts(prev => new Map(prev).set(activeProduct.id, imageUrl!));
        setStep('result');
        if (isEmbed) window.parent?.postMessage({ type: 'TRYON_COMPLETE', data: { imageUrl, productId: activeProduct.id, productName: activeProduct.name, generationId: genId, processingTime } }, EMBED_ORIGIN);
        return;
      }

      // Backend devolvió solo generationId — hacer polling
      if (!genId) {
        throw new Error('No se pudo iniciar la generación. Intenta de nuevo.');
      }

      setGenerationId(genId);
      const finalResult = await pollGeneration(genId);
      setResultImageUrl(finalResult.imageUrl!);
      setGeneratedProducts(prev => new Map(prev).set(activeProduct.id, finalResult.imageUrl!));
      setStep('result');
      if (isEmbed) window.parent?.postMessage({ type: 'TRYON_COMPLETE', data: { imageUrl: finalResult.imageUrl, productId: activeProduct.id, productName: activeProduct.name, generationId: genId, processingTime: finalResult.processingTime } }, EMBED_ORIGIN);
    } catch (err: any) {
      const isService = err.isServiceError === true || err.message === 'SERVICE_CREDITS_EXHAUSTED';
      setErrorIsService(isService);
      setNotice(null);
      if (isService) {
        setShowUpgradeModal(true);
        setError('SERVICE_CREDITS_EXHAUSTED');
      } else {
        setError(err.message || 'Algo salió mal. Intenta de nuevo.');
      }
      setStep('upload');
      if (isEmbed) window.parent?.postMessage({ type: 'TRYON_ERROR', data: { error: err.message } }, EMBED_ORIGIN);
    }
  };

  // Handler cuando el usuario acepta los términos
  const handleTermsAccepted = useCallback(() => {
    sessionStorage.setItem(TERMS_STORAGE_KEY, 'true');
    setTermsAccepted(true);
    setShowDisclaimerModal(false);
  }, []);

  const EMBED_ORIGIN = useMemo(() => {
    if (typeof window === 'undefined' || !document.referrer) return '*';
    try {
      return new URL(document.referrer).origin;
    } catch {
      return '*';
    }
  }, []);

  useEffect(() => {
    if (!isEmbed || !config) return;
    window.parent?.postMessage({ type: 'TRYON_READY', data: { brandSlug, brandName: config.brand.name } }, EMBED_ORIGIN);
    const handleMessage = (e: MessageEvent) => { if (e.data.type === 'TRYON_RESET') handleReset(); };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbed, config, brandSlug, handleReset, EMBED_ORIGIN]);

  useEffect(() => {
    if (!isEmbed) return;
    const container = document.getElementById('tryon-widget-container');
    if (!container) return;
    const notifyHeight = () =>
      window.parent?.postMessage({ type: 'TRYON_RESIZE', data: { height: container.scrollHeight } }, EMBED_ORIGIN);
    notifyHeight();
    const observer = new ResizeObserver(notifyHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isEmbed, EMBED_ORIGIN]);

  const primaryColor   = config?.brand.primaryColor   || '#FF5C3A';
  const secondaryColor = config?.brand.secondaryColor || '#f9fafb';
  const buttonText     = config?.brand.buttonText     || 'Probarme esto';
  const welcomeMessage = config?.brand.welcomeMessage || '';
  const selectedLayout = templateToLayout(config?.brand?.widgetTemplate);
  const isPro = (config?.brand?.plan || 'BASIC') === 'PRO';
  
  const effectiveLayout = pluginView ? 'bare' : (forceLayout || (isPro ? selectedLayout : 'bare'));

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center px-6">
          <div className="w-14 h-14 border-4 border-gray-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: primaryColor }} />
          <p className="mt-4 text-gray-500 text-sm font-medium">Cargando el probador...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">No encontramos esta tienda</h2>
          <p className="mt-2 text-white/60 text-sm">{error || 'Verifica el enlace e intenta de nuevo'}</p>
          <button onClick={loadConfig} className="mt-5 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: primaryColor }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const templateProps = {
    step,
    config,
    brandSlug,
    isEmbed,
    pluginView,
    primaryColor,
    secondaryColor,
    buttonText,
    welcomeMessage,
    shareMessage: config.brand.shareMessage,
    selfiePreview,
    selectedProduct,
    resultImageUrl,
    generationId,
    error,
    errorIsService,
    errorIsContentPolicy,
    notice,
    generatedProducts,
    lockProductSelection: isLocked,
    onReset: handleReset,
    onSelfieReset: handleSelfieReset,
    onSelfieUpload: handleSelfieUpload,
    onProductSelect: handleProductSelect,
    onProductReset: handleProductReset,
    onProceedToUpload: () => setStep('upload'),
    onBack: () => setStep('select'),
    onGenerate: () => handleGenerate(),
    onDismissError: () => { setError(null); setErrorIsService(false); setErrorIsContentPolicy(false); },
    onDismissNotice: () => setNotice(null),
    termsAccepted,
    onTermsAccepted: handleTermsAccepted,
  } as const;

  const renderTemplate = () => {
    switch (effectiveLayout) {
      case 'bare':
        return isEmbed ? <TemplateLandingEmbed {...templateProps} /> : <TemplateBare {...templateProps} />;
      case 'sidebar':
        return <TemplateModernSidebar {...templateProps} />;
      case 'centered':
        return <TemplateBoldProStudio {...templateProps} />;
      case 'showcase':
      default:
        return <TemplateShowcase {...templateProps} />;
    }
  };

  return (
    <div id="tryon-widget-container" className="w-full flex flex-col items-center">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <LegalDisclaimerModal
        isOpen={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
        brandPrimaryColor={primaryColor}
      />
      {renderTemplate()}
    </div>
  );
}
