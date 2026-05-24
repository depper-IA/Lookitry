'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown, User, LogOut, Layers, Smartphone, ShoppingBag, Code2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { usePromoBanner } from '@/contexts/PromoBannerContext';
import { usePublicSession } from '@/hooks/usePublicSession';
import { useTheme } from '@/contexts/ThemeContext';
import { formatPrice } from '@/utils/currency';

// Subcomponents
import { NavCurrencySelector } from './nav/NavCurrencySelector';
import { NavThemeToggle } from './nav/NavThemeToggle';
import { NavTrialBadge } from './nav/NavTrialBadge';
import { NavMobileMenu } from './nav/NavMobileMenu';
import { NavHowItWorksDropdown } from './nav/NavHowItWorksDropdown';
import { NavProductsDropdown } from './nav/NavProductsDropdown';

const EASING_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DEFAULT_TRIAL_PRICE_COP = 20000;
const DEFAULT_BASIC_PRICE_COP = 180000;

interface LandingNavProps {
  transparent?: boolean;
  currency?: 'COP' | 'USD';
  onCurrencyChange?: (c: 'COP' | 'USD') => void;
}

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
  const { toggleTheme, isDark } = useTheme();
  
  const [trialPriceCOP, setTrialPriceCOP] = useState(DEFAULT_TRIAL_PRICE_COP);
  const [basicPriceCOP, setBasicPriceCOP] = useState(DEFAULT_BASIC_PRICE_COP);
  const [trm, setTrm] = useState(3900);
  const [trialDataFetched, setTrialDataFetched] = useState(false);

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

  const productLinks = [
    { icon: Layers, title: 'Probador Virtual', desc: 'Tus clientes se prueban la ropa virtualmente antes de comprar.', href: 'https://lookitry.com/probador-virtual', badge: 'Más popular', logo: null },
    { icon: Smartphone, title: 'Tienda Virtual', desc: 'Tu vitrina interactiva lista para vender.', href: '/mini-landing', badge: null, logo: null },
    { icon: ShoppingBag, title: 'WooCommerce Plugin', desc: 'Automatiza tu probador virtual.', href: '/plugin-woocommerce', badge: null, logo: '/integrations/Woo_logo_color.png' },
    { icon: Code2, title: 'API Developer Hub', desc: 'IA nativa en tu propia app.', href: '/api-developer', badge: null, logo: null },
  ];

  const isHeroMode = Boolean(transparent && !scrolled && !hoverMenu);
  const navBg = isHeroMode
    ? 'bg-transparent border-b border-transparent'
    : 'bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-black/[0.04] dark:border-white/5 shadow-sm';

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
          {/* Logo + currency */}
          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/" className="nav-logo flex shrink-0 items-center gap-2.5 group" aria-label="Lookitry - Inicio">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 transition-transform duration-300 group-hover:scale-110">
                <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill sizes="32px" className={`object-contain transition-opacity duration-300 ${isHeroMode ? 'opacity-0' : 'dark:opacity-0 opacity-100'}`} priority />
                <Image src="/logo.svg" alt="Lookitry" fill sizes="32px" className={`object-contain transition-opacity duration-300 ${isHeroMode ? 'opacity-100' : 'dark:opacity-100 opacity-0'}`} priority />
              </div>
              <span className={`nav-logo-text font-jakarta text-xl font-bold tracking-tighter sm:text-2xl transition-colors duration-300 group-hover:text-black dark:group-hover:text-white ${isHeroMode ? 'text-white' : 'text-black dark:text-white'}`}>
                Look<span className="text-accent">itry</span>
              </span>
            </Link>

            <NavCurrencySelector 
              currency={currency} 
              onCurrencyChange={onCurrencyChange} 
              isHeroMode={isHeroMode} 
            />
          </div>

          {/* Center nav */}
          <div className="hidden grow items-stretch justify-center gap-4 lg:flex xl:gap-8">
            <NavHowItWorksDropdown 
              howItWorksRef={howItWorksRef} 
              hoverMenu={hoverMenu} 
              handleMouseEnter={handleMouseEnter} 
              handleMouseLeave={handleMouseLeave} 
              isHeroMode={isHeroMode} 
            />

            <NavProductsDropdown 
              productsRef={productsRef}
              hoverMenu={hoverMenu}
              handleMouseEnter={handleMouseEnter}
              handleMouseLeave={handleMouseLeave}
              isHeroMode={isHeroMode}
              productLinks={productLinks}
              basicPriceCOP={basicPriceCOP}
              currency={currency}
              trm={trm}
            />

            {/* Regular links */}
            {menuLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative flex items-center py-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${isHeroMode ? 'text-white/80 hover:text-accent' : 'text-black/60 hover:text-accent dark:text-white/60 dark:hover:text-accent'}`}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] origin-center scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            {mounted && session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`nav-user-btn group flex items-center gap-2 rounded-full border p-1 pr-3 transition-all duration-300 ${
                    isHeroMode
                      ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      : 'border-black/10 bg-black/5 hover:bg-black/10 hover:border-black/15 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/15'
                  }`}
                >
                  <div className="nav-user-avatar flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white transition-transform duration-300 sm:h-8 sm:w-8 group-hover:scale-105">
                    {initials}
                  </div>
                  <div className="mr-1 hidden flex-col items-start sm:flex">
                    <span className={`max-w-[100px] truncate text-[10px] font-bold ${isHeroMode ? 'text-white' : 'text-black dark:text-white'}`}>{session.name}</span>
                    <span className={`text-[8px] uppercase tracking-widest leading-none ${isHeroMode ? 'text-white/50' : 'text-black/30 dark:text-white/30'}`}>Mi Panel</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isHeroMode ? 'text-white/30' : 'text-black/20 dark:text-white/20'} ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200 absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-black/10 bg-white py-2 shadow-2xl dark:border-white/10 dark:bg-dark-card">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="nav-dropdown-link group flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <User size={16} className="text-black/30 transition-colors duration-200 group-hover:text-accent dark:text-white/30" />
                      <span className="text-[12px] font-bold text-black/80 transition-colors duration-200 group-hover:text-black dark:text-white/80 dark:group-hover:text-white">
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
                className={`nav-login-link hidden text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 sm:block flex items-center ${isHeroMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'}`}
              >
                Ingresar
              </Link>
            )}

            <NavThemeToggle 
              toggleTheme={toggleTheme}
              isDark={isDark}
              mounted={mounted}
              isHeroMode={isHeroMode}
            />

            <NavTrialBadge 
              trialPriceCOP={trialPriceCOP}
              currency={currency}
              trm={trm}
              fetchTrialDataIfNeeded={fetchTrialDataIfNeeded}
            />

            <button
              className={`nav-mobile-menu-btn p-2 transition-all duration-300 hover:scale-110 lg:hidden ${isHeroMode ? 'text-white hover:text-white' : 'text-black/80 hover:text-black dark:text-white/80 dark:hover:text-white'}`}
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

      {/* Mobile Menu */}
      <NavMobileMenu 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currency={currency}
        onCurrencyChange={onCurrencyChange}
        toggleTheme={toggleTheme}
        isDark={isDark}
        session={session}
        trialPriceCOP={trialPriceCOP}
        trm={trm}
        fetchTrialDataIfNeeded={fetchTrialDataIfNeeded}
        menuLinks={menuLinks}
        productLinks={productLinks}
      />

      {/* Backdrop overlay para Megamenú */}
      {hoverMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-[2px] pointer-events-none"
        />
      )}
    </>
  );
}
