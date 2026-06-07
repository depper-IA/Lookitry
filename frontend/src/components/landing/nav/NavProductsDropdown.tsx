'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/utils/currency';

const PANEL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface NavProductsDropdownProps {
  productsRef: React.RefObject<HTMLDivElement>;
  hoverMenu: string | null;
  handleMouseEnter: (menuId: string) => void;
  handleMouseLeave: () => void;
  isHeroMode: boolean;
  productLinks: any[];
  basicPriceCOP: number;
  currency: 'COP' | 'USD';
  trm: number;
}

export function NavProductsDropdown({
  productsRef,
  hoverMenu,
  handleMouseEnter,
  handleMouseLeave,
  isHeroMode,
  productLinks,
  basicPriceCOP,
  currency,
  trm,
}: NavProductsDropdownProps) {
  return (
    <div
      ref={productsRef}
      className="level1-item flex items-center"
      onMouseEnter={() => handleMouseEnter('products')}
      onMouseLeave={handleMouseLeave}
    >
      <button
        aria-haspopup="true"
        aria-expanded={hoverMenu === 'products'}
        className={`nav-products-btn flex h-full items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${
          isHeroMode
            ? 'text-white/80 hover:text-accent'
            : 'text-black/60 hover:text-accent dark:text-white/60 dark:hover:text-accent'
        }`}
      >
        Productos
        <ChevronDown
          size={12}
          className="transition-transform duration-300"
          style={{ transform: hoverMenu === 'products' ? 'rotate(180deg)' : undefined }}
          aria-hidden="true"
        />
      </button>

      {/* PRODUCTS panel */}
      <div
        className={`absolute top-full left-0 right-0 z-50 ${
          hoverMenu === 'products' ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ overflow: 'hidden' }}
        onMouseEnter={() => handleMouseEnter('products')}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="w-full bg-white dark:bg-black shadow-2xl shadow-black/10 dark:shadow-black/40 -translate-y-[calc(100%+1px)] transition-transform duration-[300ms] will-change-transform"
          style={{
            transitionTimingFunction: PANEL_EASE,
            transform: hoverMenu === 'products' ? 'translateY(0)' : undefined,
            opacity: hoverMenu === 'products' ? 1 : 0,
          }}
          role="menu"
        >
          <div
            className="opacity-0 -translate-y-3 transition-[opacity,transform] duration-[280ms]"
            style={{
              transitionTimingFunction: PANEL_EASE,
              opacity: hoverMenu === 'products' ? 1 : 0,
              transform: hoverMenu === 'products' ? 'translateY(0)' : undefined,
              transitionDelay: hoverMenu === 'products' ? '150ms' : '0ms',
            }}
          >
            <div className="mx-auto max-w-7xl px-6 md:px-12 py-8">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-text-secondary mb-6">
                Nuestros productos
              </p>
              <div className="flex gap-10">
                {/* Product list */}
                <div className="flex-1 grid grid-cols-2 gap-1">
                  {productLinks.map(({ href, icon: Icon, title, desc, badge, logo }) => (
                    <Link
                      key={href}
                      href={href}
                      className="group flex items-start gap-4 rounded-2xl px-4 py-4 transition-all duration-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-200 group-hover:bg-accent group-hover:text-white">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                           <p className="text-[12px] font-bold text-black dark:text-white group-hover:text-accent transition-colors duration-200">
                            {title}
                          </p>
                          {badge && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-accent">
                              {badge}
                            </span>
                          )}
                          {logo && (
                            <div className="relative h-3.5 w-16 shrink-0">
                              <Image
                                src={logo}
                                alt=""
                                fill
                                className="object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                                sizes="64px"
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-text-secondary leading-snug">{desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* CTA lateral */}
                <div className="w-52 shrink-0 flex flex-col rounded-2xl overflow-hidden bg-white border border-black/[0.06] dark:border-white/5 dark:bg-neutral-950/40 shadow-sm">
                  <div className="relative h-36">
                    <Image
                      src="/megamenu/productos-cta.webp"
                      alt="Trial Lookitry"
                      fill
                      className="object-cover object-center"
                      sizes="208px"
                      quality={90}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="text-[13px] font-black text-white leading-tight">Probalo 7 días</p>
                      <p className="text-[10px] text-white/65">sin riesgo</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    {['Sin tarjeta de crédito', 'Setup en 2 minutos', 'Soporte en español'].map(item => (
                      <div key={item} className="flex items-center gap-1.5">
                        <svg
                          className="w-2.5 h-2.5 text-accent shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[9px] text-text-secondary">{item}</span>
                      </div>
                    ))}
                    <Link
                      href="/trial-checkout"
                      className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-[11px] font-black text-white transition-all duration-200 hover:bg-accent-bright"
                    >
                      Comenzar trial <ArrowRight size={10} />
                    </Link>
                    <Link
                      href="/planes"
                      className="text-center text-[9px] text-text-secondary hover:text-accent transition-colors"
                    >
                      Planes desde {formatPrice(basicPriceCOP, currency, trm)}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
