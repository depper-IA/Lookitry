'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X, Zap, Check, ArrowRight } from 'lucide-react';
import { subscriptionService } from '@/services/subscription.service';

interface UpgradeModalProps {
  onClose: () => void;
}

const BASIC_FEATURES = [
  'Hasta 5 productos activos',
  '400 generaciones por mes',
  'Branding básico (logo y colores)',
  'URL propia del probador',
  'Soporte por WhatsApp/email',
];

const PRO_FEATURES = [
  'Hasta 15 productos activos',
  '1.200 generaciones por mes',
  'Templates Minimal, Modern y Bold',
  'Texto del botón personalizado',
  'Mensaje de bienvenida en widget',
  'URL del widget personalizable',
  'Soporte prioritario',
];

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const router = useRouter();
  const [isInTrial, setIsInTrial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionService.getSubscriptionInfo()
      .then((info) => setIsInTrial(info.isInTrial ?? false))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = (plan: 'BASIC' | 'PRO') => {
    onClose();
    router.push(`/dashboard/checkout?plan=${plan}`);
  };

  // Si está en TRIAL, mostrar selector de plan (BASIC o PRO)
  if (!loading && isInTrial) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div
          className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
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
                <h2 className="text-lg font-bold text-white font-syne">Activa tu plan</h2>
                <p className="text-white/75 text-sm">Elige el plan que mejor se adapte a tu marca</p>
              </div>
            </div>
          </div>

          {/* Body — dos tarjetas de plan */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Tu período de prueba está activo. Selecciona un plan para continuar usando todas las funciones.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Plan Básico */}
              <div
                className="rounded-xl border-2 p-4 flex flex-col gap-3 transition-all"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }}
              >
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Plan Básico</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    $150.000
                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mes</span>
                  </p>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {BASIC_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                        style={{ background: 'rgba(255,92,58,0.1)' }}
                      >
                        <Check className="w-2.5 h-2.5 text-[#FF5C3A]" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('BASIC')}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 min-h-[40px] rounded-xl border text-sm font-semibold transition-all"
                  style={{ borderColor: '#FF5C3A', color: '#FF5C3A', background: 'rgba(255,92,58,0.06)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,92,58,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,92,58,0.06)')}
                >
                  Elegir Básico
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Plan Pro */}
              <div
                className="rounded-xl border-2 p-4 flex flex-col gap-3 transition-all relative"
                style={{ borderColor: '#FF5C3A', background: 'rgba(255,92,58,0.04)' }}
              >
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white whitespace-nowrap"
                  style={{ background: '#FF5C3A' }}
                >
                  Recomendado
                </span>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Plan Pro</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: '#FF5C3A' }}>
                    $250.000
                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mes</span>
                  </p>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {PRO_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                        style={{ background: 'rgba(255,92,58,0.1)' }}
                      >
                        <Check className="w-2.5 h-2.5 text-[#FF5C3A]" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('PRO')}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 min-h-[40px] rounded-xl text-white text-sm font-semibold transition-opacity"
                  style={{ background: '#FF5C3A' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Elegir Pro
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Continuar con el período de prueba
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista por defecto: usuario en BASIC que quiere ir a PRO
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
              <h2 className="text-lg font-bold text-white font-syne">Actualiza a Plan Pro</h2>
              <p className="text-white/75 text-sm">$250.000 COP / mes</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Esta función está disponible en el Plan Pro. Actualiza para desbloquear:
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
              onClick={() => handleUpgrade('PRO')}
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
