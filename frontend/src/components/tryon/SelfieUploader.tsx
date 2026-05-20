'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Product } from './templates/types';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, validateImageFile } from '@/utils/imageCompression';
import { ImageEditor } from './ImageEditor';
import { X, Loader2 } from 'lucide-react';

interface SelfieUploaderProps {
  onUpload: (file: File, preview: string) => void;
  onReset?: () => void;
  onSelfieReset?: () => void;
  currentPreview?: string | null;
  selectedProduct?: Product | null;
  primaryColor?: string;
  welcomeMessage?: string;
  privacyNotice?: string;
  textColor?: string;
  mutedColor?: string;
  cardBg?: string;
  cardBorder?: string;
  isDesktop?: boolean;
}

const CHIPS = [
  'Cuerpo completo',
  'Buena iluminacion',
  'Solo tu',
  'Sin manos en los bolsillos',
] as const;

const CheckIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function SelfieUploader({
  onUpload,
  onReset,
  onSelfieReset,
  currentPreview,
  primaryColor = '#FF5C3A',
  textColor = '#1a1a1a',
  mutedColor = '#666666',
}: SelfieUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isDesktop = !mobile && !hasTouch;

    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const hasVideo = devices.some((d) => d.kind === 'videoinput');
          setHasCamera(hasVideo && !isDesktop);
        })
        .catch(() => setHasCamera(false));
    }
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const hasImage = Array.from(e.clipboardData?.items || []).some((item) =>
        item.type.startsWith('image/')
      );
      if (hasImage) {
        e.preventDefault();
        setError('No puedes pegar imagenes directamente. Sube la foto desde tu galeria usando el boton "Subir foto".');
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Archivo invalido');
      return;
    }
    try {
      setCompressing(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const compressed = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        maxSizeMB: 2,
      });
      const objectUrl = URL.createObjectURL(compressed);
      setEditingSrc(objectUrl);
    } catch {
      setError('No pudimos procesar la foto. Intenta con una imagen de la galeria.');
    } finally {
      setCompressing(false);
    }
  }, []);

  const handleEditorConfirm = (file: File, preview: string) => {
    setEditingSrc(null);
    onUpload(file, preview);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropRef.current) setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  return (
    <>
      {editingSrc && (
        <ImageEditor
          src={editingSrc}
          onConfirm={handleEditorConfirm}
          onCancel={() => setEditingSrc(null)}
          primaryColor={primaryColor}
        />
      )}

      <div
        ref={dropRef}
        className="max-w-lg mx-auto space-y-4 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 rounded-[2.5rem] border-2 border-dashed flex items-center justify-center pointer-events-none"
              style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}15` }}
            >
              <p
                className="text-sm font-black uppercase tracking-widest"
                style={{ color: primaryColor }}
              >
                Soltar para subir
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chips de guia */}
        <div className="flex flex-wrap gap-2 justify-center">
          {CHIPS.map((chip) => (
            <div
              key={chip}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <CheckIcon color={primaryColor} />
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: textColor, opacity: 0.7 }}
              >
                {chip}
              </span>
            </div>
          ))}
        </div>

        {/* Zona central: imagen guia o preview */}
        <AnimatePresence mode="wait">
          {compressing ? (
            <motion.div
              key="loading"
              className="py-12 flex flex-col items-center justify-center gap-4 bg-white/5 rounded-[2.5rem] border border-white/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
              <p
                className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse"
                style={{ color: textColor }}
              >
                Optimizando imagen...
              </p>
            </motion.div>
          ) : currentPreview ? (
            <motion.div
              key="preview"
              className="relative group rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 hover:scale-[1.01] w-full max-w-sm mx-auto bg-black/20"
              style={{
                borderColor: primaryColor,
                boxShadow: `0 24px 60px -12px ${primaryColor}40`,
              }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <img
                src={currentPreview}
                alt="Tu selfie"
                className="w-full h-auto max-h-[60vh] object-contain mx-auto block"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <motion.button
                  onClick={onSelfieReset || onReset}
                  className="px-8 py-4 rounded-full bg-white text-black font-black uppercase text-xs tracking-widest shadow-2xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cambiar foto
                </motion.button>
              </div>
              <button
                onClick={onSelfieReset || onReset}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:bg-black/70 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <img
                src="/rebecca_probador.png"
                alt="Ejemplo de pose"
                className="max-h-[60vh] w-auto object-contain mx-auto block"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boton primario */}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 4px 24px ${primaryColor}40`,
          }}
        >
          Subir foto
        </button>

        {/* Link secundario: camara */}
        {hasCamera && !currentPreview && (
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full text-center text-xs underline underline-offset-2 py-1 transition-opacity hover:opacity-80"
            style={{ color: mutedColor }}
          >
            Tomar foto con camara
          </button>
        )}

        {/* Disclaimer legal */}
        <p className="text-[9px] text-center leading-relaxed" style={{ color: mutedColor, opacity: 0.5 }}>
          Solo sube una foto tuya. Aplican nuestra{' '}
          <a
            href="/politica-de-uso"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            Politica de Uso
          </a>{' '}
          y{' '}
          <a
            href="/politicas-privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            Politica de Privacidad
          </a>
          . Las imagenes generadas por IA pueden incluir errores.
        </p>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
            >
              <X className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex-1">{error}</p>
              <button onClick={() => setError(null)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" style={{ color: textColor }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          aria-label="Subir imagen desde galeria"
        />
        <input
          ref={cameraRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          aria-label="Tomar foto con camara"
        />
      </div>
    </>
  );
}
