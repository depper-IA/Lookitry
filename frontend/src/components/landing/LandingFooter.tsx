'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  Instagram, 
  Youtube, 
  Twitter
} from 'lucide-react';

const NAV_PRODUCTO = [
  { label: 'Inicio', href: '/' },
  { label: 'Planes y precios', href: '/planes' },
  { label: 'Iniciar sesión', href: '/login' },
  { label: 'Crear cuenta gratis', href: '/register' },
];

const NAV_EMPRESA = [
  { label: 'Sobre nosotros', href: '/sobre-nosotros' },
  { label: 'Términos y Condiciones', href: '/terminos' },
  { label: 'Política de Privacidad', href: '/politicas-privacidad' },
];

// Icono personalizado para TikTok (Lucide no lo tiene por defecto en versiones antiguas o es diferente)
function IconTikTok() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

export function LandingFooter() {
  const [socials, setSocials] = useState<{
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    x?: string;
  }>({ instagram: '#', tiktok: '#' });

  useEffect(() => {
    // Cargar config desde Supabase (vía API pública de pricing)
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?id=eq.meta&select=data`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
    })
      .then(r => r.json())
      .then(rows => {
        if (rows && rows[0]?.data) {
          const d = rows[0].data;
          setSocials({
            instagram: d.social_instagram || '#',
            tiktok: d.social_tiktok || '#',
            youtube: d.social_youtube,
            x: d.social_x,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#080808] border-t border-[#161616]">

      {/* Cuerpo principal */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-10 lg:gap-16">

        {/* Columna 1 — Marca + contacto */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
            <Image
              src="/logo.svg"
              alt="Lookitry"
              width={22}
              height={22}
              className="object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <span className="font-syne font-extrabold text-[15px] text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>

          <p className="text-[13px] text-[#777] leading-relaxed mb-6 max-w-[280px] mx-auto sm:mx-0">
            Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica.
          </p>

          {/* RRSS */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-8">
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" 
                className="w-8 h-8 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#555] hover:text-[#FF5C3A] hover:border-[#FF5C3A]/30 transition-all">
                <Instagram size={14} />
              </a>
            )}
            {socials.tiktok && (
              <a href={socials.tiktok} target="_blank" rel="noopener noreferrer" 
                className="w-8 h-8 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#555] hover:text-[#FF5C3A] hover:border-[#FF5C3A]/30 transition-all">
                <IconTikTok />
              </a>
            )}
            {socials.youtube && socials.youtube !== '#' && (
              <a href={socials.youtube} target="_blank" rel="noopener noreferrer" 
                className="w-8 h-8 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#555] hover:text-[#FF5C3A] hover:border-[#FF5C3A]/30 transition-all">
                <Youtube size={14} />
              </a>
            )}
            {socials.x && socials.x !== '#' && (
              <a href={socials.x} target="_blank" rel="noopener noreferrer" 
                className="w-8 h-8 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#555] hover:text-[#FF5C3A] hover:border-[#FF5C3A]/30 transition-all">
                <Twitter size={14} />
              </a>
            )}
          </div>

          {/* Contacto */}
          <div className="flex flex-col gap-3">
            <a
              href="mailto:info@pruebalo.wilkiedevs.com"
              className="inline-flex items-center gap-2.5 text-[12px] text-[#666] hover:text-[#FF5C3A] transition-colors group"
            >
              <span className="w-7 h-7 rounded-lg bg-[#111] border border-[#1e1e1e] flex items-center justify-center flex-shrink-0 group-hover:border-[#FF5C3A]/30 transition-colors">
                <Mail size={13} />
              </span>
              info@pruebalo.wilkiedevs.com
            </a>
            <a
              href="https://wa.me/573105436281"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 text-[12px] text-[#666] hover:text-[#FF5C3A] transition-colors group"
            >
              <span className="w-7 h-7 rounded-lg bg-[#111] border border-[#1e1e1e] flex items-center justify-center flex-shrink-0 group-hover:border-[#FF5C3A]/30 transition-colors">
                <Phone size={13} />
              </span>
              +57 310 543 6281
            </a>
          </div>
        </div>

        {/* Columna 2 — Producto */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#444] mb-5">Producto</p>
          <ul className="flex flex-col gap-3">
            {NAV_PRODUCTO.map(l => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[13px] text-[#777] hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3 — Empresa */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#444] mb-5">Empresa</p>
          <ul className="flex flex-col gap-3">
            {NAV_EMPRESA.map(l => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[13px] text-[#777] hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-[#111]">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-[#3a3a3a]">
            © {new Date().getFullYear()}{' '}
            <a
              href="https://wilkiedevs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#666] transition-colors"
            >
              Wilkie Devs SAS
            </a>{' '}
            · Colombia
          </p>
          <Link
            href="/admin/login"
            className="text-[11px] text-[#2a2a2a] hover:text-[#555] transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>

    </footer>
  );
}
