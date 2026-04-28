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
      // Small delay to avoid layout shift
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
    <div className="fixed bottom-6 left-6 z-50 max-w-[320px] w-full">
      <div className="relative rounded-2xl border border-white/10 bg-[#141414] p-5 shadow-xl shadow-black/30 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#FF5C3A]/10 border border-[#FF5C3A]/20">
            <Cookie className="w-4 h-4 text-[#FF5C3A]" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-white leading-tight">
            Configuración de cookies
          </h3>
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <p className="text-[13px] text-gray-400 leading-relaxed">
            Utilizamos cookies para:
          </p>
          <ul className="space-y-1 text-[12px] text-gray-500">
            <li className="flex items-start gap-1.5">
              <span className="text-[#FF5C3A] mt-0.5">•</span>
              <span><strong className="text-gray-400">Esenciales:</strong> funcionamiento de la plataforma</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#FF5C3A] mt-0.5">•</span>
              <span><strong className="text-gray-400">Análisis:</strong> mejorar tu experiencia</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#FF5C3A] mt-0.5">•</span>
              <span><strong className="text-gray-400">Marketing:</strong> contenido relevante</span>
            </li>
          </ul>
        </div>

        {/* Main CTA */}
        <p className="text-[12px] text-gray-500 leading-relaxed mb-4">
          Al continuar navegando, aceptas nuestra{' '}
          <Link href="/cookies" className="text-[#FF5C3A] hover:text-white transition-colors underline decoration-[#FF5C3A]/30 hover:decoration-white">
            política de cookies
          </Link>
          . Puedes rechazar las no esenciales.
        </p>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleAccept}
            className="w-full px-4 py-2.5 text-[13px] font-semibold text-white bg-[#FF5C3A] hover:bg-[#e04f32] rounded-xl transition-colors shadow-[0_0_15px_rgba(255,92,58,0.25)]"
          >
            Aceptar todas
          </button>
          <button
            onClick={handleReject}
            className="w-full px-4 py-2.5 text-[13px] font-medium text-gray-300 bg-transparent border border-white/10 hover:border-white/20 hover:text-white rounded-xl transition-colors"
          >
            Rechazar no esenciales
          </button>
          <button
            onClick={handleCustomize}
            className="w-full px-4 py-2.5 text-[13px] font-medium text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-4"
          >
            Personalizar
          </button>
        </div>

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-white/5">
          <Link href="/cookies" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
            Cookies
          </Link>
          <span className="text-gray-700">•</span>
          <Link href="/politicas-privacidad" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
            Privacidad
          </Link>
          <span className="text-gray-700">•</span>
          <Link href="/terminos" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
            Términos
          </Link>
        </div>
      </div>
    </div>
  );
}
