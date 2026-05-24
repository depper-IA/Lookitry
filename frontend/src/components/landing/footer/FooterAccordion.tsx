'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface FooterSection {
  title: string;
  links: { name: string; href: string }[];
}

interface FooterAccordionProps {
  sections: FooterSection[];
  openSections: Record<string, boolean>;
  toggleSection: (title: string) => void;
  mobileAccordionHeight: Record<string, number>;
  accordionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  footerVisible: boolean;
  easingQuint: number[];
  easingQuart: number[];
}

export function FooterAccordion({
  sections,
  openSections,
  toggleSection,
  mobileAccordionHeight,
  accordionRefs,
  footerVisible,
  easingQuint,
  easingQuart,
}: FooterAccordionProps) {
  return (
    <div
      className="border-t border-black/5 dark:border-white/5"
      style={{
        opacity: footerVisible ? 1 : 0,
        transform: footerVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s cubic-bezier(${easingQuart.join(',')}), transform 0.5s cubic-bezier(${easingQuart.join(',')})`,
        transitionDelay: '0.2s',
      }}
    >
      {sections.map((section, sectionIdx) => (
        <div
          key={section.title}
          style={{
            animation: footerVisible
              ? `slideDown 0.4s cubic-bezier(${easingQuint.join(',')}) ${0.25 + sectionIdx * 0.08}s forwards`
              : 'none',
            opacity: 0,
          }}
        >
          <button
            onClick={() => toggleSection(section.title)}
            className="group flex w-full items-center justify-between py-3 text-[10px] font-bold uppercase tracking-wider text-black/60 transition-colors duration-300 hover:text-accent dark:text-white/60 dark:hover:text-accent"
            aria-expanded={openSections[section.title]}
          >
            {section.title}
            <ChevronDown
              size={14}
              className={`text-black/25 transition-all duration-300 group-hover:text-accent dark:text-white/25 dark:group-hover:text-accent ${
                openSections[section.title] ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{
              height: openSections[section.title] ? `${mobileAccordionHeight[section.title] || 200}px` : '0px',
              opacity: openSections[section.title] ? 1 : 0,
            }}
          >
            <div
              ref={(el) => {
                accordionRefs.current[section.title] = el;
              }}
              className="-mt-0.5 pb-3"
            >
              <ul className="flex flex-col gap-0.5">
                {section.links.map((item, linkIdx) => (
                  <li
                    key={item.name}
                    style={{
                      animation: openSections[section.title]
                        ? `fadeSlideIn 0.3s cubic-bezier(${easingQuart.join(',')}) ${linkIdx * 0.05}s forwards`
                        : 'none',
                      opacity: 0,
                    }}
                  >
                    <Link
                      href={item.href}
                      className="block py-2 text-center text-xs text-black/45 transition-colors duration-300 hover:text-accent dark:text-white/35 dark:hover:text-accent"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
