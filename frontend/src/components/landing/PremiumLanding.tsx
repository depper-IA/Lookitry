'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PromoBannerProvider } from '@/contexts/PromoBannerContext';

import { PricingConfig } from '@/lib/pricing';
import { PublicReview } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import { LandingSkeleton } from './LandingSkeleton';

// ============================================================================
// CODE SPLITTING - Lazy loading de componentes below-the-fold
// ============================================================================

// Skeleton reutilizable para secciones above-the-fold
const HeroSkeleton = () => <LandingSkeleton variant="hero" />;
const NavSkeleton = () => <LandingSkeleton variant="stats" />;

// Nav: carga inmediata para que siempre esté lista
const LandingNav = dynamic(() => import('./LandingNav'), { ssr: true });

// Hero: skeleton mientras carga - es lo primero que ve el usuario
const LandingHero = dynamic(() => import('./LandingHero'), {
  ssr: false,
  loading: () => <HeroSkeleton />
});

// Stats: skeleton mientras carga
const LandingStats = dynamic(() => import('./LandingStats'), {
  ssr: false,
  loading: () => <LandingSkeleton variant="stats" />
});

// Steps: skeleton mientras carga
const LandingSteps = dynamic(() => import('./LandingSteps'), {
  ssr: false,
  loading: () => <LandingSkeleton variant="steps" />
});

// MiniLanding: skeleton mientras carga
const LandingMiniLanding = dynamic(() => import('./LandingMiniLanding'), { ssr: false });
const LandingPlugin = dynamic(() => import('./LandingPlugin'), { ssr: false });

// PromoBanner: carga inmediata
const PromoBanner = dynamic(() => import('./PromoBanner').then(m => ({ default: m.PromoBanner })), { ssr: true });

// Below-the-fold: skeleton de cards genérico
const BelowTheFoldSkeleton = () => <LandingSkeleton />;
const LandingPricing = dynamic(() => import('./LandingPricing'), {
  ssr: false,
  loading: () => <LandingSkeleton variant="pricing" />
});
const LandingPayments = dynamic(() => import('./LandingPayments'), { ssr: false });
const ReviewsSlider = dynamic(
  () => import('./ReviewsSlider').then(m => ({ default: m.ReviewsSlider })),
  { ssr: false }
);
const LandingFaq = dynamic(() => import('./LandingFaq'), { ssr: false });
const LandingFooter = dynamic(() => import('./LandingFooter'), { ssr: false });
const ActiveCouponsBanner = dynamic(() => import('./ActiveCouponsBanner'), { ssr: false });

// Modal de promoción: carga lazy + no SSR (usa localStorage/sessionStorage)
const PromoModal = dynamic(
  () => import('./PromoModal').then(m => ({ default: m.PromoModal })),
  { ssr: false }
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
    // Usa el proxy de Next.js para evitar CORS con el backend
    fetch('/api/payment-settings/public')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.trm && Number(data.trm) > 0) {
          setTrmState(Number(data.trm));
        }
      })
      .catch(() => {});
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
