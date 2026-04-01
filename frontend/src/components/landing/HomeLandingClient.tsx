'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { 
  MessageCircle, 
  Mail, 
  Zap, 
  Globe 
} from 'lucide-react';

import { PricingConfig } from '@/lib/pricing';
import { PublicReview } from '@/types';

import LandingNav from './new-landing/LandingNav';
import LandingHero from './new-landing/LandingHero';
import LandingStats from './new-landing/LandingStats';
import LandingSteps from './new-landing/LandingSteps';
import LandingMiniLanding from './new-landing/LandingMiniLanding';
import LandingPlugin from './new-landing/LandingPlugin';
import LandingPricing from './new-landing/LandingPricing';
import LandingReviews from './new-landing/LandingReviews';
import LandingPayments from './new-landing/LandingPayments';
import LandingFaq from './new-landing/LandingFaq';
import LandingFooter from './new-landing/LandingFooter';

// Registrar plugins de GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
  
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

interface HomeLandingClientProps {
  pricing: PricingConfig;
  reviews: PublicReview[];
}

export default function HomeLandingClient({ pricing, reviews }: HomeLandingClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const floatingCtaRef = useRef<HTMLDivElement>(null);

  // Lógica de Moneda
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const [isMounted, setIsMounted] = useState(false);
  const [trm, setTrm] = useState(pricing?.meta?.trm_referencia ?? 4000);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved) setCurrency(saved);

    // Fetch TRM real si es posible
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (apiUrl) {
      fetch(`${apiUrl}/api/payment-settings/public`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.trm && Number(data.trm) > 0) {
            setTrm(Number(data.trm));
          }
        })
        .catch(() => {});
    }

    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      
      const shouldBeStuck = scrollPos > 40;
      if (navRef.current) {
        if (shouldBeStuck) {
          navRef.current.classList.add('bg-[#0a0a0a]/90', 'backdrop-blur-md', 'border-b', 'border-white/5', 'py-4');
          navRef.current.classList.remove('bg-transparent', 'py-8');
        } else {
          navRef.current.classList.add('bg-transparent', 'py-8');
          navRef.current.classList.remove('bg-[#0a0a0a]/90', 'backdrop-blur-md', 'border-b', 'border-white/5', 'py-4');
        }
      }

      const shouldHide = fullHeight - (scrollPos + windowHeight) < 350; 
      if (floatingCtaRef.current) {
        if (shouldHide) {
          floatingCtaRef.current.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10');
          floatingCtaRef.current.classList.remove('opacity-100', 'translate-y-0');
        } else {
          floatingCtaRef.current.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
          floatingCtaRef.current.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeCurrency = (newCur: 'COP' | 'USD') => {
    setCurrency(newCur);
    localStorage.setItem('currency', newCur);
    window.dispatchEvent(new CustomEvent('currencyChange'));
  };

  useGSAP(() => {
    // Animaciones iniciales y de scroll ya están en los sub-componentes o se pueden centralizar aquí
    gsap.from('.hero-title span', {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'expo.out'
    });

    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 85%',
      },
      y: 40,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out'
    });

    gsap.from('.step-card', {
      scrollTrigger: {
        trigger: '.steps-grid',
        start: 'top 80%',
      },
      x: (i: number) => i % 2 === 0 ? -40 : 40,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: 'power4.out'
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A] font-dm-sans overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav currency={currency} onCurrencyChange={changeCurrency} />

      <main>
        <LandingHero />
        <LandingStats />
        <LandingSteps />
        <LandingMiniLanding />
        <LandingPlugin />
        <LandingPricing pricing={pricing} currency={currency} trm={trm} />
        <LandingReviews reviews={reviews} />
        <LandingPayments />
        <LandingFaq />
        
        {/* Sección: ¿Aún tienes dudas? (Integrada aquí por simplicidad) */}
        <section className="bg-[#0a0a0a] pb-40 px-6 md:px-12 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#141414] border border-white/5 rounded-[3.5rem] p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#FF5C3A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="text-center lg:text-left relative z-10">
                <h4 className="text-white font-jakarta font-bold text-4xl mb-4 tracking-tight">¿Aún tienes dudas?</h4>
                <p className="text-white/40 text-[15px] font-dm-sans font-medium max-w-sm">Charla con nuestro equipo de expertos ahora mismo.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-5 w-full lg:w-auto relative z-10 items-center font-dm-sans">
                <Link href="https://wa.me/573105436281" className="bg-[#25D366] text-white px-10 py-5 rounded-[2rem] font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-2xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 w-full sm:w-auto text-sm">
                  <MessageCircle size={20} fill="white" /> WhatsApp
                </Link>
                <Link href="mailto:info@lookitry.com" className="bg-[#1a1a1a] text-white px-10 py-5 rounded-[2rem] font-bold flex flex-col items-center justify-center gap-0 border border-white/10 hover:border-[#FF5C3A]/30 transition-all w-full sm:w-auto relative group/email">
                  <div className="flex items-center gap-2 mb-0.5">
                     <Mail size={16} className="text-white/60 group-hover/email:text-[#FF5C3A]" />
                     <span className="text-[14px]">Soporte</span>
                  </div>
                  <span className="text-[14px]">Email</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      {/* FLOATING CTA */}
      <div 
        ref={floatingCtaRef}
        className="fixed bottom-10 right-10 z-[100] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform opacity-100 translate-y-0"
      >
        <Link 
          href="/register" 
          className="flex items-center gap-3 bg-[#FF5C3A] text-white px-8 py-5 rounded-full font-bold shadow-2xl shadow-[#FF5C3A]/50 hover:scale-110 active:scale-95 transition-all group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none opacity-20" />
          <Zap size={20} className="fill-white" />
          <span className="tracking-tight">Probar mi marca ahora</span>
        </Link>
      </div>
    </div>
  );
}
