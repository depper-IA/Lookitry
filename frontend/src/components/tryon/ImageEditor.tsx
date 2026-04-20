'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, RotateCw, RotateCcw, ZoomIn, ZoomOut, 
  Check, RefreshCcw, Maximize2
} from 'lucide-react';

type AspectFormat = 'original' | '1:1' | '3:4' | '16:9';

interface ImageEditorProps {
  src: string;
  onConfirm: (file: File, preview: string) => void;
  onCancel: () => void;
  primaryColor?: string;
}

const FORMAT_OPTIONS: { label: string; value: AspectFormat; aspect: number | undefined }[] = [
  { label: 'Original', value: 'original', aspect: undefined },
  { label: '1:1', value: '1:1', aspect: 1 },
  { label: '3:4', value: '3:4', aspect: 3 / 4 },
  { label: '16:9', value: '16:9', aspect: 16 / 9 },
];

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

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation: number = 0
  ): Promise<{ file: File; url: string } | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const rotRad = (rotation * Math.PI) / 180;
    const { width: bWidth, height: bHeight } = {
      width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
      height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height),
    };

    canvas.width = bWidth;
    canvas.height = bHeight;
    ctx.translate(bWidth / 2, bHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.putImageData(data, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg', lastModified: Date.now() });
        resolve({ file, url });
      }, 'image/jpeg', 0.95);
    });
  };

  const resetAll = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectFormat('original');
  };

  const handleFormatChange = (fmt: AspectFormat) => {
    setAspectFormat(fmt);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const rotate90 = () => setRotation(r => (r + 90) % 360);
  const zoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 1));

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const result = await getCroppedImg(src, croppedAreaPixels, rotation);
      if (result) onConfirm(result.file, result.url);
    } catch (e) {
      console.error('[ImageEditor] Error:', e);
    }
  };

  const currentAspect = FORMAT_OPTIONS.find(f => f.value === aspectFormat)?.aspect ?? undefined;

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95"
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
        >
          <RefreshCcw className="w-3.5 h-3.5 text-white/60" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Reset</span>
        </button>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-1 overflow-hidden min-h-0">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
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

      {/* Bottom Toolbar - Mobile Optimized */}
      <div className="bg-gradient-to-t from-black via-black/95 to-black/90 backdrop-blur-xl border-t border-white/5 p-4 pb-safe z-20">
        {/* Format Selector */}
        <div className="mb-5">
          <div className="flex gap-2 justify-center">
            {FORMAT_OPTIONS.map((fmt) => (
              <motion.button
                key={fmt.value}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleFormatChange(fmt.value)}
                className={`relative min-w-[60px] min-h-[44px] px-3 py-2.5 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200 ${
                  aspectFormat === fmt.value 
                    ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/25' 
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`}
                style={{
                  backgroundColor: aspectFormat === fmt.value ? primaryColor : undefined,
                  boxShadow: aspectFormat === fmt.value ? `0 8px 24px -8px ${primaryColor}40` : undefined,
                }}
              >
                <span className="text-[11px] font-black uppercase tracking-wide">{fmt.label}</span>
                {aspectFormat === fmt.value && (
                  <motion.div 
                    className="absolute inset-0 rounded-2xl border-2"
                    layoutId="format-indicator"
                    style={{ borderColor: primaryColor }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="space-y-4 mb-5">
          {/* Zoom Row */}
          <div className="flex items-center gap-3">
            <button 
              onClick={zoomOut}
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
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
                style={{
                  background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.1) ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
            </div>
            <button 
              onClick={zoomIn}
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
            >
              <ZoomIn className="w-4 h-4 text-white/70" />
            </button>
            <div className="w-12 text-right">
              <span className="text-[10px] font-bold text-white/50">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {/* Rotation Row */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setRotation(r => (r - 90 + 360) % 360)}
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
            >
              <RotateCcw className="w-4 h-4 text-white/70" />
            </button>
            <button
              onClick={rotate90}
              className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-95"
            >
              <RotateCw className="w-4 h-4 text-white/70" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">90°</span>
            </button>
            <button 
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
            >
              <RotateCw className="w-4 h-4 text-white/70" />
            </button>
            <div className="w-12 text-right">
              <span className="text-[10px] font-bold text-white/50">{rotation}°</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            className="flex-1 h-14 rounded-[1.5rem] border-2 border-white/10 text-white font-black italic uppercase text-xs tracking-widest hover:bg-white/5 transition-all"
          >
            Cancelar
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            className="flex-1 h-14 rounded-[1.5rem] text-white font-black italic uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: primaryColor,
              boxShadow: `0 12px 32px -8px ${primaryColor}50`
            }}
          >
            <Check className="w-4 h-4" strokeWidth={3} />
            Aplicar
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
