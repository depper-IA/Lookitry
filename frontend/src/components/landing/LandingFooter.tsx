'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, MessageCircle, ShieldCheck, Sun, Moon, ChevronDown } from 'lucide-react';
import { fetchPublicPaymentSettings, normalizeSocialUrl, toWhatsAppUrl } from '@/services/public-config.service';
import DynamicLoveAnimation from './DynamicLoveAnimation';

interface FooterSection {
  title: string;
  links: { name: string; href: string }[];
}

// Declarado FUERA del componente para evitar re-creación en cada render
// (si estuviera dentro, causaría un loop infinito en el useEffect que lo usa como dep)
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

  // Animation states
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
    // Sync theme on mount
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

  // Intersection Observer for footer entrance animation
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

  // Measure accordion content heights
  useEffect(() => {
    const heights: Record<string, number> = {};
    FOOTER_SECTIONS.forEach((section) => {
      if (accordionRefs.current[section.title]) {
        heights[section.title] = accordionRefs.current[section.title]!.scrollHeight;
      }
    });
    setMobileAccordionHeight(heights);
  }, []); // FOOTER_SECTIONS es constante de módulo, no cambia nunca

  const toggle = () => {
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

  return (
    <footer
      className="theme-bg-base theme-text relative z-10 overflow-x-hidden pt-12 sm:pt-20 md:pt-24 lg:pt-28 pb-20 md:pb-0"
      role="contentinfo"
      style={{
        opacity: footerVisible ? 1 : 0,
        transform: footerVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s cubic-bezier(${EASING.outQuart.join(',')}), transform 0.6s cubic-bezier(${EASING.outQuart.join(',')})`,
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
              transition: `opacity 0.5s cubic-bezier(${EASING.outQuart.join(',')}), transform 0.5s cubic-bezier(${EASING.outQuart.join(',')})`,
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
          <div
            className="mb-5 flex items-center justify-center gap-2.5"
            style={{
              opacity: footerVisible ? 1 : 0,
              transform: footerVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s cubic-bezier(${EASING.outQuart.join(',')}), transform 0.5s cubic-bezier(${EASING.outQuart.join(',')})`,
              transitionDelay: '0.15s',
            }}
          >
            {[
              { Icon: Instagram, href: socialLinks.instagram, label: 'Instagram' },
              { Icon: Facebook, href: socialLinks.facebook, label: 'Facebook' },
              { Icon: MessageCircle, href: socialLinks.whatsapp, label: 'WhatsApp' },
            ].map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/45 transition-all duration-300 hover:border-accent/30 hover:bg-accent/10 hover:text-accent hover:scale-110 sm:h-10 sm:w-10 dark:border-white/5 dark:bg-white/5 dark:text-white/40 dark:hover:border-accent/30 dark:hover:bg-accent/10 dark:hover:text-accent"
                aria-label={item.label}
              >
                <item.Icon size={16} aria-hidden="true" />
              </Link>
            ))}
            <Link
              href={socialLinks.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/45 transition-all duration-300 hover:border-accent/30 hover:bg-accent/10 hover:text-accent hover:scale-110 dark:border-white/5 dark:bg-white/5 dark:text-white/40 dark:hover:border-accent/30 dark:hover:bg-accent/10 dark:hover:text-accent"
              aria-label="TikTok"
              suppressHydrationWarning
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current transition-transform duration-300 hover:scale-110" aria-hidden="true" suppressHydrationWarning>
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
              </svg>
            </Link>
          </div>

          {/* Accordion Sections */}
          <div
            className="border-t border-black/5 dark:border-white/5"
            style={{
              opacity: footerVisible ? 1 : 0,
              transform: footerVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s cubic-bezier(${EASING.outQuart.join(',')}), transform 0.5s cubic-bezier(${EASING.outQuart.join(',')})`,
              transitionDelay: '0.2s',
            }}
          >
            {FOOTER_SECTIONS.map((section, sectionIdx) => (
              <div
                key={section.title}
                style={{
                  animation: footerVisible
                    ? `slideDown 0.4s cubic-bezier(${EASING.outQuint.join(',')}) ${0.25 + sectionIdx * 0.08}s forwards`
                    : 'none',
                  opacity: 0,
                }}
              >
                <button
                  onClick={() => toggleSection(section.title)}
                  className="group flex w-full items-center justify-between py-3 text-[10px] font-bold uppercase tracking-wider text-black/60 transition-colors duration-300 hover:text-accent dark:text-white/60 dark:hover:text-accent"
                  aria-expanded={openSections[section.title]}
                >
                  {section.title}
                  <ChevronDown
                    size={14}
                    className={`text-black/25 transition-all duration-300 group-hover:text-accent dark:text-white/25 dark:group-hover:text-accent ${openSections[section.title] ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    height: openSections[section.title] ? `${mobileAccordionHeight[section.title] || 200}px` : '0px',
                    opacity: openSections[section.title] ? 1 : 0,
                  }}
                >
                  <div
                    ref={(el) => { accordionRefs.current[section.title] = el; }}
                    className="-mt-0.5 pb-3"
                  >
                    <ul className="flex flex-col gap-0.5">
                      {section.links.map((item, linkIdx) => (
                        <li
                          key={item.name}
                          style={{
                            animation: openSections[section.title]
                              ? `fadeSlideIn 0.3s cubic-bezier(${EASING.outQuart.join(',')}) ${linkIdx * 0.05}s forwards`
                              : 'none',
                            opacity: 0,
                          }}
                        >
                          <Link
                            href={item.href}
                            className="block py-2 text-center text-xs text-black/45 transition-colors duration-300 hover:text-accent dark:text-white/35 dark:hover:text-accent"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div
            className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] font-medium text-black/35 dark:text-white/25"
            style={{
              opacity: footerVisible ? 1 : 0,
              transition: `opacity 0.5s cubic-bezier(${EASING.outQuart.join(',')})`,
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
        <div className="mb-16 hidden md:block lg:mb-20">
          <div className="grid grid-cols-2 gap-10 lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-20">
            {/* Brand Column */}
            <div
              style={{
                opacity: footerVisible ? 1 : 0,
                transform: footerVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `opacity 0.6s cubic-bezier(${EASING.outQuart.join(',')}), transform 0.6s cubic-bezier(${EASING.outQuart.join(',')})`,
                transitionDelay: '0.1s',
              }}
            >
              <Link href="/" className="group mb-6 inline-flex items-center gap-2.5 sm:mb-8 sm:gap-3 md:mb-10">
                <div className="relative h-8 w-8 transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9 md:h-10 md:w-10">
                  <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill sizes="32px" className="object-contain dark:hidden" />
                  <Image src="/logo.svg" alt="Lookitry" fill sizes="32px" className="hidden object-contain dark:block" />
                </div>
                <span className="font-jakarta text-2xl font-bold tracking-tighter text-black dark:text-white sm:text-3xl">
                  Look<span className="text-accent">itry</span>
                </span>
              </Link>
              <p className="mb-6 max-w-xs text-sm font-light leading-relaxed text-black/70 transition-colors duration-300 dark:text-white/70 sm:mb-8 sm:text-base">
                Empoderamos al retail con Inteligencia Artificial. La primera solución de visualización personalizada líder en Colombia y Latinoamérica.
              </p>
              <div className="mb-6 sm:mb-8 md:mb-10">
                <Link
                  href="/sobre-nosotros"
                  className="group relative border-b border-accent/30 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-accent transition-colors duration-300 hover:text-accent/80 sm:text-[11px] sm:tracking-[0.2em]"
                >
                  <span className="relative z-10">Conoce nuestra historia</span>
                  <span className="absolute bottom-0 left-0 h-full w-0 bg-accent/10 transition-all duration-300 group-hover:w-full" />
                </Link>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3">
                {[
                  { Icon: Instagram, href: socialLinks.instagram, label: 'Instagram' },
                  { Icon: Facebook, href: socialLinks.facebook, label: 'Facebook' },
                  { Icon: MessageCircle, href: socialLinks.whatsapp, label: 'WhatsApp' },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn group relative flex h-9 w-9 items-center justify-center rounded-lg border border-black/5 bg-black/5 text-black/60 transition-all duration-300 hover:border-accent/40 hover:bg-accent/10 hover:text-accent hover:scale-110 hover:shadow-[0_0_20px_rgba(255,92,58,0.15)] sm:h-10 sm:w-10 sm:rounded-xl md:h-11 md:w-11 dark:border-white/5 dark:bg-white/5 dark:text-white/60 dark:hover:border-accent/40 dark:hover:bg-accent/10 dark:hover:text-accent dark:hover:shadow-[0_0_20px_rgba(255,92,58,0.15)]"
                    aria-label={item.label}
                  >
                    <item.Icon size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:scale-110" />
                  </Link>
                ))}
                <Link
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn group relative flex h-9 w-9 items-center justify-center rounded-lg border border-black/5 bg-black/5 text-black/60 transition-all duration-300 hover:border-accent/40 hover:bg-accent/10 hover:text-accent hover:scale-110 hover:shadow-[0_0_20px_rgba(255,92,58,0.15)] sm:h-10 sm:w-10 sm:rounded-xl md:h-11 md:w-11 dark:border-white/5 dark:bg-white/5 dark:text-white/60 dark:hover:border-accent/40 dark:hover:bg-accent/10 dark:hover:text-accent dark:hover:shadow-[0_0_20px_rgba(255,92,58,0.15)]"
                  aria-label="TikTok"
                  suppressHydrationWarning
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current transition-transform duration-300 group-hover:scale-110 sm:h-4 sm:w-4" aria-hidden="true" suppressHydrationWarning>
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Link Columns */}
            {FOOTER_SECTIONS.map((section, sectionIdx) => (
              <div
                key={section.title}
                style={{
                  opacity: footerVisible ? 1 : 0,
                  transform: footerVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `opacity 0.6s cubic-bezier(${EASING.outQuart.join(',')}), transform 0.6s cubic-bezier(${EASING.outQuart.join(',')})`,
                  transitionDelay: `${0.2 + sectionIdx * 0.1}s`,
                }}
              >
                <h5 className="mb-6 font-jakarta text-[9px] font-bold uppercase tracking-[0.25em] text-black transition-colors duration-300 hover:text-accent dark:text-white sm:mb-8 sm:text-[10px] sm:tracking-[0.3em] md:mb-10">
                  {section.title}
                </h5>
                <ul className="flex flex-col gap-3 sm:gap-4 md:gap-5">
                  {section.links.map((item, linkIdx) => (
                    <li
                      key={item.name}
                      style={{
                        opacity: footerVisible ? 1 : 0,
                        transform: footerVisible ? 'translateY(0)' : 'translateY(15px)',
                        transition: `opacity 0.4s cubic-bezier(${EASING.outQuart.join(',')}), transform 0.4s cubic-bezier(${EASING.outQuart.join(',')})`,
                        transitionDelay: `${0.35 + sectionIdx * 0.08 + linkIdx * 0.05}s`,
                      }}
                    >
                      <Link
                        href={item.href}
                        className="group relative text-sm text-black/65 transition-colors duration-300 hover:text-accent dark:text-white/60 dark:hover:text-accent"
                      >
                        {item.name}
                        <span className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="mt-5 w-full bg-accent md:mt-0"
        style={{
          opacity: footerVisible ? 1 : 0,
          transition: `opacity 0.5s cubic-bezier(${EASING.outQuart.join(',')})`,
          transitionDelay: '0.5s',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-12 md:py-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Copyright */}
            <div className="font-dm-sans text-xs font-medium text-black/80 sm:text-sm flex items-center flex-wrap justify-center sm:justify-start">
              <span>© {currentYear} Lookitry · Hecho con</span>
              <DynamicLoveAnimation />
              <span>por</span>
              <Link
                href="https://wilkiedevs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold transition-colors duration-300 hover:text-white ml-1.5"
              >
                Wilkie Devs
              </Link>
            </div>

            {/* Trust badges & Theme toggle */}
            <div className="flex items-center gap-6 sm:gap-8">
              {/* Trust badge */}
              <div
                className="flex items-center gap-2 font-dm-sans text-xs font-medium text-black/80 transition-all duration-300 hover:text-black sm:text-sm"
              >
                <ShieldCheck
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-300 hover:scale-110"
                />
                <span className="relative">
                  Pagos seguros
                  <span className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-current transition-all duration-300 group-hover:w-full" />
                </span>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggle}
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="group flex items-center gap-2 rounded-full border border-black/20 px-4 py-2 text-xs font-medium text-black/90 transition-all duration-300 hover:border-text-primary/40 hover:bg-text-primary/10 hover:text-text-primary sm:text-sm"
              >
                {mounted ? (
                  isDark ? (
                    <>
                      <Sun
                        size={14}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:rotate-45"
                      />
                      <span className="relative z-10">Modo claro</span>
                    </>
                  ) : (
                    <>
                      <Moon
                        size={14}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:rotate-12"
                      />
                      <span className="relative z-10">Modo oscuro</span>
                    </>
                  )
                ) : (
                  <>
                    <Moon size={14} aria-hidden="true" />
                    <span className="relative z-10">Modo oscuro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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