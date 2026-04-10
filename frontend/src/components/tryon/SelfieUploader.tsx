'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, validateImageFile } from '@/utils/imageCompression';
import { ImageEditor } from './ImageEditor';
import { Camera, Image as ImageIcon, Lightbulb, User, Eye, X, Loader2 } from 'lucide-react';

interface SelfieUploaderProps {
  onUpload: (file: File, preview: string) => void;
  primaryColor?: string;
  welcomeMessage?: string;
  privacyNotice?: string;
  textColor?: string;
  mutedColor?: string;
  cardBg?: string;
  cardBorder?: string;
}

const TIPS = [
  { tip: 'Buena luz', icon: Lightbulb, color: '#f59e0b' },
  { tip: 'Foto frontal', icon: User, color: null }, // uses primary
  { tip: 'Cara visible', icon: Eye, color: '#10b981' },
] as const;

export function SelfieUploader({ 
  onUpload, 
  primaryColor = '#FF5C3A', 
  welcomeMessage, 
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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); 
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleCameraClick = useCallback(() => {
    if (!cameraRef.current) return;
    setCameraError(false);
    cameraRef.current.click();
  }, []);

  // Entrance animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const }
    }
  };

  const buttonVariants = {
    rest: { scale: 1 },
    tap: { scale: 0.97 },
    hover: { scale: 1.02 }
  };

  const dropZoneVariants = {
    rest: { scale: 1, opacity: 1 },
    dragActive: { 
      scale: 1.02, 
      opacity: 1,
      transition: { duration: 0.2 }
    }
  };

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

      <motion.div 
        className="max-w-md mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Título */}
        <motion.div className="text-center mb-4 md:mb-6" layout>
          <motion.div 
            className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-3 border shadow-sm"
            style={{ backgroundColor: cardBg || '#f3f4f6', borderColor: cardBorder || 'transparent' }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Camera className="w-6 h-6 md:w-8 md:h-8 text-gray-400" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tight" style={{ color: textColor }}>Sube tu foto</h2>
          {welcomeMessage ? (
            <p className="text-xs md:text-sm mt-0.5 font-bold uppercase tracking-widest" style={{ color: primaryColor }}>{welcomeMessage}</p>
          ) : (
            <p className="text-xs md:text-sm mt-0.5 font-medium" style={{ color: mutedColor }}>Una foto frontal da mejores resultados</p>
          )}
        </motion.div>

        {/* Zona de drop — solo en desktop */}
        {!isMobile && (
          <motion.div
            ref={dropRef}
            className="relative border-2 border-dashed rounded-3xl p-8 md:p-10 text-center cursor-pointer overflow-hidden"
            style={dragActive 
              ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } 
              : { borderColor: cardBorder || '#e5e7eb', backgroundColor: cardBg || '#ffffff' }
            }
            variants={dropZoneVariants}
            initial="rest"
            animate={dragActive ? 'dragActive' : 'rest'}
            onDragEnter={handleDrag} 
            onDragLeave={handleDrag} 
            onDragOver={handleDrag} 
            onDrop={handleDrop}
            onClick={() => !compressing && inputRef.current?.click()}
          >
            <AnimatePresence mode="wait">
              {compressing ? (
                <motion.div 
                  key="compressing"
                  className="flex flex-col items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-10 h-10 border-4 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ borderColor: mutedColor, borderTopColor: primaryColor }}
                  />
                  <p className="text-sm font-medium" style={{ color: mutedColor }}>Optimizando imagen...</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="upload"
                  className="flex flex-col items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div 
                    className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${mutedColor}15` }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <ImageIcon className="w-7 h-7 md:w-8 md:h-8" style={{ color: mutedColor }} strokeWidth={1.5} />
                  </motion.div>
                  <p className="font-black uppercase tracking-tight italic" style={{ color: textColor }}>Arrastra tu foto aquí</p>
                  <p className="text-xs mt-1 uppercase font-bold tracking-widest" style={{ color: mutedColor }}>o haz clic para seleccionar</p>
                  <motion.div 
                    className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-xl"
                    style={{ backgroundColor: primaryColor }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ImageIcon className="w-3.5 h-3.5" strokeWidth={3} />
                    Seleccionar foto
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Botones móvil — galería + cámara */}
        {isMobile && (
          <motion.div 
            className="space-y-2.5 md:space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {compressing ? (
                <motion.div 
                  key="compressing-mobile"
                  className="flex flex-col items-center gap-3 py-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <motion.div
                    className="w-12 h-12 border-4 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ borderColor: mutedColor, borderTopColor: primaryColor }}
                  />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: mutedColor }}>Optimizando imagen...</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="buttons-mobile"
                  className="space-y-2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Botón cámara */}
                  <motion.button
                    type="button"
                    onClick={handleCameraClick}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all min-h-[60px]"
                    style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}
                    variants={buttonVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    aria-label="Tomar foto con la cámara"
                  >
                    <motion.div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Camera className="w-5 h-5 text-white" strokeWidth={2} />
                    </motion.div>
                    <div>
                      <p className="font-black uppercase italic leading-none text-sm" style={{ color: textColor }}>Tomar foto ahora</p>
                      <p className="text-[10px] mt-0.5 uppercase font-bold tracking-widest" style={{ color: mutedColor }}>Usar cámara del celular</p>
                    </div>
                  </motion.button>

                  {/* Botón galería */}
                  <motion.button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all min-h-[60px]"
                    style={{ borderColor: cardBorder || '#e5e5e5', backgroundColor: cardBg ? `${cardBg}80` : '#f9fafb' }}
                    variants={buttonVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    aria-label="Seleccionar foto de la galería"
                  >
                    <motion.div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${mutedColor}15` }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ImageIcon className="w-5 h-5" style={{ color: mutedColor }} strokeWidth={2} />
                    </motion.div>
                    <div>
                      <p className="font-black uppercase italic leading-none text-sm" style={{ color: textColor }}>Elegir de galería</p>
                      <p className="text-[10px] mt-0.5 uppercase font-bold tracking-widest" style={{ color: mutedColor }}>Seleccionar foto existente</p>
                    </div>
                  </motion.button>

                  {/* Camera error fallback */}
                  {cameraError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-2"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 font-medium">
                        No pudimos acceder a la cámara. Puedes seleccionar una foto de tu galería.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Tips - responsive grid */}
        <motion.div 
          className="mt-3 md:mt-4 grid grid-cols-3 gap-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {TIPS.map(({ tip, icon: Icon, color }, index) => (
            <motion.div
              key={tip}
              className="rounded-xl p-2 md:p-2.5 border shadow-sm"
              style={{ backgroundColor: cardBg || 'rgba(0,0,0,0.02)', borderColor: cardBorder || 'rgba(0,0,0,0.05)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <motion.div 
                className="mb-1"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Icon className="w-4 h-4 mx-auto" style={{ color: color || primaryColor }} strokeWidth={2} />
              </motion.div>
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-tighter leading-tight" style={{ color: mutedColor }}>{tip}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p 
          className="text-center text-[9px] md:text-xs mt-3 font-black uppercase tracking-[0.2em]"
          style={{ color: mutedColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          JPG, PNG o WEBP · Máx. 5MB
        </motion.p>
        
        {privacyNotice && (
          <motion.p 
            className="text-center text-[8px] md:text-[9px] mt-2 font-medium italic"
            style={{ color: mutedColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {privacyNotice}
          </motion.p>
        )}

        {/* Error message with animation */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-[11px] text-red-500 font-bold leading-tight uppercase flex-1">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                  aria-label="Cerrar mensaje de error"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input 
          ref={inputRef} 
          type="file" 
          className="hidden" 
          accept="image/jpeg,image/png,image/webp"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} 
        />
        <input 
          ref={cameraRef} 
          type="file" 
          className="hidden" 
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          onChange={e => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
          onError={() => setCameraError(true)}
        />
      </motion.div>
    </>
  );
}
