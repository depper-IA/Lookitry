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
      <DashboardLayout>{children}</DashboardLayout>
    </>
  );
}
