import { GenerationLoader } from '../GenerationLoader';
import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner, SelfieThumb } from './shared';

export function TemplateModernSidebar(props: TryOnTemplateProps) {
  const {
    step,
    config,
    brandSlug,
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
    onSelfieUpload,
    onProductSelect,
    onGenerate,
  } = props;

  // Auto-detect if primaryColor is light for contrast adjustment
  const isLightColor = (hex: string) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  };
  const sidebarTextColor = isLightColor(primaryColor) ? '#1a1a1a' : '#ffffff';

  if (step === 'generating') {
    return (
      <div className="flex flex-col" style={{ backgroundColor: secondaryColor }}>
        <div className="flex items-center justify-center py-16">
          <GenerationLoader productName={selectedProduct?.name || ''} primaryColor={primaryColor} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row font-sans min-h-screen transition-all duration-700`} style={{ backgroundColor: secondaryColor }}>
      {/* Sidebar */}
      <div
        className="w-full md:w-64 max-h-[50vh] md:max-h-screen overflow-y-auto overflow-x-hidden flex-shrink-0 flex flex-col relative z-20 border-b md:border-b-0 md:border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.1)] backdrop-blur-3xl transition-all duration-700"
        style={{ backgroundColor: `${primaryColor}CC` }}
      >
        <div className="px-4 py-5 border-b border-white/20">
          {config.brand.logo
            ? <img src={config.brand.logo} alt={config.brand.name} className="h-8 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : <h1 className="font-bold text-base" style={{ color: sidebarTextColor }}>{config.brand.name}</h1>}
          <p className="text-xs mt-0.5" style={{ color: sidebarTextColor, opacity: 0.6 }}>Probador Virtual</p>
        </div>

        <div className="px-3 py-4 space-y-1 border-b border-white/20">
          {[
            { num: 1, label: 'Sube tu foto',      active: step === 'upload', done: step !== 'upload' },
            { num: 2, label: 'Elige un producto', active: step === 'select', done: step === 'result' },
            { num: 3, label: 'Ve el resultado',   active: step === 'result', done: false },
          ].map(s => (
            <div key={s.num} className={`flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm ${s.active ? 'bg-white/20 text-white font-semibold' : s.done ? 'text-white/70' : 'text-white/40'}`}>
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.active ? 'bg-white' : s.done ? 'bg-white/30' : 'bg-white/10'}`}
                style={s.active ? { color: primaryColor } : {}}
              >
                {s.done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : s.num}
              </span>
              {s.label}
            </div>
          ))}
        </div>

        {step === 'select' && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            <p className="text-xs text-white/60 font-semibold uppercase tracking-wide px-1 mb-2">Toca para elegir</p>
            {config.products.map(p => (
              <button
                key={p.id}
                onClick={() => onProductSelect(p)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left cursor-pointer transition-all duration-300 ${selectedProduct?.id === p.id ? 'bg-white/20 shadow-inner translate-x-1' : 'bg-white/5 hover:bg-white/15'}`}
              >
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
            <button onClick={onReset} className="w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Probar otro
            </button>
          </div>
        )}
      </div>

      {/* Área principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
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
            <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-4">Reiniciar</button>
          )}
        </div>

        <div className="flex-1 p-6">
          <ErrorBanner error={error} isService={errorIsService} />
          <NoticeBanner notice={notice} />
           {step === 'upload' && <SelfieUploader onUpload={onSelfieUpload} primaryColor={primaryColor} welcomeMessage={welcomeMessage} privacyNotice="Tu selfie solo se usa en tu navegador y se elimina al subir una nueva foto" />}
          {step === 'select' && (
            <div>
              <SelfieThumb preview={selfiePreview} onReset={onReset} />
              {selectedProduct ? (
                <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-14 h-14 rounded-xl object-cover" />
                    <div>
                      <p className="font-semibold text-gray-800">{selectedProduct.name}</p>
                      <p className="text-xs text-gray-400">Producto seleccionado</p>
                    </div>
                  </div>
                  <button
                    onClick={onGenerate}
                    className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    {generatedProducts.has(selectedProduct.id) ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-8 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-200 transition-all duration-300 hover:border-gray-300 text-center">
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
            <ResultDisplay
              imageUrl={resultImageUrl}
              productName={selectedProduct?.name || ''}
              selfiePreview={selfiePreview}
              onReset={onReset}
              primaryColor={primaryColor}
              generationId={generationId ?? undefined}
              brandSlug={brandSlug}
              brandName={config.brand.name}
              brandPlan={config.brand.plan}
            />
          )}
        </div>
      </div>
    </div>
  );
}

