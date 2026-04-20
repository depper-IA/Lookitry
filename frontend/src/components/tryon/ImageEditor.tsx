'use client';

import { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, RotateCw, RotateCcw, ZoomIn, ZoomOut, 
  Check, RefreshCcw
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type AspectFormat = 'original' | '1:1' | '4:3' | '9:16';

interface ImageEditorProps {
  src: string;
  onConfirm: (file: File, preview: string) => void;
  onCancel: () => void;
  primaryColor?: string;
}

// ─── Formatos VERTICALES únicamente ───────────────────────────────────────────
// Nota de aspect ratios:
//   '4:3'  → portrait = 3/4 = 0.75   (label "4:3" = referencia al formato, orientación VERTICAL)
//   '9:16' → story    = 9/16 = 0.5625 (portrait, Instagram/TikTok stories)
//   'original' → aspect undefined (usa dimensiones naturales de la imagen, respeta EXIF)
const FORMAT_OPTIONS: {
  label: string;
  sublabel: string;
  value: AspectFormat;
  aspect: number | undefined;
}[] = [
  { label: 'Original', sublabel: 'Sin recorte', value: 'original', aspect: undefined },
  { label: '1:1',      sublabel: 'Cuadrado',    value: '1:1',      aspect: 1 },
  { label: '4:3',      sublabel: 'Vertical',    value: '4:3',      aspect: 3 / 4 },
  { label: '9:16',     sublabel: 'Story',       value: '9:16',     aspect: 9 / 16 },
];

// ─── Icono SVG de orientación vertical ────────────────────────────────────────
function VerticalIcon({ size = 10, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 10 14" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="8" height="12" rx="1.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function SquareIcon({ size = 10, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function OriginalIcon({ size = 10, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size * 1.1} height={size * 1.3} viewBox="0 0 11 13" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="9" height="11" rx="1.5" stroke={color} strokeWidth="1.5" strokeDasharray="2 1.5" />
    </svg>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export function ImageEditor({ 
  src, 
  onConfirm, 
  onCancel, 
  primaryColor = '#FF5C3A'
}: ImageEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectFormat, setAspectFormat] = useState<AspectFormat>('original');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // ── Cargar imagen como HTMLImageElement ───────────────────────────────────
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', reject);
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  // ── Export con recorte (para formatos 1:1, 4:3, 9:16) ────────────────────
  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rot: number = 0
  ): Promise<{ file: File; url: string } | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const rotRad = (rot * Math.PI) / 180;
    const bWidth  = Math.abs(Math.cos(rotRad) * image.width)  + Math.abs(Math.sin(rotRad) * image.height);
    const bHeight = Math.abs(Math.sin(rotRad) * image.width)  + Math.abs(Math.cos(rotRad) * image.height);

    canvas.width  = bWidth;
    canvas.height = bHeight;
    ctx.translate(bWidth / 2, bHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
    canvas.width  = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.putImageData(data, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(null); return; }
        const url  = URL.createObjectURL(blob);
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg', lastModified: Date.now() });
        resolve({ file, url });
      }, 'image/jpeg', 0.95);
    });
  };

  // ── Export Original: respeta orientación EXIF via createImageBitmap ───────
  // createImageBitmap con imageOrientation:'from-image' aplica la rotación EXIF
  // correctamente antes de dibujar en canvas (a diferencia de drawImage normal).
  const getOriginalImg = async (imageSrc: string): Promise<{ file: File; url: string } | null> => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      let bitmap: ImageBitmap;
      try {
        // imageOrientation:'from-image' respeta EXIF (Chrome 72+, Firefox 93+, Safari 15+)
        bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' } as ImageBitmapOptions);
      } catch {
        // Fallback si el browser no soporta la opción
        bitmap = await createImageBitmap(blob);
      }

      const canvas = document.createElement('canvas');
      canvas.width  = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { bitmap.close(); return null; }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      return new Promise((resolve) => {
        canvas.toBlob((b) => {
          if (!b) { resolve(null); return; }
          const url  = URL.createObjectURL(b);
          const file = new File([b], 'photo.jpg', { type: 'image/jpeg', lastModified: Date.now() });
          resolve({ file, url });
        }, 'image/jpeg', 0.95);
      });
    } catch (err) {
      console.error('[ImageEditor] getOriginalImg error:', err);
      return null;
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetAll = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectFormat('original');
    setCroppedAreaPixels(null);
  };

  const handleFormatChange = (fmt: AspectFormat) => {
    setAspectFormat(fmt);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const zoomIn  = () => setZoom(z => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 1));

  // ── Confirmar ─────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      let result: { file: File; url: string } | null = null;

      if (aspectFormat === 'original') {
        // Modo Original: no recorta, respeta orientación EXIF de la foto
        result = await getOriginalImg(src);
      } else {
        // Modos con recorte (1:1, 4:3, 9:16)
        if (!croppedAreaPixels) return;
        result = await getCroppedImg(src, croppedAreaPixels, rotation);
      }

      if (result) onConfirm(result.file, result.url);
    } catch (e) {
      console.error('[ImageEditor] Error al exportar imagen:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentAspect = FORMAT_OPTIONS.find(f => f.value === aspectFormat)?.aspect;

  // ── Helper: ícono por formato ─────────────────────────────────────────────
  const getFormatIcon = (value: AspectFormat, active: boolean) => {
    const color = active ? 'white' : 'rgba(255,255,255,0.4)';
    switch (value) {
      case 'original': return <OriginalIcon size={10} color={color} />;
      case '1:1':      return <SquareIcon   size={10} color={color} />;
      case '4:3':
      case '9:16':     return <VerticalIcon size={10} color={color} />;
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-4 md:p-6 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95"
            aria-label="Cancelar edición"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div>
            <h3 className="text-base font-black italic uppercase tracking-tight text-white">Editar Imagen</h3>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Ajusta el encuadre</p>
          </div>
        </div>
        <button 
          onClick={resetAll}
          className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors active:scale-95"
          aria-label="Restaurar ajustes"
        >
          <RefreshCcw className="w-3.5 h-3.5 text-white/60" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Reset</span>
        </button>
      </div>

      {/* ── Cropper Area ── */}
      <div className="relative flex-1 overflow-hidden min-h-0">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          // Para 'original': aspect undefined → usa dimensiones naturales (respeta EXIF)
          aspect={currentAspect}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          classes={{
            containerClassName: 'bg-[#0a0a0a]',
            mediaClassName: 'bg-[#0a0a0a]',
          }}
        />
      </div>

      {/* ── Bottom Toolbar ── */}
      <div className="bg-gradient-to-t from-black via-black/95 to-black/90 backdrop-blur-xl border-t border-white/5 p-4 pb-safe z-20">

        {/* ── Selector de formato (solo verticales) ── */}
        <div className="mb-5">
          <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/25 text-center mb-2.5">
            Formato
          </p>
          <div className="flex gap-2 justify-center">
            {FORMAT_OPTIONS.map((fmt) => {
              const isActive = aspectFormat === fmt.value;
              return (
                <motion.button
                  key={fmt.value}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleFormatChange(fmt.value)}
                  className={`relative min-w-[64px] min-h-[52px] px-3 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                  style={{
                    backgroundColor: isActive ? primaryColor : undefined,
                    boxShadow: isActive ? `0 8px 24px -8px ${primaryColor}40` : undefined,
                  }}
                  aria-pressed={isActive}
                  aria-label={`Formato ${fmt.label} — ${fmt.sublabel}`}
                >
                  {/* Ícono de orientación */}
                  <span className="flex items-center justify-center">
                    {getFormatIcon(fmt.value, isActive)}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wide leading-none">
                    {fmt.label}
                  </span>
                  <span className={`text-[7px] font-bold uppercase tracking-widest leading-none ${
                    isActive ? 'text-white/70' : 'text-white/25'
                  }`}>
                    {fmt.sublabel}
                  </span>

                  {/* Indicador animado del activo */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
                      layoutId="format-indicator"
                      style={{ borderColor: `${primaryColor}80` }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Controles de zoom y rotación (ocultos en modo Original) ── */}
        <AnimatePresence>
          {aspectFormat !== 'original' && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4">
                {/* Zoom */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={zoomOut}
                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
                    aria-label="Reducir zoom"
                  >
                    <ZoomOut className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="flex-1 relative">
                    <input 
                      type="range" 
                      min={1} 
                      max={3} 
                      step={0.05} 
                      value={zoom} 
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      aria-label="Nivel de zoom"
                      style={{
                        background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.1) ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />
                  </div>
                  <button 
                    onClick={zoomIn}
                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
                    aria-label="Aumentar zoom"
                  >
                    <ZoomIn className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="w-12 text-right">
                    <span className="text-[10px] font-bold text-white/50">{Math.round(zoom * 100)}%</span>
                  </div>
                </div>

                {/* Rotación */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
                    aria-label="Rotar 90° a la izquierda"
                  >
                    <RotateCcw className="w-4 h-4 text-white/70" />
                  </button>
                  <button
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-95"
                    aria-label="Rotar 90° a la derecha"
                  >
                    <RotateCw className="w-4 h-4 text-white/70" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">90°</span>
                  </button>
                  <button 
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
                    aria-label="Rotar 90° a la derecha"
                  >
                    <RotateCw className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="w-12 text-right">
                    <span className="text-[10px] font-bold text-white/50">{rotation}°</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Botones de acción ── */}
        <div className="flex gap-3">
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 h-14 rounded-[1.5rem] border-2 border-white/10 text-white font-black italic uppercase text-xs tracking-widest hover:bg-white/5 transition-all disabled:opacity-40"
          >
            Cancelar
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 h-14 rounded-[1.5rem] text-white font-black italic uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ 
              backgroundColor: primaryColor,
              boxShadow: `0 12px 32px -8px ${primaryColor}50`
            }}
          >
            {isProcessing ? (
              <motion.div
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={3} />
                Aplicar
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
