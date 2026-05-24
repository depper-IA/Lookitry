'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FooterSocialButtons } from './FooterSocialButtons';

interface FooterSection {
  title: string;
  links: { name: string; href: string }[];
}

interface FooterDesktopGridProps {
  sections: FooterSection[];
  socialLinks: any;
  footerVisible: boolean;
  easingQuart: number[];
}

export function FooterDesktopGrid({
  sections,
  socialLinks,
  footerVisible,
  easingQuart,
}: FooterDesktopGridProps) {
  return (
    <div className="mb-16 hidden md:block lg:mb-20">
      <div className="grid grid-cols-2 gap-10 lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-20">
        {/* Brand Column */}
        <div
          style={{
            opacity: footerVisible ? 1 : 0,
            transform: footerVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: `opacity 0.6s cubic-bezier(${easingQuart.join(',')}), transform 0.6s cubic-bezier(${easingQuart.join(',')})`,
            transitionDelay: '0.1s',
          }}
        >
          <Link href="/" className="group mb-6 inline-flex items-center gap-2.5 sm:mb-8 sm:gap-3 md:mb-10">
            <div className="relative h-8 w-8 transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9 md:h-10 md:w-10">
              <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill sizes="32px" className="object-contain dark:hidden" />
              <Image src="/logo.svg" alt="Lookitry" fill sizes="32px" className="hidden object-contain dark:block" />
            </div>
            <span className="font-jakarta text-2xl font-bold tracking-tighter text-black dark:text-white sm:text-3xl">
              Look<span className="text-accent">itry</span>
            </span>
          </Link>
          <p className="mb-6 max-w-xs text-sm font-light leading-relaxed text-black/70 transition-colors duration-300 dark:text-white/70 sm:mb-8 sm:text-base">
            Empoderamos al retail con Inteligencia Artificial. La primera solución de visualización personalizada líder en Colombia y Latinoamérica.
          </p>
          <div className="mb-6 sm:mb-8 md:mb-10">
            <Link
              href="/sobre-nosotros"
              className="group relative border-b border-accent/30 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-accent transition-colors duration-300 hover:text-accent/80 sm:text-[11px] sm:tracking-[0.2em]"
            >
              <span className="relative z-10">Conoce nuestra historia</span>
              <span className="absolute bottom-0 left-0 h-full w-0 bg-accent/10 transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>
          <FooterSocialButtons socialLinks={socialLinks} isLarge />
        </div>

        {/* Link Columns */}
        {sections.map((section, sectionIdx) => (
          <div
            key={section.title}
            style={{
              opacity: footerVisible ? 1 : 0,
              transform: footerVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: `opacity 0.6s cubic-bezier(${easingQuart.join(',')}), transform 0.6s cubic-bezier(${easingQuart.join(',')})`,
              transitionDelay: `${0.2 + sectionIdx * 0.1}s`,
            }}
          >
            <h5 className="mb-6 font-jakarta text-[9px] font-bold uppercase tracking-[0.25em] text-black transition-colors duration-300 hover:text-accent dark:text-white sm:mb-8 sm:text-[10px] sm:tracking-[0.3em] md:mb-10">
              {section.title}
            </h5>
            <ul className="flex flex-col gap-3 sm:gap-4 md:gap-5">
              {section.links.map((item, linkIdx) => (
                <li
                  key={item.name}
                  style={{
                    opacity: footerVisible ? 1 : 0,
                    transform: footerVisible ? 'translateY(0)' : 'translateY(15px)',
                    transition: `opacity 0.4s cubic-bezier(${easingQuart.join(',')}), transform 0.4s cubic-bezier(${easingQuart.join(',')})`,
                    transitionDelay: `${0.35 + sectionIdx * 0.08 + linkIdx * 0.05}s`,
                  }}
                >
                  <Link
                    href={item.href}
                    className="group relative text-sm text-black/65 transition-colors duration-300 hover:text-accent dark:text-white/60 dark:hover:text-accent"
                  >
                    {item.name}
                    <span className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
