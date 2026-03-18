'use client';

import { useState, useRef, useEffect } from 'react';
import { compressImage, validateImageFile } from '@/utils/imageCompression';
import { ImageEditor } from './ImageEditor';

interface SelfieUploaderProps {
  onUpload: (file: File, preview: string) => void;
  primaryColor?: string;
  welcomeMessage?: string;
}

export function SelfieUploader({ onUpload, primaryColor = '#6366f1', welcomeMessage }: SelfieUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) { setError(validation.error || 'Archivo inválido'); return; }
    try {
      setCompressing(true);
      const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.9, maxSizeMB: 5 });
      const reader = new FileReader();
      reader.onload = (e) => setEditingSrc(e.target?.result as string);
      reader.readAsDataURL(compressed);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la imagen');
    } finally {
      setCompressing(false);
    }
  };

  const handleEditorConfirm = (file: File, preview: string) => {
    setEditingSrc(null);
    onUpload(file, preview);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
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

      <div className="max-w-md mx-auto">
        {/* Título */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Sube tu foto</h2>
          {welcomeMessage ? (
            <p className="text-sm mt-1" style={{ color: primaryColor }}>{welcomeMessage}</p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Una foto frontal con buena iluminación da mejores resultados</p>
          )}
        </div>

        {/* Zona de drop — solo en desktop */}
        {!isMobile && (
          <div
            className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragActive ? 'scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
            style={dragActive ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => !compressing && inputRef.current?.click()}
          >
            {compressing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: primaryColor }} />
                <p className="text-sm text-gray-500">Optimizando imagen...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700">Arrastra tu foto aquí</p>
                <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Seleccionar foto
                </div>
              </>
            )}
          </div>
        )}

        {/* Botones móvil — galería + cámara */}
        {isMobile && (
          <div className="space-y-3">
            {compressing ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: primaryColor }} />
                <p className="text-sm text-gray-500">Optimizando imagen...</p>
              </div>
            ) : (
              <>
                {/* Botón cámara */}
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98]"
                  style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Tomar foto ahora</p>
                    <p className="text-xs text-gray-500 mt-0.5">Abre la cámara del dispositivo</p>
                  </div>
                </button>

                {/* Botón galería */}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 bg-white text-left transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Elegir de galería</p>
                    <p className="text-xs text-gray-500 mt-0.5">Selecciona una foto existente</p>
                  </div>
                </button>
              </>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {([
            { tip: 'Buena luz', icon: <svg className="w-4 h-4 mx-auto text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg> },
            { tip: 'Foto frontal', icon: <svg className="w-4 h-4 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> },
            { tip: 'Cara visible', icon: <svg className="w-4 h-4 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
          ] as const).map(({ tip, icon }) => (
            <div key={tip} className="bg-white rounded-xl p-2 border border-gray-100">
              <div className="mb-0.5">{icon}</div>
              <p className="text-xs text-gray-500 mt-0.5">{tip}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">JPG, PNG o WEBP · Máx. 5MB</p>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {/* Input exclusivo para cámara (capture="user" = cámara frontal) */}
        <input ref={cameraRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp"
          capture="user"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </>
  );
}
