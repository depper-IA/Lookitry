'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { downloadImage } from '@/utils/download';
import { useAuth } from '@/hooks/useAuth';
import { getProxiedImageUrl } from '@/utils/imageProxy';
import {
  LayoutGrid,
  LayoutList,
  Grid3X3,
  Search,
  Trash2,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
  CheckCircle2,
  Clock,
  Shirt,
  Filter,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Flag,
  CheckCircle
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Generation {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  resultImageUrl: string | null;
  resultImageDeletedAt?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error_message?: string | null;
  generatedAt: string;
  processingTime: number | null;
  has_feedback?: boolean;
  feedback_types?: string[];
  feedback_count?: number;
}

// Error types for feedback reporting
const ERROR_TYPES = [
  { value: 'wrong_clothing_removed', label: 'Ropa eliminada' },
  { value: 'wrong_clothing_kept',    label: 'Ropa conservada' },
  { value: 'body_distortion',        label: 'Distorsión' },
  { value: 'color_wrong',            label: 'Color incorrecto' },
  { value: 'product_not_applied',    label: 'Producto no aplicado' },
  { value: 'background_changed',     label: 'Fondo alterado' },
  { value: 'other',                  label: 'Otro' },
] as const;

type ErrorTypeValue = typeof ERROR_TYPES[number]['value'];

const OTHER_VALUE = 'other';

export type ViewMode = 'grid' | 'thumbnails' | 'list';

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ imageUrl, productName, onClose, brandPlan, onDelete, onReportError, hasFeedback, isExpired }: { imageUrl: string; productName: string; onClose: () => void; brandPlan?: string; onDelete: () => void; onReportError: () => void; hasFeedback?: boolean; isExpired?: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const isDragging = useRef(false);

  const handleDownload = () => {
    // Forzamos descarga mediante el proxy con header Content-Disposition
    const downloadUrl = getProxiedImageUrl(imageUrl, brandPlan, true);
    window.location.href = downloadUrl;
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging.current) return; // Ignore click if it came from dragging
    setZoom(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 md:p-8 backdrop-blur-xl"
      onClick={onClose}
    >
      <button className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 active:scale-90 z-20" onClick={onClose}>
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
        <motion.div
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          className={`relative group shadow-[0_0_100px_rgba(255,92,58,0.2)] rounded-3xl overflow-hidden z-10 flex items-center justify-center ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
        >
          <motion.img 
            src={imageUrl} 
            alt={productName} 
            className="w-auto h-auto max-w-full max-h-[75vh] object-contain rounded-3xl"
            animate={zoom === 1 ? { scale: 1, x: 0, y: 0 } : { scale: zoom }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag={zoom > 1}
            dragConstraints={{ left: -100 * zoom, right: 100 * zoom, top: -100 * zoom, bottom: 100 * zoom }}
            onDragStart={(e) => { e.stopPropagation(); isDragging.current = true; }}
            onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 100); }}
            onClick={toggleZoom}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x1200?text=Resultado+expirado';
            }}
          />

          {/* Expirado overlay */}
          {isExpired && (
            <div className="absolute inset-0 bg-[var(--bg-secondary)] flex flex-col items-center justify-center gap-3 z-20">
              <Clock size={40} className="text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)] font-bold text-center px-4">Resultado expirado tras 48h</span>
            </div>
          )}

          {/* Lupa Helper Indicator */}
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full p-3 text-white pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 z-20">
            {zoom === 1 ? <ZoomIn size={24} /> : <ZoomOut size={24} />}
          </div>
        </motion.div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 items-center justify-center shrink-0 z-20" onClick={(e) => e.stopPropagation()}>
        {!hasFeedback ? (
          <button
            onClick={(e) => { e.stopPropagation(); onReportError(); }}
            className="px-6 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 shadow-2xl hover:bg-white/20 active:scale-95 transition-all"
          >
            <Flag size={18} />
            Reportar Fallo
          </button>
        ) : (
          <span className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3">
            <CheckCircle size={18} />
            Reporte Enviado
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="px-6 py-4 bg-[#1a1a1a] border border-white/10 text-white/80 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 shadow-2xl hover:bg-rose-500 hover:text-white hover:border-rose-500 active:scale-95 transition-all"
        >
          <Trash2 size={18} />
          Borrar
        </button>

        <button
          onClick={handleDownload} disabled={downloading}
          className="px-10 py-4 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 shadow-2xl hover:brightness-110 active:scale-95 transition-all"
        >
          {downloading ? <Spinner size="sm" /> : <Download size={18} />}
          {downloading ? 'Codificando...' : 'Descargar'}
        </button>
      </div>
    </motion.div>
  );
}

// ── Feedback Modal ─────────────────────────────────────────────────────────────
function FeedbackModal({
  generation,
  brandSlug,
  onClose,
  onSuccess
}: {
  generation: Generation;
  brandSlug: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [feedbackType, setFeedbackType] = useState<ErrorTypeValue | null>(null);
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType) return;
    if (feedbackType === OTHER_VALUE && !feedbackDesc.trim()) return;

    setSending(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/pruebalo/${brandSlug}/generation/${generation.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          error_type: feedbackType,
          description: feedbackDesc.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al enviar reporte');
      }

      setSent(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      alert('Error al enviar reporte: ' + (err.message || 'Error desconocido'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="rounded-3xl w-full max-w-sm p-5 sm:p-6 shadow-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {!sent ? (
          <>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-bold text-lg sm:text-xl text-[var(--text-primary)]">¿Algo no salió bien?</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-[var(--bg-hover)] flex items-center justify-center transition-colors">
                <X size={18} className="text-[var(--text-muted)]" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-4 shrink-0">Cuéntanos qué falló para que nuestra IA aprenda a hacerlo mejor.</p>

            {generation.error_message && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                <p className="text-[10px] sm:text-xs font-medium text-rose-400 uppercase tracking-wider mb-1">Error original</p>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{generation.error_message}</p>
              </div>
            )}

            <div className="overflow-y-auto no-scrollbar shrink">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto no-scrollbar pb-2">
              {ERROR_TYPES.map(et => (
                <button
                  key={et.value}
                  onClick={() => setFeedbackType(et.value)}
                  className={`p-3 rounded-2xl border text-xs sm:text-sm font-medium transition-all text-left ${
                    feedbackType === et.value ? 'ring-2 ring-[#FF5C3A] shadow-sm' : ''
                  } ${et.value === OTHER_VALUE ? 'sm:col-span-2' : ''}`}
                  style={
                    feedbackType === et.value
                      ? { backgroundColor: 'rgba(255,92,58,0.1)', borderColor: '#FF5C3A', color: 'var(--text-primary)' }
                      : { backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                  }
                >
                  {et.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {feedbackType && (
                <motion.textarea
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: '6rem' }}
                  exit={{ opacity: 0, height: 0 }}
                  value={feedbackDesc}
                  onChange={e => setFeedbackDesc(e.target.value)}
                  placeholder={feedbackType === OTHER_VALUE ? "Dinos qué viste mal..." : "Detalles adicionales (opcional)..."}
                  className="w-full p-4 rounded-2xl mb-4 text-xs sm:text-sm outline-none transition-all border bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none"
                />
              )}
            </AnimatePresence>
            </div>

            <div className="flex flex-col gap-2 shrink-0 mt-4">
              <button
                onClick={handleSubmit}
                disabled={sending || (!feedbackType) || (feedbackType === OTHER_VALUE && !feedbackDesc.trim())}
                className="w-full py-3.5 sm:py-4 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 active:scale-95 transition-all bg-[#FF5C3A] text-sm"
              >
                {sending ? 'Enviando...' : 'Enviar reporte'}
              </button>
              <button onClick={onClose} className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors text-[var(--text-muted)]">
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center animate-in fade-in zoom-in duration-300 my-auto">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 bg-emerald-500/10 border-emerald-500">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-[var(--text-primary)]">¡Reporte enviado!</h3>
            <p className="text-sm text-[var(--text-secondary)] px-4">Gracias por ayurdarnos. Analizaremos tu caso de inmediato.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tarjeta de Generación ─────────────────────────────────────────────────────
const GenerationCard = React.forwardRef<HTMLDivElement, {
  gen: Generation; selected: boolean; selecting: boolean; viewMode: ViewMode;
  onOpen: () => void; onToggle: () => void; onDelete: () => void; onReportError: () => void;
  brandPlan?: string; hasFeedback?: boolean;
}>(function GenerationCard({
  gen, selected, selecting, viewMode, onOpen, onToggle, onDelete, onReportError, brandPlan, hasFeedback
}, ref) {
  const date = new Date(gen.generatedAt);
  const dateStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const isFailed = gen.status === 'FAILED';
  const isPending = gen.status === 'PENDING';

  if (viewMode === 'list') {
    return (
      <motion.div
        ref={ref}
        variants={itemVariants}
        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${selected ? 'bg-[#FF5C3A]/10 border-[#FF5C3A] shadow-[0_0_20px_rgba(255,92,58,0.1)]' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--text-muted)]/50'}`}
        onClick={selecting ? onToggle : (isFailed || isPending ? undefined : onOpen)}
      >
        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-[var(--border-color)] bg-[var(--bg-hover)] flex items-center justify-center relative shadow-inner">
          {isPending ? (
            <Loader2 className="w-6 h-6 text-[#FF5C3A] animate-spin" />
          ) : isFailed ? (
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          ) : (
            <>
              <img
                src={gen.resultImageUrl || '/placeholder-gen.jpg'}
                alt={gen.productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  // Si el resultado fue expirado, mostrar placeholder específico
                  if (gen.resultImageUrl === '[EXPIRADO]') {
                    el.src = 'https://via.placeholder.com/400x600?text=Resultado+expirado';
                  } else {
                    el.src = 'https://via.placeholder.com/400x600?text=Error+Imagen';
                  }
                }}
              />
              {/* Badge para resultado expirado */}
              {gen.resultImageUrl === '[EXPIRADO]' && (
                <div className="absolute inset-0 bg-[var(--bg-secondary)] flex flex-col items-center justify-center gap-1">
                  <Clock size={16} className="text-[var(--text-muted)]" />
                  <span className="text-[8px] text-[var(--text-muted)] font-bold text-center px-1">Resultado expirado</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </div>
        <div className="flex-1 min-w-0 px-2">
          <p className="text-[12px] font-[900] uppercase tracking-tight text-[var(--text-primary)] italic truncate">{gen.productName}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {isPending && <span className="text-[8px] font-black uppercase text-[#FF5C3A] bg-[#FF5C3A]/10 px-2 py-0.5 rounded-full border border-[#FF5C3A]/20">Sincronizando...</span>}
            {isFailed && <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Interrupción</span>}
            {isFailed && hasFeedback && (
              <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle size={8} /> Reporte enviado
              </span>
            )}
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] opacity-60">
              <Clock size={10} />
              <p className="text-[9px] font-bold uppercase tracking-[0.1em]">{dateStr} · {timeStr}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 pr-2">
          {selecting ? (
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-[#FF5C3A] border-[#FF5C3A] shadow-lg shadow-[#FF5C3A]/30' : 'border-[var(--border-color)] bg-black/5'}`}>
              {selected && <CheckCircle2 size={16} className="text-white" />}
            </div>
          ) : (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              {isFailed && (
                <button onClick={(e) => { e.stopPropagation(); onReportError(); }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all" title="Reportar error">
                  <Flag size={14} />
                </button>
              )}
              {!isFailed && !isPending && (
                <button onClick={(e) => { e.stopPropagation(); onOpen(); }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[#FF5C3A] hover:bg-[#FF5C3A]/10 transition-all">
                  <Maximize2 size={16} />
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={itemVariants}
      className={`relative group rounded-2xl overflow-hidden border transition-all cursor-pointer ${selected ? 'border-[#FF5C3A] ring-[6px] ring-[#FF5C3A]/10 shadow-[0_20px_50px_rgba(255,92,58,0.2)]' : 'border-[var(--border-color)] hover:border-[#FF5C3A]/40'} bg-[var(--bg-card)] shadow-xl hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]`}
      onClick={selecting ? onToggle : (isFailed || isPending ? undefined : onOpen)}
    >
      <div className={`relative ${viewMode === 'thumbnails' ? 'aspect-[3/4]' : 'aspect-[3/4.5]'} overflow-hidden bg-[var(--bg-hover)] flex items-center justify-center`}>
        {isPending ? (
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-[#FF5C3A] animate-spin opacity-40" />
              <div className="absolute inset-0 bg-[#FF5C3A]/20 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF5C3A] animate-pulse">Procesando Imagen</p>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center gap-4 p-10 text-center bg-rose-500/5 w-full h-full justify-center relative">
            <AlertTriangle className="w-10 h-10 text-rose-500/40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 leading-tight">Generación de IA<br />Interrumpida</p>
            {gen.error_message && (
              <p className="text-[8px] text-rose-400/50 mt-1 px-4 max-w-[200px] truncate">{gen.error_message}</p>
            )}
            {hasFeedback && (
              <span className="absolute top-3 right-3 text-[7px] font-black uppercase text-emerald-500 bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle size={8} /> Reporte
              </span>
            )}
          </div>
        ) : (
          <>
            <img
              src={gen.resultImageUrl || '/placeholder-gen.jpg'}
              alt={gen.productName}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=Error+Imagen'; }}
            />
            {/* Vibrant Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

            <div className={`absolute inset-x-0 bottom-0 ${viewMode === 'thumbnails' ? 'p-3' : 'p-6'} transform ${viewMode === 'thumbnails' ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'} transition-all duration-500 ease-out bg-gradient-to-t from-black/80 via-black/20 to-transparent`}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-jakarta">
                  {viewMode !== 'thumbnails' && <Shirt size={10} className="text-[#FF5C3A]" />}
                  <p className={`${viewMode === 'thumbnails' ? 'text-[9px]' : 'text-[11px]'} font-bold uppercase text-white tracking-[0.1em] truncate italic shadow-sm`}>{gen.productName}</p>
                </div>
                {viewMode !== 'thumbnails' && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">{dateStr} · {timeStr}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-rose-500 transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                        <Trash2 size={12} className="text-white" />
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-[#FF5C3A] transition-colors" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                        <Maximize2 size={12} className="text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {selecting && (
          <div className="absolute top-8 left-8 z-10">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center backdrop-blur-xl transition-all duration-300 ${selected ? 'bg-[#FF5C3A] border-[#FF5C3A] scale-110 shadow-[0_0_20px_rgba(255,92,58,0.4)]' : 'bg-black/20 border-white/30 hover:border-white/60'}`}>
              {selected && <CheckCircle2 size={20} className="text-white" />}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default function GenerationsPage() {
  const { brand } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [filteredGenerations, setFilteredGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Generation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id?: string; bulk?: boolean }>({ isOpen: false });
  const [reportingError, setReportingError] = useState<Generation | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('generations-view-mode') as ViewMode | null;
    if (saved && ['grid', 'thumbnails', 'list'].includes(saved)) setViewMode(saved);
    loadGenerations();
  }, []);

  useEffect(() => {
    const filtered = generations.filter(gen =>
      gen.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGenerations(filtered);
  }, [searchTerm, generations]);

  const loadGenerations = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ generations: Generation[]; total: number }>(`/generations`);
      setGenerations(res.data.generations);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteOne = async (id: string) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDeleteOne = async () => {
    const id = confirmDelete.id;
    if (!id) return;
    setDeleting(true);
    try {
      await api.delete(`/generations/${id}`);
      setGenerations(prev => prev.filter(g => g.id !== id));
      setConfirmDelete({ isOpen: false });
    } catch (err: any) {
      console.error('Error al eliminar generación:', err);
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message || 'Error desconocido'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    setConfirmDelete({ isOpen: true, bulk: true });
  };

  const handleConfirmDeleteBulk = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      await api.delete('/generations', { ids: Array.from(selected) });
      setGenerations(prev => prev.filter(g => !selected.has(g.id)));
      setSelected(new Set());
      setSelecting(false);
      setConfirmDelete({ isOpen: false });
    } catch (err: any) {
      console.error('Error en el borrado masivo:', err);
      alert('Error en el borrado masivo: ' + (err.response?.data?.message || err.message || 'Error desconocido'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-width-[1400px] mx-auto space-y-8 md:space-y-12 pb-20 px-4 md:px-0"
    >
      {/* ══ HEADER & CONTROLS ══ */}
      <motion.div variants={itemVariants} className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-b border-[var(--border-color)] pb-8 md:pb-10 mt-4 md:mt-0">
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center border border-[#FF5C3A]/5">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-[#FF5C3A]" />
              </div>
              <h1 className="text-2xl md:text-4xl font-[950] tracking-tighter text-[var(--text-primary)] italic uppercase leading-none">
                Mis Pruebas
              </h1>
            </div>
            <p className="text-[10px] md:text-sm text-[var(--text-secondary)] font-bold uppercase tracking-tight opacity-60">
              Historial de IA / <span className="text-[#FF5C3A]">{generations.length} items</span>
            </p>
          </div>

          <div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <div className="flex bg-[var(--bg-card)] rounded-2xl p-1 md:p-1.5 border border-[var(--border-color)] shadow-xl shrink-0">
              {([
                { id: 'grid', icon: <LayoutGrid size={15} /> },
                { id: 'thumbnails', icon: <Grid3X3 size={15} /> },
                { id: 'list', icon: <LayoutList size={15} /> },
              ] as const).map(({ id, icon }) => (
                <button
                  key={id}
                  onClick={() => { setViewMode(id); localStorage.setItem('generations-view-mode', id); }}
                  className={`p-2.5 md:p-3 rounded-xl transition-all ${viewMode === id ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
                >
                  {icon}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setSelecting(!selecting); setSelected(new Set()); }}
              className={`flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] border transition-all shadow-xl active:scale-95 shrink-0 ${selecting ? 'bg-[#FF5C3A] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--text-muted)]'}`}
            >
              {selecting ? <X size={14} /> : <Filter size={14} />}
              {selecting ? 'Cerrar' : 'Gestionar'}
            </button>
          </div>
        </div>

        {/* Search & Bulk Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-4 md:gap-6 px-2 md:px-0">
          <div className="relative flex-1 group">
            <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 md:gap-4 border-r border-[var(--border-color)] pr-3 md:pr-4">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
            </div>
            <input
              type="text" placeholder="BUSCAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 md:pl-20 pr-6 py-4 md:py-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl md:rounded-3xl text-[10px] md:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] outline-none focus:border-[#FF5C3A]/50 transition-all shadow-2xl placeholder:text-[var(--text-muted)]/30"
            />
          </div>

          <AnimatePresence>
            {selecting && selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 w-full sm:w-auto"
              >
                <button
                  onClick={handleDeleteSelected} disabled={deleting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-rose-500 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-rose-500/20 active:scale-95 transition-all"
                >
                  <Trash2 size={16} /> ELIMINAR {selected.size} GENERACIONES
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ══ GRID ══ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-32 gap-6 bg-[var(--bg-card)] rounded-3xl md:rounded-[4rem] border border-[var(--border-color)]">
          <div className="relative">
            <Spinner size="lg" />
            <div className="absolute inset-0 bg-[#FF5C3A]/10 blur-xl rounded-full"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-[var(--text-primary)] animate-pulse">Cargando Historial</p>
          </div>
        </div>
      ) : filteredGenerations.length === 0 ? (
        <div className="text-center py-40 rounded-[4rem] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-inner group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="w-28 h-28 bg-[var(--bg-hover)] rounded-full flex items-center justify-center mx-auto mb-10 relative border border-[var(--border-color)]">
            <Shirt size={48} className="text-[var(--text-muted)] opacity-20" />
          </div>
          <h3 className="text-3xl font-[950] uppercase italic text-[var(--text-primary)] mb-4 tracking-tighter">Sin fotos</h3>
          <p className="text-[12px] text-[var(--text-muted)] font-black uppercase tracking-[0.3em] opacity-40 max-w-xs mx-auto leading-relaxed">Aún no has realizado pruebas con IA. Los resultados aparecerán aquí.</p>
        </div>
      ) : (
        <motion.div
          layout
          className={
            viewMode === 'list'
              ? "flex flex-col gap-8"
              : `grid ${viewMode === 'thumbnails' ? 'gap-4 md:gap-6' : 'gap-10'} ${viewMode === 'thumbnails' ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`
          }
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredGenerations.map(gen => (
              <GenerationCard
                key={gen.id}
                gen={gen}
                viewMode={viewMode}
                selected={selected.has(gen.id)}
                selecting={selecting}
                onOpen={() => setLightbox(gen)}
                onToggle={() => toggleSelect(gen.id)}
                onDelete={() => handleDeleteOne(gen.id)}
                onReportError={() => setReportingError(gen)}
                brandPlan={brand?.plan}
                hasFeedback={gen.has_feedback}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ══ MODALS ══ */}
      <AnimatePresence>
        {lightbox && (lightbox.resultImageUrl || lightbox.resultImageUrl === '[EXPIRADO]') && (
          <Lightbox 
            imageUrl={lightbox.resultImageUrl} 
            productName={lightbox.productName} 
            onClose={() => setLightbox(null)} 
            brandPlan={brand?.plan} 
            onDelete={() => {
              setLightbox(null);
              setConfirmDelete({ isOpen: true, id: lightbox.id });
            }}
            onReportError={() => {
              setLightbox(null);
              setReportingError(lightbox);
            }}
            isExpired={lightbox.resultImageUrl === '[EXPIRADO]'}
            hasFeedback={lightbox.has_feedback}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false })}
        onConfirm={confirmDelete.bulk ? handleConfirmDeleteBulk : handleConfirmDeleteOne}
        title={confirmDelete.bulk ? 'Eliminar fotos' : 'Eliminar foto'}
        message={confirmDelete.bulk
          ? `¿Estás seguro de que deseas eliminar permanentemente estas ${selected.size} fotos? Esta acción no se puede deshacer.`
          : '¿Estás seguro de que deseas eliminar permanentemente esta foto? Esta acción no se puede deshacer.'
        }
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar permanentemente'}
        isLoading={deleting}
      />

      {/* Feedback Modal for FAILED generations */}
      <AnimatePresence>
        {reportingError && brand?.slug && (
          <FeedbackModal
            generation={reportingError}
            brandSlug={brand.slug}
            onClose={() => setReportingError(null)}
            onSuccess={() => {
              // Mark as having feedback locally and reload
              setGenerations(prev => prev.map(g =>
                g.id === reportingError.id ? { ...g, has_feedback: true } : g
              ));
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
