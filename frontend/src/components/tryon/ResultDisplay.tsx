'use client';

import React, { useState, useEffect } from 'react';
import { downloadImage } from '@/utils/download';

// ── Imagen con skeleton de carga ──────────────────────────────────────────────
function ResultImage({
  imageUrl,
  productName,
  primaryColor,
  onOpen,
  aspectRatio,
  compact = false,
}: {
  imageUrl: string;
  productName: string;
  primaryColor: string;
  onOpen: () => void;
  aspectRatio?: string;
  compact?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  // Resetear si cambia la URL
  useEffect(() => { setLoaded(false); }, [imageUrl]);

  return (
    <div
      className={`relative group cursor-pointer rounded-2xl overflow-hidden ${compact ? '' : 'mb-5 shadow-md border border-gray-100'} ${aspectRatio ?? ''}`}
      onClick={onOpen}
    >
      {/* Skeleton mientras carga */}
      {!loaded && (
        <div className={`w-full ${aspectRatio ?? 'aspect-[3/4]'} bg-gray-100 animate-pulse flex flex-col items-center justify-center gap-3`}>
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-transparent animate-spin" style={{ borderTopColor: primaryColor }} />
          {!compact && <p className="text-xs text-gray-400 font-medium">Cargando imagen...</p>}
        </div>
      )}
      <img
        src={imageUrl}
        alt={`Prueba virtual de ${productName}`}
        className={`w-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'} ${aspectRatio ? 'object-cover h-full' : 'h-auto'}`}
        onLoad={() => setLoaded(true)}
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
  const [shareOpen, setShareOpen]         = useState(false);
  const [sharing, setSharing]             = useState(false);

  // Feedback state
  const [feedbackOpen, setFeedbackOpen]       = useState(false);
  const [feedbackType, setFeedbackType]       = useState<ErrorTypeValue | ''>('');
  const [feedbackDesc, setFeedbackDesc]       = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent]       = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadImage(
        imageUrl,
        `prueba-virtual-${productName.toLowerCase().replace(/\s+/g, '-')}.jpg`
      );
    } catch {
      // silencioso
    } finally {
      setDownloading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackType || !generationId || !brandSlug) return;
    if (feedbackType === OTHER_VALUE && !feedbackDesc.trim()) return;
    setFeedbackSending(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiBase}/api/pruebalo/${brandSlug}/generation/${generationId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: feedbackType,
          description: feedbackDesc.trim() || undefined,
        }),
      });
      setFeedbackSent(true);
    } catch {
      setFeedbackSent(true);
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

  // ── Compartir ──────────────────────────────────────────────────────────────
  const isPro = brandPlan === 'PRO';
  const shareText = isPro
    ? `¿Qué tal me queda este ${productName} de ${brandName ?? ''}? ¿Me lo llevo?`
    : `¿Qué tal me queda este ${productName} de ${brandName ?? ''}? ¿Me lo llevo?\nImagen generada por Lookitry`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Compartir nativo con imagen adjunta (móvil)
  const handleShareNative = async () => {
    setSharing(true);
    try {
      // Intentar compartir con archivo de imagen (funciona en móvil Chrome/Safari)
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `prueba-virtual-${productName.replace(/\s+/g, '-')}.jpg`, { type: blob.type || 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Así me queda el ${productName}`,
          text: shareText,
          files: [file],
        });
        return;
      }
      // Fallback: compartir solo URL
      if (navigator.share) {
        await navigator.share({ title: `Así me queda el ${productName}`, text: shareText, url: shareUrl });
        return;
      }
    } catch {
      // cancelado o no soportado
    } finally {
      setSharing(false);
    }
    // Si no hay Web Share API, abrir panel de redes
    setShareOpen(v => !v);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener');
  };

  const handleShareX = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://x.com/intent/tweet?text=${text}`, '_blank', 'noopener');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener');
  };

  const handleSharePinterest = () => {
    const url = encodeURIComponent(shareUrl);
    const media = encodeURIComponent(imageUrl);
    const desc = encodeURIComponent(shareText);
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${desc}`, '_blank', 'noopener');
  };

  return (
    <>
      <div className="max-w-md mx-auto">
        {/* Título */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Así te verías</h2>
          <p className="text-sm text-gray-500 mt-1">Con <span className="font-medium text-gray-700">{productName}</span></p>
        </div>

        {/* Imagen generada primero — con skeleton mientras carga */}
        <ResultImage
          imageUrl={imageUrl}
          productName={productName}
          primaryColor={primaryColor}
          onOpen={() => setLightboxOpen(true)}
        />

        {/* Comparación antes/después — debajo de la imagen principal */}
        {selfiePreview && (
          <div className="grid grid-cols-2 gap-3 mt-4 mb-2">
            <div className="relative">
              <img src={selfiePreview} alt="Tu foto" className="w-full aspect-[3/4] object-cover rounded-2xl" />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">Antes</div>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
              <ResultImage
                imageUrl={imageUrl}
                productName={productName}
                primaryColor={primaryColor}
                onOpen={() => setLightboxOpen(true)}
                aspectRatio="aspect-[3/4]"
                compact
              />
              <div className="absolute bottom-2 left-2 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none" style={{ backgroundColor: `${primaryColor}cc` }}>Con el producto</div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col gap-3">

          {/* Descargar */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3.5 rounded-2xl font-semibold text-white shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: primaryColor }}
          >
            {downloading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {downloading ? 'Descargando...' : 'Descargar imagen'}
          </button>

          {/* Compartir nativo — solo visible en móvil */}
          <button
            onClick={handleShareNative}
            disabled={sharing}
            className="md:hidden w-full py-3.5 rounded-2xl font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {sharing ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
            {sharing ? 'Compartiendo...' : 'Compartir imagen'}
          </button>

          {/* Redes sociales — en móvil se ocultan si hay Web Share API, en desktop siempre visibles */}
          <div className="md:block">
            <p className="text-xs text-gray-400 text-center mb-2.5 hidden md:block">Compartir en redes</p>
            <div className="flex items-center justify-center gap-2">
              {/* WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
                aria-label="Compartir en WhatsApp"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-[9px] text-gray-400">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
                aria-label="Compartir en Facebook"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-[9px] text-gray-400">Facebook</span>
              </button>

              {/* X (Twitter) */}
              <button
                onClick={handleShareX}
                className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
                aria-label="Compartir en X"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-[9px] text-gray-400">X</span>
              </button>

              {/* Pinterest */}
              <button
                onClick={handleSharePinterest}
                className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
                aria-label="Compartir en Pinterest"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#E60023">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
                <span className="text-[9px] text-gray-400">Pinterest</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={handleShareLinkedIn}
                className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
                aria-label="Compartir en LinkedIn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-[9px] text-gray-400">LinkedIn</span>
              </button>
            </div>
          </div>

          {/* Tip de foto — orientación para mejores resultados */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Para mejores resultados</p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>Foto frontal con buena iluminación</li>
                <li>Fondo liso o neutro</li>
                <li>Cuerpo completo visible si es ropa</li>
                <li>Sin accesorios que cubran la zona del producto</li>
              </ul>
            </div>
          </div>

          {/* Probar otro producto */}
          <button
            onClick={onReset}
            className="w-full py-3.5 rounded-2xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Probar otro producto
          </button>

          {/* Reportar error */}
          {generationId && brandSlug && !feedbackSent && (
            <button
              onClick={() => setFeedbackOpen(true)}
              className="w-full py-2.5 rounded-2xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-100 transition-all flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Reportar un problema con esta imagen
            </button>
          )}

          {feedbackSent && (
            <p className="text-center text-xs text-green-600 py-1">
              Gracias por tu reporte. Lo usaremos para mejorar.
            </p>
          )}
        </div>
      </div>

      {/* Modal de feedback */}
      {feedbackOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={handleFeedbackClose}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {feedbackSent ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800">Reporte enviado</p>
                <p className="text-sm text-gray-500 mt-1">Gracias por ayudarnos a mejorar.</p>
                <button
                  onClick={handleFeedbackClose}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Reportar problema</p>
                    <p className="text-xs text-gray-400 mt-0.5">Ayúdanos a mejorar la generación</p>
                  </div>
                  <button
                    onClick={handleFeedbackClose}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de problema</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ERROR_TYPES.map(et => (
                      <button
                        key={et.value}
                        onClick={() => setFeedbackType(et.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs text-left transition-all ${
                          feedbackType === et.value
                            ? 'border-transparent text-white font-medium'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                        }`}
                        style={feedbackType === et.value ? { backgroundColor: primaryColor } : {}}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          feedbackType === et.value ? 'border-white bg-white/30' : 'border-gray-300'
                        }`}>
                          {feedbackType === et.value && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        {et.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setFeedbackType(OTHER_VALUE)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs text-left transition-all col-span-2 ${
                        feedbackType === OTHER_VALUE
                          ? 'border-transparent text-white font-medium'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                      }`}
                      style={feedbackType === OTHER_VALUE ? { backgroundColor: primaryColor } : {}}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        feedbackType === OTHER_VALUE ? 'border-white bg-white/30' : 'border-gray-300'
                      }`}>
                        {feedbackType === OTHER_VALUE && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      Otro problema
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {feedbackType === OTHER_VALUE ? 'Describe el problema' : 'Descripción (opcional)'}
                    </p>
                    <textarea
                      value={feedbackDesc}
                      onChange={e => setFeedbackDesc(e.target.value)}
                      placeholder={feedbackType === OTHER_VALUE ? 'Cuéntanos qué salió mal...' : 'Describe brevemente qué salió mal...'}
                      rows={2}
                      maxLength={300}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackType || feedbackSending || (feedbackType === OTHER_VALUE && !feedbackDesc.trim())}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {feedbackSending ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    {feedbackSending ? 'Enviando...' : 'Enviar reporte'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={imageUrl}
            alt={`Prueba virtual de ${productName}`}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={e => { e.stopPropagation(); handleDownload(); }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar
          </button>
        </div>
      )}
    </>
  );
}
