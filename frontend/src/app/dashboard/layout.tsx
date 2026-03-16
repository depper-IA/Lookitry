'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SuspensionModal } from '@/components/dashboard/SuspensionModal';
import { ProUpgradeBanner } from '@/components/dashboard/ProUpgradeBanner';
import { Spinner } from '@/components/ui/Spinner';
import { brandsService } from '@/services/brands.service';
import type { Brand } from '@/types';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [brandData, setBrandData] = useState<Brand | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showProBanner, setShowProBanner] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (isAuthenticated && !isLoading) {
        try {
          const brand = await brandsService.getCurrentBrand();
          setBrandData(brand);

          // Detectar upgrade a PRO
          const prevPlan = localStorage.getItem('brand_plan');
          if (brand.plan === 'PRO' && prevPlan !== 'PRO') {
            const dismissed = sessionStorage.getItem('pro_upgrade_banner_dismissed');
            if (!dismissed) setShowProBanner(true);
          }
          localStorage.setItem('brand_plan', brand.plan);
        } catch (error) {
          console.error('Error fetching brand data:', error);
        } finally {
          setCheckingSubscription(false);
        }
      }
    };

    checkSubscriptionStatus();

    // Re-fetch cuando el usuario vuelve a la pestaña (ej: admin cambió el plan)
    const handleFocus = () => { checkSubscriptionStatus(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, isLoading]);

  if (isLoading || checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Mostrar modal de suspensión si la marca está suspendida
  if (brandData?.subscriptionStatus === 'suspended') {
    return (
      <SuspensionModal
        brandName={brandData.name}
        brandEmail={brandData.email}
        plan={brandData.plan}
      />
    );
  }

  // Mostrar modal de trial vencido si no tiene suscripción activa y el trial expiró
  const trialExpired =
    brandData?.trialEndDate &&
    new Date(brandData.trialEndDate) <= new Date() &&
    brandData?.subscriptionStatus !== 'active' &&
    brandData?.subscriptionStatus !== 'expiring_soon';

  if (trialExpired) {
    return (
      <SuspensionModal
        brandName={brandData!.name}
        brandEmail={brandData!.email}
        plan={brandData!.plan}
        isTrialExpired
      />
    );
  }

  return (
    <>
      {showProBanner && brandData && (
        <ProUpgradeBanner brandName={brandData.name} />
      )}
      {brandData && !(brandData as any).emailVerified && (
        <EmailVerificationBanner email={brandData.email} />
      )}
      <DashboardLayout>{children}</DashboardLayout>
    </>
  );
}

function EmailVerificationBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="w-full bg-[#1a1200] border-b border-[#3d2e00] px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <svg className="w-4 h-4 text-[#f5a623] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-[12px] text-[#f5a623] truncate">
          Verifica tu correo <span className="font-medium">{email}</span> para poder usar las generaciones.{' '}
          <a href="/verify-email" className="underline hover:text-[#ffc04d] transition-colors">Reenviar correo</a>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-[#f5a623] hover:text-[#ffc04d] transition-colors"
        aria-label="Cerrar aviso"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
