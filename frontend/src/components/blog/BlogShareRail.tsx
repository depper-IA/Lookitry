'use client';

import React, { useState } from 'react';
import { Facebook, Linkedin, Link2, MessageCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface BlogShareRailProps {
  title: string;
  url: string;
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-current">
      <path d="M18.901 2H21.98l-6.727 7.688L23.167 22H16.97l-4.854-7.42L5.62 22H2.54l7.196-8.227L1.833 2h6.354l4.387 6.732L18.901 2Zm-1.087 18.137h1.706L7.262 3.767H5.43l12.384 16.37Z" />
    </svg>
  );
}

export function BlogShareRail({ title, url }: BlogShareRailProps) {
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareItems = [
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: 'Compartir en Facebook',
      icon: <Facebook size={18} />,
    },
    {
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      label: 'Compartir en X',
      icon: <XIcon />,
    },
    {
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      label: 'Compartir en WhatsApp',
      icon: <MessageCircle size={18} />,
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      label: 'Compartir en LinkedIn',
      icon: <Linkedin size={18} />,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('No se pudo copiar el enlace del blog:', error);
    }
  };

  return (
    <aside className="hidden 2xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-40">
      <div className={`flex flex-col items-center gap-3 rounded-[1.75rem] border ${isDark ? 'border-white/10 bg-[#111111]/95 shadow-[0_24px_70px_rgba(0,0,0,0.28)]' : 'border-black/5 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.08)]'} px-3 py-4 backdrop-blur transition-all duration-300`}>
        <span className={`[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold uppercase tracking-[0.28em] ${isDark ? 'text-[#999]' : 'text-gray-400'}`}>
          Compartir
        </span>
        <div className={`h-10 w-px ${isDark ? 'bg-white/10' : 'bg-black/5'}`} />
        {shareItems.map((item) => {
          return (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-[#FF5C3A]/25 transition-all hover:-translate-y-0.5 hover:border-[#FF5C3A] ${
                isDark 
                  ? 'bg-[#191919] text-[#FF5C3A] hover:bg-[#221613]' 
                  : 'bg-[#fff5f2] text-[#FF5C3A] hover:bg-[#ffece6]'
              }`}
            >
              {item.icon}
            </a>
          );
        })}
        <button
          type="button"
          onClick={copyLink}
          className={`flex h-11 w-11 items-center justify-center rounded-full border border-[#FF5C3A]/25 transition-all hover:-translate-y-0.5 hover:border-[#FF5C3A] ${
            isDark 
              ? 'bg-[#191919] text-[#FF5C3A] hover:bg-[#221613]' 
              : 'bg-[#fff5f2] text-[#FF5C3A] hover:bg-[#ffece6]'
          }`}
          aria-label="Copiar enlace del artículo"
          title="Copiar enlace"
        >
          <Link2 size={18} />
        </button>
        <span className="min-h-[16px] text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5C3A]">
          {copied ? 'Copiado' : ''}
        </span>
      </div>
    </aside>
  );
}
