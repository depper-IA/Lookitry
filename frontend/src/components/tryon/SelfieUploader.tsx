'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, validateImageFile } from '@/utils/imageCompression';
import { ImageEditor } from './ImageEditor';
import { Camera, Image as ImageIcon, Lightbulb, User, Eye, X, Loader2, ChevronRight, Upload } from 'lucide-react';

interface SelfieUploaderProps {
  onUpload: (file: File, preview: string) => void;
  primaryColor?: string;
  welcomeMessage?: string; // Mantener por compatibilidad de props, pero no usar para títulos duplicativos
  privacyNotice?: string;
  textColor?: string;
  mutedColor?: string;
  cardBg?: string;
  cardBorder?: string;
}

const TIPS = [
  { tip: 'Buena luz', icon: Lightbulb, color: '#f59e0b' },
  { tip: 'Foto frontal', icon: User, color: null },
  { tip: 'Cara visible', icon: Eye, color: '#10b981' },
] as const;

export function SelfieUploader({ 
  onUpload, 
  primaryColor = '#FF5C3A', 
  privacyNotice, 
  textColor = '#1a1a1a', 
  mutedColor = '#666666',
  cardBg,
  cardBorder
}: SelfieUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setCameraError(false);
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

  const handleCameraClick = useCallback(() => {
    if (!cameraRef.current) return;
    setCameraError(false);
    cameraRef.current.click();
  }, []);

  // Drag-and-drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the drop zone entirely
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
        className="max-w-md mx-auto space-y-6 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay feedback */}
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

        {/* Decisión principal: Cámara vs Galería */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {compressing ? (
              <motion.div 
                key="loading"
                className="py-12 flex flex-col items-center justify-center gap-4 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="relative">
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
                  <div className="absolute inset-0 blur-xl opacity-50" style={{ backgroundColor: primaryColor }} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse" style={{ color: textColor }}>
                  Optimizando imagen...
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="actions"
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* BOTÓN CÁMARA (Acción Principal) */}
                <button
                  onClick={handleCameraClick}
                  className="w-full group relative overflow-hidden flex items-center gap-4 p-5 rounded-[2.5rem] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ 
                    backgroundColor: primaryColor,
                    boxShadow: `0 20px 40px -12px ${primaryColor}40`
                  }}
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30 backdrop-blur-md relative z-10 transition-transform group-hover:rotate-12">
                    <Camera className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  
                  <div className="text-left relative z-10">
                    <p className="text-lg font-black italic uppercase leading-none text-white tracking-tight">Tomar foto ahora</p>
                    <p className="text-[10px] mt-1 text-white/70 font-bold uppercase tracking-widest">Usar cámara frontal</p>
                  </div>

                  <ChevronRight className="ml-auto w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform relative z-10" />
                </button>

                {/* BOTÓN GALERÍA (Acción Secundaria) */}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-full group flex items-center gap-4 p-5 rounded-[2.5rem] border-2 transition-all duration-500 hover:bg-white/5 active:scale-[0.98]"
                  style={{ 
                    borderColor: cardBorder || 'rgba(255,255,255,0.1)',
                    backgroundColor: cardBg || 'transparent'
                  }}
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 transition-colors group-hover:bg-white/10">
                    <ImageIcon className="w-6 h-6" style={{ color: textColor }} strokeWidth={2} />
                  </div>

                  <div className="text-left">
                    <p className="text-base font-black italic uppercase leading-none tracking-tight" style={{ color: textColor }}>Elegir de galería</p>
                    <p className="text-[10px] mt-1 font-bold uppercase tracking-widest" style={{ color: mutedColor }}>Álbum de fotos</p>
                  </div>

                  <ChevronRight className="ml-auto w-5 h-5 opacity-20 group-hover:translate-x-1 transition-transform" style={{ color: textColor }} />
                </button>
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

        <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input ref={cameraRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" capture="user" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </>
  );
}
