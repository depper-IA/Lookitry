'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';

interface FooterSocialButtonsProps {
  socialLinks: {
    instagram: string;
    facebook: string;
    whatsapp: string;
    tiktok: string;
  };
  className?: string;
  isLarge?: boolean;
}

export function FooterSocialButtons({
  socialLinks,
  className = '',
  isLarge = false,
}: FooterSocialButtonsProps) {
  const btnSize = isLarge ? 'h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-lg sm:rounded-xl' : 'h-10 w-10 rounded-full';
  const iconSize = isLarge ? 18 : 16;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {[
        { Icon: Instagram, href: socialLinks.instagram, label: 'Instagram' },
        { Icon: Facebook, href: socialLinks.facebook, label: 'Facebook' },
        { Icon: MessageCircle, href: socialLinks.whatsapp, label: 'WhatsApp' },
      ].map((item, idx) => (
        <Link
          key={idx}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`social-btn group relative flex items-center justify-center border border-black/5 bg-black/5 text-black/60 transition-all duration-300 hover:border-accent/40 hover:bg-accent/10 hover:text-accent hover:scale-110 dark:border-white/5 dark:bg-white/5 dark:text-white/60 dark:hover:border-accent/40 dark:hover:bg-accent/10 dark:hover:text-accent ${btnSize}`}
          aria-label={item.label}
        >
          <item.Icon size={iconSize} aria-hidden="true" className="transition-transform duration-300 group-hover:scale-110" />
        </Link>
      ))}
      <Link
        href={socialLinks.tiktok}
        target="_blank"
        rel="noopener noreferrer"
        className={`social-btn group relative flex items-center justify-center border border-black/5 bg-black/5 text-black/60 transition-all duration-300 hover:border-accent/40 hover:bg-accent/10 hover:text-accent hover:scale-110 dark:border-white/5 dark:bg-white/5 dark:text-white/60 dark:hover:border-accent/40 dark:hover:bg-accent/10 dark:hover:text-accent ${btnSize}`}
        aria-label="TikTok"
        suppressHydrationWarning
      >
        <svg
          viewBox="0 0 24 24"
          className="fill-current transition-transform duration-300 group-hover:scale-110"
          style={{ width: isLarge ? '1rem' : '0.875rem', height: isLarge ? '1rem' : '0.875rem' }}
          aria-hidden="true"
          suppressHydrationWarning
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
        </svg>
      </Link>
    </div>
  );
}
