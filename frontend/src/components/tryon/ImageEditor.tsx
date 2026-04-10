'use client';

import { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCw, RotateCcw, Maximize, Crop as CropIcon, Check, MousePointer2, RefreshCcw } from 'lucide-react';

interface ImageEditorProps {
  src: string;
  onConfirm: (file: File, preview: string) => void;
  onCancel: () => void;
  primaryColor?: string;
  aspectRatio?: number; // Optional initial aspect ratio
}

export function ImageEditor({ 
  src, 
  onConfirm, 
  onCancel, 
  primaryColor = '#FF5C3A'
}: ImageEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(undefined); // undefined = free crop
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

    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.putImageData(data, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        resolve({ file, url });
      }, 'image/jpeg', 0.95);
    });
  };

  const resetAll = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(undefined);
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const result = await getCroppedImg(src, croppedAreaPixels, rotation);
      if (result) {
        onConfirm(result.file, result.url);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const ASPECT_RATIOS = [
    { label: 'Libre', value: undefined, icon: MousePointer2 },
    { label: '1:1', value: 1, icon: SquareIcon },
    { label: '3:4', value: 3/4, icon: VerticalIcon },
  ];

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative w-full h-full flex flex-col max-w-4xl mx-auto overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <CropIcon className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <h3 className="text-lg font-black italic uppercase tracking-tight text-white">Editar Imagen</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ajusta el encuadre y rotación</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={resetAll}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors text-[10px] font-black uppercase tracking-widest text-white/60"
            >
              <RefreshCcw className="w-3 h-3" />
              Restablecer
            </button>
            <button 
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Cropper Container */}
        <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            classes={{
              containerClassName: 'bg-[#0a0a0a]',
              mediaClassName: 'bg-[#0a0a0a]'
            }}
          />
        </div>

        {/* Controls Footer */}
        <div className="p-6 space-y-8 bg-[#0a0a0a]/80 backdrop-blur-md border-t border-white/5 z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            
            {/* Aspect Ratios */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 text-center md:text-left">Proporción</p>
              <div className="flex gap-2 justify-center md:justify-start">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setAspect(r.value)}
                    className="group relative flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border transition-all duration-300"
                    style={{ 
                      borderColor: aspect === r.value ? primaryColor : 'rgba(255,255,255,0.05)',
                      backgroundColor: aspect === r.value ? `${primaryColor}15` : 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <r.icon className="w-4 h-4 transition-colors" style={{ color: aspect === r.value ? primaryColor : 'white' }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: aspect === r.value ? primaryColor : 'rgba(255,255,255,0.4)' }}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom & Rotation Sliders */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40 px-1">
                  <div className="flex items-center gap-2"><Maximize className="w-3 h-3" /> Zoom</div>
                  <span className="text-white/60">{Math.round(zoom * 100)}%</span>
                </div>
                <input 
                  type="range" min={1} max={3} step={0.1} value={zoom} 
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#FF5C3A] cursor-pointer"
                  style={{ accentColor: primaryColor }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40 px-1">
                  <div className="flex items-center gap-2"><RotateCw className="w-3 h-3" /> Rotación</div>
                  <span className="text-white/60">{rotation}°</span>
                </div>
                <input 
                  type="range" min={0} max={360} step={1} value={rotation} 
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-[#FF5C3A] cursor-pointer"
                  style={{ accentColor: primaryColor }}
                />
              </div>
            </div>
          </div>

          {/* Quick Rotation Buttons */}
          <div className="flex justify-center gap-4">
             <button onClick={() => setRotation(r => (r - 1) % 360)} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
               <RotateCcw className="w-5 h-5 text-white/20" />
             </button>
             <button onClick={() => setRotation(r => (r - 90) % 360)} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
               <RotateCcw className="w-5 h-5 text-white/60" />
             </button>
             <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
               <RotateCw className="w-5 h-5 text-white/60" />
             </button>
             <button onClick={() => setRotation(r => (r + 1) % 360)} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
               <RotateCw className="w-5 h-5 text-white/20" />
             </button>
          </div>

          {/* Confirm Actions */}
          <div className="flex gap-4 pt-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-4 px-6 rounded-[2rem] border-2 border-white/10 text-white font-black italic uppercase text-xs tracking-widest hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 py-4 px-6 rounded-[2rem] text-white font-black italic uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{ 
                backgroundColor: primaryColor,
                boxShadow: `0 20px 40px -12px ${primaryColor}40`
              }}
            >
              <Check className="w-4 h-4" strokeWidth={3} />
              Usar esta foto
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const SquareIcon = ({ className, style }: { className?: string, style?: any }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} style={style}>
    <rect x="4" y="4" width="16" height="16" rx="1" />
  </svg>
);

const VerticalIcon = ({ className, style }: { className?: string, style?: any }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} style={style}>
    <rect x="6" y="2" width="12" height="20" rx="1" />
  </svg>
);
