'use client';

import React, { useRef, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { authService } from '@/services/auth.service';

// Icono Upload
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

// ── Upload de logo ────────────────────────────────────────────────────────────
export function LogoUpload({
  currentUrl,
  onUpload,
}: {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('El logo no debe superar 2MB'); return; }
    setError(null);
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = authService.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, filename: file.name }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Error al subir logo'); }
      const data = await res.json();
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message || 'Error al subir el logo');
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <div
        className="relative w-20 h-20 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-colors"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        onClick={() => inputRef.current?.click()}
      >
        {currentUrl ? (
          <>
            <img src={currentUrl} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <UploadIcon className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          uploading ? <Spinner size="sm" /> : <UploadIcon className="w-6 h-6 text-gray-400" />
        )}
      </div>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ── Upload de imagen de portada ───────────────────────────────────────────────
export function CoverImageUpload({
  currentUrl,
  onUpload,
}: {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no debe superar 5MB'); return; }
    setError(null);
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = authService.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, filename: file.name }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Error al subir imagen'); }
      const data = await res.json();
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <div
        className="relative w-full h-32 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-colors"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        onClick={() => inputRef.current?.click()}
      >
        {currentUrl ? (
          <>
            <img src={currentUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium flex items-center gap-2">
                <UploadIcon className="w-4 h-4" /> Cambiar portada
              </span>
            </div>
          </>
        ) : (
          <div className="text-center">
            {uploading ? <Spinner size="sm" /> : (
              <>
                <UploadIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Fondo Hero</p>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
