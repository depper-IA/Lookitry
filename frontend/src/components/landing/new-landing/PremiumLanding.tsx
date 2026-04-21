'use client';

import React, { useState, useEffect } from 'react';
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
import { PromoBannerProvider } from '@/contexts/PromoBannerContext';

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

  const [navCurrency, setNavCurrency] = useState<'COP' | 'USD'>(currency);
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

  useEffect(() => {
    const handleCurrencyChange = () => {
      const saved = localStorage.getItem('currency') as 'COP' | 'USD';
      if (saved) setNavCurrency(saved);
    };
    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, []);

  const handleNavCurrencyChange = (c: 'COP' | 'USD') => {
    setNavCurrency(c);
    localStorage.setItem('currency', c);
    window.dispatchEvent(new Event('currencyChange'));
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
