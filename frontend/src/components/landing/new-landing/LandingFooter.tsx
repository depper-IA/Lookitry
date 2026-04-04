'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, MessageCircle, ShieldCheck, Sun, Moon, ChevronDown } from 'lucide-react';
import { fetchPublicPaymentSettings, normalizeSocialUrl, toWhatsAppUrl } from '@/services/public-config.service';

interface FooterSection {
  title: string;
  links: { name: string; href: string }[];
}

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [socialLinks, setSocialLinks] = useState({
    instagram: '#',
    facebook: '#',
    website: 'https://lookitry.com',
    whatsapp: '#',
    tiktok: '#',
  });

  const footerSections: FooterSection[] = [
    {
      title: 'Ecosistema',
      links: [
        { name: 'Probador Virtual', href: '/probador-virtual' },
        { name: 'Mini-Landing Pro', href: '/mini-landing' },
        { name: 'Plugin WooCommerce', href: '/plugin-woocommerce' },
        { name: 'API Developer', href: '/api-developer' },
        { name: 'Planes Mensuales', href: '/planes' },
      ],
    },
    {
      title: 'Recursos',
      links: [
        { name: 'Centro de Ayuda', href: '/ayuda' },
        { name: 'Blog Tecnico', href: '/blog' },
        { name: 'Sobre Nosotros', href: '/sobre-nosotros' },
        { name: 'Casos de Uso', href: '/casos-de-exito' },
        { name: 'Estado del sistema', href: '/estado' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terminos de Servicio', href: '/terminos' },
        { name: 'Politicas de Privacidad', href: '/politicas-privacidad' },
        { name: 'Politica de Uso', href: '/politica-de-uso' },
        { name: 'Cookies', href: '/cookies' },
        { name: 'Aviso Legal', href: '/aviso-legal' },
      ],
    },
  ];

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
      .catch(() => {});
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    syncTheme();
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
    <footer className="theme-bg-base theme-text relative z-10 -mb-16 overflow-x-hidden pt-12 sm:pt-20 md:mb-0 md:pt-24 lg:pt-28" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12">
        <div className="mb-0 md:hidden">
          <div className="mb-5 flex flex-col items-center text-center">
            <Link href="/" className="group mb-3 inline-flex items-center gap-2.5">
              <div className="relative h-7 w-7">
                <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className="object-contain dark:hidden" />
                <Image src="/logo.svg" alt="Lookitry" fill className="hidden object-contain dark:block" />
              </div>
              <span className="font-jakarta text-lg font-bold tracking-tighter text-[#0a0a0a] dark:text-white">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>
            <p className="max-w-[260px] text-xs leading-relaxed text-black/50 dark:text-white/40">
              Empoderamos al retail con Inteligencia Artificial.
            </p>
          </div>

          <div className="mb-5 flex items-center justify-center gap-2.5">
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/45 transition-all duration-300 hover:border-[#FF5C3A] hover:bg-[#FF5C3A] hover:text-white dark:border-white/5 dark:bg-white/5 dark:text-white/40"
                aria-label={item.label}
              >
                <item.Icon size={16} aria-hidden="true" />
              </Link>
            ))}
            <Link
              href={socialLinks.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/45 transition-all duration-300 hover:border-[#FF5C3A] hover:bg-[#FF5C3A] hover:text-white dark:border-white/5 dark:bg-white/5 dark:text-white/40"
              aria-label="TikTok"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
              </svg>
            </Link>
          </div>

          <div className="border-t border-black/5 dark:border-white/5">
            {footerSections.map((section) => (
              <div key={section.title} className="border-b border-black/5 dark:border-white/5">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="group flex w-full items-center justify-between py-3 text-[10px] font-bold uppercase tracking-wider text-black/60 transition-colors hover:text-[#FF5C3A] dark:text-white/60"
                  aria-expanded={openSections[section.title]}
                >
                  {section.title}
                  <ChevronDown
                    size={14}
                    className={`text-black/25 transition-all group-hover:text-[#FF5C3A] dark:text-white/25 ${
                      openSections[section.title] ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections[section.title] && (
                  <div className="-mt-0.5 pb-3">
                    <ul className="flex flex-col gap-0.5">
                      {section.links.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className="block py-2 text-center text-xs text-black/45 transition-colors hover:text-[#FF5C3A] dark:text-white/35"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] font-medium text-black/35 dark:text-white/25">
            <Link href="/contacto" className="transition-colors hover:text-[#FF5C3A]">
              Contacto
            </Link>
            <Link href="/sobre-nosotros" className="transition-colors hover:text-[#FF5C3A]">
              Nosotros
            </Link>
            <Link href="/estado" className="transition-colors hover:text-[#FF5C3A]">
              Estado
            </Link>
          </div>
        </div>

        <div className="mb-16 hidden grid-cols-1 gap-10 sm:mb-20 sm:grid sm:grid-cols-2 sm:gap-14 md:mb-24 md:gap-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-20">
          <div>
            <Link href="/" className="group mb-6 inline-flex items-center gap-2.5 sm:mb-8 sm:gap-3 md:mb-10">
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className="object-contain dark:hidden" />
                <Image src="/logo.svg" alt="Lookitry" fill className="hidden object-contain dark:block" />
              </div>
              <span className="font-jakarta text-2xl font-bold tracking-tighter text-[#0a0a0a] dark:text-white sm:text-3xl">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>
            <p className="mb-6 max-w-xs text-sm font-light leading-relaxed text-black/70 dark:text-white/70 sm:mb-8 sm:text-base">
              Empoderamos al retail con Inteligencia Artificial. La primera solucion de visualizacion personalizada lider en Colombia y Latinoamerica.
            </p>
            <div className="mb-6 sm:mb-8 md:mb-10">
              <Link
                href="/sobre-nosotros"
                className="border-b border-[#FF5C3A]/30 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF5C3A] transition-colors hover:text-[#FF5C3A]/80 sm:text-[11px] sm:tracking-[0.2em]"
              >
                Conoce nuestra historia
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/5 bg-black/5 text-black/60 transition-all duration-300 hover:border-[#FF5C3A] hover:bg-[#FF5C3A] hover:text-white sm:h-10 sm:w-10 sm:rounded-xl md:h-11 md:w-11 dark:border-white/5 dark:bg-white/5 dark:text-white/60"
                  aria-label={item.label}
                >
                  <item.Icon size={18} aria-hidden="true" />
                </Link>
              ))}
              <Link
                href={socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/5 bg-black/5 text-black/60 transition-all duration-300 hover:border-[#FF5C3A] hover:bg-[#FF5C3A] hover:text-white sm:h-10 sm:w-10 sm:rounded-xl md:h-11 md:w-11 dark:border-white/5 dark:bg-white/5 dark:text-white/60"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                </svg>
              </Link>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h5 className="mb-6 font-jakarta text-[9px] font-bold uppercase tracking-[0.25em] text-[#0a0a0a] dark:text-white sm:mb-8 sm:text-[10px] sm:tracking-[0.3em] md:mb-10">
                {section.title}
              </h5>
              <ul className="flex flex-col gap-3 sm:gap-4 md:gap-5">
                {section.links.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-black/65 transition-colors hover:text-[#FF5C3A] dark:text-white/60">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 w-full bg-[#FF5C3A] md:mt-0">
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-8 md:px-12 md:py-8">
          <div className="text-center font-dm-sans text-[8px] font-bold uppercase tracking-[0.2em] text-white/80 sm:text-[10px] sm:tracking-[0.3em]">
            © {currentYear} Lookitry / Un producto de{' '}
            <Link href="https://wilkiedevs.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
              Wilkie Devs
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 opacity-60 sm:gap-8 md:gap-10">
            <div className="flex items-center gap-1.5 font-dm-sans text-[8px] font-bold uppercase tracking-widest text-white/90 sm:gap-2 sm:text-[9px]">
              <ShieldCheck size={14} aria-hidden="true" /> Pagos seguros
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={toggle}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-medium text-white/90 transition-all hover:border-[#FF8A70] hover:bg-[#FF8A70]/20 hover:text-white"
            >
              {isDark ? (
                <>
                  <Sun size={14} aria-hidden="true" /> Modo claro
                </>
              ) : (
                <>
                  <Moon size={14} aria-hidden="true" /> Modo oscuro
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
