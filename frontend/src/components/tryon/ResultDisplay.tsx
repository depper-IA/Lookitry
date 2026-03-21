'use client';

import React, { useState, useEffect } from 'react';
import { downloadImage } from '@/utils/download';

// ── Marca de agua dinámica (Visual Overlay) ──────────────────────────────────
function Watermark({ plan }: { plan?: string }) {
  if (plan !== 'BASIC' && plan !== 'TRIAL') return null;

  if (plan === 'BASIC') {
    return (
      <div className="absolute bottom-[3.5%] right-[3.5%] w-[12%] pointer-events-none select-none z-10 opacity-70">
        <img src="/watermark-basic.webp" alt="Lookitry Basic" className="w-full h-auto drop-shadow-md" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
      <div className="w-[45%] opacity-50">
        <img src="/watermark-trial.webp" alt="Lookitry Trial" className="w-full h-auto drop-shadow-lg" />
      </div>
    </div>
  );
}

// ── Imagen con skeleton de carga ──────────────────────────────────────────────
function ResultImage({
  imageUrl,
  productName,
  primaryColor,
  onOpen,
  aspectRatio,
  compact = false,
  brandPlan,
}: {
  imageUrl: string;
  productName: string;
  primaryColor: string;
  onOpen: () => void;
  aspectRatio?: string;
  compact?: boolean;
  brandPlan?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(false); }, [imageUrl]);

  return (
    <div
      className={`relative group cursor-pointer rounded-2xl overflow-hidden ${compact ? '' : 'mb-5 shadow-md border border-gray-100'} ${aspectRatio ?? ''}`}
      onClick={onOpen}
    >
      {!loaded && (
        <div className={`w-full ${aspectRatio ?? 'aspect-[3/4]'} bg-gray-100 animate-pulse flex flex-col items-center justify-center gap-3`}>
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-transparent animate-spin" style={{ borderTopColor: primaryColor }} />
          {!compact && <p className="text-xs text-gray-400 font-medium">Cargando imagen...</p>}
        </div>
      )}
      
      {loaded && <Watermark plan={brandPlan} />}

      <img
        src={imageUrl}
        alt={`Prueba virtual de ${productName}`}
        className={`w-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'} ${aspectRatio ? 'object-cover h-full' : 'h-auto'}`}
        onLoad={() => setLoaded(true)}
        crossOrigin="anonymous"
      />
      {loaded && !compact && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

const ERROR_TYPES = [
  { value: 'wrong_clothing_removed', label: 'Ropa eliminada' },
  { value: 'wrong_clothing_kept',    label: 'Ropa conservada' },
  { value: 'body_distortion',        label: 'Distorsión' },
  { value: 'color_wrong',            label: 'Color incorrecto' },
] as const;

const OTHER_VALUE = 'other';
type ErrorTypeValue = typeof ERROR_TYPES[number]['value'] | 'other';

interface ResultDisplayProps {
  imageUrl: string;
  productName: string;
  selfiePreview?: string | null;
  onReset: () => void;
  primaryColor: string;
  generationId?: string;
  brandSlug?: string;
  brandName?: string;
  brandPlan?: string;
}

export function ResultDisplay({
  imageUrl,
  productName,
  selfiePreview,
  onReset,
  primaryColor,
  generationId,
  brandSlug,
  brandName,
  brandPlan,
}: ResultDisplayProps) {
  const [lightboxOpen, setLightboxOpen]   = useState(false);
  const [downloading, setDownloading]     = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [sharing, setSharing]             = useState(false);
  const [shareError, setShareError]       = useState<string | null>(null);

  // Feedback state
  const [feedbackOpen, setFeedbackOpen]       = useState(false);
  const [feedbackType, setFeedbackType]       = useState<ErrorTypeValue | ''>('');
  const [feedbackDesc, setFeedbackDesc]       = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent]       = useState(false);

  // ── Aplicar marca de agua física a la imagen para descarga/compartir ──────────
  const applyWatermark = async (srcUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Usar dimensiones naturales para no perder calidad
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
            // BASIC: Esquina inferior derecha (bot-right), 12% width, opacidad 70%
            const wmWidth = canvas.width * 0.12;
            const wmHeight = (wmImg.naturalHeight / wmImg.naturalWidth) * wmWidth;
            const paddingX = canvas.width * 0.035;
            const paddingY = canvas.height * 0.035;
            ctx.globalAlpha = 0.7;
            ctx.drawImage(wmImg, canvas.width - wmWidth - paddingX, canvas.height - wmHeight - paddingY, wmWidth, wmHeight);
          } else if (brandPlan === 'TRIAL') {
            // TRIAL: Centro, 45% width, opacidad 50%
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

  // Fix #3: si hay error CORS al aplicar watermark, NO descargamos sin él
  // (evita que usuarios en TRIAL/BASIC se salten la protección)
  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const watermarkedUrl = await applyWatermark(imageUrl);
      const link = document.createElement('a');
      link.href = watermarkedUrl;
      link.download = `prueba-virtual-${productName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error descargando imagen:', err);
      // Fix #3: no fallback a descarga sin watermark
      setDownloadError('No se pudo descargar la imagen. Por favor intenta de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  // Fix #5: reemplaza alert() nativo con estado shareError renderizado en la UI
  const handleShare = async () => {
    setShareError(null);
    if (!navigator.share) {
      setShareError('Tu navegador no soporta la función de compartir. Usa los botones de WhatsApp o Facebook.');
      return;
    }

    setSharing(true);
    try {
      const watermarkedUrl = await applyWatermark(imageUrl);
      const res = await fetch(watermarkedUrl);
      const blob = await res.blob();
      const file = new File([blob], 'prueba-virtual.jpg', { type: 'image/jpeg' });

      await navigator.share({
        title: `Mi prueba virtual en ${brandName ?? 'Lookitry'}`,
        text: `Mira cómo me queda este producto: ${productName}`,
        files: [file],
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    } finally {
      setSharing(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackType || !generationId || !brandSlug) return;
    if (feedbackType === OTHER_VALUE && !feedbackDesc.trim()) return;
    setFeedbackSending(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiBase}/api/pruebalo/${brandSlug}/generation/${generationId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: feedbackType,
          description: feedbackDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        setFeedbackSent(true);
        setTimeout(() => { handleFeedbackClose(); }, 2500);
      } else {
        throw new Error('Error al enviar');
      }
    } catch (err) {
      console.error('Error enviando feedback:', err);
      // Fix #5: sin alert() — si falla el envío cerramos el modal y el usuario puede reintentar
      handleFeedbackClose();
    } finally {
      setFeedbackSending(false);
    }
  };

  const handleFeedbackClose = () => {
    setFeedbackOpen(false);
    setFeedbackType('');
    setFeedbackDesc('');
    setFeedbackSent(false);
  };

  const shareText = `Mira cómo me queda este ${productName} de ${brandName ?? ''}. Generado por Lookitry AI.`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener');
  };

  return (
    <>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-4 md:mb-5">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-2 md:mb-3">
            <svg className="w-6 h-6 md:w-7 md:h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase italic tracking-tight">¡Te ves genial!</h2>
          <p className="text-xs md:text-sm text-gray-400 mt-0.5 font-medium uppercase tracking-widest">Resultado con <span className="font-bold text-gray-700">{productName}</span></p>
        </div>

        <div className="mb-4">
          <ResultImage
            imageUrl={imageUrl}
            productName={productName}
            primaryColor={primaryColor}
            onOpen={() => setLightboxOpen(true)}
            brandPlan={brandPlan}
          />
        </div>

        {selfiePreview && (
          <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4">
            <div className="relative">
              <img src={selfiePreview} alt="Tu foto" className="w-full aspect-[3/4] object-cover rounded-xl md:rounded-2xl shadow-sm border border-gray-100" />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[8px] md:text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Antes</div>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
              <div className="rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-full">
                <ResultImage
                  imageUrl={imageUrl}
                  productName={productName}
                  primaryColor={primaryColor}
                  onOpen={() => setLightboxOpen(true)}
                  aspectRatio="aspect-[3/4]"
                  compact
                  brandPlan={brandPlan}
                />
              </div>
              <div className="absolute bottom-2 left-2 text-white text-[8px] md:text-[10px] px-2 py-0.5 rounded-full pointer-events-none uppercase font-black tracking-widest" style={{ backgroundColor: `${primaryColor}cc` }}>Después</div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 md:gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3 md:py-3.5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest text-white shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: primaryColor }}
          >
            {downloading ? '...' : (
              <>
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar imagen
              </>
            )}
          </button>
          
          {downloadError && (
            <p className="text-[10px] text-red-500 text-center font-bold uppercase">{downloadError}</p>
          )}

          <button
            onClick={handleShare}
            disabled={sharing}
            className="md:hidden w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-gray-100 text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {sharing ? '...' : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Compartir
              </>
            )}
          </button>

          {shareError && (
            <p className="text-[10px] text-orange-500 text-center font-bold uppercase">{shareError}</p>
          )}

          <button
            onClick={onReset}
            className="w-full py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest text-gray-400 bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Probar otro
          </button>

          {generationId && brandSlug && (
            <button
              onClick={() => setFeedbackOpen(true)}
              className={`w-full py-2 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${feedbackSent ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-500'}`}
            >
              {feedbackSent ? (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Reporte enviado
                </>
              ) : '¿Problemas con la imagen? Reportar'}
            </button>
          )}
        </div>
      </div>

      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={handleFeedbackClose}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {!feedbackSent ? (
              <>
                <h3 className="font-bold text-xl text-gray-900 mb-2">¿Algo no salió bien?</h3>
                <p className="text-sm text-gray-500 mb-5">Cuéntanos qué falló para que nuestra IA aprenda a hacerlo mejor.</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {ERROR_TYPES.map(et => (
                    <button key={et.value} onClick={() => setFeedbackType(et.value)} className={`p-3 rounded-2xl border text-sm font-medium transition-all ${feedbackType === et.value ? 'bg-orange-50 border-orange-300 text-orange-700 ring-2 ring-orange-100' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 text-left'}`}>
                      {et.label}
                    </button>
                  ))}
                  <button onClick={() => setFeedbackType(OTHER_VALUE)} className={`col-span-2 p-3 rounded-2xl border text-sm font-medium transition-all ${feedbackType === OTHER_VALUE ? 'bg-orange-50 border-orange-300 text-orange-700 ring-2 ring-orange-100' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 text-left'}`}>
                    Otro detalle
                  </button>
                </div>
                {feedbackType === OTHER_VALUE && (
                  <textarea value={feedbackDesc} onChange={e => setFeedbackDesc(e.target.value)} placeholder="Dinos qué viste mal..." className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-4 h-28 text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all" />
                )}
                <div className="flex flex-col gap-2">
                  <button onClick={handleFeedbackSubmit} disabled={feedbackSending || (!feedbackType) || (feedbackType === OTHER_VALUE && !feedbackDesc.trim())} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-200 disabled:opacity-50 active:scale-95 transition-all">
                    {feedbackSending ? 'Enviando reporte...' : 'Enviar reporte'}
                  </button>
                  <button onClick={handleFeedbackClose} className="w-full py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border-2 border-green-100">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">¡Reporte enviado!</h3>
                <p className="text-sm text-gray-500 px-4">Gracias por ayudarnos a mejorar Lookitry AI. Analizaremos tu caso de inmediato.</p>
                <button onClick={handleFeedbackClose} className="mt-8 w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all">
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setLightboxOpen(false)}>
          <img src={imageUrl} alt={productName} className="max-w-full max-h-[90vh] object-contain rounded-2xl" />
          <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
