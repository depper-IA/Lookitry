'use client';

import { useState, useEffect, useCallback } from 'react';
import { tryonService } from '@/services/tryon.service';
import type { TryOnConfigResponse } from '@/types';
import { TemplateBare } from './templates/TemplateBare';
import { TemplateShowcase } from './templates/TemplateShowcase';
import { TemplateModernSidebar } from './templates/TemplateModernSidebar';
import { TemplateBoldProStudio } from './templates/TemplateBoldProStudio';
import type { Layout, Product, Step } from './templates/types';

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
      console.warn(`[TryOnWidget] Template desconocido: "${template}". Usando bare.`);
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
  // Productos ya generados en esta sesión: productId → imageUrl
  const [generatedProducts, setGeneratedProducts] = useState<Map<string, string>>(new Map());

  // Cargar productos generados previos de localStorage al montar o cambiar selfie
  useEffect(() => {
    if (!brandSlug) return;
    const key = `tryon_gen_${brandSlug}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const { products } = JSON.parse(saved);
        if (products) setGeneratedProducts(new Map(Object.entries(products)));
      } catch (e) {
        console.error('Error parsing generated products', e);
        localStorage.removeItem(key);
      }
    }
  }, [brandSlug]);

  // Guardar productos generados en localStorage
  useEffect(() => {
    if (!brandSlug || generatedProducts.size === 0) return;
    const key = `tryon_gen_${brandSlug}`;
    try {
      localStorage.setItem(key, JSON.stringify({ products: Object.fromEntries(generatedProducts) }));
    } catch (e) {
      console.warn('[TryOnWidget] localStorage lleno, no se pudo guardar caché de generaciones.', e);
    }
  }, [generatedProducts, brandSlug]);

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
    const key = `tryon_gen_${brandSlug}`;
    localStorage.removeItem(key);
    
    setSelfiePreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    setSelfieFile(null);
    setSelectedProduct(prev => (hasLockedProduct ? prev : null));
    setResultImageUrl(null); setGenerationId(null); setError(null); setErrorIsService(false);
    setNotice(null);
    setGeneratedProducts(new Map());
    // Nuevo flujo: Reset vuelve a select, a menos que el producto esté bloqueado, entonces vuelve a upload
    setStep(hasLockedProduct ? 'upload' : 'select');
  }, [brandSlug, hasLockedProduct]);

  const handleSelfieUpload = (file: File, preview: string) => {
    setSelfiePreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    setSelfieFile(file); 
    setNotice(null);
    setUploadPrivacyNotice('Tu selfie solo se usa en tu navegador y se elimina al subir una nueva foto');
    
    // Invalida el caché cuando se sube una COMPLETAMENTE NUEVA selfie
    const key = `tryon_gen_${brandSlug}`;
    localStorage.removeItem(key);
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
      const result = await tryonService.generate(brandSlug, { productId: activeProduct.id, selfieFile: activeFile });
      setResultImageUrl(result.imageUrl);
      setGenerationId(result.generationId ?? null);
      if (result.reused) {
        setNotice(result.message || 'Ya existía un resultado para esta foto y este producto. Te mostramos el guardado sin costo adicional.');
      }
      setGeneratedProducts(prev => new Map(prev).set(activeProduct.id, result.imageUrl));
      setStep('result');
      if (isEmbed) window.parent?.postMessage({ type: 'TRYON_COMPLETE', data: { imageUrl: result.imageUrl, productId: activeProduct.id, productName: activeProduct.name, generationId: result.generationId, processingTime: result.processingTime } }, EMBED_ORIGIN);
    } catch (err: any) {
      const isService = err.isServiceError === true || err.message === 'SERVICE_CREDITS_EXHAUSTED';
      setErrorIsService(isService);
      setNotice(null);
      setError(isService ? 'SERVICE_CREDITS_EXHAUSTED' : (err.message || 'Algo salió mal. Intenta de nuevo.'));
      // Volver a upload para que reintente
      setStep('upload');
      if (isEmbed) window.parent?.postMessage({ type: 'TRYON_ERROR', data: { error: err.message } }, EMBED_ORIGIN);
    }
  };

  const EMBED_ORIGIN = typeof window !== 'undefined' && document.referrer
    ? new URL(document.referrer).origin
    : '*';

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
  } as const;

  switch (effectiveLayout) {
    case 'bare':
      return <TemplateBare {...templateProps} />;
    case 'sidebar':
      return <TemplateModernSidebar {...templateProps} />;
    case 'centered':
      return <TemplateBoldProStudio {...templateProps} />;
    case 'showcase':
    default:
      return <TemplateShowcase {...templateProps} />;
  }
}

