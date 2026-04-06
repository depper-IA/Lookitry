import { ResultDisplay } from '../ResultDisplay';
import { SelfieUploader } from '../SelfieUploader';
import type { TryOnTemplateProps } from './types';
import { ErrorBanner, GENERATION_CACHED_HINT, GENERATION_TIME_HINT, NoticeBanner, SelfieThumb } from './shared';

export function TemplateBoldProStudio(props: TryOnTemplateProps) {
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

  return (
    <div className="font-sans min-h-screen text-white" style={{ backgroundColor: secondaryColor || '#050505' }}>
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 opacity-100">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl" style={{ background: `${primaryColor}25` }} />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl" style={{ background: `${primaryColor}18` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      {/* Top bar (glass) */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {config.brand.logo ? (
              <img
                src={config.brand.logo}
                alt={config.brand.name}
                className="h-7 w-auto object-contain"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className="font-black tracking-tight truncate">{config.brand.name}</span>
            )}
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.25em] text-white/50 font-bold">
              Pro Studio
            </span>
          </div>
          <div className="flex items-center gap-2">
            {step !== 'upload' && (
              <button
                onClick={onReset}
                className="px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-widest font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                Reiniciar
              </button>
            )}
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70">
              {step === 'upload' && '1/3 Foto'}
              {step === 'select' && '2/3 Producto'}
              {(step === 'result' || step === 'generating') && '3/3 Resultado'}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Hero */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
            Prueba virtual premium
          </h2>
          <p className="mt-2 text-sm md:text-base text-white/60 max-w-2xl">
            Flujo optimizado para PRO: selección rápida de productos, resultado inmediato y reinicio sin fricción.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
          {/* Left: Flow */}
          <div className="md:col-span-7">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="p-4 md:p-6 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/50">Experiencia</p>
                    <p className="mt-1 text-lg md:text-xl font-black tracking-tight">
                      {step === 'upload' && 'Sube tu foto'}
                      {step === 'select' && 'Elige un producto'}
                      {step === 'generating' && 'Generando…'}
                      {step === 'result' && 'Resultado listo'}
                    </p>
                  </div>
                  <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width:
                          step === 'upload' ? '33%' :
                          step === 'select' ? '66%' : '100%',
                        backgroundColor: primaryColor,
                        transition: 'width 300ms ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6">
                <ErrorBanner error={error} isService={errorIsService} />
                <NoticeBanner notice={notice} />

                {step === 'upload' && (
                  <SelfieUploader
                    onUpload={onSelfieUpload}
                    primaryColor={primaryColor}
                    welcomeMessage={welcomeMessage}
                  />
                )}

                {step === 'select' && (
                  <div className="space-y-4">
                    <SelfieThumb preview={selfiePreview} onReset={onReset} />
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 md:p-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/50 mb-3">
                        Catálogo (toca para elegir)
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                        {config.products.map(p => {
                          const sel = selectedProduct?.id === p.id;
                          const alreadyGenerated = generatedProducts.has(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => onProductSelect(p)}
                              className={`flex-shrink-0 w-28 md:w-32 rounded-2xl overflow-hidden border transition-colors cursor-pointer ${
                                sel ? 'border-white/60' : 'border-white/10 hover:border-white/20'
                              }`}
                              style={sel ? { boxShadow: `0 0 0 2px ${primaryColor}55` } : {}}
                            >
                              <div className="relative bg-white/5 aspect-square">
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                {alreadyGenerated && (
                                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 border border-white/10 text-white/80">
                                    Cache
                                  </div>
                                )}
                                {sel && (
                                  <div
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border border-white/20"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="p-2">
                                <p className="text-[10px] font-black uppercase tracking-tight truncate">{p.name}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
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

              {/* Bottom action bar */}
              {step === 'select' && (
                <div className="p-4 md:p-6 border-t border-white/10 bg-black/30">
                  <button
                    onClick={onGenerate}
                    disabled={!selectedProduct}
                    className="w-full py-3.5 md:py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                  >
                    {selectedProduct
                      ? (generatedProducts.has(selectedProduct.id) ? 'Ver resultado' : buttonText)
                      : 'Selecciona un producto'}
                  </button>
                  <p className="text-center text-[10px] text-white/50 mt-2">
                    {selectedProduct && generatedProducts.has(selectedProduct.id) ? GENERATION_CACHED_HINT : GENERATION_TIME_HINT}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Context card */}
          <div className="md:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 md:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: `${primaryColor}80` }}>Consejos PRO</p>
              <ul className="mt-3 space-y-3 text-sm" style={{ color: `${primaryColor}bb` }}>
                <li className="flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  Foto frontal con buena luz mejora el resultado.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  Si ya generaste un producto, “Cache” muestra el resultado sin costo adicional.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  Reinicia para cambiar tu foto y limpiar el caché de esta sesión.
                </li>
              </ul>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/50">Plan</p>
                <p className="mt-1 text-sm font-black tracking-tight" style={{ color: primaryColor }}>
                  {config.brand.plan || 'BASIC'}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Este template es parte de la experiencia PRO.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

