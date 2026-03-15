'use client';

import { useEffect, useState } from 'react';

interface ProUpgradeBannerProps {
  brandName: string;
}

export function ProUpgradeBanner({ brandName }: ProUpgradeBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar solo una vez por sesión
    const dismissed = sessionStorage.getItem('pro_upgrade_banner_dismissed');
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('pro_upgrade_banner_dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">

        {/* Fondo degradado */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-8 pt-10 pb-8 text-center">

          {/* Icono estrella SVG */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white leading-tight">
            ¡Bienvenido al Plan Pro!
          </h2>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            {brandName}, tu cuenta ha sido actualizada. Ahora tienes acceso a todas las funciones avanzadas.
          </p>
        </div>

        {/* Contenido */}
        <div className="bg-white px-8 py-6">
          <ul className="space-y-3 mb-6">
            {[
              { label: 'Templates Minimal, Modern y Bold desbloqueados' },
              { label: 'Texto del botón personalizado' },
              { label: 'Mensaje de bienvenida en widget' },
              { label: 'URL del widget personalizable' },
              { label: 'Hasta 15 productos activos' },
              { label: '1.200 generaciones/mes' },
              { label: 'Soporte prioritario' },
            ].map(f => (
              <li key={f.label} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {f.label}
              </li>
            ))}
          </ul>

          <button
            onClick={dismiss}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Comenzar a explorar
          </button>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
