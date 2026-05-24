'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchPublicPaymentSettings, normalizeSocialUrl, toWhatsAppUrl } from '@/services/public-config.service';

// Subcomponents
import { FooterSocialButtons } from './footer/FooterSocialButtons';
import { FooterAccordion } from './footer/FooterAccordion';
import { FooterDesktopGrid } from './footer/FooterDesktopGrid';
import { FooterBottomBar } from './footer/FooterBottomBar';

interface FooterSection {
  title: string;
  links: { name: string; href: string }[];
}

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Ecosistema',
    links: [
      { name: 'Probador Virtual', href: '/probador-virtual' },
      { name: 'Tienda Virtual', href: '/mini-landing' },
      { name: 'Plugin WooCommerce', href: '/plugin-woocommerce' },
      { name: 'API Developer', href: '/api-developer' },
      { name: 'Planes', href: '/planes' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { name: 'Centro de Ayuda', href: '/ayuda' },
      { name: 'Lookitry Blog', href: '/blog' },
      { name: 'Sobre Nosotros', href: '/sobre-nosotros' },
      { name: 'Casos de Uso', href: '/casos-de-exito' },
      { name: 'Estado del sistema', href: '/estado' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Términos de Servicio', href: '/terminos' },
      { name: 'Políticas de Privacidad', href: '/politicas-privacidad' },
      { name: 'Política de Uso', href: '/politica-de-uso' },
      { name: 'Cookies', href: '/cookies' },
      { name: 'Aviso Legal', href: '/aviso-legal' },
    ],
  },
];

const EASING = {
  outQuart: [0.25, 1, 0.5, 1] as const,
  outQuint: [0.22, 1, 0.36, 1] as const,
  outExpo: [0.16, 1, 0.3, 1] as const,
};

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [socialLinks, setSocialLinks] = useState({
    instagram: '#',
    facebook: '#',
    website: 'https://lookitry.com',
    whatsapp: '#',
    tiktok: '#',
  });

  const [footerVisible, setFooterVisible] = useState(false);
  const [mobileAccordionHeight, setMobileAccordionHeight] = useState<Record<string, number>>({});
  const accordionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchPublicPaymentSettings()
      .then((settings) => {
        if (!settings) return;

        const instagramUrl = normalizeSocialUrl('instagram', settings.socialInstagram);
        const facebookUrl = normalizeSocialUrl('facebook', settings.socialFacebook);
        const tiktokUrl = normalizeSocialUrl('tiktok', settings.socialTiktok);
        const whatsappUrl = toWhatsAppUrl(settings.manualWhatsapp);

        setSocialLinks({
          instagram: instagramUrl || '#',
          facebook: facebookUrl || '#',
          website: 'https://lookitry.com',
          whatsapp: whatsappUrl || '#',
          tiktok: tiktokUrl || '#',
        });
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    setMounted(true);

    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      const stored = localStorage.getItem('theme');
      if (!stored) {
        document.documentElement.classList.toggle('dark', event.matches);
        syncTheme();
      }
    };

    window.addEventListener('themechange', syncTheme);
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => {
      window.removeEventListener('themechange', syncTheme);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFooterVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const footer = document.querySelector('footer');
    if (footer) observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const heights: Record<string, number> = {};
    FOOTER_SECTIONS.forEach((section) => {
      if (accordionRefs.current[section.title]) {
        heights[section.title] = accordionRefs.current[section.title]!.scrollHeight;
      }
    });
    setMobileAccordionHeight(heights);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    window.dispatchEvent(new Event('themechange'));
  };

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const easingQuartArr = Array.from(EASING.outQuart);
  const easingQuintArr = Array.from(EASING.outQuint);

  return (
    <footer
      className="theme-bg-base theme-text relative z-10 overflow-x-hidden pt-12 sm:pt-20 md:pt-24 lg:pt-28 pb-20 md:pb-0"
      role="contentinfo"
      style={{
        opacity: footerVisible ? 1 : 0,
        transform: footerVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s cubic-bezier(${easingQuartArr.join(',')}), transform 0.6s cubic-bezier(${easingQuartArr.join(',')})`,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12">
        {/* Mobile Accordion */}
        <div className="mb-0 md:hidden">
          {/* Logo & Tagline */}
          <div
            className="mb-5 flex flex-col items-center text-center"
            style={{
              opacity: footerVisible ? 1 : 0,
              transform: footerVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s cubic-bezier(${easingQuartArr.join(',')}), transform 0.5s cubic-bezier(${easingQuartArr.join(',')})`,
              transitionDelay: '0.1s',
            }}
          >
            <Link href="/" className="group mb-3 inline-flex items-center gap-2.5">
              <div className="relative h-7 w-7 transition-transform duration-300 group-hover:scale-110">
                <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className="object-contain dark:hidden" />
                <Image src="/logo.svg" alt="Lookitry" fill className="hidden object-contain dark:block" />
              </div>
              <span className="font-jakarta text-lg font-bold tracking-tighter text-black dark:text-white">
                Look<span className="text-accent">itry</span>
              </span>
            </Link>
            <p className="max-w-[260px] text-xs leading-relaxed text-black/50 dark:text-white/40">
              Empoderamos al retail con Inteligencia Artificial.
            </p>
          </div>

          {/* Social Buttons */}
          <FooterSocialButtons 
            socialLinks={socialLinks} 
            className="mb-5 justify-center" 
          />

          {/* Accordion Sections */}
          <FooterAccordion 
            sections={FOOTER_SECTIONS}
            openSections={openSections}
            toggleSection={toggleSection}
            mobileAccordionHeight={mobileAccordionHeight}
            accordionRefs={accordionRefs}
            footerVisible={footerVisible}
            easingQuint={easingQuintArr}
            easingQuart={easingQuartArr}
          />

          {/* Quick Links */}
          <div
            className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] font-medium text-black/35 dark:text-white/25"
            style={{
              opacity: footerVisible ? 1 : 0,
              transition: `opacity 0.5s cubic-bezier(${easingQuartArr.join(',')})`,
              transitionDelay: '0.4s',
            }}
          >
            {[
              { href: '/contacto', label: 'Contacto' },
              { href: '/sobre-nosotros', label: 'Nosotros' },
              { href: '/estado', label: 'Estado' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative transition-colors duration-300 hover:text-accent after:absolute after:-bottom-0.5 after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <FooterDesktopGrid 
          sections={FOOTER_SECTIONS}
          socialLinks={socialLinks}
          footerVisible={footerVisible}
          easingQuart={easingQuartArr}
        />
      </div>

      {/* Bottom Bar */}
      <div
        className="mt-5 w-full bg-accent md:mt-0"
        style={{
          opacity: footerVisible ? 1 : 0,
          transition: `opacity 0.5s cubic-bezier(${easingQuartArr.join(',')})`,
          transitionDelay: '0.5s',
        }}
      >
        <FooterBottomBar 
          currentYear={currentYear}
          isDark={isDark}
          toggleTheme={toggleTheme}
          mounted={mounted}
        />
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </footer>
  );
}
