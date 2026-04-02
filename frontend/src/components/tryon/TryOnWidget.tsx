'use client';

import { useState, useEffect, useCallback } from 'react';
import { tryonService } from '@/services/tryon.service';
import type { TryOnConfigResponse } from '@/types';
import { TemplateBare } from './templates/TemplateBare';
import { TemplateMinimalTopBar } from './templates/TemplateMinimalTopBar';
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
}

function templateToLayout(template?: string): Layout {
  switch (template) {
    case 'modern': return 'sidebar';
    case 'bold':   return 'centered';
    case 'bare':   return 'bare';
    case 'minimal':
    // ✅ Default: bare (template principal)
    case undefined: return 'bare';
    default:
      console.warn(`[TryOnWidget] Template desconocido: "${template}". Usando bare.`);
      return 'bare';
  }
}

// ── Componente principal ──────────────────────────────────────────────────────
export function TryOnWidget({ brandSlug, isEmbed = false, initialProductId = null, externalId = null, forceLayout, pluginView = false }: TryOnWidgetProps) {
  const [step, setStep] = useState<Step>('upload');
  const [config, setConfig] = useState<TryOnConfigResponse | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [generationId, setGenerationId]     = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorIsService, setErrorIsService] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Productos ya generados en esta sesión: productId → imageUrl
  const [generatedProducts, setGeneratedProducts] = useState<Map<string, string>>(new Map());

  // Cargar productos generados previos de localStorage al montar o cambiar selfie
  // Fix #6: Solo guardamos/leemos el mapa de IDs→URL, NO la selfie base64 (evita QuotaExceededError)
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

  // Guardar productos generados en localStorage cuando cambien
  // Fix #6: Ya no persiste la selfie base64
  useEffect(() => {
    if (!brandSlug || generatedProducts.size === 0) return;
    const key = `tryon_gen_${brandSlug}`;
    try {
      localStorage.setItem(key, JSON.stringify({ products: Object.fromEntries(generatedProducts) }));
    } catch (e) {
      // QuotaExceededError: ignorar silenciosamente, la funcionalidad sigue
      console.warn('[TryOnWidget] localStorage lleno, no se pudo guardar caché de generaciones.', e);
    }
  }, [generatedProducts, brandSlug]);

  // Fix #2: loadConfig con useCallback para evitar referencias obsoletas
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tryonService.getConfig(brandSlug);
      setConfig(data);
      setError(null);

      // Pre-seleccionar producto si viene por props
      if (data.products) {
        let found = null;
        
        // 1. Prioridad: Búsqueda por externalId (WordPress ID)
        if (externalId) {
          found = data.products.find((p: any) => String(p.externalId) === String(externalId));
        }
        
        // 2. Fallback: Búsqueda por initialProductId (Lookitry UUID)
        if (!found && initialProductId) {
          found = data.products.find((p: any) => p.id === initialProductId);
        }

        if (found) setSelectedProduct(found);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [brandSlug, initialProductId, externalId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // Limpieza de memoria de la URL temporal en desmontaje
  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [selfiePreview]);

  // Fix #1: handleReset memoizado con useCallback — evita stale closure en el listener TRYON_RESET
  const handleReset = useCallback(() => {
    const key = `tryon_gen_${brandSlug}`;
    localStorage.removeItem(key);
    
    setSelfiePreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    setSelfieFile(null); setSelectedProduct(null);
    setResultImageUrl(null); setGenerationId(null); setError(null); setErrorIsService(false);
    setNotice(null);
    setGeneratedProducts(new Map());
    setStep('upload');
  }, [brandSlug]);

  const handleSelfieUpload = (file: File, preview: string) => {
    setSelfiePreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    setSelfieFile(file); 
    setNotice(null);
    
    // Invalida el caché cuando se sube una COMPLETAMENTE NUEVA selfie
    const key = `tryon_gen_${brandSlug}`;
    localStorage.removeItem(key);
    setGeneratedProducts(new Map());
    
    if (selectedProduct) {
      // Si el usuario ya viene con un producto seleccionado (ej. plugin WooCommerce),
      // saltamos la pantalla de selección y empezamos a generar inmediatamente.
      // IMPORTANTE: Pasamos force=true para evitar que use el mapa de generados actual (que es capturado por closure)
      handleGenerate(file, selectedProduct, true);
    } else {
      setStep('select');
    }
  };

  const handleProductSelect = (product: Product) => setSelectedProduct(product);

  const handleGenerate = async (fileOverride?: File, productOverride?: Product, force = false) => {
    const activeFile = fileOverride || selfieFile;
    const activeProduct = productOverride || selectedProduct;
    if (!activeFile || !activeProduct) return;
    
    // Si ya fue generado, mostrar resultado guardado directamente
    // Excepto si forzamos una nueva generación (ej. cambio de selfie)
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
      // Guardar en el mapa de generados
      setGeneratedProducts(prev => new Map(prev).set(activeProduct.id, result.imageUrl));
      setStep('result');
      if (isEmbed) window.parent?.postMessage({ type: 'TRYON_COMPLETE', data: { imageUrl: result.imageUrl, productId: activeProduct.id, productName: activeProduct.name, generationId: result.generationId, processingTime: result.processingTime } }, EMBED_ORIGIN);
    } catch (err: any) {
      const isService = err.isServiceError === true || err.message === 'SERVICE_CREDITS_EXHAUSTED';
      setErrorIsService(isService);
      setNotice(null);
      setError(isService ? 'SERVICE_CREDITS_EXHAUSTED' : (err.message || 'Algo salió mal. Intenta de nuevo.'));
      setStep('select');
      if (isEmbed) window.parent?.postMessage({ type: 'TRYON_ERROR', data: { error: err.message } }, EMBED_ORIGIN);
    }
  };

  // Fix #4: postMessage seguro — usar origen del parent en vez de '*'
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

  // Fix #8: ResizeObserver desacoplado del step — se conecta una sola vez
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
  // En planes no-PRO, forzamos la experiencia principal (bare) por defecto.
  // PRO desbloquea el resto de experiencias (minimal/modern/bold).
  const effectiveLayout = pluginView ? 'bare' : (forceLayout || (isPro ? selectedLayout : 'bare'));

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" >
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-gray-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: primaryColor }} />
          <p className="mt-4 text-gray-500 text-sm font-medium">Cargando el probador...</p>
        </div>
      </div>
    );
  }

  // ── Error / no encontrado ──────────────────────────────────────────────────
  if (!config) {
    return (
      <div className="flex items-center justify-center py-16 bg-gray-50">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">No encontramos esta tienda</h2>
          <p className="mt-2 text-gray-500 text-sm">{error || 'Verifica el enlace e intenta de nuevo'}</p>
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
    onReset: handleReset,
    onSelfieUpload: handleSelfieUpload,
    onProductSelect: handleProductSelect,
    onGenerate: () => handleGenerate(),
  } as const;

  switch (effectiveLayout) {
    case 'bare':
      return <TemplateBare {...templateProps} />;
    case 'sidebar':
      return <TemplateModernSidebar {...templateProps} />;
    case 'centered':
      return <TemplateBoldProStudio {...templateProps} />;
    case 'top-bar':
    default:
      return <TemplateMinimalTopBar {...templateProps} />;
  }
}
