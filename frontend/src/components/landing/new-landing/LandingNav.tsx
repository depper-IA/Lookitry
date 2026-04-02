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
    window.location.href = '/login';
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

  const navBg = 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5';

  return (
    <>
      <nav
        className={`sticky top-0 z-[70] px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full ${navBg}`}
        role="navigation"
        aria-label="Navegación principal"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Lookitry - Inicio">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                <Image src="/logo.svg" alt="Lookitry" fill className="object-contain" priority />
              </div>
              <span className="font-jakarta text-xl sm:text-2xl font-bold tracking-tighter text-white">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>

            {/* Currency Toggle */}
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full px-2.5 sm:px-3 py-1.5 gap-2 sm:gap-2.5 ml-1 sm:ml-2" role="group" aria-label="Selector de moneda">
              <button
                onClick={() => onCurrencyChange('COP')}
                aria-pressed={currency === 'COP'}
                className={`text-[9px] sm:text-[8px] font-bold cursor-pointer transition-colors uppercase ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-white/50 hover:text-white'}`}
              >
                COP
              </button>
              <div className="w-[1px] h-2.5 bg-white/10" aria-hidden="true" />
              <button
                onClick={() => onCurrencyChange('USD')}
                aria-pressed={currency === 'USD'}
                className={`text-[9px] sm:text-[8px] font-bold cursor-pointer transition-colors uppercase ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-white/50 hover:text-white'}`}
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
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${productsOpen ? 'text-[#FF5C3A]' : 'text-white/60 hover:text-white'}`}
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
                className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60 hover:text-white transition-all duration-300 relative group"
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
                  className="flex items-center gap-2 group p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF5C3A] flex items-center justify-center text-white font-bold text-xs">
                    {initials}
                  </div>
                  <div className="hidden sm:flex flex-col items-start mr-1">
                    <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{session.name}</span>
                    <span className="text-[8px] text-white/30 uppercase tracking-widest leading-none">Mi Panel</span>
                  </div>
                  <ChevronDown size={14} className={`text-white/20 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
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
                className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
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
              className="lg:hidden text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
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
        <div className="fixed inset-0 z-[55] bg-[#0a0a0a]/95 backdrop-blur-xl pt-24 sm:pt-28 px-6 sm:px-10 overflow-y-auto animate-in fade-in slide-in-from-right duration-300" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <div className="flex flex-col gap-6 pb-20">
            {/* Currency Selector - Mobile */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Moneda</span>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 gap-3" role="group" aria-label="Selector de moneda">
                <button
                  onClick={() => { onCurrencyChange('COP'); }}
                  aria-pressed={currency === 'COP'}
                  className={`text-sm font-bold cursor-pointer transition-colors uppercase ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-white/50'}`}
                >
                  COP
                </button>
                <div className="w-[1px] h-3 bg-white/10" aria-hidden="true" />
                <button
                  onClick={() => { onCurrencyChange('USD'); }}
                  aria-pressed={currency === 'USD'}
                  className={`text-sm font-bold cursor-pointer transition-colors uppercase ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-white/50'}`}
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
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 active:scale-[0.98] transition-all hover:bg-white/10 hover:border-white/10 group"
                >
                  <div className={`w-10 h-10 rounded-xl ${prod.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    {prod.icon}
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-white uppercase tracking-wider">{prod.title}</p>
                    <p className="text-[10px] text-white/50 font-medium">{prod.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="flex flex-col gap-4 pt-2 border-t border-white/5">
              {menuLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xl sm:text-2xl font-jakarta font-bold text-white/50 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Mobile Auth Section */}
            <div className="flex flex-col gap-3">
              {session ? (
                <>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-[#FF5C3A] flex items-center justify-center text-white font-bold text-sm">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white">{session.name}</span>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">Mi Panel</span>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 py-3.5 px-4 text-white/80 font-bold uppercase tracking-widest text-[11px] border border-white/10 rounded-2xl active:scale-[0.98] transition-all hover:bg-white/5"
                  >
                    <User size={16} className="text-white/40" />
                    Dashboard General
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 py-3.5 px-4 text-white/80 font-bold uppercase tracking-widest text-[11px] border border-red-500/20 rounded-2xl active:scale-[0.98] transition-all hover:bg-red-500/10"
                  >
                    <LogOut size={16} className="text-red-400" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3.5 text-center text-white/60 font-bold uppercase tracking-widest text-[11px] border border-white/10 rounded-2xl active:scale-[0.98] transition-all hover:bg-white/5"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/checkout?plan=TRIAL"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-[#FF5C3A] text-white px-8 py-4 rounded-2xl font-jakarta font-black text-center transition-all active:scale-[0.98] hover:bg-[#ff7a5f] shadow-xl shadow-[#FF5C3A]/20"
                  >
                    Probar ahora
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] text-white/30 font-medium pt-4">
              <Link href="/terminos" className="hover:text-white/60 transition-colors">Términos</Link>
              <Link href="/politicas-privacidad" className="hover:text-white/60 transition-colors">Privacidad</Link>
              <Link href="/cookies" className="hover:text-white/60 transition-colors">Cookies</Link>
              <Link href="/contacto" className="hover:text-white/60 transition-colors">Contacto</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
