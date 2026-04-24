'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { tryonService } from '@/services/tryon.service';
import type { TryOnConfigResponse } from '@/types';
import { TemplateBare } from './templates/TemplateBare';
import { TemplateLandingEmbed } from './templates/TemplateLandingEmbed';
import { TemplateShowcase } from './templates/TemplateShowcase';
import { TemplateModernSidebar } from './templates/TemplateModernSidebar';
import { TemplateBoldProStudio } from './templates/TemplateBoldProStudio';
import type { Layout, Product, Step } from './templates/types';
import { UpgradeModal } from '@/components/ui/UpgradeModal';

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
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadPrivacyNotice, setUploadPrivacyNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // Productos ya generados en esta sesión: productId → imageUrl
  const [generatedProducts, setGeneratedProducts] = useState<Map<string, string>>(new Map());
  // Hash de la selfie actual para cachear resultados por selfie específica
  const [selfieHash, setSelfieHash] = useState<string>('');

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
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [brandSlug, initialProductId, externalId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [selfiePreview]);

  const handleReset = useCallback(() => {
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
    setResultImageUrl(null); setGenerationId(null); setError(null); setErrorIsService(false);
    setNotice(null);
    setGeneratedProducts(new Map());
    // Nuevo flujo: Reset vuelve a select, a menos que el producto esté bloqueado, entonces vuelve a upload
    setStep(hasLockedProduct ? 'upload' : 'select');
  }, [brandSlug, selfieHash, hasLockedProduct]);

  const handleSelfieUpload = async (file: File, preview: string) => {
    setSelfiePreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    setSelfieFile(file); 
    setNotice(null);
    setUploadPrivacyNotice('Tu selfie solo se usa en tu navegador y se elimina al subir una nueva foto');
    
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
    
    if (selectedProduct) {
      // Si el usuario sube la foto y ya había seleccionado el producto, genera automáticamente.
      handleGenerate(file, selectedProduct, true);
    } else {
      // Como seguridad, si logró subir sin producto (bare), pasa a select,
      // aunque nuestro nuevo diseño en bare deshabilitará el upload si no hay producto.
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
    const MAX_POLLS = 15;
    for (let i = 0; i < MAX_POLLS; i++) {
      // Espera inicial 3s, luego +1s por cada poll adicional (3s, 4s, 5s…)
      const delay = (i + 3) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      let status;
      try {
        status = await tryonService.getGenerationStatus(generationId);
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
  }, []);

  const handleGenerate = async (fileOverride?: File, productOverride?: Product, force = false) => {
    const activeFile = fileOverride || selfieFile;
    const activeProduct = productOverride || selectedProduct;
    if (!activeFile || !activeProduct) return;

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
        const result = await tryonService.generate(brandSlug, { productId: activeProduct.id, selfieFile: activeFile });
        imageUrl = result.imageUrl;
        genId = result.generationId ?? null;
        reused = result.reused ?? false;
        processingTime = result.processingTime;
      } catch (err: any) {
        const isService = err.isServiceError === true || err.message === 'SERVICE_CREDITS_EXHAUSTED';
        setErrorIsService(isService);
        if (isService) {
          setShowUpgradeModal(true);
          setError('SERVICE_CREDITS_EXHAUSTED');
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
    const notifyHeight = () =>
      window.parent?.postMessage({ type: 'TRYON_RESIZE', data: { height: document.documentElement.scrollHeight } }, EMBED_ORIGIN);
    notifyHeight();
    const observer = new ResizeObserver(notifyHeight);
    observer.observe(document.body);
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
    notice,
    generatedProducts,
    lockProductSelection: isLocked,
    onReset: handleReset,
    onSelfieUpload: handleSelfieUpload,
    onProductSelect: handleProductSelect,
    onProceedToUpload: () => setStep('upload'),
    onBack: () => setStep('select'),
    onGenerate: () => handleGenerate(),
    onDismissError: () => setError(null),
    onDismissNotice: () => setNotice(null),
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
    <>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      {renderTemplate()}
    </>
  );
}

