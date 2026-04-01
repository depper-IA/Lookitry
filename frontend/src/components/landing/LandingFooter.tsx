'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  Instagram,
  Facebook,
  Youtube
} from 'lucide-react';
import { LookitryLogoText } from '@/components/mini-landing/shared';
import { fetchPublicPaymentSettings, normalizeSocialUrl, toWhatsAppUrl } from '@/services/public-config.service';

const NAV_PRODUCTO = [
  { label: 'Probador Virtual', href: '/probador-virtual' },
  { label: 'Mini-Landing Pro', href: '/mini-landing-pro' },
  { label: 'Plugin WooCommerce', href: '/plugin-woocommerce' },
  { label: 'API Developer', href: '/api-developer' },
  { label: 'Planes Mensuales', href: '/planes' },
];

const NAV_EMPRESA = [
  { label: 'Sobre nosotros', href: '/sobre-nosotros' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Casos de Éxito', href: '/casos-de-exito' },
  { label: 'Blog', href: '/blog' },
  { label: 'Centro de ayuda', href: '/ayuda' },
];

const NAV_CONFIANZA = [
  { label: 'Términos y Condiciones', href: '/terminos' },
  { label: 'Política de Privacidad', href: '/politicas-privacidad' },
  { label: 'Aviso legal', href: '/aviso-legal' },
];

// Icono personalizado para TikTok
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
    facebook?: string;
    youtube?: string;
    x?: string;
    email?: string;
    whatsapp?: string;
  }>({ instagram: '#', tiktok: '#' });

  useEffect(() => {
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

  useEffect(() => {
    fetchPublicPaymentSettings()
      .then(data => {
        if (!data) return;
        setSocials(prev => ({
          ...prev,
          instagram: normalizeSocialUrl('instagram', data.socialInstagram) || prev.instagram || '#',
          tiktok: normalizeSocialUrl('tiktok', data.socialTiktok) || prev.tiktok || '#',
          facebook: normalizeSocialUrl('facebook', data.socialFacebook) || '',
          youtube: normalizeSocialUrl('youtube', data.socialYoutube) || '',
          email: data.manualEmail || 'info@lookitry.com',
          whatsapp: toWhatsAppUrl(data.manualWhatsapp) || 'https://wa.me/573105436281',
        }));
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#080808] border-t border-[#161616]">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-12">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
            <Image
              src="/logo.svg"
              alt="Lookitry"
              width={22}
              height={22}
              className="object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-white leading-none">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>

          <p className="text-[13px] text-[#9a9a9a] leading-relaxed mb-6 max-w-[300px] mx-auto sm:mx-0">
            Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica.
          </p>
          <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#1a120f] border border-[#FF5C3A]/30 text-[#ffb7a8]">
              Activación en minutos
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#1a120f] border border-[#FF5C3A]/30 text-[#ffb7a8]">
              Soporte por WhatsApp
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#1a120f] border border-[#FF5C3A]/30 text-[#ffb7a8]">
              Pago seguro
            </span>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 mb-8">
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1a120f] border border-[#FF5C3A]/35 flex items-center justify-center text-[#ffb7a8] hover:text-white hover:bg-[#FF5C3A] transition-all">
                <Instagram size={14} />
              </a>
            )}
            {socials.tiktok && (
              <a href={socials.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1a120f] border border-[#FF5C3A]/35 flex items-center justify-center text-[#ffb7a8] hover:text-white hover:bg-[#FF5C3A] transition-all">
                <IconTikTok />
              </a>
            )}
            {socials.facebook && (
              <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1a120f] border border-[#FF5C3A]/35 flex items-center justify-center text-[#ffb7a8] hover:text-white hover:bg-[#FF5C3A] transition-all">
                <Facebook size={14} />
              </a>
            )}
            <a href={`mailto:${socials.email || 'info@lookitry.com'}`} className="w-10 h-10 rounded-full bg-[#1a120f] border border-[#FF5C3A]/35 flex items-center justify-center text-[#ffb7a8] hover:text-white hover:bg-[#FF5C3A] transition-all">
              <Mail size={14} />
            </a>
            <a href={socials.whatsapp || 'https://wa.me/573105436281'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1a120f] border border-[#FF5C3A]/35 flex items-center justify-center text-[#ffb7a8] hover:text-white hover:bg-[#FF5C3A] transition-all">
              <Phone size={14} />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <p className="text-[12px] font-bold uppercase tracking-[.15em] text-white mb-6">Ecosistema</p>
          <ul className="flex flex-col gap-3">
            {NAV_PRODUCTO.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13px] text-[#a1a1a1] hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#FF5C3A] mb-5">Empresa</p>
          <ul className="flex flex-col gap-3">
            {NAV_EMPRESA.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13px] text-[#a1a1a1] hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#FF5C3A] mb-5">Confianza legal</p>
          <ul className="flex flex-col gap-3">
            {NAV_CONFIANZA.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13px] text-[#a1a1a1] hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[#111]">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-[#3a3a3a]">
            © {new Date().getFullYear()} Wilkie Devs SAS · Colombia
          </p>
          <Link href="/admin/login" className="text-[11px] text-[#2a2a2a] hover:text-[#555] transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
