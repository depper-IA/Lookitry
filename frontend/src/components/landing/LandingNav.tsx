'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Menu, X, User, LogOut, Layout, Zap, Terminal } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface LandingNavProps {
  ctaHref?: string;
  ctaLabel?: string;
  currentCurrency?: 'COP' | 'USD';
  onCurrencyChange?: (c: 'COP' | 'USD') => void;
}

export function LandingNav({ ctaHref, ctaLabel, currentCurrency, onCurrencyChange }: LandingNavProps) {
  const [session, setSession] = useState<{ name: string; email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si se pasa currentCurrency por props, sincronizar estado interno
    if (currentCurrency && currentCurrency !== currency) {
      setCurrency(currentCurrency);
    }
  }, [currentCurrency]);

  useEffect(() => {
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved && !currentCurrency) setCurrency(saved);

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

  const toggleCurrency = () => {
    const next = currency === 'COP' ? 'USD' : 'COP';
    if (onCurrencyChange) {
      onCurrencyChange(next);
    } else {
      setCurrency(next);
    }
    localStorage.setItem('currency', next);
    window.dispatchEvent(new Event('currencyChange'));
  };

  async function handleLogout() {
    await authService.logout();
    setSession(null);
    setDropdownOpen(false);
    window.location.href = '/login';
  }

  const resolvedCtaHref = ctaHref ?? '/register';
  const resolvedCtaLabel = ctaLabel ?? 'Probar ahora';

  const initials = session?.name
    ? session.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <nav className="sticky top-0 left-0 right-0 z-[70] bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 py-3 md:py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-4 md:gap-8 grow lg:grow-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-7 h-7 md:w-8 md:h-8">
              <Image src="/logo.svg" alt="Lookitry" fill className="object-contain" priority />
            </div>
            <span className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-bold tracking-tighter text-white">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
        </div>

        {/* Center: Intelligent Navigation Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2">
          {/* Products Dropdown */}
          <div className="relative" ref={productsRef}>
            <button 
              onMouseEnter={() => setProductsOpen(true)}
              onClick={() => setProductsOpen(!productsOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${productsOpen ? 'text-[#FF5C3A]' : 'text-[#FF5C3A] hover:text-white'}`}
            >
              PRODUCTOS PRO
              <ChevronDown size={12} className={`transition-transform duration-300 ${productsOpen ? 'rotate-180' : ''}`} />
            </button>

            {productsOpen && (
              <div 
                onMouseLeave={() => setProductsOpen(false)}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <Link href="/mini-landing-pro" onClick={() => setProductsOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#FF5C3A] group-hover:bg-[#FF5C3A] group-hover:text-white transition-all">
                    <Layout size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-0.5">Mini-Landing Pro</p>
                    <p className="text-[9px] text-white/40 leading-relaxed font-medium">Tu tienda online pro sin código.</p>
                  </div>
                </Link>
                <Link href="/plugin-woocommerce" onClick={() => setProductsOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <Zap size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-0.5">WooCommerce Plugin</p>
                    <p className="text-[9px] text-white/40 leading-relaxed font-medium">Automatiza tu probador virtual.</p>
                  </div>
                </Link>
                <Link href="/api-developer" onClick={() => setProductsOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Terminal size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-0.5">API Developer Hub</p>
                    <p className="text-[9px] text-white/40 leading-relaxed font-medium">IA nativa en tu propia app.</p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {[
            { label: 'CASOS DE ÉXITO', href: '/casos-de-exito' },
            { label: 'PLANES', href: '/planes' },
            { label: 'BLOG', href: '/blog' }
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 hover:text-white transition-all duration-300 relative group"
            >
              {item.label}
              <span className="absolute bottom-0 left-3 right-3 h-[1px] bg-[#FF5C3A] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </Link>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 group p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#FF5C3A] flex items-center justify-center text-white font-bold text-xs">
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
                  <Link href="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group">
                    <User size={16} className="text-white/30 group-hover:text-[#FF5C3A] transition-colors" />
                    <span className="text-[12px] font-bold text-white/80 group-hover:text-white transition-colors">Dashboard General</span>
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors group">
                    <LogOut size={16} className="text-white/30 group-hover:text-red-500 transition-colors" />
                    <span className="text-[12px] font-bold text-white/80 group-hover:text-red-500 transition-colors">Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="hidden xl:flex items-center bg-white/5 border border-white/10 rounded-full px-2.5 py-1.5 gap-2">
                <button 
                  onClick={() => currency !== 'COP' && toggleCurrency()}
                  className={`text-[9px] font-bold tracking-widest transition-colors ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-white/40 hover:text-white/70'}`}
                >
                  COP
                </button>
                <div className="w-[1px] h-2 bg-white/10" />
                <button 
                  onClick={() => currency !== 'USD' && toggleCurrency()}
                  className={`text-[9px] font-bold tracking-widest transition-colors ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-white/40 hover:text-white/70'}`}
                >
                  USD
                </button>
              </div>
              <Link 
                href="/login" 
                className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
              >
                Ingresar
              </Link>
              <Link
                href={resolvedCtaHref}
                className="group relative overflow-hidden bg-[#FF5C3A] text-white text-[10px] font-bold uppercase tracking-[0.2em] px-6 md:px-8 py-3 md:py-3.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#FF5C3A]/20"
              >
                <span className="relative z-10">{resolvedCtaLabel}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[60px] bg-[#0a0a0a]/95 backdrop-blur-xl z-50 p-6 animate-in fade-in slide-in-from-right duration-300 border-t border-white/5 overflow-y-auto">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="text-[9px] font-black text-[#FF5C3A] uppercase tracking-[0.3em] mb-2">Productos Pro</p>
              <Link href="/mini-landing-pro" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-[0.98] transition-all hover:bg-white/10 hover:border-white/20 group">
                <div className="w-10 h-10 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] group-hover:bg-[#FF5C3A] group-hover:text-white transition-all">
                  <Layout size={20} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white uppercase tracking-wider">Mini-Landing Pro</p>
                  <p className="text-[10px] text-white/40 font-medium">Tienda sin código.</p>
                </div>
              </Link>
              <Link href="/plugin-woocommerce" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-[0.98] transition-all hover:bg-white/10 hover:border-white/20 group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white uppercase tracking-wider">Woo Plugin</p>
                  <p className="text-[10px] text-white/40 font-medium">Ventas en piloto automático.</p>
                </div>
              </Link>
              <Link href="/api-developer" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-[0.98] transition-all hover:bg-white/10 hover:border-white/20 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Terminal size={20} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white uppercase tracking-wider">Developer API</p>
                  <p className="text-[10px] text-white/40 font-medium">Integración nativa.</p>
                </div>
              </Link>
            </div>

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-black text-[#FF5C3A] uppercase tracking-[0.3em] mb-2">Corporativo</p>
              {[
                { label: 'Casos de Éxito', href: '/casos-de-exito' },
                { label: 'Planes y Precios', href: '/planes' },
                { label: 'Nuestro Blog', href: '/blog' }
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-4 text-2xl font-bold font-['Plus_Jakarta_Sans'] text-white/60 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {!session && (
              <div className="mt-4 pt-6 border-t border-white/5 flex flex-col gap-4">
                {/* Currency Selector - Mobile */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Moneda</span>
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 gap-3" role="group" aria-label="Selector de moneda">
                    <button
                      onClick={() => { if (currency !== 'COP') toggleCurrency(); }}
                      aria-pressed={currency === 'COP'}
                      className={`text-sm font-bold cursor-pointer transition-colors uppercase ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-white/50'}`}
                    >
                      COP
                    </button>
                    <div className="w-[1px] h-3 bg-white/10" aria-hidden="true" />
                    <button
                      onClick={() => { if (currency !== 'USD') toggleCurrency(); }}
                      aria-pressed={currency === 'USD'}
                      className={`text-sm font-bold cursor-pointer transition-colors uppercase ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-white/50'}`}
                    >
                      USD
                    </button>
                  </div>
                </div>

                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-4 text-center text-white/60 font-bold uppercase tracking-widest text-[11px] border border-white/10 rounded-2xl active:scale-[0.98] transition-all hover:bg-white/5 hover:border-white/20"
                >
                  Ingresar a mi cuenta
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-5 bg-[#FF5C3A] rounded-2xl text-center text-white font-bold uppercase tracking-[0.2em] text-[12px] active:scale-[0.98] transition-all hover:bg-[#ff7a5f]"
                >
                  Probar gratis ahora
                </Link>
              </div>
            )}

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] text-white/30 font-medium">
              <Link href="/terminos" className="hover:text-white/60 transition-colors">Términos</Link>
              <Link href="/politicas-privacidad" className="hover:text-white/60 transition-colors">Privacidad</Link>
              <Link href="/cookies" className="hover:text-white/60 transition-colors">Cookies</Link>
              <Link href="/contacto" className="hover:text-white/60 transition-colors">Contacto</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
