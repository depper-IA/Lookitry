'use client';

import React from 'react';
import LandingNav from './LandingNav';
import LandingHero from './LandingHero';
import LandingStats from './LandingStats';
import LandingSteps from './LandingSteps';
import LandingMiniLanding from './LandingMiniLanding';
import LandingPlugin from './LandingPlugin';
import LandingPricing from './LandingPricing';
import LandingPayments from './LandingPayments';
import LandingFaq from './LandingFaq';
import LandingFooter from './LandingFooter';
import { PromoBanner } from './PromoBanner';
import { PromoModal } from './PromoModal';
import { ReviewsSlider } from './ReviewsSlider';
import ActiveCouponsBanner from './ActiveCouponsBanner';
import { PromoBannerProvider } from '@/context/PromoBannerContext';
import { PublicTopbar } from '@/components/layout/PublicTopbar';
import { WhatsAppFloatingButton } from '@/components/ui/WhatsAppFloatingButton';

import { PricingConfig } from '@/lib/pricing';
import { PublicReview } from '@/types';

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
  return (
    <PromoBannerProvider>
      <div className="min-h-screen bg-white dark:bg-black text-[#0a0a0a] dark:text-white selection:bg-[#FF5C3A]/30 selection:text-white font-dm-sans overflow-x-clip">
        <PublicTopbar />
        <PromoBanner />
        <main className="relative">
          <LandingNav />
          <LandingHero />
          <LandingStats />
          <LandingSteps />
          <LandingMiniLanding />
          <LandingPlugin />
          <LandingPricing pricing={pricing} currency={currency} trm={trm} />
          <ActiveCouponsBanner />
          <LandingPayments />
          <ReviewsSlider reviews={reviews} realReviewsCount={realReviewsCount} usingMockReviews={usingMockReviews} />
          <LandingFaq />
        </main>
        <LandingFooter />
        <PromoModal />
        <WhatsAppFloatingButton />
      </div>
    </PromoBannerProvider>
  );
}
