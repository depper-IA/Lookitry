'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Globe, MessageCircle, ShieldCheck } from 'lucide-react';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#080808] pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-10 md:pb-12 px-4 sm:px-6 md:px-12 border-t border-white/5 relative z-10" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 sm:gap-14 md:gap-16 lg:gap-20 mb-16 sm:mb-20 md:mb-24">
          {/* Info Col */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8 md:mb-10 group">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10">
                <Image src="/logo.svg" alt="Lookitry" fill className="object-contain" />
              </div>
              <span className="font-jakarta text-2xl sm:text-3xl font-bold text-white tracking-tighter">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-xs mb-6 sm:mb-8 font-dm-sans font-light">
              Empoderamos al retail con Inteligencia Artificial. La primera solución de visualización personalizada líder en Colombia y Latinoamérica.
            </p>
            <div className="mb-6 sm:mb-8 md:mb-10">
              <Link href="/sobre-nosotros" className="text-[10px] sm:text-[11px] font-bold text-[#FF5C3A] uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:text-white transition-colors border-b border-[#FF5C3A]/30 pb-1">
                Conoce nuestra historia
              </Link>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              {[
                { Icon: Instagram, href: '#', label: 'Instagram' },
                { Icon: Facebook, href: '#', label: 'Facebook' },
                { Icon: Globe, href: '#', label: 'Sitio web' },
                { Icon: MessageCircle, href: '#', label: 'WhatsApp' }
              ].map((item, idx) => (
                <Link key={idx} href={item.href} className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#FF5C3A] hover:border-[#FF5C3A] transition-all duration-300" aria-label={item.label}>
                  <item.Icon size={18} aria-hidden="true" />
                </Link>
              ))}
              <Link href="#" className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#FF5C3A] hover:border-[#FF5C3A] transition-all duration-300" aria-label="TikTok">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Nav Col 1 */}
          <div>
            <h5 className="font-jakarta font-bold text-white text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] mb-6 sm:mb-8 md:mb-10">Ecosistema</h5>
            <ul className="flex flex-col gap-3 sm:gap-4 md:gap-5">
              {[
                { name: 'Probador Virtual', href: '/probador-virtual' },
                { name: 'Mini-Landing Pro', href: '/mini-landing' },
                { name: 'Plugin WooCommerce', href: '/plugin-woocommerce' },
                { name: 'API Developer', href: '/api-developer' },
                { name: 'Planes Mensuales', href: '/planes' }
              ].map(item => (
                <li key={item.name}><Link href={item.href} className="text-sm text-white/60 font-dm-sans hover:text-[#FF5C3A] transition-colors">{item.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Nav Col 2 */}
          <div>
            <h5 className="font-jakarta font-bold text-white text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] mb-6 sm:mb-8 md:mb-10">Recursos</h5>
            <ul className="flex flex-col gap-3 sm:gap-4 md:gap-5">
              {[
                { name: 'Centro de Ayuda', href: '/ayuda' },
                { name: 'Blog Técnico', href: '/blog' },
                { name: 'Sobre Nosotros', href: '/sobre-nosotros' },
                { name: 'Casos de Uso', href: '/casos-de-exito' },
                { name: 'Estado del sistema', href: '/estado' }
              ].map(item => (
                <li key={item.name}><Link href={item.href} className="text-sm text-white/60 font-dm-sans hover:text-[#FF5C3A] transition-colors">{item.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Nav Col 3 */}
          <div>
            <h5 className="font-jakarta font-bold text-white text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] mb-6 sm:mb-8 md:mb-10">Legal</h5>
            <ul className="flex flex-col gap-3 sm:gap-4 md:gap-5">
              {[
                { name: 'Términos de Servicio', href: '/terminos' },
                { name: 'Políticas Privacidad', href: '/politicas-privacidad' },
                { name: 'Política de Uso', href: '/politica-de-uso' },
                { name: 'Cookies', href: '/politicas-privacidad' },
                { name: 'Aviso Legal', href: '/terminos' }
              ].map(item => (
                <li key={item.name}><Link href={item.href} className="text-sm text-white/60 font-dm-sans hover:text-[#FF5C3A] transition-colors">{item.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 sm:pt-10 md:pt-12 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-10">
          <div className="text-white/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] font-dm-sans text-center lg:text-left">
            © {currentYear} Lookitry / Una división de <Link href="https://wilkiedevs.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Wilkie Devs SAS</Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10 sm:opacity-60 transition-opacity">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest font-dm-sans text-white/30"><Globe size={14} aria-hidden="true" /> CALI. COLOMBIA</div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest font-dm-sans text-white/30"><ShieldCheck size={14} aria-hidden="true" /> PCI Tier 1</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
