'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SuspensionModal } from '@/components/dashboard/SuspensionModal';
import { ProUpgradeBanner } from '@/components/dashboard/ProUpgradeBanner';
import { Spinner } from '@/components/ui/Spinner';
import { brandsService } from '@/services/brands.service';
import { reviewsService } from '@/services/reviews.service';
import IdleTimer from '@/components/auth/IdleTimer';
import type { Brand } from '@/types';
import { ReviewPromptModal } from '@/components/dashboard/ReviewPromptModal';
import { dispatchAuthStateChanged } from '@/lib/sessionEvents';

export function DashboardRouteShell({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [brandData, setBrandData] = useState<Brand | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showProBanner, setShowProBanner] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

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
          dispatchAuthStateChanged();

          const prevPlan = localStorage.getItem('brand_plan');
          const proBannerSeenKey = `pro_upgrade_banner_seen_${brand.id}`;
          const alreadySeenProBanner = localStorage.getItem(proBannerSeenKey) === '1';

          if (brand.plan === 'PRO' && prevPlan !== 'PRO' && !alreadySeenProBanner) {
            setShowProBanner(true);
          }
          localStorage.setItem('brand_plan', brand.plan);

          const subscriptionAnchor = brand.subscriptionStartDate ? new Date(brand.subscriptionStartDate) : null;
          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
          const isEligibleByDate = Boolean(subscriptionAnchor && Date.now() - subscriptionAnchor.getTime() >= threeDaysMs);
          const shouldCheckReviewPrompt = brand.plan !== 'TRIAL' && !brand.reviewPromptShownAt && isEligibleByDate;

          if (shouldCheckReviewPrompt) {
            const myReview = await reviewsService.getMyReview();
            setShowReviewPrompt(myReview === null);
          } else {
            setShowReviewPrompt(false);
          }
        } catch (error) {
          console.error('Error fetching brand data:', error);
        } finally {
          setCheckingSubscription(false);
        }
      }
    };

    checkSubscriptionStatus();

    const handleFocus = () => {
      checkSubscriptionStatus();
    };

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

  if (brandData?.subscriptionStatus === 'suspended') {
    return (
      <SuspensionModal
        brandName={brandData.name}
        brandEmail={brandData.email}
        plan={brandData.plan}
      />
    );
  }

  const trialExpired = !!(
    brandData?.plan === 'TRIAL' &&
    brandData?.trialEndDate &&
    new Date(brandData.trialEndDate) <= new Date() &&
    brandData?.subscriptionStatus !== 'active' &&
    brandData?.subscriptionStatus !== 'expiring_soon'
  );

  if (trialExpired || brandData?.trialPaymentStatus === 'pending_payment' ||
      (brandData?.plan === 'TRIAL' && !brandData?.trialEndDate)) {
    return (
      <SuspensionModal
        brandName={brandData!.name}
        brandEmail={brandData!.email}
        plan={brandData!.plan}
        isTrialExpired={trialExpired && brandData?.trialPaymentStatus !== 'pending_payment'}
        isTrialPending={brandData?.trialPaymentStatus === 'pending_payment' || (brandData?.plan === 'TRIAL' && !brandData?.trialEndDate)}
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
      {brandData && (
        <ReviewPromptModal
          isOpen={showReviewPrompt}
          onClose={() => setShowReviewPrompt(false)}
          onSubmitted={() => {
            setShowReviewPrompt(false);
            setBrandData((previous) => previous ? { ...previous, reviewPromptShownAt: new Date().toISOString() } : previous);
          }}
        />
      )}
      <IdleTimer>
        <DashboardLayout brandOverride={brandData}>{children}</DashboardLayout>
      </IdleTimer>
    </>
  );
}
