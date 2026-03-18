'use client';

import { useState, useEffect } from 'react';
import { SelfieUploader } from './SelfieUploader';
import { GenerationLoader } from './GenerationLoader';
import { ResultDisplay } from './ResultDisplay';
import { tryonService } from '@/services/tryon.service';
import type { TryOnConfigResponse } from '@/types';

interface TryOnWidgetProps {
  brandSlug: string;
  isEmbed?: boolean;
}

type Step = 'upload' | 'select' | 'generating' | 'result';
type Layout = 'top-bar' | 'sidebar' | 'centered' | 'bare';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
}

function templateToLayout(template?: string): Layout {
  if (template === 'modern') return 'sidebar';
  if (template === 'bold') return 'centered';
  if (template === 'bare') return 'bare';
  return 'top-bar';
}

// ── Barra de progreso de pasos ────────────────────────────────────────────────
function StepBar({ step, primaryColor }: { step: Step; primaryColor: string }) {
  const steps = [
    { key: 'upload',    num: 1, label: 'Tu foto'   },
    { key: 'select',    num: 2, label: 'Producto'  },
    { key: 'result',    num: 3, label: 'Resultado' },
  ];
  const current = step === 'generating' ? 2 : steps.findIndex(s => s.key === step);

  return (
    <div className="flex items-center justify-center gap-0 py-3 px-4 bg-white border-b border-gray-100">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done ? 'text-white' : active ? 'text-white shadow-md' : 'bg-gray-100 text-gray-400'
                }`}
                style={done || active ? { backgroundColor: primaryColor } : {}}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : s.num}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-gray-800' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-12 h-0.5 mx-1 mb-4 rounded transition-all" style={{ backgroundColor: i < current ? primaryColor : '#e5e7eb' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Selector de productos amigable ────────────────────────────────────────────
function FriendlyProductSelector({
  products, selected, onSelect, primaryColor, generatedProducts,
}: {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
  primaryColor: string;
  generatedProducts: Map<string, string>;
}) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No hay productos disponibles aún</p>
        <p className="text-sm text-gray-400 mt-1">La tienda está preparando sus productos</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-center">
        <p className="text-base font-semibold text-gray-800">¿Qué quieres probarte hoy?</p>
        <p className="text-sm text-gray-500 mt-0.5">Toca el producto que más te guste</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {products.map(p => {
          const sel = selected?.id === p.id;
          const alreadyGenerated = generatedProducts.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`rounded-xl overflow-hidden border-2 text-left transition-all duration-200 bg-white ${
                sel ? 'scale-[1.04] shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              style={sel ? { borderColor: primaryColor, boxShadow: `0 4px 16px ${primaryColor}30` } : {}}
            >
              <div className="relative">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full aspect-square object-cover"
                />
                {/* Badge "Ya probado" */}
                {alreadyGenerated && !sel && (
                  <div className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: '#10b981' }}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {sel && (
                  <div
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>
              <div className="px-1.5 py-1.5">
                <p className="font-medium text-[11px] text-gray-900 leading-tight truncate">{p.name}</p>
                {alreadyGenerated && (
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: '#10b981' }}>Ver resultado</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function TryOnWidget({ brandSlug, isEmbed = false }: TryOnWidgetProps) {
  const [step, setStep] = useState<Step>('upload');
  const [config, setConfig] = useState<TryOnConfigResponse | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [generationId, setGenerationId]     = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorIsService, setErrorIsService] = useState(false);
  const [loading, setLoading] = useState(true);
  // Productos ya generados en esta sesión: productId → imageUrl
  const [generatedProducts, setGeneratedProducts] = useState<Map<string, string>>(new Map());

  useEffect(() => { loadConfig(); }, [brandSlug]);

  useEffect(() => {
    if (!isEmbed || !config) return;
    window.parent?.postMessage({ type: 'TRYON_READY', data: { brandSlug, brandName: config.brand.name } }, '*');
    const handleMessage = (e: MessageEvent) => { if (e.data.type === 'TRYON_RESET') handleReset(); };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbed, config, brandSlug]);

  useEffect(() => {
    if (!isEmbed) return;
    const notifyHeight = () => window.parent?.postMessage({ type: 'TRYON_RESIZE', data: { height: document.documentElement.scrollHeight } }, '*');
    notifyHeight();
    const observer = new ResizeObserver(notifyHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [isEmbed, step]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await tryonService.getConfig(brandSlug);
      setConfig(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfieUpload = (file: File, preview: string) => {
    setSelfieFile(file); setSelfiePreview(preview); setStep('select');
  };

  const handleProductSelect = (product: Product) => setSelectedProduct(product);

  const handleGenerate = async () => {
    if (!selfieFile || !selectedProduct) return;
    // Si ya fue generado, mostrar resultado guardado directamente
    const cached = generatedProducts.get(selectedProduct.id);
    if (cached) {
      setResultImageUrl(cached);
      setStep('result');
      return;
    }
    try {
      setStep('generating');
      setError(null);
      setErrorIsService(false);
      const result = await tryonService.generate(brandSlug, { productId: selectedProduct.id, selfieFile });
      setResultImageUrl(result.imageUrl);
      setGenerationId(result.generationId ?? null);
      // Guardar en el mapa de generados
      setGeneratedProducts(prev => new Map(prev).set(selectedProduct.id, result.imageUrl));
      setStep('result');
      if (isEmbed) window.parent?.postMessage({ type: 'TRYON_COMPLETE', data: { imageUrl: result.imageUrl, productId: selectedProduct.id, productName: selectedProduct.name, generationId: result.generationId, processingTime: result.processingTime } }, '*');
    } catch (err: any) {
      const isService = err.isServiceError === true || err.message === 'SERVICE_CREDITS_EXHAUSTED';
      setErrorIsService(isService);
      setError(isService ? 'SERVICE_CREDITS_EXHAUSTED' : (err.message || 'Algo salió mal. Intenta de nuevo.'));
      setStep('select');
      if (isEmbed) window.parent?.postMessage({ type: 'TRYON_ERROR', data: { error: err.message } }, '*');
    }
  };

  const handleReset = () => {
    setSelfieFile(null); setSelfiePreview(null); setSelectedProduct(null);
    setResultImageUrl(null); setGenerationId(null); setError(null); setErrorIsService(false);
    setGeneratedProducts(new Map());
    setStep('upload');
  };

  const primaryColor   = config?.brand.primaryColor   || '#6366f1';
  const secondaryColor = config?.brand.secondaryColor || '#f9fafb';
  const buttonText     = config?.brand.buttonText     || 'Probarme esto';
  const welcomeMessage = config?.brand.welcomeMessage || '';
  const layout         = templateToLayout(config?.brand.widgetTemplate);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: secondaryColor }}>
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
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

  // ── Generating (igual para todos los layouts excepto bare) ───────────────
  if (step === 'generating' && layout !== 'bare') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: secondaryColor }}>
        <BrandHeader config={config} primaryColor={primaryColor} onReset={handleReset} showReset={false} />
        <div className="flex-1 flex items-center justify-center">
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      </div>
    );
  }

  // ── SIDEBAR layout (modern) ────────────────────────────────────────────────
  if (layout === 'sidebar') {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: secondaryColor }}>
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 flex flex-col" style={{ backgroundColor: primaryColor }}>
          <div className="px-4 py-5 border-b border-white/20">
            {config.brand.logo
              ? <img src={config.brand.logo} alt={config.brand.name} className="h-8 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
              : <h1 className="font-bold text-white text-base">{config.brand.name}</h1>}
            <p className="text-xs text-white/60 mt-0.5">Probador Virtual</p>
          </div>
          {/* Pasos en sidebar */}
          <div className="px-3 py-4 space-y-1 border-b border-white/20">
            {[
              { num: 1, label: 'Sube tu foto',      active: step === 'upload', done: step !== 'upload' },
              { num: 2, label: 'Elige un producto', active: step === 'select', done: step === 'result' },
              { num: 3, label: 'Ve el resultado',   active: step === 'result', done: false },
            ].map(s => (
              <div key={s.num} className={`flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm ${s.active ? 'bg-white/20 text-white font-semibold' : s.done ? 'text-white/70' : 'text-white/40'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.active ? 'bg-white' : s.done ? 'bg-white/30' : 'bg-white/10'}`}
                  style={s.active ? { color: primaryColor } : {}}>
                  {s.done ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : s.num}
                </span>
                {s.label}
              </div>
            ))}
          </div>
          {/* Lista de productos en sidebar */}
          {step === 'select' && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              <p className="text-xs text-white/60 font-semibold uppercase tracking-wide px-1 mb-2">Toca para elegir</p>
              {config.products.map(p => (
                <button key={p.id} onClick={() => handleProductSelect(p)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${selectedProduct?.id === p.id ? 'bg-white/25 ring-1 ring-white/50' : 'bg-white/10 hover:bg-white/20'}`}>
                  <img src={p.imageUrl} alt={p.name} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                    {p.category && <p className="text-white/50 text-xs truncate capitalize">{p.category}</p>}
                  </div>
                  {selectedProduct?.id === p.id && (
                    <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              ))}
            </div>
          )}
          {step !== 'select' && <div className="flex-1" />}
          {step === 'result' && (
            <div className="px-3 pb-4">
              <button onClick={handleReset} className="w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Probar otro
              </button>
            </div>
          )}
        </div>

        {/* Área principal */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">
                {step === 'upload' && 'Paso 1 — Sube tu foto'}
                {step === 'select' && 'Paso 2 — Elige un producto'}
                {step === 'result' && 'Listo — Aquí está tu resultado'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === 'upload' && 'Una foto frontal con buena luz da mejores resultados'}
                {step === 'select' && 'Selecciona del panel izquierdo y luego presiona el botón'}
                {step === 'result' && 'Puedes descargar la imagen o probar otro producto'}
              </p>
            </div>
            {step !== 'upload' && (
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-4">Reiniciar</button>
            )}
          </div>
          <div className="flex-1 p-6">
            <ErrorBanner error={error} isService={errorIsService} />
            {step === 'upload' && <SelfieUploader onUpload={handleSelfieUpload} primaryColor={primaryColor} welcomeMessage={welcomeMessage} />}
            {step === 'select' && (
              <div>
                <SelfieThumb preview={selfiePreview} onReset={handleReset} />
                {selectedProduct ? (
                  <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-14 h-14 rounded-xl object-cover" />
                      <div>
                        <p className="font-semibold text-gray-800">{selectedProduct.name}</p>
                        <p className="text-xs text-gray-400">Producto seleccionado</p>
                      </div>
                    </div>
                    <button onClick={handleGenerate}
                      className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor }}>
                      {buttonText}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">Tarda unos 30 segundos</p>
                  </div>
                ) : (
                  <div className="mt-4 p-5 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">Selecciona un producto del panel izquierdo</p>
                  </div>
                )}
              </div>
            )}
            {step === 'result' && resultImageUrl && (
              <ResultDisplay imageUrl={resultImageUrl} productName={selectedProduct?.name || ''} selfiePreview={selfiePreview} onReset={handleReset} primaryColor={primaryColor} generationId={generationId ?? undefined} brandSlug={brandSlug} brandName={config.brand.name} brandPlan={config.brand.plan} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── CENTERED layout (bold) ─────────────────────────────────────────────────
  if (layout === 'centered') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: secondaryColor }}>
        {/* Hero header */}
        <div className="py-7 px-4 flex flex-col items-center gap-2 text-center" style={{ backgroundColor: primaryColor }}>
          {config.brand.logo
            ? <img src={config.brand.logo} alt={config.brand.name} className="h-10 object-contain mb-1" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : <h1 className="font-bold text-white text-2xl">{config.brand.name}</h1>}
          {welcomeMessage && <p className="text-white/80 text-sm max-w-xs">{welcomeMessage}</p>}
          {/* Steps */}
          <div className="flex items-center gap-1 mt-3">
            {[
              { num: 1, label: 'Foto',     active: step === 'upload', done: step !== 'upload' },
              { num: 2, label: 'Producto', active: step === 'select', done: step === 'result' },
              { num: 3, label: 'Resultado',active: step === 'result', done: false },
            ].map((s, i, arr) => (
              <div key={s.num} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${s.active ? 'bg-white' : s.done ? 'bg-white/30 text-white' : 'bg-white/10 text-white/50'}`}
                  style={s.active ? { color: primaryColor } : {}}>
                  <span>{s.done ? <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : s.num}</span><span>{s.label}</span>
                </div>
                {i < arr.length - 1 && <div className={`w-4 h-0.5 rounded ${s.done ? 'bg-white/60' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
          <ErrorBanner error={error} isService={errorIsService} />
          {step === 'upload' && <SelfieUploader onUpload={handleSelfieUpload} primaryColor={primaryColor} welcomeMessage="" />}
          {step === 'select' && (
            <div>
              <SelfieThumb preview={selfiePreview} onReset={handleReset} />
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {config.products.map(p => {
                  const sel = selectedProduct?.id === p.id;
                  return (
                    <button key={p.id} onClick={() => handleProductSelect(p)}
                      className={`rounded-2xl overflow-hidden border-2 transition-all text-left bg-white ${sel ? 'shadow-lg scale-[1.03]' : 'border-gray-200 hover:border-gray-300'}`}
                      style={sel ? { borderColor: primaryColor } : {}}>
                      <div className="relative">
                        <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-cover" />
                        {sel && <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: primaryColor }}><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>}
                      </div>
                      <div className="p-2"><p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p></div>
                    </button>
                  );
                })}
              </div>
              {selectedProduct && (
                <div>
                  <button onClick={handleGenerate}
                    className="w-full py-4 rounded-2xl font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor, color: secondaryColor }}>
                    {buttonText}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-2">Tarda unos 30 segundos</p>
                </div>
              )}
              {!selectedProduct && (
                <div className="p-5 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Toca un producto de arriba para seleccionarlo</p>
                </div>
              )}
            </div>
          )}
          {step === 'result' && resultImageUrl && (
            <ResultDisplay imageUrl={resultImageUrl} productName={selectedProduct?.name || ''} selfiePreview={selfiePreview} onReset={handleReset} primaryColor={primaryColor} generationId={generationId ?? undefined} brandSlug={brandSlug} brandName={config.brand.name} brandPlan={config.brand.plan} />
          )}
        </div>
      </div>
    );
  }

  // ── BARE layout (sin header ni sidebar) ──────────────────────────────────
  if (layout === 'bare') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: secondaryColor }}>
        {step === 'generating' && (
          <div className="flex-1 flex items-center justify-center">
            <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
          </div>
        )}
        {step !== 'generating' && (
          <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
            <ErrorBanner error={error} isService={errorIsService} />
            {step === 'upload' && (
              <SelfieUploader onUpload={handleSelfieUpload} primaryColor={primaryColor} welcomeMessage={welcomeMessage} />
            )}
            {step === 'select' && (
              <div className="space-y-4">
                <SelfieThumb preview={selfiePreview} onReset={handleReset} />
                <FriendlyProductSelector products={config.products} selected={selectedProduct} onSelect={handleProductSelect} primaryColor={primaryColor} generatedProducts={generatedProducts} />
                {selectedProduct && (
                  <div className="sticky bottom-4">
                    <button
                      onClick={handleGenerate}
                      className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      {generatedProducts.has(selectedProduct.id) ? 'Ya generado — sin costo adicional' : 'Puede tardar unos 30 segundos'}
                    </p>
                  </div>
                )}
              </div>
            )}
            {step === 'result' && resultImageUrl && (
              <ResultDisplay imageUrl={resultImageUrl} productName={selectedProduct?.name || ''} selfiePreview={selfiePreview} onReset={handleReset} primaryColor={primaryColor} generationId={generationId ?? undefined} brandSlug={brandSlug} brandName={config.brand.name} brandPlan={config.brand.plan} />
            )}
          </div>
        )}
      </div>
    );
  }

  // ── TOP-BAR layout (minimal — default) ────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: secondaryColor }}>
      <BrandHeader config={config} primaryColor={primaryColor} onReset={handleReset} showReset={step !== 'upload'} />
      <StepBar step={step} primaryColor={primaryColor} />

      {/* Guía contextual */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="rounded-2xl px-4 py-3 text-center text-sm font-medium" style={{ backgroundColor: primaryColor + '15', color: primaryColor }}>
          {step === 'upload' && 'Sube una foto tuya de frente'}
          {step === 'select' && 'Elige el producto que quieres probarte'}
          {step === 'result' && 'Aquí está tu prueba virtual'}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        <ErrorBanner error={error} isService={errorIsService} />

        {step === 'upload' && (
          <SelfieUploader onUpload={handleSelfieUpload} primaryColor={primaryColor} welcomeMessage={welcomeMessage} />
        )}

        {step === 'select' && (
          <div className="space-y-4">
            <SelfieThumb preview={selfiePreview} onReset={handleReset} />
            <FriendlyProductSelector products={config.products} selected={selectedProduct} onSelect={handleProductSelect} primaryColor={primaryColor} generatedProducts={generatedProducts} />
            {selectedProduct && (
              <div className="sticky bottom-4">
                <button onClick={handleGenerate}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}>
                  {generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">
                  {generatedProducts.has(selectedProduct.id) ? 'Ya generado — sin costo adicional' : 'Tarda unos 30 segundos'}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 'result' && resultImageUrl && (
          <ResultDisplay imageUrl={resultImageUrl} productName={selectedProduct?.name || ''} selfiePreview={selfiePreview} onReset={handleReset} primaryColor={primaryColor} generationId={generationId ?? undefined} brandSlug={brandSlug} brandName={config.brand.name} brandPlan={config.brand.plan} />
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function BrandHeader({ config, primaryColor, onReset, showReset }: {
  config: TryOnConfigResponse; primaryColor: string; onReset: () => void; showReset: boolean;
}) {
  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config.brand.logo && (
            <img src={config.brand.logo} alt={config.brand.name} className="h-9 w-auto object-contain"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
          )}
          <div>
            <h1 className="font-bold text-gray-900 text-base leading-tight">{config.brand.name}</h1>
            <p className="text-xs text-gray-400">Probador Virtual</p>
          </div>
        </div>
        {showReset && (
          <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reiniciar
          </button>
        )}
      </div>
    </div>
  );
}

function SelfieThumb({ preview, onReset }: { preview: string | null; onReset: () => void }) {
  if (!preview) return null;
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
      <img src={preview} alt="Tu selfie" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">Tu foto está lista</p>
        <p className="text-xs text-gray-400 mt-0.5">Ahora elige qué quieres probarte</p>
      </div>
      <button onClick={onReset} className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
        Cambiar
      </button>
    </div>
  );
}

function ErrorBanner({ error, isService = false }: { error: string | null; isService?: boolean }) {
  if (!error) return null;

  // Error de servicio (créditos agotados) — mensaje sutil, no culpa al usuario
  if (isService) {
    return (
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-gray-600">Servicio no disponible en este momento</p>
          <p className="text-xs text-gray-400 mt-0.5">Estamos trabajando para resolverlo. Por favor intenta más tarde.</p>
        </div>
      </div>
    );
  }

  // Error normal
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-red-700">Algo salió mal</p>
        <p className="text-xs text-red-600 mt-0.5">{error}</p>
      </div>
    </div>
  );
}
