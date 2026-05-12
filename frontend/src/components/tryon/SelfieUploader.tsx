'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Product } from './templates/types';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, validateImageFile } from '@/utils/imageCompression';
import { ImageEditor } from './ImageEditor';
import { Camera, Image as ImageIcon, Lightbulb, User, Eye, X, Loader2, ChevronRight, Upload, Clipboard } from 'lucide-react';

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

const TIPS = [
  { tip: 'Buena luz', icon: Lightbulb, color: '#f59e0b' },
  { tip: 'Foto frontal', icon: User, color: null },
  { tip: 'Cara visible', icon: Eye, color: '#10b981' },
] as const;

export function SelfieUploader({ 
  onUpload, 
  onReset,
  onSelfieReset,
  currentPreview,
  selectedProduct,
  primaryColor = '#FF5C3A', 
  privacyNotice, 
  textColor = '#1a1a1a', 
  mutedColor = '#666666',
  cardBg,
  cardBorder,
  isDesktop: isDesktopProp
}: SelfieUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [isDesktopState, setIsDesktopState] = useState<boolean>(false);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const hasTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Si tiene touch (móvil, tablet, laptop con touch), no lo consideramos "escritorio puro"
    setIsDesktopState(!mobile && !hasTouch);

    if (navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setHasCamera(videoDevices.length > 0);
        })
        .catch(() => setHasCamera(false));
    }
  }, []);

  const isDesktop = isDesktopProp !== undefined ? isDesktopProp : isDesktopState;
  
  // Mostrar cámara si tiene cámara Y (no es escritorio O es laptop/móvil detectado por touch)
  const showCamera = hasCamera && !isDesktop;

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const hasImage = Array.from(e.clipboardData?.items || []).some(
        (item) => item.type.startsWith('image/')
      );
      if (hasImage) {
        e.preventDefault();
        setError('No puedes pegar imágenes directamente. Sube la foto desde tu galería usando el botón "Elegir de galería".');
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) { 
      setError(validation.error || 'Archivo inválido'); 
      return; 
    }
    
    try {
      setCompressing(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const compressed = await compressImage(file, { 
        maxWidth: 1600,
        maxHeight: 1600, 
        quality: 0.8, 
        maxSizeMB: 2 
      });

      const objectUrl = URL.createObjectURL(compressed);
      setEditingSrc(objectUrl);
      setCompressing(false);
    } catch (err: any) {
      console.error('[SelfieUploader] Error:', err);
      setError('No pudimos procesar la foto. Intenta con una imagen de la galería.');
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
    if (e.currentTarget === dropRef.current) {
      setDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

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
        className="max-w-lg mx-auto space-y-6 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 rounded-[2.5rem] border-2 border-dashed flex items-center justify-center pointer-events-none"
              style={{ 
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}15`
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 animate-bounce" style={{ color: primaryColor }} />
                <p className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                  Soltar para subir
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {compressing ? (
              <motion.div
                key="loading"
                className="py-12 flex flex-col items-center justify-center gap-4 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <div className="relative">
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
                  <div className="absolute inset-0 blur-xl opacity-50" style={{ backgroundColor: primaryColor }} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse" style={{ color: textColor }}>
                  Optimizando imagen...
                </p>
              </motion.div>
            ) : currentPreview ? (
              <motion.div
                key="preview"
                className="relative group rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 hover:scale-[1.01] w-full max-w-sm mx-auto bg-black/20"
                style={{ 
                  borderColor: primaryColor,
                  boxShadow: `0 24px 60px -12px ${primaryColor}40`
                }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <img 
                  src={currentPreview} 
                  alt="Tu selfie" 
                  className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] object-contain mx-auto block"
                />


                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <motion.button
                    onClick={onSelfieReset || onReset}
                    className="px-8 py-4 rounded-full bg-white text-black font-black uppercase text-xs tracking-widest shadow-2xl transition-all duration-300"
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
                key="actions"
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {showCamera && (
                    <button
                      onClick={() => cameraRef.current?.click()}
                      className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative p-4 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform duration-300">
                        <Camera className="w-8 h-8" style={{ color: primaryColor }} />
                      </div>
                      <div className="relative text-center">
                        <span className="block text-xs font-black uppercase tracking-[0.2em] mb-1" style={{ color: textColor }}>Tomar foto</span>
                        <span className="block text-[9px] font-medium opacity-50 uppercase tracking-widest" style={{ color: textColor }}>Usa tu cámara</span>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => inputRef.current?.click()}
                    className={`group relative flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden ${!showCamera ? 'sm:col-span-2' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-4 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon className="w-8 h-8" style={{ color: textColor }} />
                    </div>
                    <div className="relative text-center">
                      <span className="block text-xs font-black uppercase tracking-[0.2em] mb-1" style={{ color: textColor }}>Elegir de galería</span>
                      <span className="block text-[9px] font-medium opacity-50 uppercase tracking-widest" style={{ color: textColor }}>Sube tu imagen</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recomendaciones visuales compactas */}
        <div className="flex items-center justify-center gap-4 px-2">
          {TIPS.map(({ tip, icon: Icon, color }) => (
            <div key={tip} className="flex items-center gap-2 group">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors border"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.08)'
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: color || primaryColor }} strokeWidth={2.5} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: textColor }}>
                {tip}
              </span>
            </div>
          ))}
        </div>

        {/* Footer info sutil */}
        <div className="pt-2 text-center space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: mutedColor }}>
            JPG · PNG · WEBP (MÁX. 5MB)
          </p>
          {privacyNotice && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500/80">
                {privacyNotice}
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
            >
              <X className="w-4 h-4 text-red-500" />
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex-1">{error}</p>
              <button onClick={() => setError(null)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" style={{ color: textColor }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} aria-label="Subir imagen desde galería" />
        <input ref={cameraRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" capture="user" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} aria-label="Tomar foto con cámara" />
      </div>
    </>
  );
}
