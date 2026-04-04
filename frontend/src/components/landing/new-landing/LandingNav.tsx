'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, Layout, Zap, Terminal, User, LogOut } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface LandingNavProps {
  currency?: 'COP' | 'USD';
  onCurrencyChange?: (c: 'COP' | 'USD') => void;
}

export default function LandingNav({
  currency: externalCurrency,
  onCurrencyChange: externalOnCurrencyChange
}: LandingNavProps) {
  const [internalCurrency, setInternalCurrency] = useState<'COP' | 'USD'>('COP');
  const [session, setSession] = useState<{ name: string; email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!externalCurrency) {
      const saved = localStorage.getItem('currency') as 'COP' | 'USD';
      if (saved) setInternalCurrency(saved);
    }
  }, [externalCurrency]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
    if (!token) return;
    try {
      const brand = JSON.parse(localStorage.getItem('brand') || 'null');
      if (brand?.name || brand?.email) {
        setSession({ name: brand.name || '', email: brand.email || '' });
      }
    } catch {}
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
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

  async function handleLogout() {
    await authService.logout();
    setSession(null);
    setDropdownOpen(false);
    window.location.href = '/';
  }

  const initials = session?.name
    ? session.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

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
      bgColor: 'bg-[#FF5C3A]/10'
    },
    {
      title: 'WOOCOMMERCE PLUGIN',
      desc: 'Automatiza tu probador virtual.',
      href: '/plugin-woocommerce',
      icon: <Zap size={16} className="text-blue-400" />,
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'API DEVELOPER HUB',
      desc: 'IA nativa en tu propia app.',
      href: '/api-developer',
      icon: <Terminal size={16} className="text-emerald-400" />,
      bgColor: 'bg-emerald-500/10'
    }
  ];

  const navBg = 'bg-white/92 dark:bg-[#0a0a0a]/82 backdrop-blur-md border-b border-black/5 dark:border-white/5';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[70] px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full ${navBg}`}
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
                className={`text-[9px] sm:text-[8px] font-bold cursor-pointer transition-colors uppercase ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-black/45 dark:text-white/50 hover:text-[#0a0a0a] dark:hover:text-white'}`}
              >
                COP
              </button>
              <div className="w-[1px] h-2.5 bg-black/10 dark:bg-white/10" aria-hidden="true" />
              <button
                onClick={() => onCurrencyChange('USD')}
                aria-pressed={currency === 'USD'}
                className={`text-[9px] sm:text-[8px] font-bold cursor-pointer transition-colors uppercase ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-black/45 dark:text-white/50 hover:text-[#0a0a0a] dark:hover:text-white'}`}
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
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${productsOpen ? 'text-[#FF5C3A]' : 'text-black/60 dark:text-white/60 hover:text-[#0a0a0a] dark:hover:text-white'}`}
              >
                Productos Pro
                <ChevronDown size={12} className={`transition-transform duration-300 ${productsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {productsOpen && (
                <div
                  onMouseLeave={() => setProductsOpen(false)}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300"
                  role="menu"
                >
                  {productLinks.map((prod) => (
                    <Link
                      key={prod.title}
                      href={prod.href}
                      onClick={() => setProductsOpen(false)}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group"
                      role="menuitem"
                    >
                      <div className={`w-10 h-10 rounded-xl ${prod.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        {prod.icon}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">{prod.title}</p>
                        <p className="text-[10px] text-white/50 leading-relaxed font-medium">{prod.desc}</p>
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
                className="text-[11px] font-bold uppercase tracking-[0.15em] text-black/60 dark:text-white/60 hover:text-[#0a0a0a] dark:hover:text-white transition-all duration-300 relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#FF5C3A] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 group p-1 pr-3 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF5C3A] flex items-center justify-center text-white font-bold text-xs">
                    {initials}
                  </div>
                  <div className="hidden sm:flex flex-col items-start mr-1">
                    <span className="text-[10px] font-bold text-[#0a0a0a] dark:text-white truncate max-w-[100px]">{session.name}</span>
                    <span className="text-[8px] text-black/30 dark:text-white/30 uppercase tracking-widest leading-none">Mi Panel</span>
                  </div>
                  <ChevronDown size={14} className={`text-black/20 dark:text-white/20 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                    >
                      <User size={16} className="text-white/30 group-hover:text-[#FF5C3A] transition-colors" />
                      <span className="text-[12px] font-bold text-white/80 group-hover:text-white transition-colors">Dashboard General</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors group"
                    >
                      <LogOut size={16} className="text-white/30 group-hover:text-red-500 transition-colors" />
                      <span className="text-[12px] font-bold text-white/80 group-hover:text-red-500 transition-colors">Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60 hover:text-[#0a0a0a] dark:hover:text-white transition-colors"
              >
                Ingresar
              </Link>
            )}

            <Link
              href="/checkout?plan=TRIAL"
              className="group relative overflow-hidden bg-[#FF5C3A] text-white text-[10px] font-bold uppercase tracking-[0.15em] px-6 sm:px-8 py-3 sm:py-3.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#FF5C3A]/20"
            >
              <span className="relative z-10">Probar ahora</span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none opacity-20" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden text-[#0a0a0a]/80 dark:text-white/80 hover:text-[#0a0a0a] dark:hover:text-white transition-colors p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[55] bg-[rgba(10,10,10,0.98)] px-6 pb-8 pt-24 backdrop-blur-xl animate-in fade-in slide-in-from-right duration-300 overflow-y-auto sm:px-10 sm:pt-28" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6 rounded-[2rem] border border-white/8 bg-white/[0.03] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            {/* Currency Selector - Mobile */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Moneda</span>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 gap-2.5" role="group" aria-label="Selector de moneda">
                <button
                  onClick={() => { onCurrencyChange('COP'); }}
                  aria-pressed={currency === 'COP'}
                  className={`text-xs font-bold cursor-pointer transition-colors uppercase ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-white/35'}`}
                >
                  COP
                </button>
                <div className="w-[1px] h-2.5 bg-white/10" aria-hidden="true" />
                <button
                  onClick={() => { onCurrencyChange('USD'); }}
                  aria-pressed={currency === 'USD'}
                  className={`text-xs font-bold cursor-pointer transition-colors uppercase ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-white/35'}`}
                >
                  USD
                </button>
              </div>
            </div>

            {/* Products */}
            <div className="flex flex-col items-center gap-2.5 w-full">
              <p className="text-[9px] font-black text-[#FF5C3A]/60 uppercase tracking-[0.25em] mb-0.5">PRODUCTOS PRO</p>
              {productLinks.map((prod) => (
                <Link
                  key={prod.title}
                  href={prod.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 p-3.5 bg-white/5 rounded-2xl border border-white/5 active:scale-[0.98] transition-all hover:bg-white/10 hover:border-white/10 group w-full"
                >
                  <div className={`w-9 h-9 rounded-xl ${prod.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    {prod.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">{prod.title}</p>
                    <p className="text-[10px] text-white/35 font-medium">{prod.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/8 to-transparent" />

            {/* Main Links */}
            <div className="flex flex-col items-center gap-4 w-full">
              {menuLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-jakarta font-bold text-white/35 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/8 to-transparent" />

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pb-1 text-[10px] text-white/20 font-medium">
              <Link href="/terminos" className="hover:text-white/40 transition-colors">Términos</Link>
              <Link href="/politicas-privacidad" className="hover:text-white/40 transition-colors">Privacidad</Link>
              <Link href="/cookies" className="hover:text-white/40 transition-colors">Cookies</Link>
              <Link href="/contacto" className="hover:text-white/40 transition-colors">Contacto</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

