'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import OnboardingForm from '@/components/auth/OnboardingForm';

function GoogleSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setRef(refParam);
      localStorage.setItem('pendingRegistrationId', refParam);
    } else {
      const stored = localStorage.getItem('pendingRegistrationId');
      if (stored) setRef(stored);
    }
  }, [searchParams]);

  // Si no hay ref después de cargar, redirigir a checkout
  // (Esta página solo debe ser accedida con un pendingRegistrationId válido)
  useEffect(() => {
    if (ref === null) {
      // Solo redirigir si ya se cargó y no hay ref (no en el estado inicial)
      const timer = setTimeout(() => {
        const stored = localStorage.getItem('pendingRegistrationId');
        if (!stored && ref === null) {
          router.replace('/checkout');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [ref, router]);

  const handleSubmit = async (data: { name: string; slug: string }) => {
    const body: { name: string; slug: string; ref?: string } = { name: data.name, slug: data.slug };
    if (ref) {
      body.ref = ref;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/google/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const result = await res.json();

    if (!res.ok) {
      if (result.error === 'SLUG_TAKEN') {
        throw new Error('Esta URL ya está en uso. Prueba con otra o usa "Sugerir".');
      }
      throw new Error(result.message || 'Error al completar la configuración');
    }

    // Limpiar pendingRegistrationId
    localStorage.removeItem('pendingRegistrationId');

    // Guardar brand y token del onboarding
    if (result.brand) {
      localStorage.setItem('brand', JSON.stringify(result.brand));
    }
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
  };

  const handleSuccess = async () => {
    // IMPORTANTE: Después del setup de marca, SIEMPRE ir al checkout
    // Ya no se verifica requiresTrialPayment aquí - el checkout funnel maneja eso
    router.push('/checkout');
  };

  return (
    <OnboardingForm
      title="Configura tu marca"
      subtitle="Tu cuenta fue creada con Google. Solo necesitamos el nombre de tu marca y la URL de tu probador."
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      loginLink="/login"
    />
  );
}

export default function GoogleSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#999]">
        <div className="w-8 h-8 border-2 border-t-[#FF5C3A] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Cargando...</p>
      </div>
    }>
      <GoogleSetupContent />
    </Suspense>
  );
}
