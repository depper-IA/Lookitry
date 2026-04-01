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
import LandingReviews from './LandingReviews';
import LandingFaq from './LandingFaq';
import LandingFooter from './LandingFooter';

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
  currency = 'COP', 
  trm = 4000 
}: PremiumLandingProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A] font-dm-sans overflow-x-hidden">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingStats />
        <LandingSteps />
        <LandingMiniLanding />
        <LandingPlugin />
        <LandingPricing pricing={pricing} currency={currency} trm={trm} />
        <LandingPayments />
        <LandingReviews reviews={reviews} />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
