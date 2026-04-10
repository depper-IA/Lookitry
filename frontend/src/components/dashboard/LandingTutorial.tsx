'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Palette, Package, Globe, X, ChevronLeft, ChevronRight } from 'lucide-react';

const getLandingTutorialKey = (brandId?: string | number) =>
  brandId ? `landing_tutorial_seen_${brandId}` : 'landing_tutorial_seen';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  hint: string;
  icon: React.ReactNode;
}

const STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Sube tu logo',
    description: 'Agrega el logo de tu marca para que aparezca en tu mini-landing. Recomendamos PNG con fondo transparente.',
    hint: 'Busca la sección "Logo de la marca" en esta página.',
    icon: <ImageIcon className="w-8 h-8" />,
  },
  {
    id: 2,
    title: 'Configura los colores',
    description: 'Elige el color principal de tu marca. Este color se usará en botones y elementos destacados de tu página.',
    hint: 'Busca la sección "Color principal" más abajo en el formulario.',
    icon: <Palette className="w-8 h-8" />,
  },
  {
    id: 3,
    title: 'Agrega tus productos',
    description: 'Añade los productos que quieres mostrar en tu mini-landing para que tus clientes puedan verlos y probarlos.',
    hint: 'Ve a "Productos" en el menú lateral para agregar tu catálogo.',
    icon: <Package className="w-8 h-8" />,
  },
  {
    id: 4,
    title: 'Publica tu mini-landing',
    description: 'Guarda los cambios y comparte la URL de tu página con tus clientes. Tu mini-landing ya está activa.',
    hint: 'Haz clic en "Guardar cambios" y luego copia la URL de tu página.',
    icon: <Globe className="w-8 h-8" />,
  },
];

interface LandingTutorialProps {
  brandId?: string | number;
  onClose?: () => void;
}

export function LandingTutorial({ brandId, onClose }: LandingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (brandId === undefined || brandId === null) return;
    const key = getLandingTutorialKey(brandId);
    const seen = localStorage.getItem(key);
    if (!seen) {
      setVisible(true);
    }
  }, [brandId]);

  const dismiss = () => {
    const key = getLandingTutorialKey(brandId);
    localStorage.setItem(key, 'true');
    setVisible(false);
    onClose?.();
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      dismiss();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!visible) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-tutorial-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="relative px-6 py-5"
            style={{ background: 'linear-gradient(135deg, #FF5C3A, #e04e30)' }}
          >
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.2)' }}
              title="Omitir tutorial"
              aria-label="Omitir tutorial"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <p className="text-white/80 text-xs font-medium uppercase tracking-wide">
              Tutorial de configuración
            </p>
            <h3
              id="landing-tutorial-title"
              className="text-white font-jakarta font-bold text-lg mt-0.5 tracking-tight"
            >
              Configura tu mini-landing
            </h3>
          </div>

          {/* Indicador de progreso */}
          <div className="px-6 pt-5">
            <div className="flex items-center gap-1.5 mb-5">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5 flex-1">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-all duration-200"
                    style={{
                      background:
                        i < currentStep
                          ? '#10b981'
                          : i === currentStep
                          ? '#FF5C3A'
                          : '#1f1f1f',
                      color: i <= currentStep ? '#fff' : '#6b7280',
                    }}
                  >
                    {i < currentStep ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.id
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-0.5 rounded-full transition-colors duration-300"
                      style={{ background: i < currentStep ? '#10b981' : '#1f1f1f' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contenido del paso */}
          <div className="px-6 pb-6">
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}
              >
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs mb-0.5" style={{ color: '#6b7280' }}>
                  Paso {step.id} de {STEPS.length}
                </p>
                <h4 className="font-bold text-base mb-1.5" style={{ color: '#f5f2ee' }}>
                  {step.title}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
                  {step.description}
                </p>
              </div>
            </div>

            {/* Hint */}
            <div
              className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl mb-5"
              style={{ background: 'rgba(255,92,58,0.08)', border: '1px solid rgba(255,92,58,0.2)' }}
            >
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#FF5C3A"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs" style={{ color: '#FF5C3A' }}>
                {step.hint}
              </p>
            </div>

            {/* Botones de navegación */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={dismiss}
                className="text-xs transition-colors px-3 py-2 rounded-lg"
                style={{ color: '#6b7280' }}
              >
                Omitir tutorial
              </button>

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={goPrev}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: '#9ca3af', border: '1px solid #1f1f1f' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#FF5C3A' }}
                >
                  {isLast ? 'Finalizar' : 'Siguiente'}
                  {!isLast && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
