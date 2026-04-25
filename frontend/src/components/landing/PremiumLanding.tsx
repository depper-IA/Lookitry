'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PromoBannerProvider } from '@/contexts/PromoBannerContext';

import { PricingConfig } from '@/lib/pricing';
import { PublicReview } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';

// ============================================================================
// CODE SPLITTING - Lazy loading de componentes below-the-fold
// ============================================================================

// Componentes above-the-fold: carga inmediata
const LandingNav = dynamic(() => import('./LandingNav'), { ssr: true });
const LandingHero = dynamic(() => import('./LandingHero'), { ssr: true });
const LandingStats = dynamic(() => import('./LandingStats'), { ssr: true });
const LandingSteps = dynamic(() => import('./LandingSteps'), { ssr: true });
const LandingMiniLanding = dynamic(() => import('./LandingMiniLanding'), { ssr: true });
const LandingPlugin = dynamic(() => import('./LandingPlugin'), { ssr: true });
const PromoBanner = dynamic(() => import('./PromoBanner').then(m => ({ default: m.PromoBanner })), { ssr: true });

// Componentes below-the-fold: carga perezosa (solo cuando entran en viewport)
const LandingPricing = dynamic(() => import('./LandingPricing'), {
  ssr: true,
  loading: () => <BelowTheFoldSkeleton />
});
const LandingPayments = dynamic(() => import('./LandingPayments'), { ssr: true });
const ReviewsSlider = dynamic(
  () => import('./ReviewsSlider').then(m => ({ default: m.ReviewsSlider })),
  { ssr: true }
);
const LandingFaq = dynamic(() => import('./LandingFaq'), { ssr: true });
const LandingFooter = dynamic(() => import('./LandingFooter'), { ssr: true });
const ActiveCouponsBanner = dynamic(() => import('./ActiveCouponsBanner'), { ssr: true });

// Modal de promoción: carga lazy + no SSR (usa localStorage/sessionStorage)
const PromoModal = dynamic(
  () => import('./PromoModal').then(m => ({ default: m.PromoModal })),
  { ssr: false }
);

// Skeleton placeholder para componentes en carga (BelowTheFold skeleton)
const BelowTheFoldSkeleton = () => (
  <div className="py-20 sm:py-24 md:py-32 lg:py-40 px-4 sm:px-6 bg-white dark:bg-black" style={{ minHeight: '500px' }}>
    <div className="max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8 mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-80 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

interface PremiumLandingProps {
  pricing: PricingConfig;
  reviews: PublicReview[];
  currency?: 'COP' | 'USD';
  trm?: number;
}

export default function PremiumLanding({
  pricing,
  reviews,
  realReviewsCount = 0,
  usingMockReviews = false,
  currency = 'COP',
  trm = 4000
}: PremiumLandingProps & { realReviewsCount?: number; usingMockReviews?: boolean }) {

  const { currency: navCurrency, setCurrency } = useCurrency();
  const [trmState, setTrmState] = useState(trm);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (apiUrl) {
      fetch(`${apiUrl}/api/payment-settings/public`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.trm && Number(data.trm) > 0) {
            setTrmState(Number(data.trm));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleNavCurrencyChange = (c: 'COP' | 'USD') => {
    setCurrency(c);
  };

  return (
    <PromoBannerProvider>
      <div className="min-h-screen bg-white dark:bg-black text-[#0a0a0a] dark:text-white selection:bg-[#FF5C3A]/30 selection:text-white font-dm-sans overflow-x-clip">
        <PromoBanner />
        <LandingNav currency={navCurrency} onCurrencyChange={handleNavCurrencyChange} />
        <main className="relative">
          <LandingHero />
          <LandingStats />
          <LandingSteps />
          <LandingMiniLanding />
          <LandingPlugin />
          <LandingPricing pricing={pricing} currency={navCurrency} trm={trmState} />
          <ActiveCouponsBanner />
          <LandingPayments />
          <ReviewsSlider reviews={reviews} realReviewsCount={realReviewsCount} usingMockReviews={usingMockReviews} />
          <LandingFaq />
        </main>
        <LandingFooter />
        <PromoModal />
      </div>
    </PromoBannerProvider>
  );
}
