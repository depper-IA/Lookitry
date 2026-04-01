'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Globe, MessageCircle, ShieldCheck } from 'lucide-react';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#080808] pt-32 pb-12 px-6 md:px-12 border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-20 mb-24">
          {/* Info Col */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
              <div className="relative w-10 h-10">
                <Image src="/logo.svg" alt="Lookitry" fill className="object-contain" />
              </div>
              <span className="font-jakarta text-3xl font-bold text-white tracking-tighter">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>
            <p className="text-white/70 text-base leading-relaxed max-w-xs mb-8 font-dm-sans font-light">
              Empoderamos al retail con Inteligencia Artificial. La primera solución de visualización personalizada líder en Colombia y Latinoamérica.
            </p>
            <div className="mb-10">
              <Link href="/sobre-nosotros" className="text-[11px] font-bold text-[#FF5C3A] uppercase tracking-[0.2em] hover:text-white transition-colors border-b border-[#FF5C3A]/30 pb-1">
                Conoce nuestra historia
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {[
                { Icon: Instagram, href: '#' },
                { Icon: Facebook, href: '#' },
                { Icon: Globe, href: '#' },
                { Icon: MessageCircle, href: '#' }
              ].map((item, idx) => (
                <Link key={idx} href={item.href} className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#FF5C3A] hover:border-[#FF5C3A] transition-all duration-300">
                  <item.Icon size={18} />
                </Link>
              ))}
              <Link href="#" className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#FF5C3A] hover:border-[#FF5C3A] transition-all duration-300">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Nav Col 1 */}
          <div>
            <h5 className="font-jakarta font-bold text-white text-[10px] uppercase tracking-[0.3em] mb-10">Ecosistema</h5>
            <ul className="flex flex-col gap-5">
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
            <h5 className="font-jakarta font-bold text-white text-[10px] uppercase tracking-[0.3em] mb-10">Recursos</h5>
            <ul className="flex flex-col gap-5">
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
            <h5 className="font-jakarta font-bold text-white text-[10px] uppercase tracking-[0.3em] mb-10">Legal</h5>
            <ul className="flex flex-col gap-5">
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

        <div className="pt-12 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="text-white/10 text-[10px] font-bold uppercase tracking-[0.3em] font-dm-sans">
            © {currentYear} Lookitry / Una división de <Link href="https://wilkiedevs.com" target="_blank" className="hover:text-white transition-colors">Wilkie Devs SAS</Link>
          </div>
          <div className="flex items-center gap-12 opacity-60 transition-opacity">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest font-dm-sans"><Globe size={14} /> CALI. COLOMBIA</div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest font-dm-sans"><ShieldCheck size={14} /> PCI Tier 1</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
