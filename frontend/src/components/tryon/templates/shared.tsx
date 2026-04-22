import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { TryOnConfigResponse } from '@/types';
import type { Product, Step } from './types';

// Helper para determinar si un color es claro u oscuro
function isLightBg(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// ── Badge y categoría para productos ──────────────────────────────────────
const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  rines: { bg: '#1E293B', text: 'rgba(255,255,255,0.9)' },
  tshirt: { bg: '#3F3F46', text: 'rgba(255,255,255,0.9)' },
  camisa: { bg: '#78350F', text: 'rgba(255,255,255,0.9)' },
  vestido: { bg: '#4C1D95', text: 'rgba(255,255,255,0.9)' },
  zapatos: { bg: '#166534', text: 'rgba(255,255,255,0.9)' },
  default: { bg: '#3F3F46', text: 'rgba(255,255,255,0.9)' },
};

const BADGE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  nuevo: { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', text: 'white', dot: '#34D399' },
  top: { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', text: 'white', dot: '#FCD34D' },
  oferta: { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', text: 'white', dot: '#FCA5A5' },
};

export function ProductBadge({ type }: { type: string }) {
  const style = BADGE_STYLES[type.toLowerCase()] || BADGE_STYLES.nuevo;
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-white text-[9px] font-bold uppercase tracking-wider"
      style={{ 
        background: style.bg, 
        boxShadow: `0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)`, 
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot, boxShadow: `0 0 4px ${style.dot}` }} />
      {type}
    </div>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category.toLowerCase()] || CATEGORY_STYLES.default;
  return (
    <div 
      className="inline-flex items-center px-2 py-0.5 rounded text-white/80 text-[8px] font-semibold uppercase tracking-wider"
      style={{ background: style.bg }}
    >
      {category}
    </div>
  );
}

// Technical specs line
function TechLine({ attributes, textColor }: { attributes: Record<string, any>; textColor: string }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const parts: string[] = [];
  if (attributes.material) parts.push(attributes.material);
  if (attributes.medida_pulgadas) parts.push(attributes.medida_pulgadas + '"');
  if (attributes.marca) parts.push(attributes.marca);
  if (parts.length === 0) return null;
  return <p className="text-[10px] font-medium tracking-wide truncate" style={{ color: textColor + 'aa' }}>{parts.join(' · ')}</p>;
}

// Attribute pills (solo los que no aparecen en TechLine)
function AttrPills({ attributes }: { attributes: Record<string, any>; primaryColor?: string }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const pills: string[] = [];
  if (attributes.finish) pills.push(attributes.finish);
  if (attributes.peso) pills.push(typeof attributes.peso === 'number' ? attributes.peso + 'kg' : attributes.peso);
  if (attributes.tallas && Array.isArray(attributes.tallas)) pills.push(attributes.tallas.slice(0, 4).join(', '));
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {pills.map((pill, i) => (
        <span key={i} className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide bg-white/10 text-white/80">
          {pill}
        </span>
      ))}
    </div>
  );
}

// Price display
function PriceTag({ price, textColor }: { price: number | undefined | null; textColor: string }) {
  if (price == null) return null;
  return (
    <p className="text-base font-black tracking-tight" style={{ color: '#FF5C3A' }}>
      ${price.toLocaleString('es-CO')}
    </p>
  );
}

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
              <motion.div
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-sm font-bold transition-all ${
                  done ? 'text-white' : active ? 'text-white shadow-md' : 'bg-gray-100 text-gray-400'
                }`}
                style={done || active ? { backgroundColor: primaryColor } : {}}
                whileTap={{ scale: 0.95 }}
              >
                {done ? (
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : s.num}
              </motion.div>
              <span className={`text-[9px] md:text-xs font-black uppercase tracking-tighter ${active ? 'text-gray-800' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <motion.div 
                className="w-8 md:w-12 h-0.5 mx-1 mb-3.5 md:mb-4 rounded transition-all"
                style={{ backgroundColor: i < current ? primaryColor : '#e5e7eb' }}
                animate={{ 
                  backgroundColor: i < current ? primaryColor : '#e5e7eb'
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Selector de productos amigable ────────────────────────────────────────────
// ── Selector de productos amigable (con toda la información del editor) ────────
export function FriendlyProductSelector({
  products, selected, onSelect, primaryColor, generatedProducts, textColor, textMutedColor,
  showHeader = true,
}: {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
  primaryColor: string;
  generatedProducts: Map<string, string>;
  textColor?: string;
  textMutedColor?: string;
  showHeader?: boolean;
}) {
  const bgLuminance = isLightBg(primaryColor);
  const textMain = textColor || (bgLuminance ? '#050505' : '#ffffff');
  const textMuted = textMutedColor || (bgLuminance ? '#666666' : '#ffffff99');
  
  if (products.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <motion.div 
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <svg className="w-6 h-6 md:w-7 md:h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </motion.div>
        <p className="text-gray-500 font-medium text-sm md:text-base">No hay productos disponibles aún</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {showHeader && (
        <div className="mb-3 md:mb-4 text-center">
          <p className="text-sm font-black uppercase italic tracking-tight" style={{ color: textMain }}>¿Qué quieres probarte?</p>
          <p className="text-[10px] font-medium uppercase tracking-widest mt-0.5" style={{ color: textMuted }}>Toca el producto que más te guste</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {products.map((p, index) => {
          const sel = selected?.id === p.id;
          const alreadyGenerated = generatedProducts.has(p.id);
          const cardBg = 'rgba(255,255,255,0.1)';
          const borderColor = 'rgba(255,255,255,0.15)';
          
          return (
            <motion.button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`rounded-2xl overflow-hidden border-2 text-left transition-all duration-300 ${
                sel ? 'scale-[1.03] shadow-xl' : 'hover:scale-[1.02] hover:shadow-lg'
              }`}
              style={{ 
                borderColor: sel ? primaryColor : borderColor,
                boxShadow: sel ? `0 8px 24px ${primaryColor}30` : `0 4px 12px rgba(0,0,0,0.1)`,
                background: cardBg,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              aria-label={`Seleccionar ${p.name}`}
            >
              {/* Image Container */}
              <div className="relative bg-gray-100">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-contain p-1.5"
                />
                
                {/* Selection/Generated Badge */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                  {alreadyGenerated && !sel && (
                    <motion.div 
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-md" 
                      style={{ backgroundColor: primaryColor }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                  {sel && (
                    <motion.div
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: primaryColor }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </motion.div>
                  )}
                </div>
                
                {/* Price Badge */}
                {p.price != null && (
                  <div className="absolute top-2 right-2">
                    <div className="px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                      <p className="text-[10px] font-black text-white">${p.price.toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                )}
                
                {/* Badge overlay */}
                {p.badge && (
                  <div className="absolute bottom-2 left-2">
                    <ProductBadge type={p.badge} />
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-2">
                <p className="font-black text-[10px] uppercase tracking-tight truncate leading-tight" style={{ color: textMain }}>
                  {p.name}
                </p>
                
                {/* Category + Short Description */}
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  {p.category && <CategoryBadge category={p.category} />}
                  {p.shortDescription && (
                    <span className="text-[8px] truncate max-w-[60%]" style={{ color: textMuted }}>{p.shortDescription}</span>
                  )}
                </div>
                
                {/* Attributes Pills */}
                {p.attributes && Object.keys(p.attributes).length > 0 && (
                  <div className="mt-2">
                    <AttrPills attributes={p.attributes} primaryColor={primaryColor} />
                  </div>
                )}
                
                {/* Tech Line */}
                {p.attributes && (
                  <TechLine attributes={p.attributes} textColor="#666666" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export function BrandHeader({ config, onReset, showReset }: {
  config: TryOnConfigResponse;
  onReset: () => void;
  showReset: boolean;
}) {
  const textMuted = '#666666';
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
          <motion.button
            onClick={onReset}
            className="text-[10px] hover:text-gray-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: textMuted }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Reiniciar proceso"
          >
            <svg className="w-3 md:w-3.5 h-3 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reiniciar
          </motion.button>
        )}
      </div>
    </div>
  );
}

export function SelfieThumb({ 
  preview, 
  onReset, 
  primaryColor = '#FF5C3A', 
  textMuted = '#666666' 
}: { 
  preview: string | null; 
  onReset: () => void;
  primaryColor?: string;
  textMuted?: string;
}) {
  if (!preview) return null;
  return (
    <motion.div 
      className="flex items-center gap-2 md:gap-3 bg-white rounded-xl md:rounded-2xl p-2 md:p-3 shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <img src={preview} alt="Tu foto" className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase italic leading-none" style={{ color: primaryColor }}>Foto lista</p>
        <p className="text-[9px] mt-0.5 font-medium uppercase tracking-widest leading-none" style={{ color: textMuted }}>Elige un producto</p>
      </div>
      <motion.button 
        onClick={onReset} 
        className="text-[9px] font-black uppercase hover:opacity-80 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: textMuted }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Cambiar foto"
      >
        Cambiar
      </motion.button>
    </motion.div>
  );
}

// ── ErrorBanner ─────────────────────────────────────────────────────────────────
interface ErrorBannerProps {
  error: string | null;
  isService?: boolean;
  onDismiss?: () => void;
  cardBg?: string;
  cardBorder?: string;
  textColor?: string;
  mutedColor?: string;
  autoDismiss?: number; // Time in ms, optional
}

export function ErrorBanner({ 
  error, 
  isService = false, 
  onDismiss, 
  cardBg, 
  cardBorder, 
  textColor, 
  mutedColor,
  autoDismiss = 8000 // Default 8s for errors
}: ErrorBannerProps) {
  useEffect(() => {
    if (error && onDismiss && autoDismiss > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [error, onDismiss, autoDismiss]);

  if (!error) return null;

  const isServiceError = isService || error === 'SERVICE_CREDITS_EXHAUSTED';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{ opacity: 1, height: 'auto', y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="mb-4 overflow-hidden"
      >
        <div 
          className="p-3 md:p-4 rounded-2xl flex items-start gap-2 md:gap-3 border"
          style={{ 
            backgroundColor: isServiceError ? (cardBg || '#f3f4f6') : '#fef2f2',
            borderColor: isServiceError ? (cardBorder || '#e5e5e5') : '#fecaca',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: isServiceError ? (mutedColor || '#666') : '#ef4444' }} strokeWidth={2} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: isServiceError ? (textColor || '#1a1a1a') : '#dc2626' }}>
              {isServiceError ? 'La prueba virtual está temporalmente no disponible' : 'Algo salió mal'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: isServiceError ? (mutedColor || '#666') : '#991b1b' }}>
              {isServiceError 
                ? 'El servicio de generación se quedó sin capacidad temporalmente. Intenta de nuevo en unos minutos.'
                : error
              }
            </p>
          </div>
          {onDismiss && (
            <motion.button
              onClick={onDismiss}
              className="p-1.5 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" style={{ color: mutedColor || (isServiceError ? '#666' : '#991b1b') }} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── NoticeBanner ────────────────────────────────────────────────────────────────
interface NoticeBannerProps {
  notice: string | null;
  onDismiss?: () => void;
  cardBg?: string;
  cardBorder?: string;
  mutedColor?: string;
  primaryColor?: string;
  autoDismiss?: number;
}

export function NoticeBanner({ 
  notice, 
  onDismiss, 
  cardBg, 
  cardBorder, 
  mutedColor, 
  primaryColor,
  autoDismiss = 5000 // Default 5s for success notices
}: NoticeBannerProps) {
  useEffect(() => {
    if (notice && onDismiss && autoDismiss > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [notice, onDismiss, autoDismiss]);

  if (!notice) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{ opacity: 1, height: 'auto', y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="mb-4 overflow-hidden"
      >
        <div 
          className="p-3 md:p-4 rounded-2xl flex items-start gap-2 md:gap-3 border"
          style={{ 
            backgroundColor: '#f0fdf4',
            borderColor: '#bbf7d0',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" strokeWidth={2} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">Resultado reutilizado</p>
            <p className="text-xs mt-0.5 text-emerald-700">{notice}</p>
          </div>
          {onDismiss && (
            <motion.button
              onClick={onDismiss}
              className="p-1.5 rounded-full hover:bg-emerald-100 transition-colors flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4 text-emerald-600" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── InfoBanner (generic informational notice) ────────────────────────────────────
interface InfoBannerProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onDismiss?: () => void;
  cardBg?: string;
  cardBorder?: string;
  textColor?: string;
  mutedColor?: string;
  primaryColor?: string;
}

const INFO_STYLES = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: '#3b82f6',
    titleColor: '#1d4ed8',
    textColor: '#1e40af',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: '#f59e0b',
    titleColor: '#b45309',
    textColor: '#92400e',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: '#ef4444',
    titleColor: '#dc2626',
    textColor: '#991b1b',
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconColor: '#10b981',
    titleColor: '#047857',
    textColor: '#065f46',
  },
};

const INFO_ICONS = {
  info: Info,
  warning: AlertCircle,
  error: AlertCircle,
  success: CheckCircle,
};

export function InfoBanner({ 
  message, 
  type = 'info', 
  onDismiss,
  primaryColor = '#FF5C3A',
}: InfoBannerProps) {
  const styles = INFO_STYLES[type];
  const Icon = INFO_ICONS[type];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{ opacity: 1, height: 'auto', y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="mb-4 overflow-hidden"
      >
        <div 
          className={`p-3 md:p-4 rounded-2xl flex items-start gap-2 md:gap-3 border ${styles.bg} ${styles.border}`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: styles.iconColor }} strokeWidth={2} />
          </motion.div>
          <p className="text-sm font-medium flex-1" style={{ color: styles.textColor }}>{message}</p>
          {onDismiss && (
            <motion.button
              onClick={onDismiss}
              className="p-1.5 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" style={{ color: styles.iconColor }} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
