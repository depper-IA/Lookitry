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

  // Si no se provee moneda externa, cargamos del localStorage o usamos COP
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
      // Disparar evento para que otros componentes se enteren (como PlanesClient)
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

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (productsRef.current && !productsRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[60] px-6 md:px-12 transition-all duration-500 ease-in-out ${isStuck
            ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 py-4'
            : 'bg-transparent py-8'
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="relative w-8 h-8">
                <Image src="/logo.svg" alt="Lookitry" fill className="object-contain" />
              </div>
              <span className="font-jakarta text-2xl font-bold tracking-tighter text-white">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>

            {/* Currency Toggle */}
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 gap-2.5 ml-2">
              <button
                onClick={() => onCurrencyChange('COP')}
                className={`text-[8px] font-bold cursor-pointer transition-colors uppercase ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-white/30 hover:text-white'}`}
              >
                COP
              </button>
              <div className="w-[1px] h-2.5 bg-white/10" />
              <button
                onClick={() => onCurrencyChange('USD')}
                className={`text-[8px] font-bold cursor-pointer transition-colors uppercase ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-white/30 hover:text-white'}`}
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
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${productsOpen ? 'text-[#FF5C3A]' : 'text-white/50 hover:text-white'}`}
              >
                Productos Pro
                <ChevronDown size={12} className={`transition-transform duration-300 ${productsOpen ? 'rotate-180' : ''}`} />
              </button>

              {productsOpen && (
                <div
                  onMouseLeave={() => setProductsOpen(false)}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  {productLinks.map((prod) => (
                    <Link
                      key={prod.title}
                      href={prod.href}
                      onClick={() => setProductsOpen(false)}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-xl ${prod.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        {prod.icon}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">{prod.title}</p>
                        <p className="text-[9px] text-white/40 leading-relaxed font-medium">{prod.desc}</p>
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
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-all duration-300"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/login" className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="group relative overflow-hidden bg-[#FF5C3A] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-8 py-3.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#FF5C3A]/20"
            >
              <span className="relative z-10">Probar ahora</span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none opacity-20" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[55] bg-[#0a0a0a] pt-32 px-10 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex flex-col gap-8 pb-20">
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-black text-[#FF5C3A] uppercase tracking-[0.3em] mb-2">PRODUCTOS PRO</p>
              {productLinks.map((prod) => (
                <Link
                  key={prod.title}
                  href={prod.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5"
                >
                  <div className={`w-10 h-10 rounded-xl ${prod.bgColor} flex items-center justify-center shrink-0`}>
                    {prod.icon}
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-white uppercase tracking-wider">{prod.title}</p>
                    <p className="text-[10px] text-white/40 font-medium">{prod.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-6 pt-4 border-t border-white/5">
              {menuLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-jakarta font-bold text-white/40 hover:text-white transition-colors uppercase tracking-tight"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-4 text-center text-white/60 font-bold uppercase tracking-widest text-[11px] border border-white/5 rounded-2xl"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="flex-1 bg-[#FF5C3A] text-white px-8 py-5 rounded-3xl font-jakarta font-black text-center transition-all hover:scale-105 shadow-xl shadow-[#FF5C3A]/20"
              >
                PLANES PREMIUM
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
