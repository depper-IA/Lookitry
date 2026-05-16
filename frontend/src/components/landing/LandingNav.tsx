'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Zap, User, LogOut, ArrowRight, Layers, ShoppingBag, Code2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { usePromoBanner } from '@/contexts/PromoBannerContext';
import { usePublicSession } from '@/hooks/usePublicSession';
import { useTheme } from '@/contexts/ThemeContext';
import { formatPrice } from '@/utils/currency';
import { Sun, Moon } from 'lucide-react';

const EASING_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Mobile menu animation variants
const mobileMenuVariants = {
  hidden: {
    opacity: 0,
    x: '100%',
    transition: { duration: 0.3, ease: EASING_OUT }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: EASING_OUT }
  },
  exit: {
    opacity: 0,
    x: '100%',
    transition: { duration: 0.25, ease: EASING_OUT }
  }
};

const mobileCardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
    transition: { duration: 0.3, ease: EASING_OUT }
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: EASING_OUT
    }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.2
    }
  }
};

// Precio por defecto del trial (20000 COP) — se actualiza dinámicamente si hay campaña activa
const DEFAULT_TRIAL_PRICE_COP = 20000;

// Placeholder — se actualiza desde pricing config real
const DEFAULT_BASIC_PRICE_COP = 180000;

interface LandingNavProps {
  transparent?: boolean;
  currency?: 'COP' | 'USD';
  onCurrencyChange?: (c: 'COP' | 'USD') => void;
}

export default function LandingNav({
  transparent,
  currency: externalCurrency,
  onCurrencyChange: externalOnCurrencyChange
}: LandingNavProps) {
  const { bannerHeight } = usePromoBanner();
  const [internalCurrency, setInternalCurrency] = useState<'COP' | 'USD'>('COP');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const { session } = usePublicSession();
  const { toggleTheme, isDark } = useTheme();
  const [trialPriceCOP, setTrialPriceCOP] = useState(DEFAULT_TRIAL_PRICE_COP);
  const [basicPriceCOP, setBasicPriceCOP] = useState(DEFAULT_BASIC_PRICE_COP);
  const [trm, setTrm] = useState(3900);

  const [trialDataFetched, setTrialDataFetched] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNavVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
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
      fetch(`${apiUrl}/api/pricing-config`).then(r => r.ok ? r.json() : null)
    ])
      .then(([trialData, paySettings, pricingData]) => {
        if (trialData?.priceCOP && Number(trialData.priceCOP) > 0) {
          setTrialPriceCOP(Number(trialData.priceCOP));
        }
        if (paySettings?.trm && Number(paySettings.trm) > 0) {
          setTrm(Number(paySettings.trm));
        }
        // Extraer precio basic desde pricing config
        if (pricingData?.basic?.precio_mensual_cop) {
          setBasicPriceCOP(Number(pricingData.basic.precio_mensual_cop));
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    if (!externalCurrency) {
      const saved = localStorage.getItem('currency') as 'COP' | 'USD';
      if (saved) setInternalCurrency(saved);
    }
  }, [externalCurrency]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
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

  const menuLinks = [
    { label: 'Casos de Uso', href: '/casos-de-exito' },
    { label: 'Planes', href: '/planes' }
  ];

  const productLinks = [
    {
      title: 'Probador',
      desc: 'Pruébalo antes de comprar.',
      href: 'https://lookitry.com/probador-virtual'
    },
    {
      title: 'Tienda Virtual',
      desc: 'Tu vitrina interactiva lista para vender.',
      href: '/mini-landing'
    },
    {
      title: 'WooCommerce Plugin',
      desc: 'Automatiza tu probador virtual.',
      href: '/plugin-woocommerce'
    },
    {
      title: 'API Developer Hub',
      desc: 'IA nativa en tu propia app.',
      href: '/api-developer'
    }
  ];

  const companyLinks = [
    { title: 'Blog', href: '/blog' },
    { title: 'Sobre Nosotros', href: '/sobre-nosotros' },
    { title: 'Contacto', href: '/contacto' }
  ];

  const isHeroMode = transparent && !scrolled;
  const navBg = isHeroMode
    ? 'bg-transparent border-b border-transparent'
    : 'bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-black/8 dark:border-white/5 shadow-sm dark:shadow-none';

  return (
    <>
      <nav
        className={`${transparent ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-[70] w-full px-4 py-4 sm:px-6 sm:py-5 md:px-12 transition-all duration-300 ${navBg} ${isHeroMode ? '[&_.nav-link]:!text-white/80 [&_.nav-products-btn]:!text-white/80 [&_.nav-login-link]:!text-white/80 [&_.nav-currency-btn]:!text-white/50 [&_.nav-theme-btn]:!text-white/60 [&_.nav-theme-btn]:!border-white/20 [&_.nav-theme-btn]:!bg-white/10 [&_.nav-logo-text]:!text-white [&_.nav-mobile-menu-btn]:!text-white/80' : ''}`}
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
          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/" className="nav-logo flex shrink-0 items-center gap-2.5 group" aria-label="Lookitry - Inicio">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 transition-transform duration-300 group-hover:scale-110">
                <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className={`object-contain transition-opacity duration-300 ${isHeroMode ? 'opacity-0' : 'dark:opacity-0 opacity-100'}`} priority />
                <Image src="/logo.svg" alt="Lookitry" fill className={`object-contain transition-opacity duration-300 ${isHeroMode ? 'opacity-100' : 'dark:opacity-100 opacity-0'}`} priority />
              </div>
              <span className="nav-logo-text font-jakarta text-xl font-bold tracking-tighter text-black dark:text-white sm:text-2xl transition-colors duration-300 group-hover:text-dark dark:group-hover:text-white">
                Look<span className="text-accent">itry</span>
              </span>
            </Link>

            <div
              className="ml-1 hidden items-center gap-2 rounded-full border border-black/10 bg-black/5 px-2.5 py-1.5 sm:ml-2 sm:flex sm:px-3 dark:border-white/10 dark:bg-white/5"
              role="group"
              aria-label="Selector de moneda"
            >
              <button
                onClick={() => onCurrencyChange('COP')}
                aria-pressed={currency === 'COP'}
                className={`nav-currency-btn cursor-pointer text-[9px] font-bold uppercase transition-all duration-200 sm:text-[8px] ${currency === 'COP' ? 'text-accent scale-110' : 'text-black/45 hover:text-dark dark:text-white/50 dark:hover:text-white'
                  }`}
              >
                COP
              </button>
              <div className="h-2.5 w-[1px] bg-black/10 dark:bg-white/10" aria-hidden="true" />
              <button
                onClick={() => onCurrencyChange('USD')}
                aria-pressed={currency === 'USD'}
                className={`nav-currency-btn cursor-pointer text-[9px] font-bold uppercase transition-all duration-200 sm:text-[8px] ${currency === 'USD' ? 'text-accent scale-110' : 'text-black/45 hover:text-dark dark:text-white/50 dark:hover:text-white'
                  }`}
              >
                USD
              </button>
            </div>
          </div>

          <div className="hidden grow items-center justify-center gap-4 lg:flex xl:gap-8">
            {/* MEGA MENU */}
            <div className="relative" ref={megaMenuRef}>
              <button
                onMouseEnter={() => setMegaMenuOpen(true)}
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                aria-expanded={megaMenuOpen}
                aria-haspopup="true"
                className={`nav-products-btn flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${megaMenuOpen ? 'text-accent' : 'text-black/60 hover:text-dark dark:text-white/60 dark:hover:text-white'
                  }`}
              >
                Descubre Lookitry
                <ChevronDown size={12} className={`transition-transform duration-300 ${megaMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {megaMenuOpen && (
                <div
                  onMouseLeave={() => setMegaMenuOpen(false)}
                  className="absolute left-1/2 top-full mt-4 -translate-x-1/2 w-[90vw] max-w-[720px] rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-dark-card animate-in fade-in slide-in-from-top-2 duration-200"
                  role="menu"
                  style={{ left: '50%' }}
                >
                  <div className="flex gap-6">
                    {/* LEFT: Products grid — 2 columns, centered content */}
                    <div className="flex-1 min-w-0 flex flex-col items-center">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-secondary mb-3 pb-2 border-b border-black/5 dark:border-white/5 text-center w-full">Productos</p>
                      <div className="grid grid-cols-2 gap-2 flex-1 place-items-center w-full">
                        {productLinks.map((prod, index) => {
                          const icons = [Layers, Zap, ShoppingBag, Code2];
                          const colors = [
                            { bg: 'bg-accent/10', text: 'text-accent', hover: 'hover:bg-accent/15' },
                            { bg: 'bg-blue-500/10', text: 'text-blue-500', hover: 'hover:bg-blue-500/15' },
                            { bg: 'bg-purple-500/10', text: 'text-purple-500', hover: 'hover:bg-purple-500/15' },
                            { bg: 'bg-emerald-500/10', text: 'text-emerald-500', hover: 'hover:bg-emerald-500/15' }
                          ];
                          const IconComponent = icons[index];
                          const colorScheme = colors[index];
                          return (
                            <Link
                              key={prod.title}
                              href={prod.href}
                              onClick={() => setMegaMenuOpen(false)}
                              className={`nav-product-link group flex flex-col items-center text-center gap-2 rounded-xl px-3 py-3 transition-all duration-200 ${colorScheme.bg}/30 ${colorScheme.hover} focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1`}
                              role="menuitem"
                            >
                              <div className={`nav-product-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorScheme.bg} ${colorScheme.text} transition-all duration-200 group-hover:scale-110`}>
                                <IconComponent size={18} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="nav-product-title text-[11px] font-semibold text-dark dark:text-white transition-colors duration-200 group-hover:text-accent">
                                  {prod.title}
                                </h3>
                                <p className="text-[9px] font-medium text-text-secondary mt-0.5">{prod.desc}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Empresa links — below products */}
                      <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 w-full">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-2 text-center w-full">Empresa</p>
                        <div className="flex gap-3 justify-center">
                          {companyLinks.map((link) => (
                            <Link
                              key={link.title}
                              href={link.href}
                              onClick={() => setMegaMenuOpen(false)}
                              className="nav-company-link text-[10px] font-medium text-text-secondary hover:text-dark dark:hover:text-white transition-colors duration-200"
                              role="menuitem"
                            >
                              {link.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Promo card with improved CTA — ~280px */}
                    <div className="w-[280px] shrink-0">
                      <div className="nav-promo-image relative w-full aspect-[3/4] rounded-2xl overflow-hidden group">
                        <Image
                          src="/images/rebeca.webp"
                          alt="Lookitry - Transforma tu tienda con IA"
                          fill
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                          sizes="(max-width: 768px) 280px, 33vw"
                          quality={90}
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* CTA content — overlay on image */}
                        <div className="absolute inset-0 flex flex-col justify-end p-5">
                          <div className="mb-3">
                            <p className="text-[13px] font-bold text-white leading-tight">Transforma tu e-commerce</p>
                            <p className="text-[10px] text-white/70 mt-1">con IA en 30 segundos</p>
                          </div>

                          <div className="space-y-1.5 mb-4">
                            {['Sin tarjeta de crédito', 'Configuración en 2 min', 'Soporte en español'].map((item) => (
                              <div key={item} className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-[9px] text-white/80 font-medium">{item}</span>
                              </div>
                            ))}
                          </div>

                          <Link
                            href="/trial-checkout"
                            onClick={() => setMegaMenuOpen(false)}
                            className="nav-cta-btn group flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-[11px] font-bold text-white transition-all duration-300 hover:bg-accent-bright hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98]"
                          >
                            Trial 7 días
                            <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                          </Link>

                          <Link
                            href="/planes"
                            onClick={() => setMegaMenuOpen(false)}
                            className="mt-2 text-center text-[9px] font-medium text-white/50 hover:text-white/70 transition-colors duration-200"
                          >
                            Planes desde {formatPrice(basicPriceCOP, currency, trm)}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {menuLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="nav-link group relative text-[11px] font-bold uppercase tracking-[0.15em] text-black/60 transition-all duration-300 hover:text-dark dark:text-white/60 dark:hover:text-white"
              >
                {item.label}
                <span className="nav-link-underline absolute bottom-0 left-0 right-0 h-[1px] origin-center scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            {session ? (
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
                className="nav-login-link hidden text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 transition-all duration-300 hover:text-dark hover:scale-105 sm:block dark:text-white/60 dark:hover:text-white"
              >
                Ingresar
              </Link>
            )}

            {/* Theme toggle — desktop */}
            <button
              onClick={toggleTheme}
              className="nav-theme-btn flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/60 transition-all duration-300 hover:scale-110 hover:border-accent/40 hover:text-accent dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-accent"
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
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
              className="nav-mobile-menu-btn p-2 text-dark/80 transition-all duration-300 hover:text-dark hover:scale-110 lg:hidden dark:text-white/80 dark:hover:text-white"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (!mobileMenuOpen) fetchTrialDataIfNeeded();
              }}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 90 }}
                  transition={{ duration: 0.3, ease: EASING_OUT }}
                >
                  <X size={22} aria-hidden="true" />
                </motion.div>
              ) : (
                <Menu size={22} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu with AnimatePresence */}
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
              <motion.div
                custom={0}
                variants={mobileCardVariants}
                className="flex w-full items-center justify-center gap-6"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-black/25 dark:text-white/25">Moneda</span>
                  <div
                    className="flex items-center rounded-full border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 p-1"
                    role="group"
                    aria-label="Selector de moneda"
                  >
                    <button
                      onClick={() => onCurrencyChange('COP')}
                      aria-pressed={currency === 'COP'}
                      className={`mobile-currency-btn cursor-pointer px-3 py-1.5 text-xs font-bold uppercase transition-all duration-200 rounded-full ${currency === 'COP' ? 'bg-accent text-white scale-105 hover:bg-accent hover:text-white' : 'text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white'
                        }`}
                    >
                      COP
                    </button>
                    <button
                      onClick={() => onCurrencyChange('USD')}
                      aria-pressed={currency === 'USD'}
                      className={`mobile-currency-btn cursor-pointer px-3 py-1.5 text-xs font-bold uppercase transition-all duration-200 rounded-full ${currency === 'USD' ? 'bg-accent text-white scale-105 hover:bg-accent hover:text-white' : 'text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white'
                        }`}
                    >
                      USD
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-black/25 dark:text-white/25">Tema</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    className="mobile-theme-btn flex items-center justify-center px-3 py-1.5 rounded-full border border-black/10 bg-black/5 text-accent text-xs font-bold uppercase transition-all duration-300 hover:scale-105 hover:border-accent dark:border-white/10 dark:bg-white/5"
                    aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                  >
                    {isDark ? <Sun size={14} /> : <Moon size={14} />}
                  </motion.button>
                </div>
              </motion.div>

              {/* Main Navigation Links */}
              <motion.div
                custom={1}
                variants={mobileCardVariants}
                className="flex w-full flex-col gap-2"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-accent/80">Navegación</p>
                {menuLinks.map((link) => (
                  <motion.div key={link.href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link group flex items-center justify-between rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3.5 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 dark:border-white/5 dark:bg-white/5 dark:hover:border-accent/30 dark:hover:bg-accent/10"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider text-dark transition-colors duration-200 group-hover:text-accent dark:text-white dark:group-hover:text-accent">{link.label}</span>
                      <ArrowRight size={14} className="text-accent opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Products Section */}
              <motion.div
                custom={2}
                variants={mobileCardVariants}
                className="flex w-full flex-col gap-2"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-accent/80">Productos Pro</p>
                {productLinks.map((prod, index) => (
                  <motion.div
                    key={prod.title}
                    custom={index + 3}
                    variants={mobileCardVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={prod.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-product-link group flex items-center gap-3.5 rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3.5 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 dark:border-white/5 dark:bg-white/5 dark:hover:border-accent/30 dark:hover:bg-accent/10"
                    >
                      <motion.div
                        className="mobile-product-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition-transform duration-300 group-hover:scale-110"
                        whileHover={{ rotate: 90, backgroundColor: 'rgba(255, 92, 58, 0.2)' }}
                      >
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

              {/* Company Links */}
              <motion.div
                custom={6}
                variants={mobileCardVariants}
                className="flex w-full flex-col gap-2"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-accent/80">Empresa</p>
                {companyLinks.map((link) => (
                  <motion.div key={link.href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-company-link group flex items-center justify-between rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3.5 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 dark:border-white/5 dark:bg-white/5 dark:hover:border-accent/30 dark:hover:bg-accent/10"
                    >
                      <span className="text-[11px] font-medium text-dark transition-colors duration-200 group-hover:text-accent dark:text-white dark:group-hover:text-accent">{link.title}</span>
                      <ArrowRight size={14} className="text-accent opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                custom={9}
                variants={mobileCardVariants}
                className="flex w-full flex-col gap-2"
              >
                {session ? (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-panel-btn flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-dark transition-all duration-200 hover:bg-black/[0.05] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      Mi Panel
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-login-btn flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-dark transition-all duration-200 hover:bg-black/[0.05] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      Ingresar
                    </Link>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/trial-checkout"
                    onClick={() => {
                      fetchTrialDataIfNeeded();
                      setMobileMenuOpen(false);
                    }}
                    className="mobile-trial-btn flex items-center justify-center rounded-2xl bg-accent px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-accent/20 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/30"
                  >
                    Trial {formatPrice(trialPriceCOP, currency, trm)}
                  </Link>
                </motion.div>
              </motion.div>

              {/* Divider */}
              <motion.div
                custom={10}
                variants={mobileCardVariants}
                className="h-[1px] w-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/8"
              />

              {/* Footer Links */}
              <motion.div
                custom={11}
                variants={mobileCardVariants}
                className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pb-1 text-[10px] font-medium text-black/25 dark:text-white/20"
              >
                {[
                  { href: '/terminos', label: 'Terminos' },
                  { href: '/politicas-privacidad', label: 'Privacidad' },
                  { href: '/cookies', label: 'Cookies' },
                  { href: '/contacto', label: 'Contacto' }
                ].map((link) => (
                  <motion.div key={link.href} whileHover={{ scale: 1.1 }}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-footer-link transition-colors duration-200 hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}