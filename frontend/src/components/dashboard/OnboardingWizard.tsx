'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Clave de localStorage específica por brand para evitar que el onboarding
 * se marque como completado para otros usuarios en el mismo navegador.
 */
const getStorageKey = (brandId?: string | number) =>
  brandId ? `onboarding_completed_${brandId}` : 'onboarding_completed';

const getStepKey = (brandId?: string | number) =>
  brandId ? `onboarding_step_${brandId}` : 'onboarding_step';

interface Step {
  id: number;
  title: string;
  description: string;
  action: string;
  href: string;
  icon: React.ReactNode;
}

function IconUser() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconBrush() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Completa tu perfil',
    description: 'Agrega tu información de contacto: teléfono, NIT, dirección y sitio web.',
    action: 'Ir a mi perfil',
    href: '/dashboard/profile',
    icon: <IconUser />,
  },
  {
    id: 2,
    title: 'Personaliza tu marca',
    description: 'Sube tu logo y configura los colores de tu probador virtual.',
    action: 'Ir a configuración',
    href: '/dashboard/settings',
    icon: <IconBrush />,
  },
  {
    id: 3,
    title: 'Agrega tu primer producto',
    description: 'Crea un producto con su imagen para que tus clientes puedan probárselo.',
    action: 'Agregar producto',
    href: '/dashboard/products',
    icon: <IconBox />,
  },
  {
    id: 4,
    title: 'Comparte o embebe el probador',
    description: 'Copia el link de tu probador o el código iframe para tu sitio web.',
    action: 'Ver código embed',
    href: '/dashboard/integrations',
    icon: <IconCode />,
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { brand } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const currentStepRef = useRef(0);

  // Esperar a que el brand esté disponible antes de leer localStorage
  const brandId = (brand as any)?.id;

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    // No hacer nada hasta tener el brand cargado
    if (brand === null) return;

    const storageKey = getStorageKey(brandId);
    const stepKey = getStepKey(brandId);

    const completed = localStorage.getItem(storageKey);
    if (completed) return;

    const savedStep = parseInt(localStorage.getItem(stepKey) ?? '0', 10);
    const step = isNaN(savedStep) ? 0 : Math.min(savedStep, STEPS.length - 1);
    setCurrentStep(step);
    setVisible(true);

    const handleStepComplete = () => {
      const next = currentStepRef.current + 1;
      if (next >= STEPS.length) {
        localStorage.setItem(storageKey, 'true');
        localStorage.removeItem(stepKey);
        setVisible(false);
      } else {
        localStorage.setItem(stepKey, String(next));
        setCurrentStep(next);
        currentStepRef.current = next;
      }
    };
    window.addEventListener('onboarding:step-complete', handleStepComplete);
    return () => window.removeEventListener('onboarding:step-complete', handleStepComplete);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, brandId]);

  const dismiss = () => {
    const storageKey = getStorageKey(brandId);
    const stepKey = getStepKey(brandId);
    localStorage.setItem(storageKey, 'true');
    localStorage.removeItem(stepKey);
    setVisible(false);
  };

  const advance = () => {
    const next = currentStep + 1;
    if (next >= STEPS.length) {
      dismiss();
    } else {
      localStorage.setItem(getStepKey(brandId), String(next));
      setCurrentStep(next);
    }
  };

  const goToStep = (href: string) => {
    const storageKey = getStorageKey(brandId);
    const stepKey = getStepKey(brandId);
    const next = currentStep + 1;
    if (next >= STEPS.length) {
      localStorage.setItem(storageKey, 'true');
      localStorage.removeItem(stepKey);
    } else {
      localStorage.setItem(stepKey, String(next));
    }
    setVisible(false);
    router.push(href);
  };

  if (!visible) return null;

  const step = STEPS[currentStep];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal centrado */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--bg-card)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-5" style={{ background: 'linear-gradient(135deg, #FF5C3A, #e04e30)' }}>
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              title="Cerrar y no mostrar más"
              aria-label="Cerrar configuración inicial"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-white/80 text-xs font-medium uppercase tracking-wide">
              Configuración inicial
            </p>
            <h3 id="onboarding-title" className="text-white font-jakarta font-bold text-lg mt-0.5 tracking-tight">
              Bienvenido{brand?.name ? `, ${brand.name}` : ''}
            </h3>
          </div>

          {/* Progreso */}
          <div className="px-6 pt-5">
            <div className="flex items-center gap-1 mb-5">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1 flex-1">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-colors"
                    style={{
                      background: i < currentStep
                        ? '#10b981'
                        : i === currentStep
                        ? '#FF5C3A'
                        : 'var(--bg-secondary)',
                      color: i <= currentStep ? '#fff' : 'var(--text-muted)',
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
                      className="flex-1 h-0.5 rounded-full transition-colors"
                      style={{ background: i < currentStep ? '#10b981' : 'var(--border-color)' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Paso actual */}
          <div className="px-6 pb-6">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}
              >
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Paso {step.id} de {STEPS.length}
                </p>
                <h4 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                  {step.title}
                </h4>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {step.description}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => goToStep(step.href)}
                    className="px-4 py-2 min-h-[40px] text-white text-sm font-semibold rounded-lg transition-opacity"
                    style={{ background: '#FF5C3A' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {step.action}
                  </button>
                  <button
                    onClick={advance}
                    className="px-4 py-2 text-sm transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {currentStep < STEPS.length - 1 ? 'Saltar paso' : 'Finalizar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
