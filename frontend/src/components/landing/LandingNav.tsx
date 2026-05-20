'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Zap, User, LogOut, ArrowRight, Layers, ShoppingBag, Code2, Upload, Smartphone, TrendingUp, Share2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { usePromoBanner } from '@/contexts/PromoBannerContext';
import { usePublicSession } from '@/hooks/usePublicSession';
import { useTheme } from '@/contexts/ThemeContext';
import { formatPrice } from '@/utils/currency';
import { Sun, Moon } from 'lucide-react';

const EASING_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const mobileMenuVariants = {
  hidden: { opacity: 0, x: '100%', transition: { duration: 0.3, ease: EASING_OUT } },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASING_OUT } },
  exit: { opacity: 0, x: '100%', transition: { duration: 0.25, ease: EASING_OUT } },
};

const mobileCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.3, ease: EASING_OUT } },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, duration: 0.4, ease: EASING_OUT },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};

const DEFAULT_TRIAL_PRICE_COP = 20000;
const DEFAULT_BASIC_PRICE_COP = 180000;

interface LandingNavProps {
  transparent?: boolean;
  currency?: 'COP' | 'USD';
  onCurrencyChange?: (c: 'COP' | 'USD') => void;
}

const PANEL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function LandingNav({
  transparent,
  currency: externalCurrency,
  onCurrencyChange: externalOnCurrencyChange,
}: LandingNavProps) {
  const { bannerHeight } = usePromoBanner();
  const [internalCurrency, setInternalCurrency] = useState<'COP' | 'USD'>('COP');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [hoverMenu, setHoverMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { session } = usePublicSession();

  const handleMouseEnter = (menuId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoverMenu(menuId);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setHoverMenu(null);
    }, 300);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (
        hoverMenu &&
        howItWorksRef.current && !howItWorksRef.current.contains(e.target as Node) &&
        productsRef.current && !productsRef.current.contains(e.target as Node)
      ) {
        setHoverMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hoverMenu]);

  useEffect(() => {
    setMounted(true);
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setHoverMenu(null);
        setDropdownOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  const { toggleTheme, isDark } = useTheme();
  const [trialPriceCOP, setTrialPriceCOP] = useState(DEFAULT_TRIAL_PRICE_COP);
  const [basicPriceCOP, setBasicPriceCOP] = useState(DEFAULT_BASIC_PRICE_COP);
  const [trm, setTrm] = useState(3900);
  const [trialDataFetched, setTrialDataFetched] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setNavVisible(true); observer.disconnect(); } },
      { threshold: 0.1 },
    );
    const nav = document.querySelector('nav');
    if (nav) observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparent]);

  const fetchTrialDataIfNeeded = () => {
    if (trialDataFetched) return;
    setTrialDataFetched(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    Promise.all([
      fetch(`${apiUrl}/api/trial/status`).then(r => r.ok ? r.json() : null),
      fetch(`${apiUrl}/api/payment-settings/public`).then(r => r.ok ? r.json() : null),
      fetch(`${apiUrl}/api/pricing-config`).then(r => r.ok ? r.json() : null),
    ])
      .then(([trialData, paySettings, pricingData]) => {
        if (trialData?.priceCOP && Number(trialData.priceCOP) > 0) setTrialPriceCOP(Number(trialData.priceCOP));
        if (paySettings?.trm && Number(paySettings.trm) > 0) setTrm(Number(paySettings.trm));
        if (pricingData?.basic?.precio_mensual_cop) setBasicPriceCOP(Number(pricingData.basic.precio_mensual_cop));
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!externalCurrency) {
      const saved = localStorage.getItem('currency') as 'COP' | 'USD';
      if (saved) setInternalCurrency(saved);
    }
  }, [externalCurrency]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const currency = externalCurrency || internalCurrency;

  const onCurrencyChange = (c: 'COP' | 'USD') => {
    fetchTrialDataIfNeeded();
    if (externalOnCurrencyChange) {
      externalOnCurrencyChange(c);
    } else {
      setInternalCurrency(c);
      localStorage.setItem('currency', c);
      window.dispatchEvent(new Event('currencyChange'));
    }
  };

  async function handleLogout() {
    await authService.logout();
    setDropdownOpen(false);
    window.location.href = '/';
  }

  const initials = session?.name
    ? session.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const menuLinks = [{ label: 'Planes', href: '/planes' }];

  const howItWorksSteps = [
    { icon: Upload, label: 'Subí tu catálogo', desc: 'WooCommerce, Shopify o manual en minutos.' },
    { icon: Zap, label: 'IA genera el probador', desc: 'Sin código. Listo para usar al instante.' },
    { icon: Share2, label: 'Compartí con clientes', desc: 'Por WhatsApp, Instagram o en tu tienda.' },
    { icon: TrendingUp, label: 'Más ventas, menos devoluciones', desc: 'Clientes compran con confianza real.' },
  ];

  const howItWorksLinks = [
    { label: 'Ver demo en vivo', href: '/demo', highlight: true },
    { label: 'Casos de éxito', href: '/casos-de-exito', highlight: false },
    { label: 'Blog', href: '/blog', highlight: false },
    { label: 'Sobre nosotros', href: '/sobre-nosotros', highlight: false },
  ];

  const productLinks = [
    { title: 'Probador', desc: 'Pruébalo antes de comprar.', href: 'https://lookitry.com/probador-virtual' },
    { title: 'Tienda Virtual', desc: 'Tu vitrina interactiva lista para vender.', href: '/mini-landing' },
    { title: 'WooCommerce Plugin', desc: 'Automatiza tu probador virtual.', href: '/plugin-woocommerce' },
    { title: 'API Developer Hub', desc: 'IA nativa en tu propia app.', href: '/api-developer' },
  ];

  const isHeroMode = transparent && !scrolled;
  const navBg = isHeroMode
    ? 'bg-transparent'
    : 'bg-white dark:bg-black';

  return (
    <>
      <nav
        className={`${transparent ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-[70] w-full px-4 py-4 sm:px-6 sm:py-5 md:px-12 transition-all duration-300 ${navBg}`}
        role="navigation"
        aria-label="Navegacion principal"
        style={{
          opacity: (transparent || navVisible) ? 1 : 0,
          transform: (transparent || navVisible) ? 'translateY(0)' : 'translateY(-10px)',
          transition: `opacity 0.5s cubic-bezier(${EASING_OUT.join(',')}), transform 0.5s cubic-bezier(${EASING_OUT.join(',')})`,
          top: transparent ? bannerHeight : undefined,
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* ── Logo + currency ── */}
          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/" className="nav-logo flex shrink-0 items-center gap-2.5 group" aria-label="Lookitry - Inicio">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 transition-transform duration-300 group-hover:scale-110">
                <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className={`object-contain transition-opacity duration-300 ${isHeroMode ? 'opacity-0' : 'dark:opacity-0 opacity-100'}`} priority />
                <Image src="/logo.svg" alt="Lookitry" fill className={`object-contain transition-opacity duration-300 ${isHeroMode ? 'opacity-100' : 'dark:opacity-100 opacity-0'}`} priority />
              </div>
              <span className={`nav-logo-text font-jakarta text-xl font-bold tracking-tighter sm:text-2xl transition-colors duration-300 group-hover:text-dark dark:group-hover:text-white ${isHeroMode ? 'text-white' : 'text-black dark:text-white'}`}>
                Look<span className="text-accent">itry</span>
              </span>
            </Link>

            <div
              className={`ml-1 hidden items-center gap-2 rounded-full border px-2.5 py-1.5 sm:ml-2 sm:flex sm:px-3 ${isHeroMode ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5'}`}
              role="group"
              aria-label="Selector de moneda"
            >
              <button
                onClick={() => onCurrencyChange('COP')}
                aria-pressed={currency === 'COP'}
                className={`nav-currency-btn cursor-pointer text-[9px] font-bold uppercase transition-all duration-200 sm:text-[8px] ${currency === 'COP' ? 'text-accent scale-110' : (isHeroMode ? 'text-white/50 hover:text-white' : 'text-black/45 hover:text-dark dark:text-white/50 dark:hover:text-white')}`}
              >
                COP
              </button>
              <div className={`h-2.5 w-[1px] ${isHeroMode ? 'bg-white/10' : 'bg-black/10 dark:bg-white/10'}`} aria-hidden="true" />
              <button
                onClick={() => onCurrencyChange('USD')}
                aria-pressed={currency === 'USD'}
                className={`nav-currency-btn cursor-pointer text-[9px] font-bold uppercase transition-all duration-200 sm:text-[8px] ${currency === 'USD' ? 'text-accent scale-110' : (isHeroMode ? 'text-white/50 hover:text-white' : 'text-black/45 hover:text-dark dark:text-white/50 dark:hover:text-white')}`}
              >
                USD
              </button>
            </div>
          </div>

          {/* ── Center nav — CSS-only megamenus ── */}
          <div className="hidden grow items-stretch justify-center gap-4 lg:flex xl:gap-8">

            {/* TRIGGER 1 — Cómo funciona */}
            <div
              ref={howItWorksRef}
              className="level1-item flex items-center"
              onMouseEnter={() => handleMouseEnter('howItWorks')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                aria-haspopup="true"
                aria-expanded={hoverMenu === 'howItWorks'}
                className={`nav-products-btn flex h-full items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${isHeroMode ? 'text-white/80 hover:text-white' : 'text-black/60 hover:text-dark dark:text-white/60 dark:hover:text-white'}`}
                style={{ color: hoverMenu === 'howItWorks' ? 'var(--accent)' : undefined }}
              >
                Cómo funciona
                <ChevronDown
                  size={12}
                  className="transition-transform duration-300"
                  style={{ transform: hoverMenu === 'howItWorks' ? 'rotate(180deg)' : undefined }}
                  aria-hidden="true"
                />
              </button>

              {/* HOW panel */}
              <div
                className={`absolute top-full left-0 right-0 z-50 ${hoverMenu === 'howItWorks' ? 'pointer-events-auto' : 'pointer-events-none'}`}
                style={{ overflow: 'hidden' }}
                onMouseEnter={() => handleMouseEnter('howItWorks')}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  className="w-full bg-white dark:bg-black shadow-2xl shadow-black/10 dark:shadow-black/40 -translate-y-[calc(100%+1px)] transition-transform duration-[300ms] will-change-transform"
                  style={{
                    transitionTimingFunction: PANEL_EASE,
                    transform: hoverMenu === 'howItWorks' ? 'translateY(0)' : undefined,
                    opacity: hoverMenu === 'howItWorks' ? 1 : 0,
                  }}
                  role="menu"
                >
                  {/* Content fades+slides in after panel arrives */}
                  <div
                    className="opacity-0 -translate-y-3 transition-[opacity,transform] duration-[280ms]"
                    style={{
                      transitionTimingFunction: PANEL_EASE,
                      opacity: hoverMenu === 'howItWorks' ? 1 : 0,
                      transform: hoverMenu === 'howItWorks' ? 'translateY(0)' : undefined,
                      transitionDelay: hoverMenu === 'howItWorks' ? '150ms' : '0ms',
                    }}
                  >
                    <div className="mx-auto max-w-7xl px-6 md:px-12 py-7">
                      <div className="flex gap-4" style={{ height: 300 }}>

                        {/* HERO card — Demo en vivo (~55%) */}
                        <Link
                          href="/demo"
                          className="group relative overflow-hidden rounded-2xl flex-[1.4] shrink-0 block"
                        >
                          <Image
                            src="/megamenu/demo-en-vivo.webp"
                            alt="Demo en vivo"
                            fill
                            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                            sizes="50vw"
                            priority
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/5" />
                          <div className="absolute top-4 left-4">
                            <span className="inline-block rounded-full bg-accent px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                              Demo interactivo
                            </span>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-5">
                            <h3 className="text-[22px] font-black text-white leading-tight mb-1">
                              Probalo en vivo
                            </h3>
                            <p className="text-[12px] text-white/70 mb-4 leading-snug">
                              Mirá cómo tu cliente se prueba ropa virtualmente antes de comprar.
                            </p>
                            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-[11px] font-bold text-white transition-all duration-200 group-hover:bg-accent group-hover:gap-3">
                              Ver demo <ArrowRight size={12} />
                            </div>
                          </div>
                        </Link>

                        {/* Columna derecha */}
                        <div className="flex flex-col gap-3 flex-1 min-w-0">
                          <Link
                            href="/casos-de-exito"
                            className="group relative overflow-hidden rounded-2xl flex-1 block"
                          >
                            <Image src="/megamenu/casos-exito.webp" alt="Casos de éxito" fill className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.05]" sizes="25vw" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />
                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <p className="text-[13px] font-black text-white leading-tight">Casos de éxito</p>
                              <p className="text-[10px] text-white/65 mt-0.5">Marcas reales que ya venden más.</p>
                            </div>
                            <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 group-hover:bg-accent group-hover:scale-110">
                              <ArrowRight size={11} className="text-white" />
                            </div>
                          </Link>

                          <Link
                            href="/blog"
                            className="group relative overflow-hidden rounded-2xl flex-1 block"
                          >
                            <Image src="/megamenu/blog-recursos.webp" alt="Blog y recursos" fill className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.05]" sizes="25vw" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />
                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <p className="text-[13px] font-black text-white leading-tight">Blog y recursos</p>
                              <p className="text-[10px] text-white/65 mt-0.5">Guías prácticas para tu e-commerce.</p>
                            </div>
                            <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 group-hover:bg-accent group-hover:scale-110">
                              <ArrowRight size={11} className="text-white" />
                            </div>
                          </Link>

                          {/* Stats + CTA */}
                          <div className="flex items-center gap-5 px-1 pt-1">
                            {[
                              { value: '30s', label: 'genera prueba' },
                              { value: '40%', label: 'menos dev.' },
                              { value: '+1K', label: 'marcas' },
                            ].map(stat => (
                              <div key={stat.value} className="flex items-baseline gap-1.5">
                                <span className="text-[20px] font-black text-accent leading-none">{stat.value}</span>
                                <span className="text-[9px] text-text-secondary">{stat.label}</span>
                              </div>
                            ))}
                            <Link
                              href="/trial-checkout"
                              className="ml-auto flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[10px] font-black text-white transition-all duration-200 hover:bg-accent-bright shrink-0"
                            >
                              Empezar gratis <ArrowRight size={9} />
                            </Link>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TRIGGER 2 — Productos */}
            <div
              ref={productsRef}
              className="level1-item flex items-center"
              onMouseEnter={() => handleMouseEnter('products')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                aria-haspopup="true"
                aria-expanded={hoverMenu === 'products'}
                className={`nav-products-btn flex h-full items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${isHeroMode ? 'text-white/80 hover:text-white' : 'text-black/60 hover:text-dark dark:text-white/60 dark:hover:text-white'}`}
                style={{ color: hoverMenu === 'products' ? 'var(--accent)' : undefined }}
              >
                Productos
                <ChevronDown
                  size={12}
                  className="transition-transform duration-300"
                  style={{ transform: hoverMenu === 'products' ? 'rotate(180deg)' : undefined }}
                  aria-hidden="true"
                />
              </button>

              {/* PRODUCTS panel */}
              <div
                className={`absolute top-full left-0 right-0 z-50 ${hoverMenu === 'products' ? 'pointer-events-auto' : 'pointer-events-none'}`}
                style={{ overflow: 'hidden' }}
                onMouseEnter={() => handleMouseEnter('products')}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  className="w-full bg-white dark:bg-black shadow-2xl shadow-black/10 dark:shadow-black/40 -translate-y-[calc(100%+1px)] transition-transform duration-[300ms] will-change-transform"
                  style={{
                    transitionTimingFunction: PANEL_EASE,
                    transform: hoverMenu === 'products' ? 'translateY(0)' : undefined,
                    opacity: hoverMenu === 'products' ? 1 : 0,
                  }}
                  role="menu"
                >
                  <div
                    className="opacity-0 -translate-y-3 transition-[opacity,transform] duration-[280ms]"
                    style={{
                      transitionTimingFunction: PANEL_EASE,
                      opacity: hoverMenu === 'products' ? 1 : 0,
                      transform: hoverMenu === 'products' ? 'translateY(0)' : undefined,
                      transitionDelay: hoverMenu === 'products' ? '150ms' : '0ms',
                    }}
                  >
                    <div className="mx-auto max-w-7xl px-6 md:px-12 py-8">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-text-secondary mb-6">
                        Nuestros productos
                      </p>
                      <div className="flex gap-10">

                        {/* Product list */}
                        <div className="flex-1 grid grid-cols-2 gap-1">
                          {[
                            { href: productLinks[0].href, icon: Layers, title: 'Probador Virtual', desc: 'Tus clientes se prueban la ropa virtualmente antes de comprar.', badge: 'Más popular', logo: null },
                            { href: productLinks[1].href, icon: Smartphone, title: 'Tienda Virtual', desc: 'Tu vitrina interactiva lista para compartir y vender.', badge: null, logo: null },
                            { href: productLinks[2].href, icon: ShoppingBag, title: 'Plugin WooCommerce', desc: 'Integrá el probador a tu WordPress en minutos, sin código.', badge: null, logo: '/integrations/Woo_logo_color.png' },
                            { href: productLinks[3].href, icon: Code2, title: 'API Developer Hub', desc: 'Usá nuestra IA directamente desde tu propia app o plataforma.', badge: null, logo: null },
                          ].map(({ href, icon: Icon, title, desc, badge, logo }) => (
                            <Link
                              key={href}
                              href={href}
                              className="group flex items-start gap-4 rounded-2xl px-4 py-4 transition-all duration-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                            >
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-200 group-hover:bg-accent group-hover:text-white">
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-[12px] font-bold text-dark dark:text-white group-hover:text-accent transition-colors duration-200">{title}</p>
                                  {badge && (
                                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-accent">
                                      {badge}
                                    </span>
                                  )}
                                  {logo && (
                                    <Image src={logo} alt="" width={48} height={16} className="object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                                <p className="text-[10px] text-text-secondary leading-snug">{desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {/* CTA lateral */}
                        <div className="w-52 shrink-0 flex flex-col rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
                          <div className="relative h-36">
                            <Image src="/megamenu/productos-cta.webp" alt="Trial Lookitry" fill className="object-cover object-center" sizes="208px" quality={90} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-3">
                              <p className="text-[13px] font-black text-white leading-tight">Probalo 7 días</p>
                              <p className="text-[10px] text-white/65">sin riesgo</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 p-3">
                            {['Sin tarjeta de crédito', 'Setup en 2 minutos', 'Soporte en español'].map(item => (
                              <div key={item} className="flex items-center gap-1.5">
                                <svg className="w-2.5 h-2.5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-[9px] text-text-secondary">{item}</span>
                              </div>
                            ))}
                            <Link
                              href="/trial-checkout"
                              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-[11px] font-black text-white transition-all duration-200 hover:bg-accent-bright"
                            >
                              Comenzar trial <ArrowRight size={10} />
                            </Link>
                            <Link
                              href="/planes"
                              className="text-center text-[9px] text-text-secondary hover:text-accent transition-colors"
                            >
                              Planes desde {formatPrice(basicPriceCOP, currency, trm)}
                            </Link>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regular links */}
            {menuLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-link group relative text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${isHeroMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-dark dark:text-white/60 dark:hover:text-white'}`}
              >
                {item.label}
                <span className="nav-link-underline absolute bottom-0 left-0 right-0 h-[1px] origin-center scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            {mounted && session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="nav-user-btn group flex items-center gap-2 rounded-full border border-black/10 bg-black/5 p-1 pr-3 transition-all duration-300 hover:bg-black/10 hover:border-black/15 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/15"
                >
                  <div className="nav-user-avatar flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white transition-transform duration-300 sm:h-8 sm:w-8 group-hover:scale-105">
                    {initials}
                  </div>
                  <div className="mr-1 hidden flex-col items-start sm:flex">
                    <span className="max-w-[100px] truncate text-[10px] font-bold text-dark dark:text-white">{session.name}</span>
                    <span className="text-[8px] uppercase tracking-widest leading-none text-black/30 dark:text-white/30">Mi Panel</span>
                  </div>
                  <ChevronDown size={14} className={`text-black/20 transition-transform duration-300 dark:text-white/20 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200 absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-black/10 bg-white py-2 shadow-2xl dark:border-white/10 dark:bg-dark-card">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="nav-dropdown-link group flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <User size={16} className="text-black/30 transition-colors duration-200 group-hover:text-accent dark:text-white/30" />
                      <span className="text-[12px] font-bold text-black/80 transition-colors duration-200 group-hover:text-dark dark:text-white/80 dark:group-hover:text-white">
                        Dashboard General
                      </span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="nav-dropdown-logout group flex w-full items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-red-500/10"
                    >
                      <LogOut size={16} className="text-black/30 transition-colors duration-200 group-hover:text-red-500 dark:text-white/30" />
                      <span className="text-[12px] font-bold text-black/80 transition-colors duration-200 group-hover:text-red-500 dark:text-white/80">
                        Cerrar Sesión
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`nav-login-link hidden text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 sm:block ${isHeroMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-dark dark:text-white/60 dark:hover:text-white'}`}
              >
                Ingresar
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className={`nav-theme-btn flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 hover:border-accent/40 hover:text-accent ${isHeroMode ? 'border-white/10 bg-white/5 text-white/60 hover:text-white' : 'border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-accent'}`}
              aria-label={mounted && isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={mounted && isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {mounted && isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <Link
              href="/trial-checkout"
              onMouseEnter={fetchTrialDataIfNeeded}
              onFocus={fetchTrialDataIfNeeded}
              className="nav-trial-btn group relative hidden overflow-hidden rounded-full bg-accent px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-accent/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/30 active:scale-95 sm:px-8 sm:py-3.5 md:inline-flex"
            >
              <span className="relative z-10">
                Trial 7 días por {formatPrice(trialPriceCOP, currency, trm)}
              </span>
              <div className="nav-trial-shimmer pointer-events-none absolute inset-0 -translate-y-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-y-full" />
            </Link>

            <button
              className={`nav-mobile-menu-btn p-2 transition-all duration-300 hover:scale-110 lg:hidden ${isHeroMode ? 'text-white hover:text-white' : 'text-dark/80 hover:text-dark dark:text-white/80 dark:hover:text-white'}`}
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (!mobileMenuOpen) fetchTrialDataIfNeeded();
              }}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <motion.div initial={{ rotate: 0 }} animate={{ rotate: 90 }} transition={{ duration: 0.3, ease: EASING_OUT }}>
                  <X size={22} aria-hidden="true" />
                </motion.div>
              ) : (
                <Menu size={22} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed z-[55] flex items-center justify-center overflow-y-auto bg-white px-4 backdrop-blur-xl dark:bg-[rgba(10,10,10,0.98)] sm:px-10"
            style={{ top: 0, left: 0, right: 0, bottom: 0, paddingTop: '6rem', paddingBottom: '6rem' }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegacion"
          >
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mx-auto my-auto flex w-full max-w-sm flex-col items-center gap-5 rounded-[2rem] border border-black/10 bg-white px-5 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.12)] dark:border-white/8 dark:bg-white/[0.03] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            >
              {/* Currency & Theme Row */}
              <motion.div custom={0} variants={mobileCardVariants} className="flex w-full items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-black/25 dark:text-white/25">Moneda</span>
                  <div className="flex items-center rounded-full border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 p-1" role="group" aria-label="Selector de moneda">
                    <button onClick={() => onCurrencyChange('COP')} aria-pressed={currency === 'COP'} className={`mobile-currency-btn cursor-pointer px-3 py-1.5 text-xs font-bold uppercase transition-all duration-200 rounded-full ${currency === 'COP' ? 'bg-accent text-white scale-105 hover:bg-accent hover:text-white' : 'text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white'}`}>COP</button>
                    <button onClick={() => onCurrencyChange('USD')} aria-pressed={currency === 'USD'} className={`mobile-currency-btn cursor-pointer px-3 py-1.5 text-xs font-bold uppercase transition-all duration-200 rounded-full ${currency === 'USD' ? 'bg-accent text-white scale-105 hover:bg-accent hover:text-white' : 'text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white'}`}>USD</button>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-black/25 dark:text-white/25">Tema</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme} className="mobile-theme-btn flex items-center justify-center px-3 py-1.5 rounded-full border border-black/10 bg-black/5 text-accent text-xs font-bold uppercase transition-all duration-300 hover:scale-105 hover:border-accent dark:border-white/10 dark:bg-white/5" aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}>
                    {isDark ? <Sun size={14} /> : <Moon size={14} />}
                  </motion.button>
                </div>
              </motion.div>

              {/* Cómo funciona */}
              <motion.div custom={1} variants={mobileCardVariants} className="flex w-full flex-col gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-accent/80">Cómo funciona</p>
                {howItWorksSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex items-center gap-3 rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3 dark:border-white/5 dark:bg-white/5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={14} /></div>
                      <div>
                        <p className="text-[11px] font-bold text-dark dark:text-white">{step.label}</p>
                        <p className="text-[9px] text-text-secondary">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
                {howItWorksLinks.map((link) => (
                  <motion.div key={link.href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-link group flex items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ${link.highlight ? 'bg-accent text-white' : 'border border-black/8 bg-black/[0.03] hover:border-accent/30 hover:bg-accent/5 dark:border-white/5 dark:bg-white/5'}`}>
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${link.highlight ? 'text-white' : 'text-dark dark:text-white group-hover:text-accent'}`}>{link.label}</span>
                      <ArrowRight size={14} className={link.highlight ? 'text-white' : 'text-accent opacity-0 group-hover:opacity-100'} />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Planes */}
              <motion.div custom={2} variants={mobileCardVariants} className="flex w-full flex-col gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-accent/80">Navegación</p>
                {menuLinks.map((link) => (
                  <motion.div key={link.href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link group flex items-center justify-between rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3.5 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 dark:border-white/5 dark:bg-white/5 dark:hover:border-accent/30 dark:hover:bg-accent/10">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-dark transition-colors duration-200 group-hover:text-accent dark:text-white dark:group-hover:text-accent">{link.label}</span>
                      <ArrowRight size={14} className="text-accent opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Products */}
              <motion.div custom={2} variants={mobileCardVariants} className="flex w-full flex-col gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-accent/80">Productos Pro</p>
                {productLinks.map((prod, index) => (
                  <motion.div key={prod.title} custom={index + 3} variants={mobileCardVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href={prod.href} onClick={() => setMobileMenuOpen(false)} className="mobile-product-link group flex items-center gap-3.5 rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3.5 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 dark:border-white/5 dark:bg-white/5 dark:hover:border-accent/30 dark:hover:bg-accent/10">
                      <motion.div className="mobile-product-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition-transform duration-300 group-hover:scale-110" whileHover={{ rotate: 90, backgroundColor: 'rgba(255, 92, 58, 0.2)' }}>
                        <ArrowRight size={16} className="text-accent" />
                      </motion.div>
                      <div className="text-left">
                        <p className="text-[11px] font-black uppercase tracking-wider text-dark transition-colors duration-200 group-hover:text-accent dark:text-white dark:group-hover:text-accent">{prod.title}</p>
                        <p className="text-[10px] font-medium text-black/35 transition-colors duration-200 group-hover:text-accent/70 dark:text-white/35 dark:group-hover:text-accent/70">{prod.desc}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div custom={9} variants={mobileCardVariants} className="flex w-full flex-col gap-2">
                {session ? (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="mobile-panel-btn flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-dark transition-all duration-200 hover:bg-black/[0.05] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                      Mi Panel
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="mobile-login-btn flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-dark transition-all duration-200 hover:bg-black/[0.05] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                      Ingresar
                    </Link>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/trial-checkout" onClick={() => { fetchTrialDataIfNeeded(); setMobileMenuOpen(false); }} className="mobile-trial-btn flex items-center justify-center rounded-2xl bg-accent px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-accent/20 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/30">
                    Trial {formatPrice(trialPriceCOP, currency, trm)}
                  </Link>
                </motion.div>
              </motion.div>

              {/* Divider */}
              <motion.div custom={10} variants={mobileCardVariants} className="h-[1px] w-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/8" />

              {/* Footer Links */}
              <motion.div custom={11} variants={mobileCardVariants} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pb-1 text-[10px] font-medium text-black/25 dark:text-white/20">
                {[
                  { href: '/terminos', label: 'Terminos' },
                  { href: '/politicas-privacidad', label: 'Privacidad' },
                  { href: '/cookies', label: 'Cookies' },
                  { href: '/contacto', label: 'Contacto' },
                ].map((link) => (
                  <motion.div key={link.href} whileHover={{ scale: 1.1 }}>
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className="mobile-footer-link transition-colors duration-200 hover:text-accent">
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop overlay para Megamenú */}
      <AnimatePresence>
        {hoverMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-[2px] pointer-events-none"
          />
        )}
      </AnimatePresence>
    </>
  );
}
