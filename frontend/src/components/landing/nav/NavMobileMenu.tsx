'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import { formatPrice } from '@/utils/currency';

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

interface NavMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currency: 'COP' | 'USD';
  onCurrencyChange: (c: 'COP' | 'USD') => void;
  toggleTheme: () => void;
  isDark: boolean;
  session: any;
  trialPriceCOP: number;
  trm: number;
  fetchTrialDataIfNeeded: () => void;
  howItWorksSteps: any[];
  howItWorksLinks: any[];
  menuLinks: any[];
  productLinks: any[];
}

export function NavMobileMenu({
  isOpen,
  onClose,
  currency,
  onCurrencyChange,
  toggleTheme,
  isDark,
  session,
  trialPriceCOP,
  trm,
  fetchTrialDataIfNeeded,
  howItWorksSteps,
  howItWorksLinks,
  menuLinks,
  productLinks,
}: NavMobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = menuRef.current?.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    // Focus the first element when menu opens
    setTimeout(() => firstElement?.focus(), 100);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
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
          ref={menuRef}
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
                  <Link href={link.href} onClick={onClose} className={`mobile-nav-link group flex items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ${link.highlight ? 'bg-accent text-white' : 'border border-black/8 bg-black/[0.03] hover:border-accent/30 hover:bg-accent/5 dark:border-white/5 dark:bg-white/5'}`}>
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
                  <Link href={link.href} onClick={onClose} className="mobile-nav-link group flex items-center justify-between rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3.5 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 dark:border-white/5 dark:bg-white/5 dark:hover:border-accent/30 dark:hover:bg-accent/10">
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
                  <Link href={prod.href} onClick={onClose} className="mobile-product-link group flex items-center gap-3.5 rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3.5 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 dark:border-white/5 dark:bg-white/5 dark:hover:border-accent/30 dark:hover:bg-accent/10">
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
                  <Link href="/dashboard" onClick={onClose} className="mobile-panel-btn flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-dark transition-all duration-200 hover:bg-black/[0.05] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                    Mi Panel
                  </Link>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/login" onClick={onClose} className="mobile-login-btn flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-dark transition-all duration-200 hover:bg-black/[0.05] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                    Ingresar
                  </Link>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/trial-checkout" onClick={() => { fetchTrialDataIfNeeded(); onClose(); }} className="mobile-trial-btn flex items-center justify-center rounded-2xl bg-accent px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-accent/20 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/30">
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
                  <Link href={link.href} onClick={onClose} className="mobile-footer-link transition-colors duration-200 hover:text-accent">
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
