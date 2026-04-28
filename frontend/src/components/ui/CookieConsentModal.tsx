'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

export function CookieConsentModal() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('cookie_consent_status');
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent_status', 'accepted');
    setShow(false);
    window.dispatchEvent(new Event('cookie_consent_accepted'));
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent_status', 'rejected');
    setShow(false);
    window.dispatchEvent(new Event('cookie_consent_rejected'));
  };

  const handleCustomize = () => {
    localStorage.setItem('cookie_consent_status', 'customized');
    setShow(false);
    window.dispatchEvent(new Event('cookie_consent_customized'));
  };

  if (!mounted) return null;
  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-6 sm:left-6 sm:max-w-[320px] w-auto sm:w-full">
      <div className="relative rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5 shadow-xl shadow-black/30 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#FF5C3A]/10 border border-[#FF5C3A]/20">
            <Cookie className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF5C3A]" strokeWidth={1.5} />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">
            Configuración de cookies
          </h3>
        </div>

        {/* Description - Compact */}
        <p className="text-[11px] sm:text-[12px] text-gray-400 leading-relaxed mb-3 sm:mb-4">
          Utilizamos cookies esenciales, de análisis y marketing. Al continuar, aceptas nuestra{' '}
          <Link href="/cookies" className="text-[#FF5C3A] hover:text-white transition-colors underline decoration-[#FF5C3A]/30 hover:decoration-white">
            política de cookies
          </Link>
          .
        </p>

        {/* Buttons - Horizontal on mobile */}
        <div className="flex flex-row gap-2 sm:flex-col sm:gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-[13px] font-semibold text-white bg-[#FF5C3A] hover:bg-[#e04f32] rounded-lg sm:rounded-xl transition-colors shadow-[0_0_10px_rgba(255,92,58,0.2)]"
          >
            Aceptar
          </button>
          <button
            onClick={handleReject}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-[13px] font-medium text-gray-300 bg-transparent border border-white/10 hover:border-white/20 hover:text-white rounded-lg sm:rounded-xl transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={handleCustomize}
            className="px-2 py-2 text-[11px] sm:text-[12px] font-medium text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-4 sm:hidden"
          >
            Más
          </button>
        </div>

        {/* Legal Links - Hidden on mobile, visible on sm+ */}
        <div className="hidden sm:flex items-center justify-center gap-3 mt-3 sm:mt-4 pt-3 border-t border-white/5">
          <Link href="/cookies" className="text-[10px] sm:text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
            Cookies
          </Link>
          <span className="text-gray-700">•</span>
          <Link href="/politicas-privacidad" className="text-[10px] sm:text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
            Privacidad
          </Link>
          <span className="text-gray-700">•</span>
          <Link href="/terminos" className="text-[10px] sm:text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
            Términos
          </Link>
        </div>
      </div>
    </div>
  );
}
