'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, Layout, Zap, Terminal, User, LogOut, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { usePromoBanner } from '@/contexts/PromoBannerContext';
import { usePublicSession } from '@/hooks/usePublicSession';
import { useTheme } from '@/contexts/ThemeContext';
import { formatPrice } from '@/utils/currency';
import { Sun, Moon } from 'lucide-react';

// Precio por defecto del trial (20000 COP) — se actualiza dinámicamente si hay campaña activa
const DEFAULT_TRIAL_PRICE_COP = 20000;

interface LandingNavProps {
  currency?: 'COP' | 'USD';
  onCurrencyChange?: (c: 'COP' | 'USD') => void;
}

export default function LandingNav({
  currency: externalCurrency,
  onCurrencyChange: externalOnCurrencyChange
}: LandingNavProps) {
  const { bannerHeight } = usePromoBanner();
  const [internalCurrency, setInternalCurrency] = useState<'COP' | 'USD'>('COP');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const { session } = usePublicSession();
  const { toggleTheme, isDark } = useTheme();
  const [trialPriceCOP, setTrialPriceCOP] = useState(DEFAULT_TRIAL_PRICE_COP);
  const [trm, setTrm] = useState(3900);

  // Lazy fetch de trial price y TRM — solo cuando el usuario interactúa con moneda o trial
  const [trialDataFetched, setTrialDataFetched] = useState(false);

  const fetchTrialDataIfNeeded = () => {
    if (trialDataFetched) return;
    setTrialDataFetched(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    Promise.all([
      fetch(`${apiUrl}/api/trial/status`).then(r => r.ok ? r.json() : null),
      fetch(`${apiUrl}/api/payment-settings/public`).then(r => r.ok ? r.json() : null)
    ])
      .then(([trialData, paySettings]) => {
        if (trialData?.priceCOP && Number(trialData.priceCOP) > 0) {
          setTrialPriceCOP(Number(trialData.priceCOP));
        }
        if (paySettings?.trm && Number(paySettings.trm) > 0) {
          setTrm(Number(paySettings.trm));
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
      title: 'Mini-Landing Pro',
      desc: 'Tu tienda online pro sin código.',
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

  // Empresa - Links simples
  const companyLinks = [
    { title: 'Blog', href: '/blog' },
    { title: 'Sobre Nosotros', href: '/sobre-nosotros' },
    { title: 'Contacto', href: '/contacto' }
  ];

  const navBg = 'bg-white dark:bg-black border-b border-black/5 dark:border-white/5';

  return (
    <>
      <nav
        className={`sticky top-0 left-0 right-0 z-[70] w-full px-4 py-4 sm:px-6 sm:py-5 md:px-12 ${navBg}`}
        role="navigation"
        aria-label="Navegacion principal"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 group" aria-label="Lookitry - Inicio">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8">
                <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className="object-contain dark:hidden" priority />
                <Image src="/logo.svg" alt="Lookitry" fill className="hidden object-contain dark:block" priority />
              </div>
              <span className="font-jakarta text-xl font-bold tracking-tighter text-black dark:text-white sm:text-2xl">
                Look<span className="text-[#FF5C3A]">itry</span>
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
                className={`cursor-pointer text-[9px] font-bold uppercase transition-colors sm:text-[8px] ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-black/45 hover:text-[#0a0a0a] dark:text-white/50 dark:hover:text-white'
                  }`}
              >
                COP
              </button>
              <div className="h-2.5 w-[1px] bg-black/10 dark:bg-white/10" aria-hidden="true" />
              <button
                onClick={() => onCurrencyChange('USD')}
                aria-pressed={currency === 'USD'}
                className={`cursor-pointer text-[9px] font-bold uppercase transition-colors sm:text-[8px] ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-black/45 hover:text-[#0a0a0a] dark:text-white/50 dark:hover:text-white'
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
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${megaMenuOpen ? 'text-[#FF5C3A]' : 'text-black/60 hover:text-[#0a0a0a] dark:text-white/60 dark:hover:text-white'
                  }`}
              >
                Productos Pro
                <ChevronDown size={12} className={`transition-transform duration-300 ${megaMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {megaMenuOpen && (
                <div
                  onMouseLeave={() => setMegaMenuOpen(false)}
                  className="absolute left-1/2 top-full mt-4 -translate-x-1/2 w-[90vw] max-w-[680px] rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#111] animate-in fade-in slide-in-from-top-2 duration-200"
                  role="menu"
                  style={{ left: '50%' }}
                >
                  <div className="flex gap-8">
                    {/* LEFT: Links column — max ~300px */}
                    <div className="w-[300px] shrink-0 space-y-5">
                      {/* Productos */}
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#999] mb-3 pb-2 border-b border-black/5 dark:border-white/5">Productos</p>
                        <div className="space-y-0.5">
                          {productLinks.map((prod, index) => (
                            <Link
                              key={prod.title}
                              href={prod.href}
                              onClick={() => setMegaMenuOpen(false)}
                              className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#FF5C3A] focus-visible:outline-offset-1"
                              role="menuitem"
                            >
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all duration-150 ${index === 0 ? 'bg-[#FF5C3A]/10 text-[#FF5C3A]' :
                                  index === 1 ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                {index === 0 ? <Layout size={15} /> :
                                  index === 1 ? <Zap size={15} /> :
                                    <Terminal size={15} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-[11px] font-semibold text-[#0a0a0a] dark:text-white group-hover:text-[#FF5C3A] transition-colors duration-150 flex items-center gap-1.5">
                                  {prod.title}
                                  <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-all duration-150 text-[#FF5C3A] translate-x-[-2px] group-hover:translate-x-0" />
                                </h3>
                                <p className="text-[9px] font-medium text-[#999] truncate">{prod.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Empresa */}
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#999]/60 mb-3 pb-2 border-b border-black/5 dark:border-white/5">Empresa</p>
                        <div className="flex gap-4 px-2.5 py-1">
                          {companyLinks.map((link) => (
                            <Link
                              key={link.title}
                              href={link.href}
                              onClick={() => setMegaMenuOpen(false)}
                              className="text-[10px] font-medium text-[#999] hover:text-[#0a0a0a] dark:hover:text-white transition-colors duration-150"
                              role="menuitem"
                            >
                              {link.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Image + CTA — ~260px */}
                    <div className="w-[260px] shrink-0 flex flex-col">
                      {/* Horizontal image */}
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden group">
                        <Link href="/trial-checkout" onClick={() => setMegaMenuOpen(false)} className="block absolute inset-0 z-10" aria-label="Pruébalo gratis" />
                        <Image
                          src="/hero/promo_landing.png"
                          alt="Lookitry - Transforma tu tienda con IA"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          sizes="260px"
                        />
                      </div>

                      {/* CTA — small, subtle, below image */}
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-semibold text-[#0a0a0a] dark:text-white leading-tight">Transforma tu tienda</p>
                          <p className="text-[9px] text-[#999]">Sin tarjeta requerida</p>
                        </div>
                        <Link
                          href="/trial-checkout"
                          onClick={() => setMegaMenuOpen(false)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#FF5C3A] px-4 py-2 text-[10px] font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Pruébalo gratis
                          <ArrowRight size={11} />
                        </Link>
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
                className="group relative text-[11px] font-bold uppercase tracking-[0.15em] text-black/60 transition-all duration-300 hover:text-[#0a0a0a] dark:text-white/60 dark:hover:text-white"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 right-0 h-[1px] origin-center scale-x-0 bg-[#FF5C3A] transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="group flex items-center gap-2 rounded-full border border-black/10 bg-black/5 p-1 pr-3 transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF5C3A] text-xs font-bold text-white sm:h-8 sm:w-8">
                    {initials}
                  </div>
                  <div className="mr-1 hidden flex-col items-start sm:flex">
                    <span className="max-w-[100px] truncate text-[10px] font-bold text-[#0a0a0a] dark:text-white">{session.name}</span>
                    <span className="text-[8px] uppercase tracking-widest leading-none text-black/30 dark:text-white/30">Mi Panel</span>
                  </div>
                  <ChevronDown size={14} className={`text-black/20 transition-transform duration-300 dark:text-white/20 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-black/10 bg-white py-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 dark:border-white/10 dark:bg-[#111]">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <User size={16} className="text-black/30 transition-colors group-hover:text-[#FF5C3A] dark:text-white/30" />
                      <span className="text-[12px] font-bold text-black/80 transition-colors group-hover:text-[#0a0a0a] dark:text-white/80 dark:group-hover:text-white">
                        Dashboard General
                      </span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="group flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-red-500/10"
                    >
                      <LogOut size={16} className="text-black/30 transition-colors group-hover:text-red-500 dark:text-white/30" />
                      <span className="text-[12px] font-bold text-black/80 transition-colors group-hover:text-red-500 dark:text-white/80">
                        Cerrar Sesión
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 transition-colors hover:text-[#0a0a0a] sm:block dark:text-white/60 dark:hover:text-white"
              >
                Ingresar
              </Link>
            )}

            <Link
              href="/trial-checkout"
              onMouseEnter={fetchTrialDataIfNeeded}
              onFocus={fetchTrialDataIfNeeded}
              className="group relative hidden overflow-hidden rounded-full bg-[#FF5C3A] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-[#FF5C3A]/20 transition-all hover:scale-105 active:scale-95 sm:px-8 sm:py-3.5 md:inline-flex"
            >
              <span className="relative z-10">
                Trial 7 días por {formatPrice(trialPriceCOP, currency, trm)}
              </span>
              <div className="pointer-events-none absolute inset-0 translate-y-full bg-white opacity-20 transition-transform duration-300 group-hover:translate-y-0" />
            </Link>

            <button
              className="p-2 text-[#0a0a0a]/80 transition-colors hover:text-[#0a0a0a] lg:hidden dark:text-white/80 dark:hover:text-white"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (!mobileMenuOpen) fetchTrialDataIfNeeded();
              }}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="fixed z-[55] flex items-center justify-center overflow-y-auto bg-white px-4 backdrop-blur-xl animate-in fade-in slide-in-from-right duration-300 dark:bg-[rgba(10,10,10,0.98)] sm:px-10"
          style={{ top: 0, left: 0, right: 0, bottom: 0, paddingTop: '6rem', paddingBottom: '6rem' }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegacion"
        >
          <div className="mx-auto my-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-[2rem] border border-black/10 bg-white px-5 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.12)] dark:border-white/8 dark:bg-white/[0.03] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex w-full items-center justify-center gap-8 px-4">
              <div className="flex flex-col items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-black/25 dark:text-white/25">Moneda</span>
                <div
                  className="flex items-center gap-2.5 rounded-full border border-black/10 bg-black/5 px-3 py-1.5 dark:border-white/10 dark:bg-white/5"
                  role="group"
                  aria-label="Selector de moneda"
                >
                  <button
                    onClick={() => onCurrencyChange('COP')}
                    aria-pressed={currency === 'COP'}
                    className={`cursor-pointer text-xs font-bold uppercase transition-colors ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-black/35 dark:text-white/35'
                      }`}
                  >
                    COP
                  </button>
                  <div className="h-2.5 w-[1px] bg-black/10 dark:bg-white/10" aria-hidden="true" />
                  <button
                    onClick={() => onCurrencyChange('USD')}
                    aria-pressed={currency === 'USD'}
                    className={`cursor-pointer text-xs font-bold uppercase transition-colors ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-black/35 dark:text-white/35'
                      }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-black/25 dark:text-white/25">Tema</span>
                <button
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-black/5 text-[#FF5C3A] transition-all active:scale-95 dark:border-white/10 dark:bg-white/5"
                  aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-2.5">
              <p className="mb-0.5 text-[9px] font-black uppercase tracking-[0.25em] text-[#FF5C3A]/80">Productos Pro</p>
              {productLinks.map((prod) => (
                <Link
                  key={prod.title}
                  href={prod.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex w-full items-center gap-3.5 rounded-2xl border border-black/8 bg-black/[0.03] p-3.5 text-left transition-all hover:border-black/12 hover:bg-black/[0.05] active:scale-[0.98] dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF5C3A]/10 transition-transform group-hover:scale-110">
                    <ArrowRight size={16} className="text-[#FF5C3A]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#0a0a0a] dark:text-white">{prod.title}</p>
                    <p className="text-[10px] font-medium text-black/35 dark:text-white/35">{prod.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
              {session ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0a0a0a] transition-colors hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Mi Panel
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0a0a0a] transition-colors hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Ingresar
                </Link>
              )}
              <Link
                href="/trial-checkout"
                onClick={() => {
                  fetchTrialDataIfNeeded();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center rounded-2xl bg-[#FF5C3A] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-[#FF5C3A]/20 transition-transform hover:scale-[1.01]"
              >
                Trial {formatPrice(trialPriceCOP, currency, trm)}
              </Link>
            </div>

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/8" />

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pb-1 text-[10px] font-medium text-black/25 dark:text-white/20">
              <Link href="/terminos" onClick={() => setMobileMenuOpen(false)} className="transition-colors hover:text-black/45 dark:hover:text-white/40">
                Terminos
              </Link>
              <Link href="/politicas-privacidad" onClick={() => setMobileMenuOpen(false)} className="transition-colors hover:text-black/45 dark:hover:text-white/40">
                Privacidad
              </Link>
              <Link href="/cookies" onClick={() => setMobileMenuOpen(false)} className="transition-colors hover:text-black/45 dark:hover:text-white/40">
                Cookies
              </Link>
              <Link href="/contacto" onClick={() => setMobileMenuOpen(false)} className="transition-colors hover:text-black/45 dark:hover:text-white/40">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
