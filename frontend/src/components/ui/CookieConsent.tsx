'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_status');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent_status', 'accepted');
    setShow(false);
    // Aquí se inyectan dinámicamente scripts de analíticas (ej. GA, Meta Pixel)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cookie_consent_accepted'));
    }
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent_status', 'rejected');
    setShow(false);
    // Aquí se bloquea la propagación de cualquier tracking no-esencial
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cookie_consent_rejected'));
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-[#0a0a0a] border-t border-[#1f1f1f] shadow-2xl safe-m animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex-1 text-[13px] leading-relaxed text-gray-400">
          <p>
            Utilizamos cookies propias y de terceros fundamentales para el funcionamiento del servicio, analíticas de rendimiento y personalización de la experiencia. Operamos en estricto cumplimiento del <strong>GDPR (Europa) y CCPA (USA)</strong>. 
            Al hacer clic en <strong className="text-white">&quot;Aceptar todas&quot;</strong>, consientes el uso de cookies no esenciales. Puedes optar por <strong className="text-white">&quot;Rechazar&quot;</strong> el seguimiento publicitario sin que afecte el uso de nuestras funciones principales. Conoce más en nuestra{' '}
            <Link href="/politicas-privacidad" className="text-[#FF5C3A] hover:text-white transition-colors underline decoration-[#FF5C3A]/30 hover:decoration-white">
              Política de Privacidad
            </Link>.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
          <button
            onClick={handleReject}
            className="flex-1 md:flex-none px-6 py-2.5 text-[14px] font-medium text-gray-300 bg-transparent border border-[#333] hover:text-white hover:border-[#555] rounded-xl transition-colors whitespace-nowrap"
          >
            Rechazar
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-2.5 text-[14px] font-bold text-white bg-[#FF5C3A] hover:bg-[#e04f32] border border-transparent shadow-[0_0_15px_rgba(255,92,58,0.3)] rounded-xl transition-colors whitespace-nowrap"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
