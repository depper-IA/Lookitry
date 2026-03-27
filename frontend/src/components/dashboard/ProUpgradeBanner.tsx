'use client';

import { useEffect, useState } from 'react';

interface ProUpgradeBannerProps {
  brandId: string;
  brandName: string;
  onClose?: () => void;
}

export function ProUpgradeBanner({ brandId, brandName, onClose }: ProUpgradeBannerProps) {
  const [visible, setVisible] = useState(false);
  const storageKey = `pro_upgrade_banner_seen_${brandId}`;

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) setVisible(true);
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-6 border-b text-center"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,92,58,0.12)' }}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#FF5C3A" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>

          <h2
            className="text-xl font-syne font-bold leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Bienvenido al Plan Pro
          </h2>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {brandName}, tu cuenta fue actualizada. Ya tienes acceso a todas las funciones avanzadas.
          </p>
        </div>

        {/* Features */}
        <div className="px-8 py-6">
          <ul className="space-y-2.5 mb-6">
            {[
              'Templates Minimal, Modern y Bold desbloqueados',
              'Texto del botón personalizado',
              'Mensaje de bienvenida en widget',
              'URL del widget personalizable',
              'Hasta 15 productos activos',
              '1.200 generaciones/mes',
              'Soporte prioritario',
            ].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,92,58,0.12)' }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#FF5C3A" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={dismiss}
            className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-88 active:scale-95"
            style={{ background: '#FF5C3A' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Comenzar a explorar
          </button>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          aria-label="Cerrar"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border-color)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
