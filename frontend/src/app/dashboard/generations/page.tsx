'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

import { downloadImage } from '@/utils/download';

interface Generation {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  resultImageUrl: string;
  generatedAt: string;
  processingTime: number | null;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ imageUrl, productName, onClose }: { imageUrl: string; productName: string; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadImage(
        imageUrl,
        `prueba-virtual-${productName.toLowerCase().replace(/\s+/g, '-')}.jpg`
      );
    } catch { /* silencioso */ } finally {
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
      <img
        src={imageUrl}
        alt={`Prueba virtual — ${productName}`}
        className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
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
  gen, selected, selecting, onOpen, onToggle, onDelete,
}: {
  gen: Generation;
  selected: boolean;
  selecting: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadImage(
        gen.resultImageUrl,
        `prueba-virtual-${gen.productName.toLowerCase().replace(/\s+/g, '-')}.jpg`
      );
    } catch { /* silencioso */ } finally {
      setDownloading(false);
    }
  };

  const date = new Date(gen.generatedAt);
  const dateStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

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
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
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
        {gen.productImageUrl && (
          <div className="absolute top-2 right-2 w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-md">
            <img src={gen.productImageUrl} alt={gen.productName} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{gen.productName}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{dateStr} · {timeStr}</p>
        {gen.processingTime && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {Math.round(gen.processingTime / 1000)}s
          </p>
        )}

        {!selecting && (
          <div className="mt-3 flex gap-2">
            {/* Descargar */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-60"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#FF5C3A';
                (e.currentTarget as HTMLElement).style.color = '#fff';
                (e.currentTarget as HTMLElement).style.borderColor = '#FF5C3A';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
              }}
            >
              {downloading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {downloading ? 'Descargando...' : 'Descargar'}
            </button>

            {/* Eliminar */}
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#fee2e2';
                (e.currentTarget as HTMLElement).style.color = '#ef4444';
                (e.currentTarget as HTMLElement).style.borderColor = '#fca5a5';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
              }}
              title="Eliminar"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function GenerationsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Generation | null>(null);

  // Selección masiva
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadGenerations(); }, []);

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
    if (selected.size === generations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(generations.map(g => g.id)));
    }
  };

  const cancelSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
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
    if (!confirm(`¿Eliminar ${selected.size} generación${selected.size > 1 ? 'es' : ''}?`)) return;
    setDeleting(true);
    try {
      await api.delete('/generations', { ids: Array.from(selected) });
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            Historial de generaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Todas tus pruebas virtuales generadas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selecting ? (
            <>
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                {selected.size === generations.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selected.size === 0 || deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#ef4444' }}
              >
                {deleting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                {deleting ? 'Eliminando...' : `Eliminar${selected.size > 0 ? ` (${selected.size})` : ''}`}
              </button>
              <button
                onClick={cancelSelecting}
                className="px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              {generations.length > 0 && (
                <button
                  onClick={() => setSelecting(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Seleccionar
                </button>
              )}
              <button
                onClick={loadGenerations}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{error}</p>
          <button onClick={loadGenerations} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#FF5C3A' }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Vacío */}
      {!loading && !error && generations.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-card)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Sin generaciones aún</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Las pruebas virtuales que generes aparecerán aquí</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && generations.length > 0 && (
        <>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {generations.length} {generations.length === 1 ? 'generación' : 'generaciones'}
            {selecting && selected.size > 0 && ` · ${selected.size} seleccionada${selected.size > 1 ? 's' : ''}`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {generations.map(gen => (
              <GenerationCard
                key={gen.id}
                gen={gen}
                selected={selected.has(gen.id)}
                selecting={selecting}
                onOpen={() => setLightbox(gen)}
                onToggle={() => toggleSelect(gen.id)}
                onDelete={() => handleDeleteOne(gen.id)}
              />
            ))}
          </div>
        </>
      )}

      {lightbox && (
        <Lightbox
          imageUrl={lightbox.resultImageUrl}
          productName={lightbox.productName}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
