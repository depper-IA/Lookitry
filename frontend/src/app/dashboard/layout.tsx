'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SuspensionModal } from '@/components/dashboard/SuspensionModal';
import { ProUpgradeBanner } from '@/components/dashboard/ProUpgradeBanner';
import { Spinner } from '@/components/ui/Spinner';
import { brandsService } from '@/services/brands.service';
import IdleTimer from '@/components/auth/IdleTimer';
import type { Brand } from '@/types';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [brandData, setBrandData] = useState<Brand | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showProBanner, setShowProBanner] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setCheckingSubscription(false);
      return;
    }

    const checkSubscriptionStatus = async () => {
      if (isAuthenticated && !isLoading) {
        try {
          const brand = await brandsService.getCurrentBrand();
          setBrandData(brand);
          localStorage.setItem('brand', JSON.stringify(brand));

          // Detectar upgrade a PRO
          const prevPlan = localStorage.getItem('brand_plan');
          const proBannerSeenKey = `pro_upgrade_banner_seen_${brand.id}`;
          const alreadySeenProBanner = localStorage.getItem(proBannerSeenKey) === '1';

          if (brand.plan === 'PRO' && prevPlan !== 'PRO' && !alreadySeenProBanner) {
            setShowProBanner(true);
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
  const trialExpired = !!(
    brandData?.trialEndDate &&
    new Date(brandData.trialEndDate) <= new Date() &&
    brandData?.subscriptionStatus !== 'active' &&
    brandData?.subscriptionStatus !== 'expiring_soon'
  );

  if (trialExpired || brandData?.trialPaymentStatus === 'pending_payment') {
    return (
      <SuspensionModal
        brandName={brandData!.name}
        brandEmail={brandData!.email}
        plan={brandData!.plan}
        isTrialExpired={trialExpired && brandData?.trialPaymentStatus !== 'pending_payment'}
        isTrialPending={brandData?.trialPaymentStatus === 'pending_payment'}
      />
    );
  }

  return (
    <>
      {showProBanner && brandData && (
        <ProUpgradeBanner
          brandId={brandData.id}
          brandName={brandData.name}
          onClose={() => setShowProBanner(false)}
        />
      )}
      {/* El banner de verificación de email ahora vive dentro de DashboardLayout
          para respetar el padding del sidebar y no solaparse con el header sticky */}
      <IdleTimer>
        <DashboardLayout brandOverride={brandData}>{children}</DashboardLayout>
      </IdleTimer>
    </>
  );
}
