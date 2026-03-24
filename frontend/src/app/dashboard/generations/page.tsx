'use client';

import { useState, useEffect } from 'react';
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
  X,
  CheckCircle2,
  Clock,
  Shirt,
  Filter,
  AlertTriangle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Generation {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  resultImageUrl: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error_message?: string | null;
  generatedAt: string;
  processingTime: number | null;
}

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
function Lightbox({ imageUrl, productName, onClose, brandPlan }: { imageUrl: string; productName: string; onClose: () => void; brandPlan?: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const watermarkedUrl = getProxiedImageUrl(imageUrl, brandPlan);
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
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
      onClick={onClose}
    >
      <button className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 active:scale-90" onClick={onClose}>
        <X className="w-6 h-6 text-white" />
      </button>

      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="relative max-w-full max-h-[85vh] group shadow-[0_0_100px_rgba(255,92,58,0.2)]"
        onClick={e => e.stopPropagation()}
      >
        <img src={imageUrl} alt={productName} className="w-auto h-full max-h-[80vh] object-contain rounded-3xl" />
      </motion.div>

      <button
        onClick={handleDownload} disabled={downloading}
        className="absolute bottom-10 px-10 py-4 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 shadow-2xl hover:brightness-110 active:scale-95 transition-all"
      >
        {downloading ? <Spinner size="sm" /> : <Download size={18} />}
        {downloading ? 'Codificando...' : 'Descargar DNA'}
      </button>
    </motion.div>
  );
}

// ── Tarjeta de Generación ─────────────────────────────────────────────────────
function GenerationCard({
  gen, selected, selecting, viewMode, onOpen, onToggle, onDelete, brandPlan
}: {
  gen: Generation; selected: boolean; selecting: boolean; viewMode: ViewMode;
  onOpen: () => void; onToggle: () => void; onDelete: () => void; brandPlan?: string;
}) {
  const date = new Date(gen.generatedAt);
  const dateStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const isFailed = gen.status === 'FAILED';
  const isPending = gen.status === 'PENDING';

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={itemVariants}
        className={`flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer group ${selected ? 'bg-[#FF5C3A]/10 border-[#FF5C3A] shadow-[0_0_20px_rgba(255,92,58,0.1)]' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--text-muted)]/50'}`}
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
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=Error+Imagen'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </div>
        <div className="flex-1 min-w-0 px-2">
          <p className="text-[12px] font-[900] uppercase tracking-tight text-[var(--text-primary)] italic truncate">{gen.productName}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {isPending && <span className="text-[8px] font-black uppercase text-[#FF5C3A] bg-[#FF5C3A]/10 px-2 py-0.5 rounded-full border border-[#FF5C3A]/20">Sincronizando...</span>}
            {isFailed && <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Interrupción</span>}
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
      variants={itemVariants}
      className={`relative group rounded-[2.8rem] overflow-hidden border transition-all cursor-pointer ${selected ? 'border-[#FF5C3A] ring-[6px] ring-[#FF5C3A]/10 shadow-[0_20px_50px_rgba(255,92,58,0.2)]' : 'border-[var(--border-color)] hover:border-[#FF5C3A]/40'} bg-[var(--bg-card)] shadow-xl hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]`}
      onClick={selecting ? onToggle : (isFailed || isPending ? undefined : onOpen)}
    >
      <div className={`relative ${viewMode === 'thumbnails' ? 'aspect-square' : 'aspect-[3/4.5]'} overflow-hidden bg-[var(--bg-hover)] flex items-center justify-center`}>
        {isPending ? (
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-[#FF5C3A] animate-spin opacity-40" />
              <div className="absolute inset-0 bg-[#FF5C3A]/20 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF5C3A] animate-pulse">Procesando ADN</p>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center gap-4 p-10 text-center bg-rose-500/5 w-full h-full justify-center">
            <AlertTriangle className="w-10 h-10 text-rose-500/40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 leading-tight">Generación de IA<br />Interrumpida</p>
          </div>
        ) : (
          <>
            <img
              src={gen.resultImageUrl || '/placeholder-gen.jpg'}
              alt={gen.productName}
              className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=Error+Imagen'; }}
            />
            {/* Vibrant Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />

            <div className="absolute inset-x-0 bottom-0 p-8 transform translate-y-6 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Shirt size={10} className="text-[#FF5C3A]" />
                  <p className="text-[11px] font-black uppercase text-white tracking-[0.15em] truncate italic shadow-sm">{gen.productName}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">{dateStr} · {timeStr}</p>
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-[#FF5C3A] transition-colors">
                    <Maximize2 size={12} className="text-white" />
                  </div>
                </div>
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
}

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
      className="max-w-7xl mx-auto space-y-12 pb-20 px-4"
    >
      {/* ══ HEADER & CONTROLS ══ */}
      <motion.div variants={itemVariants} className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--border-color)] pb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#FF5C3A]" />
              </div>
              <h1 className="text-4xl font-[950] tracking-tighter text-[var(--text-primary)] italic uppercase leading-none">
                Mis Generaciones
              </h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)] font-bold uppercase tracking-tight opacity-60">
              Archivo de Generaciones / <span className="text-[#FF5C3A]">{generations.length} items</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-[var(--bg-card)] rounded-2xl p-1.5 border border-[var(--border-color)] shadow-xl">
              {([
                { id: 'grid', icon: <LayoutGrid size={16} /> },
                { id: 'thumbnails', icon: <Grid3X3 size={16} /> },
                { id: 'list', icon: <LayoutList size={16} /> },
              ] as const).map(({ id, icon }) => (
                <button
                  key={id}
                  onClick={() => { setViewMode(id); localStorage.setItem('generations-view-mode', id); }}
                  className={`p-3 rounded-xl transition-all ${viewMode === id ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
                >
                  {icon}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setSelecting(!selecting); setSelected(new Set()); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border transition-all shadow-xl active:scale-95 ${selecting ? 'bg-[#FF5C3A] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--text-muted)]'}`}
            >
              {selecting ? <X size={14} /> : <Filter size={14} />}
              {selecting ? 'Cerrar' : 'Gestionar'}
            </button>
          </div>
        </div>

        {/* Search & Bulk Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex-1 group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 border-r border-[var(--border-color)] pr-4">
              <Search className="w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
            </div>
            <input
              type="text" placeholder="BUSCAR POR NOMBRE DE PRODUCTO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-6 py-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl text-sm font-black uppercase tracking-widest text-[var(--text-primary)] outline-none focus:border-[#FF5C3A]/50 transition-all shadow-2xl placeholder:text-[var(--text-muted)]/30"
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
        <div className="flex flex-col items-center justify-center p-32 gap-6 bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border-color)]">
          <div className="relative">
            <Spinner size="lg" />
            <div className="absolute inset-0 bg-[#FF5C3A]/10 blur-xl rounded-full"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--text-primary)] animate-pulse">Cargando Generaciones</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Actualizando tu historial...</p>
          </div>
        </div>
      ) : filteredGenerations.length === 0 ? (
        <div className="text-center py-40 rounded-[4rem] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-inner group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="w-28 h-28 bg-[var(--bg-hover)] rounded-full flex items-center justify-center mx-auto mb-10 relative border border-[var(--border-color)]">
            <Shirt size={48} className="text-[var(--text-muted)] opacity-20" />
          </div>
          <h3 className="text-3xl font-[950] uppercase italic text-[var(--text-primary)] mb-4 tracking-tighter">Sin Generaciones</h3>
          <p className="text-[12px] text-[var(--text-muted)] font-black uppercase tracking-[0.3em] opacity-40 max-w-xs mx-auto leading-relaxed">Aún no has realizado pruebas con IA. Los resultados aparecerán aquí.</p>
        </div>
      ) : (
        <motion.div
          layout
          className={
            viewMode === 'list'
              ? "flex flex-col gap-8"
              : `grid gap-12 ${viewMode === 'thumbnails' ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`
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
                brandPlan={brand?.plan}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ══ MODALS ══ */}
      <AnimatePresence>
        {lightbox && lightbox.resultImageUrl && (
          <Lightbox imageUrl={lightbox.resultImageUrl} productName={lightbox.productName} onClose={() => setLightbox(null)} brandPlan={brand?.plan} />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false })}
        onConfirm={confirmDelete.bulk ? handleConfirmDeleteBulk : handleConfirmDeleteOne}
        title={confirmDelete.bulk ? 'Eliminar Generaciones' : 'Eliminar Generación'}
        message={confirmDelete.bulk
          ? `¿Estás seguro de que deseas eliminar permanentemente estas ${selected.size} generaciones? Esta acción no se puede deshacer.`
          : '¿Estás seguro de que deseas eliminar permanentemente esta generación? Esta acción no se puede deshacer.'
        }
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar permanentemente'}
        isLoading={deleting}
      />
    </motion.div>
  );
}
