'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageEditorProps {
  src: string;
  onConfirm: (file: File, preview: string) => void;
  onCancel: () => void;
  primaryColor?: string;
}

type CropMode = 'square' | 'vertical' | 'original';

const CROP_MODES: { key: CropMode; label: string; icon: React.ReactNode }[] = [
  {
    key: 'square',
    label: 'Cuadrado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <rect x="4" y="4" width="16" height="16" rx="1" />
      </svg>
    ),
  },
  {
    key: 'vertical',
    label: 'Vertical',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <rect x="6" y="2" width="12" height="20" rx="1" />
      </svg>
    ),
  },
  {
    key: 'original',
    label: 'Original',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
      </svg>
    ),
  },
];

/** Calcula el recorte (en píxeles de la imagen original) según el modo */
function getCropPx(
  mode: CropMode,
  imgW: number,
  imgH: number
): { x: number; y: number; w: number; h: number } {
  if (mode === 'original') return { x: 0, y: 0, w: imgW, h: imgH };

  if (mode === 'square') {
    const side = Math.min(imgW, imgH);
    return { x: (imgW - side) / 2, y: (imgH - side) / 2, w: side, h: side };
  }

  // vertical 3:4
  const targetRatio = 3 / 4;
  const imgRatio = imgW / imgH;
  if (imgRatio > targetRatio) {
    const cropW = imgH * targetRatio;
    return { x: (imgW - cropW) / 2, y: 0, w: cropW, h: imgH };
  } else {
    const cropH = imgW / targetRatio;
    if (cropH <= imgH) return { x: 0, y: (imgH - cropH) / 2, w: imgW, h: cropH };
    return { x: 0, y: 0, w: imgW, h: imgH };
  }
}

/**
 * Calcula el tamaño del bounding box de un rectángulo (w×h) rotado `deg` grados.
 * Esto evita que la imagen se recorte al rotar.
 */
function rotatedBoundingBox(w: number, h: number, deg: number): { bw: number; bh: number } {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return { bw: w * cos + h * sin, bh: w * sin + h * cos };
}

const PREVIEW_MAX = 260; // ancho máximo del preview en px

export function ImageEditor({ src, onConfirm, onCancel, primaryColor = '#6366f1' }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState<CropMode>('original');
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Cargar imagen — sin crossOrigin para evitar bloqueos CORS
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = src;
  }, [src]);

  const crop = imgSize.w > 0 ? getCropPx(cropMode, imgSize.w, imgSize.h) : { x: 0, y: 0, w: 1, h: 1 };

  // Bounding box del crop rotado → determina el tamaño real del canvas
  const { bw: rawBW, bh: rawBH } = rotatedBoundingBox(crop.w, crop.h, rotation);
  // Escalar para que quepa en PREVIEW_MAX
  const scale = PREVIEW_MAX / Math.max(rawBW, rawBH, 1);
  const canvasW = Math.round(rawBW * scale);
  const canvasH = Math.round(rawBH * scale);

  // Dibujar canvas preview
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || imgSize.w === 0) return;

    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Fondo blanco para que el preview sea fiel al resultado final
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Escalar el crop al tamaño del canvas
    const drawW = crop.w * scale;
    const drawH = crop.h * scale;

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [rotation, crop, imgSize, canvasW, canvasH, scale]);

  const rotate = (deg: number) => setRotation(r => (r + deg + 360) % 360);

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || imgSize.w === 0) return;

    // Si no hay rotación, exportar directamente el crop sin bounding box extra
    const rad = (rotation * Math.PI) / 180;
    const hasRotation = rotation !== 0;

    let outW: number;
    let outH: number;

    if (hasRotation) {
      const { bw, bh } = rotatedBoundingBox(crop.w, crop.h, rotation);
      outW = Math.round(bw);
      outH = Math.round(bh);
    } else {
      outW = Math.round(crop.w);
      outH = Math.round(crop.h);
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    const ctx = outCanvas.getContext('2d')!;

    // Fondo blanco para evitar áreas negras en JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    if (hasRotation) ctx.rotate(rad);
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, -crop.w / 2, -crop.h / 2, crop.w, crop.h);
    ctx.restore();

    outCanvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'selfie-edited.jpg', { type: 'image/jpeg' });
      const preview = outCanvas.toDataURL('image/jpeg', 0.9);
      onConfirm(file, preview);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-base">Ajustar foto</h3>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Selector de modo de recorte */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 text-center">Recorte</p>
            <div className="flex gap-2 justify-center">
              {CROP_MODES.map(m => (
                <button
                  key={m.key}
                  onClick={() => setCropMode(m.key)}
                  className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    cropMode === m.key
                      ? 'text-white border-transparent shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  style={cropMode === m.key ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview canvas — se adapta al aspect ratio real */}
          <div className="flex justify-center">
            <div
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100 flex items-center justify-center"
              style={{ width: PREVIEW_MAX, height: PREVIEW_MAX }}
            >
              <canvas
                ref={canvasRef}
                className="block max-w-full max-h-full"
                style={{ width: canvasW, height: canvasH }}
              />
            </div>
          </div>

          {/* Controles de rotación */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 text-center">Rotar</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => rotate(-90)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                -90°
              </button>
              <span className="text-sm font-mono text-gray-400 w-12 text-center">{rotation}°</span>
              <button
                onClick={() => rotate(90)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                90°
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Slider de rotación fina */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 text-center">Ajuste fino</p>
            <input
              type="range" min={-180} max={180} value={rotation}
              onChange={e => setRotation(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: primaryColor }}
            />
          </div>

          <button
            onClick={() => setRotation(0)}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Restablecer rotación
          </button>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Usar esta foto
          </button>
        </div>
      </div>
    </div>
  );
}
