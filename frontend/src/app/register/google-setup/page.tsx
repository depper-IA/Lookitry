'use client';

import { useRouter } from 'next/navigation';
import OnboardingForm from '@/components/auth/OnboardingForm';

export default function GoogleSetupPage() {
  const router = useRouter();

  const handleSubmit = async (data: { name: string; slug: string }) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/google/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: data.name, slug: data.slug }),
    });

    const result = await res.json();

    if (!res.ok) {
      if (result.error === 'SLUG_TAKEN') {
        throw new Error('Esta URL ya está en uso. Prueba con otra o usa "Sugerir".');
      }
      throw new Error(result.message || 'Error al completar la configuración');
    }
  };

  const handleSuccess = async () => {
    const trialRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/trial`, {
      credentials: 'include',
    });
    const trialData = await trialRes.json();

    if (trialData?.requiresTrialPayment) {
      router.push('/trial-checkout');
    } else {
      router.push('/dashboard');
    }
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
