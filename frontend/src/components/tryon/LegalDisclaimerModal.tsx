'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandPrimaryColor: string;
}

export function LegalDisclaimerModal({
  isOpen,
  onClose,
  brandPrimaryColor,
}: LegalDisclaimerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-[500px] rounded-2xl p-6 md:p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto"
                style={{ background: `${brandPrimaryColor}20` }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={brandPrimaryColor}
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h2
                className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-center mb-6"
                style={{ color: '#ffffff' }}
              >
                Uso Responsable de la Generación Virtual
              </h2>

              {/* Body text */}
              <div className="space-y-4 mb-6">
                <p className="text-sm leading-relaxed" style={{ color: '#999999' }}>
                  El probador virtual con IA permite visualizar cómo quedaría una prenda en una persona. Al usar esta función, el CLIENTE FINAL acepta que:
                </p>
                <ul className="space-y-2.5 text-sm leading-relaxed" style={{ color: '#999999' }}>
                  <li className="flex gap-2">
                    <span style={{ color: brandPrimaryColor }}>•</span>
                    La imagen generada es exclusivamente para uso personal o fines comerciales autorizados por la marca.
                  </li>
                  <li className="flex gap-2">
                    <span style={{ color: brandPrimaryColor }}>•</span>
                    Cuenta con el consentimiento expreso de cualquier persona cuya imagen aparezca en las fotografías que sube.
                  </li>
                  <li className="flex gap-2">
                    <span style={{ color: brandPrimaryColor }}>•</span>
                    No utilizará las generaciones para suplantar identidades, difamar, acosar o infringir derechos de terceros de ninguna forma.
                  </li>
                  <li className="flex gap-2">
                    <span style={{ color: brandPrimaryColor }}>•</span>
                    La marca y Lookitry no se responsabilizan por el uso inadecuado que el cliente final haga de las imágenes generadas.
                  </li>
                </ul>
                <p className="text-xs leading-relaxed" style={{ color: '#666666' }}>
                  Las imágenes generadas pueden ser almacenadas de forma anonimizada para mejorar el servicio de IA.
                </p>
              </div>

              {/* Terms link */}
              <div className="mb-6 text-center">
                <a
                  href="/terminos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium underline hover:no-underline transition-all"
                  style={{ color: brandPrimaryColor }}
                >
                  Leer los Términos y Condiciones de Lookitry →
                </a>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl font-black uppercase tracking-[0.1em] text-xs text-white transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  backgroundColor: brandPrimaryColor,
                  boxShadow: `0 4px 20px ${brandPrimaryColor}40`,
                }}
              >
                Cerrar y continuar
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}