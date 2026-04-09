'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Menu, X, ChevronDown } from 'lucide-react';

const navLinks = [
  { href: '/#funciones', label: 'Funciones' },
  { href: '/#precios', label: 'Planes' },
  { href: '/blog', label: 'Blog' },
  { href: '/#contacto', label: 'Contacto' },
];

export function PublicTopbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'h-16 shadow-lg shadow-black/10' 
            : 'h-20'
        }`}
        style={{
          backgroundColor: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: isScrolled 
            ? '1px solid rgba(255, 92, 58, 0.1)' 
            : '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="relative flex items-center justify-between h-full px-4 lg:px-8 max-w-[1400px] mx-auto">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 group"
            aria-label="Lookitry - Inicio"
          >
            {/* Logo SVG */}
            <div className="relative">
              <svg 
                width="36" 
                height="36" 
                viewBox="0 0 36 36" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-300 group-hover:scale-105"
              >
                {/* Background circle */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="16" 
                  fill="url(#logoGradient)" 
                  className="transition-all duration-300 group-hover:opacity-90"
                />
                {/* Lookitry "L" stylized */}
                <path 
                  d="M12 10h8a4 4 0 0 1 0 8h-5v6h-3V10z" 
                  fill="white"
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="logoGradient" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF5C3A"/>
                    <stop offset="1" stopColor="#FF8A6A"/>
                  </linearGradient>
                </defs>
              </svg>
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 92, 58, 0.3) 0%, transparent 70%)',
                  transform: 'scale(1.5)',
                }}
              />
            </div>
            {/* Brand name */}
            <span className="text-xl font-bold tracking-tight">
              Look<span className="text-[#FF5C3A] transition-colors duration-300">itry</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg group"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {link.label}
                {/* Hover underline effect */}
                <span className="absolute bottom-1 left-4 right-4 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"
                  style={{ backgroundColor: '#FF5C3A' }}
                />
              </Link>
            ))}
          </nav>

          {/* Right side: CTA + Theme */}
          <div className="flex items-center gap-3">
            {/* CTA Button */}
            <Link
              href="/register"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: '#FF5C3A',
                color: 'white',
                boxShadow: '0 4px 15px rgba(255, 92, 58, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e64d2e';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 92, 58, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FF5C3A';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 92, 58, 0.3)';
              }}
            >
              <span>Prueba gratis</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            {/* Theme Toggle */}
            <div className="flex items-center pl-2 border-l border-white/10">
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg transition-colors duration-200 lg:hidden"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-40 lg:hidden"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255, 92, 58, 0.1)',
            }}
          >
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 92, 58, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {link.label}
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </Link>
              ))}
              
              {/* Mobile CTA */}
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 mt-4 px-4 py-3 text-base font-semibold rounded-lg"
                style={{
                  backgroundColor: '#FF5C3A',
                  color: 'white',
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>Prueba gratis</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Need to import AnimatePresence and motion from framer-motion
import { motion, AnimatePresence } from 'framer-motion';
