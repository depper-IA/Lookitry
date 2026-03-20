'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { downloadImage } from '@/utils/download';
import { useAuth } from '@/hooks/useAuth';

interface Generation {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  resultImageUrl: string;
  generatedAt: string;
  processingTime: number | null;
}

export type ViewMode = 'grid' | 'thumbnails' | 'list';

// ── Iconos de vista ──────────────────────────────────────────────────────────
function IconGrid() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconThumbnails() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconList() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'grid',       label: 'Cuadrícula',  icon: <IconGrid /> },
  { id: 'thumbnails', label: 'Miniaturas',  icon: <IconThumbnails /> },
  { id: 'list',       label: 'Lista',       icon: <IconList /> },
];

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ imageUrl, productName, onClose, brandPlan }: { imageUrl: string; productName: string; onClose: () => void; brandPlan?: string }) {
  const [downloading, setDownloading] = useState(false);

  // ── Aplicar marca de agua física ───────────────────────────────────────────
  const applyWatermark = async (srcUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context');
        ctx.drawImage(img, 0, 0);

        if (brandPlan !== 'BASIC' && brandPlan !== 'TRIAL') {
          return resolve(canvas.toDataURL('image/jpeg', 1.0));
        }

        const wmImg = new Image();
        wmImg.crossOrigin = 'anonymous';
        wmImg.onload = () => {
          if (brandPlan === 'BASIC') {
            const wmWidth = canvas.width * 0.12;
            const wmHeight = (wmImg.naturalHeight / wmImg.naturalWidth) * wmWidth;
            const paddingX = canvas.width * 0.035;
            const paddingY = canvas.height * 0.035;
            ctx.globalAlpha = 0.7;
            ctx.drawImage(wmImg, canvas.width - wmWidth - paddingX, canvas.height - wmHeight - paddingY, wmWidth, wmHeight);
          } else if (brandPlan === 'TRIAL') {
            const wmWidth = canvas.width * 0.45;
            const wmHeight = (wmImg.naturalHeight / wmImg.naturalWidth) * wmWidth;
            const x = (canvas.width - wmWidth) / 2;
            const y = (canvas.height - wmHeight) / 2;
            ctx.globalAlpha = 0.5;
            ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
          }
          resolve(canvas.toDataURL('image/jpeg', 1.0));
        };
        wmImg.onerror = () => resolve(canvas.toDataURL('image/jpeg', 1.0));
        wmImg.src = brandPlan === 'BASIC' ? '/watermark-basic.webp' : '/watermark-trial.webp';
      };
      img.onerror = reject;
      img.src = srcUrl;
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const watermarkedUrl = await applyWatermark(imageUrl);
      const link = document.createElement('a');
      link.href = watermarkedUrl;
      link.download = `prueba-virtual-${productName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      await downloadImage(imageUrl, `prueba-virtual-${productName.toLowerCase().replace(/\s+/g, '-')}.jpg`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        onClick={onClose}
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="relative max-w-full max-h-[85vh]">
        <img
          src={imageUrl}
          alt={`Prueba virtual — ${productName}`}
          className="w-full h-full object-contain rounded-xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
        {brandPlan === 'BASIC' && (
          <div className="absolute bottom-[3.5%] right-[3.5%] w-[12%] pointer-events-none select-none z-10 opacity-70">
            <img src="/watermark-basic.webp" alt="Lookitry Basic" className="w-full h-auto drop-shadow-md" />
          </div>
        )}
        {brandPlan === 'TRIAL' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
            <div className="w-[45%] opacity-50">
              <img src="/watermark-trial.webp" alt="Lookitry Trial" className="w-full h-auto drop-shadow-lg" />
            </div>
          </div>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); handleDownload(); }}
        disabled={downloading}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#FF5C3A' }}
      >
        {downloading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        {downloading ? 'Descargando...' : 'Descargar'}
      </button>
    </div>
  );
}

// ── Tarjeta ───────────────────────────────────────────────────────────────────
function GenerationCard({
  gen, selected, selecting, viewMode, onOpen, onToggle, onDelete, brandPlan,
}: {
  gen: Generation;
  selected: boolean;
  selecting: boolean;
  viewMode: ViewMode;
  onOpen: () => void;
  onToggle: () => void;
  onDelete: () => void;
  brandPlan?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  // ── Aplicar marca de agua física ───────────────────────────────────────────
  const applyWatermark = async (srcUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context');
        ctx.drawImage(img, 0, 0);

        if (brandPlan !== 'BASIC' && brandPlan !== 'TRIAL') {
          return resolve(canvas.toDataURL('image/jpeg', 1.0));
        }

        const wmImg = new Image();
        wmImg.crossOrigin = 'anonymous';
        wmImg.onload = () => {
          if (brandPlan === 'BASIC') {
            const wmWidth = canvas.width * 0.12;
            const wmHeight = (wmImg.naturalHeight / wmImg.naturalWidth) * wmWidth;
            const paddingX = canvas.width * 0.035;
            const paddingY = canvas.height * 0.035;
            ctx.globalAlpha = 0.7;
            ctx.drawImage(wmImg, canvas.width - wmWidth - paddingX, canvas.height - wmHeight - paddingY, wmWidth, wmHeight);
          } else if (brandPlan === 'TRIAL') {
            const wmWidth = canvas.width * 0.45;
            const wmHeight = (wmImg.naturalHeight / wmImg.naturalWidth) * wmWidth;
            const x = (canvas.width - wmWidth) / 2;
            const y = (canvas.height - wmHeight) / 2;
            ctx.globalAlpha = 0.5;
            ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
          }
          resolve(canvas.toDataURL('image/jpeg', 1.0));
        };
        wmImg.onerror = () => resolve(canvas.toDataURL('image/jpeg', 1.0));
        wmImg.src = brandPlan === 'BASIC' ? '/watermark-basic.webp' : '/watermark-trial.webp';
      };
      img.onerror = reject;
      img.src = srcUrl;
    });
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const watermarkedUrl = await applyWatermark(gen.resultImageUrl);
      const link = document.createElement('a');
      link.href = watermarkedUrl;
      link.download = `prueba-virtual-${gen.productName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      await downloadImage(gen.resultImageUrl, `prueba-virtual-${gen.productName.toLowerCase().replace(/\s+/g, '-')}.jpg`);
    } finally {
      setDownloading(false);
    }
  };

  const date = new Date(gen.generatedAt);
  const dateStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  if (viewMode === 'list') {
    return (
      <div 
        className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:bg-gray-50/50 cursor-pointer ${selected ? 'ring-2 ring-[#FF5C3A] bg-[#FF5C3A]/5' : 'bg-card'}`}
        style={{ borderColor: selected ? '#FF5C3A' : 'var(--border-color)' }}
        onClick={selecting ? onToggle : onOpen}
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          <img src={gen.resultImageUrl} alt={gen.productName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{gen.productName}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{dateStr} · {timeStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {!selecting && (
            <>
              <button onClick={handleDownload} className="p-2 text-gray-400 hover:text-[#FF5C3A] transition-colors">
                {downloading ? '...' : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </>
          )}
          {selecting && (
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-[#FF5C3A] border-[#FF5C3A]' : 'border-gray-300'}`}>
              {selected && <svg className="w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden border group cursor-pointer transition-all hover:shadow-lg ${selected ? 'ring-2' : ''}`}
      style={{
        borderColor: selected ? '#FF5C3A' : 'var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        ...(selected ? { ringColor: '#FF5C3A' } : {}),
      }}
      onClick={selecting ? onToggle : onOpen}
    >
      <div className={`relative ${viewMode === 'thumbnails' ? 'aspect-square' : 'aspect-[3/4]'} overflow-hidden bg-gray-100`}>
        <img
          src={gen.resultImageUrl}
          alt={`Prueba virtual — ${gen.productName}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Checkbox de selección */}
        {selecting && (
          <div className="absolute top-2 left-2">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-transparent' : 'border-white bg-black/30'}`}
              style={selected ? { backgroundColor: '#FF5C3A' } : {}}
            >
              {selected && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Overlay lupa (solo cuando no está en modo selección) */}
        {!selecting && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
            </div>
          </div>
        )}

        {/* Miniatura del producto */}
        {gen.productImageUrl && viewMode === 'grid' && (
          <div className="absolute top-2 right-2 w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-md">
            <img src={gen.productImageUrl} alt={gen.productName} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{gen.productName}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{dateStr} · {timeStr}</p>

        {viewMode === 'grid' && !selecting && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-60"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              {downloading ? '...' : 'Descargar'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function GenerationsPage() {
  const { brand } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [filteredGenerations, setFilteredGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Generation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // Selección masiva
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

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
      const res = await api.get<{ generations: Generation[]; total: number }>('/generations');
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

  const toggleSelectAll = () => {
    if (selected.size === filteredGenerations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredGenerations.map(g => g.id)));
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm('¿Eliminar esta generación?')) return;
    try {
      await api.delete(`/generations/${id}`);
      setGenerations(prev => prev.filter(g => g.id !== id));
    } catch {
      alert('Error al eliminar la generación');
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`¿Eliminar ${selected.size} generaciones?`)) return;
    setDeleting(true);
    try {
      await api.delete('/generations', { data: { ids: Array.from(selected) } });
      setGenerations(prev => prev.filter(g => !selected.has(g.id)));
      setSelected(new Set());
      setSelecting(false);
    } catch {
      alert('Error al eliminar las generaciones');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              Historial de generaciones
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {filteredGenerations.length} resultados encontrados
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!selecting && (
              <div className="flex items-center bg-card border border-border rounded-lg p-0.5 gap-0.5">
                {VIEW_MODES.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => { setViewMode(id); localStorage.setItem('generations-view-mode', id); }}
                    title={label}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === id ? 'bg-[#FF5C3A] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}

            {selecting ? (
              <div className="flex items-center gap-2">
                <button onClick={toggleSelectAll} className="px-3 py-2 rounded-xl text-xs font-medium border border-border">
                  {selected.size === filteredGenerations.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
                <button onClick={handleDeleteSelected} disabled={selected.size === 0} className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white disabled:opacity-50">
                  {deleting ? '...' : `Eliminar (${selected.size})`}
                </button>
                <button onClick={() => { setSelecting(false); setSelected(new Set()); }} className="px-3 py-2 rounded-xl text-xs font-medium border border-border">
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setSelecting(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Seleccionar
              </button>
            )}
          </div>
        </div>

        {/* Buscador */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre de producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-[#FF5C3A]/20 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">Cargando generaciones...</div>
      ) : filteredGenerations.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl">
          <p className="text-gray-500">No se encontraron generaciones</p>
        </div>
      ) : (
        <div className={
          viewMode === 'list' 
            ? "flex flex-col gap-2" 
            : `grid gap-4 ${viewMode === 'thumbnails' ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`
        }>
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
              brandPlan={brand?.plan}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox imageUrl={lightbox.resultImageUrl} productName={lightbox.productName} onClose={() => setLightbox(null)} brandPlan={brand?.plan} />
      )}
    </div>
  );
}
