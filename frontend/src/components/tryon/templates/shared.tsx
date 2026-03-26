import type { TryOnConfigResponse } from '@/types';
import type { Product, Step } from './types';

/** Texto de tiempo estimado mostrado debajo del botón de generación */
export const GENERATION_TIME_HINT = 'Puede tardar unos 30 segundos';
/** Texto mostrado cuando el resultado ya fue generado antes */
export const GENERATION_CACHED_HINT = 'Si ya lo probaste con esta foto, verás el resultado guardado sin costo adicional';

// ── Barra de progreso de pasos ────────────────────────────────────────────────
export function StepBar({ step, primaryColor }: { step: Step; primaryColor: string }) {
  const steps = [
    { key: 'upload',    num: 1, label: 'Tu foto'   },
    { key: 'select',    num: 2, label: 'Producto'  },
    { key: 'result',    num: 3, label: 'Resultado' },
  ];
  const current = step === 'generating' ? 2 : steps.findIndex(s => s.key === step);

  return (
    <div className="flex items-center justify-center gap-0 py-2 md:py-3 px-4 bg-white border-b border-gray-100">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-0.5 md:gap-1">
              <div
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-sm font-bold transition-all ${
                  done ? 'text-white' : active ? 'text-white shadow-md' : 'bg-gray-100 text-gray-400'
                }`}
                style={done || active ? { backgroundColor: primaryColor } : {}}
              >
                {done ? (
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : s.num}
              </div>
              <span className={`text-[9px] md:text-xs font-black uppercase tracking-tighter ${active ? 'text-gray-800' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 md:w-12 h-0.5 mx-1 mb-3.5 md:mb-4 rounded transition-all" style={{ backgroundColor: i < current ? primaryColor : '#e5e7eb' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Selector de productos amigable ────────────────────────────────────────────
export function FriendlyProductSelector({
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
      <div className="text-center py-8 md:py-12">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 md:w-7 md:h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium text-sm md:text-base">No hay productos disponibles aún</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 md:mb-4 text-center">
        <p className="text-sm md:text-base font-black text-gray-900 uppercase italic tracking-tight">¿Qué quieres probarte?</p>
        <p className="text-[10px] md:text-sm text-gray-400 font-medium uppercase tracking-widest mt-0.5">Toca el producto que más te guste</p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 md:gap-3">
        {products.map(p => {
          const sel = selected?.id === p.id;
          const alreadyGenerated = generatedProducts.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`rounded-xl overflow-hidden border-2 text-left transition-all duration-200 bg-white ${
                sel ? 'scale-[1.04] shadow-lg' : 'border-gray-100 hover:border-gray-200'
              }`}
              style={sel ? { borderColor: primaryColor, boxShadow: `0 4px 16px ${primaryColor}30` } : {}}
            >
              <div className="relative bg-gray-50 aspect-square">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-contain"
                />
                {alreadyGenerated && !sel && (
                  <div className="absolute top-1 left-1 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: '#10b981' }}>
                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {sel && (
                  <div
                    className="absolute top-1 right-1 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>
              <div className="p-1.5 md:p-2">
                <p className="font-black text-[9px] md:text-[11px] text-gray-900 uppercase tracking-tighter truncate leading-none">{p.name}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BrandHeader({ config, onReset, showReset }: {
  config: TryOnConfigResponse;
  onReset: () => void;
  showReset: boolean;
}) {
  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-2 md:py-3 flex items-center justify-between min-h-[48px] md:min-h-[56px]">
        <div className="flex items-center gap-3">
          {config.brand.logo && (
            <img
              src={config.brand.logo}
              alt={config.brand.name}
              className="h-6 md:h-8 w-auto object-contain"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
        {showReset && (
          <button
            onClick={onReset}
            className="text-[10px] md:text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-3 md:w-3.5 h-3 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reiniciar
          </button>
        )}
      </div>
    </div>
  );
}

export function SelfieThumb({ preview, onReset }: { preview: string | null; onReset: () => void }) {
  if (!preview) return null;
  return (
    <div className="flex items-center gap-2 md:gap-3 bg-white rounded-xl md:rounded-2xl p-2 md:p-3 shadow-sm border border-gray-100">
      <img src={preview} alt="Tu foto" className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl object-cover flex-shrink-0" />
      <div className="flex-1">
        <p className="text-[11px] md:text-sm font-black text-gray-900 uppercase italic leading-none">Foto lista</p>
        <p className="text-[9px] md:text-xs text-gray-400 mt-0.5 font-medium uppercase tracking-widest leading-none">Elige un producto</p>
      </div>
      <button onClick={onReset} className="text-[9px] md:text-xs font-black uppercase text-gray-400 hover:text-[#FF5C3A] transition-colors px-2 py-1 rounded-lg hover:bg-[#FF5C3A]/5">
        Cambiar
      </button>
    </div>
  );
}

export function ErrorBanner({ error, isService = false }: { error: string | null; isService?: boolean }) {
  if (!error) return null;

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

export function NoticeBanner({ notice }: { notice: string | null }) {
  if (!notice) return null;

  return (
    <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-emerald-800">Resultado reutilizado</p>
        <p className="text-xs text-emerald-700 mt-0.5">{notice}</p>
      </div>
    </div>
  );
}

