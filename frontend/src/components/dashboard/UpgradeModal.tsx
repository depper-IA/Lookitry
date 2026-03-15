'use client';

import { useRouter } from 'next/navigation';
import { X, Zap, Check } from 'lucide-react';

interface UpgradeModalProps {
  onClose: () => void;
}

const PRO_FEATURES = [
  'Templates Minimal, Modern y Bold',
  'Texto del botón personalizado',
  'Mensaje de bienvenida en widget',
  'URL del widget personalizable',
  'Hasta 15 productos activos',
  '1.200 generaciones/mes',
  'Soporte prioritario',
];

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/dashboard/checkout?plan=PRO');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="relative px-6 py-5" style={{ background: 'linear-gradient(135deg, #FF5C3A, #e04e30)' }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-syne">Actualiza a Plan PRO</h2>
              <p className="text-white/75 text-sm">$250.000 COP / mes</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Esta función está disponible en el Plan PRO. Actualiza para desbloquear:
          </p>
          <ul className="space-y-2.5 mb-5">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,92,58,0.1)' }}
                >
                  <Check className="w-3 h-3 text-[#FF5C3A]" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 min-h-[44px] rounded-xl border text-sm transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-xl text-white text-sm font-semibold transition-opacity"
              style={{ background: '#FF5C3A' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Zap className="w-4 h-4" />
              Ir a pagar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
