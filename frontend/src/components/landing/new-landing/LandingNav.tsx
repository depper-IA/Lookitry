'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, Layout, Zap, Terminal } from 'lucide-react';

interface LandingNavProps {
  currency?: 'COP' | 'USD';
  onCurrencyChange?: (c: 'COP' | 'USD') => void;
}

export default function LandingNav({
  currency: externalCurrency,
  onCurrencyChange: externalOnCurrencyChange
}: LandingNavProps) {
  const [internalCurrency, setInternalCurrency] = useState<'COP' | 'USD'>('COP');

  useEffect(() => {
    if (!externalCurrency) {
      const saved = localStorage.getItem('currency') as 'COP' | 'USD';
      if (saved) setInternalCurrency(saved);
    }
  }, [externalCurrency]);

  const currency = externalCurrency || internalCurrency;

  const onCurrencyChange = (c: 'COP' | 'USD') => {
    if (externalOnCurrencyChange) {
      externalOnCurrencyChange(c);
    } else {
      setInternalCurrency(c);
      localStorage.setItem('currency', c);
      window.dispatchEvent(new Event('currencyChange'));
    }
  };
  const [isStuck, setIsStuck] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setIsStuck(scrollPos > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (productsRef.current && !productsRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const menuLinks = [
    { label: 'Casos de Uso', href: '/casos-de-exito' },
    { label: 'Planes', href: '/planes' },
    { label: 'Blog', href: '/blog' }
  ];

  const productLinks = [
    {
      title: 'MINI-LANDING PRO',
      desc: 'Tu tienda online pro sin código.',
      href: '/mini-landing',
      icon: <Layout size={16} className="text-[#FF5C3A]" />,
      bgColor: 'bg-orange-500/5'
    },
    {
      title: 'WOOCOMMERCE PLUGIN',
      desc: 'Automatiza tu probador virtual.',
      href: '/plugin-woocommerce',
      icon: <Zap size={16} className="text-blue-400" />,
      bgColor: 'bg-blue-500/5'
    },
    {
      title: 'API DEVELOPER HUB',
      desc: 'IA nativa en tu propia app.',
      href: '/api-developer',
      icon: <Terminal size={16} className="text-emerald-400" />,
      bgColor: 'bg-emerald-500/5'
    }
  ];

  const navBg = isStuck
    ? 'bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md shadow-sm'
    : 'bg-white/80 dark:bg-transparent backdrop-blur-sm';

  return (
    <>
      <nav
        className={`sticky top-0 left-0 right-0 z-[70] px-4 sm:px-6 md:px-12 transition-all duration-500 ease-in-out ${navBg} ${isStuck ? 'py-3 sm:py-4' : 'py-6 sm:py-8'}`}
        role="navigation"
        aria-label="Navegación principal"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Lookitry - Inicio">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                <Image src="/logo.svg" alt="Lookitry" fill className="object-contain" priority />
              </div>
              <span className="font-jakarta text-xl sm:text-2xl font-bold tracking-tighter text-[#0a0a0a] dark:text-white">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>

            {/* Currency Toggle */}
            <div className="hidden sm:flex items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-2.5 sm:px-3 py-1.5 gap-2 sm:gap-2.5 ml-1 sm:ml-2" role="group" aria-label="Selector de moneda">
              <button
                onClick={() => onCurrencyChange('COP')}
                aria-pressed={currency === 'COP'}
                className={`text-[9px] sm:text-[8px] font-bold cursor-pointer transition-colors uppercase ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'}`}
              >
                COP
              </button>
              <div className="w-[1px] h-2.5 bg-black/10 dark:bg-white/10" aria-hidden="true" />
              <button
                onClick={() => onCurrencyChange('USD')}
                aria-pressed={currency === 'USD'}
                className={`text-[9px] sm:text-[8px] font-bold cursor-pointer transition-colors uppercase ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'}`}
              >
                USD
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-8 grow justify-center">
            {/* PRODUCTOS PRO Dropdown */}
            <div className="relative" ref={productsRef}>
              <button
                onMouseEnter={() => setProductsOpen(true)}
                onClick={() => setProductsOpen(!productsOpen)}
                aria-expanded={productsOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${productsOpen ? 'text-[#FF5C3A]' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
              >
                Productos Pro
                <ChevronDown size={12} className={`transition-transform duration-300 ${productsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {productsOpen && (
                <div
                  onMouseLeave={() => setProductsOpen(false)}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300"
                  role="menu"
                >
                  {productLinks.map((prod) => (
                    <Link
                      key={prod.title}
                      href={prod.href}
                      onClick={() => setProductsOpen(false)}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                      role="menuitem"
                    >
                      <div className={`w-10 h-10 rounded-xl ${prod.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        {prod.icon}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-black text-[#0a0a0a] dark:text-white uppercase tracking-wider mb-0.5">{prod.title}</p>
                        <p className="text-[10px] text-black/50 dark:text-white/50 leading-relaxed font-medium">{prod.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {menuLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[11px] font-bold uppercase tracking-[0.15em] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-all duration-300"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            <Link href="/login" className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.15em] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="group relative overflow-hidden bg-[#FF5C3A] text-white text-[11px] font-bold uppercase tracking-[0.15em] px-6 sm:px-8 py-3 sm:py-3.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#FF5C3A]/20"
            >
              <span className="relative z-10">Probar ahora</span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none opacity-20" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[55] bg-white dark:bg-[#0a0a0a] pt-24 sm:pt-28 px-6 sm:px-10 overflow-y-auto animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <div className="flex flex-col gap-6 pb-20">
            {/* Currency Selector - Mobile */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Moneda</span>
              <div className="flex items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2 gap-3" role="group" aria-label="Selector de moneda">
                <button
                  onClick={() => { onCurrencyChange('COP'); }}
                  aria-pressed={currency === 'COP'}
                  className={`text-sm font-bold cursor-pointer transition-colors uppercase ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-black/50 dark:text-white/50'}`}
                >
                  COP
                </button>
                <div className="w-[1px] h-3 bg-black/10 dark:bg-white/10" aria-hidden="true" />
                <button
                  onClick={() => { onCurrencyChange('USD'); }}
                  aria-pressed={currency === 'USD'}
                  className={`text-sm font-bold cursor-pointer transition-colors uppercase ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-black/50 dark:text-white/50'}`}
                >
                  USD
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-black text-[#FF5C3A] uppercase tracking-[0.2em] mb-1">PRODUCTOS PRO</p>
              {productLinks.map((prod) => (
                <Link
                  key={prod.title}
                  href={prod.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 active:scale-[0.98] transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl ${prod.bgColor} flex items-center justify-center shrink-0`}>
                    {prod.icon}
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-[#0a0a0a] dark:text-white uppercase tracking-wider">{prod.title}</p>
                    <p className="text-[10px] text-black/50 dark:text-white/50 font-medium">{prod.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-black/5 dark:border-white/5">
              {menuLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xl sm:text-2xl font-jakarta font-bold text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 text-center text-black/60 dark:text-white/60 font-bold uppercase tracking-widest text-[11px] border border-black/10 dark:border-white/10 rounded-2xl active:scale-[0.98] transition-all"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-[#FF5C3A] text-white px-8 py-4 rounded-2xl font-jakarta font-black text-center transition-all active:scale-[0.98] shadow-xl shadow-[#FF5C3A]/20"
              >
                Probar ahora
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
