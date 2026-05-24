'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ArrowRight } from 'lucide-react';

const PANEL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface NavHowItWorksDropdownProps {
  howItWorksRef: React.RefObject<HTMLDivElement>;
  hoverMenu: string | null;
  handleMouseEnter: (menuId: string) => void;
  handleMouseLeave: () => void;
  isHeroMode: boolean;
}

export function NavHowItWorksDropdown({
  howItWorksRef,
  hoverMenu,
  handleMouseEnter,
  handleMouseLeave,
  isHeroMode,
}: NavHowItWorksDropdownProps) {
  return (
    <div
      ref={howItWorksRef}
      className="level1-item flex items-center"
      onMouseEnter={() => handleMouseEnter('howItWorks')}
      onMouseLeave={handleMouseLeave}
    >
      <button
        aria-haspopup="true"
        aria-expanded={hoverMenu === 'howItWorks'}
        className={`nav-products-btn flex h-full items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${
          isHeroMode
            ? 'text-white/80 hover:text-white'
            : 'text-black/60 hover:text-dark dark:text-white/60 dark:hover:text-white'
        }`}
        style={{ color: hoverMenu === 'howItWorks' ? 'var(--accent)' : undefined }}
      >
        Cómo funciona
        <ChevronDown
          size={12}
          className="transition-transform duration-300"
          style={{ transform: hoverMenu === 'howItWorks' ? 'rotate(180deg)' : undefined }}
          aria-hidden="true"
        />
      </button>

      {/* HOW panel */}
      <div
        className={`absolute top-full left-0 right-0 z-50 ${
          hoverMenu === 'howItWorks' ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ overflow: 'hidden' }}
        onMouseEnter={() => handleMouseEnter('howItWorks')}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="w-full bg-white dark:bg-black shadow-2xl shadow-black/10 dark:shadow-black/40 -translate-y-[calc(100%+1px)] transition-transform duration-[300ms] will-change-transform"
          style={{
            transitionTimingFunction: PANEL_EASE,
            transform: hoverMenu === 'howItWorks' ? 'translateY(0)' : undefined,
            opacity: hoverMenu === 'howItWorks' ? 1 : 0,
          }}
          role="menu"
        >
          {/* Content fades+slides in after panel arrives */}
          <div
            className="opacity-0 -translate-y-3 transition-[opacity,transform] duration-[280ms]"
            style={{
              transitionTimingFunction: PANEL_EASE,
              opacity: hoverMenu === 'howItWorks' ? 1 : 0,
              transform: hoverMenu === 'howItWorks' ? 'translateY(0)' : undefined,
              transitionDelay: hoverMenu === 'howItWorks' ? '150ms' : '0ms',
            }}
          >
            <div className="mx-auto max-w-7xl px-6 md:px-12 py-7">
              <div className="flex gap-4" style={{ height: 300 }}>
                {/* HERO card — Demo en vivo (~55%) */}
                <Link
                  href="/demo"
                  className="group relative overflow-hidden rounded-2xl flex-[1.4] shrink-0 block"
                >
                  <Image
                    src="/megamenu/demo-en-vivo.webp"
                    alt="Demo en vivo"
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/5" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-block rounded-full bg-accent px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                      Demo interactivo
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="text-[22px] font-black text-white leading-tight mb-1">
                      Probalo en vivo
                    </h3>
                    <p className="text-[12px] text-white/70 mb-4 leading-snug">
                      Mirá cómo tu cliente se prueba ropa virtualmente antes de comprar.
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-[11px] font-bold text-white transition-all duration-200 group-hover:bg-accent group-hover:gap-3">
                      Ver demo <ArrowRight size={12} />
                    </div>
                  </div>
                </Link>

                {/* Columna derecha */}
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <Link
                    href="/casos-de-exito"
                    className="group relative overflow-hidden rounded-2xl flex-1 block"
                  >
                    <Image
                      src="/megamenu/casos-exito.webp"
                      alt="Casos de éxito"
                      fill
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.05]"
                      sizes="25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[13px] font-black text-white leading-tight">Casos de éxito</p>
                      <p className="text-[10px] text-white/65 mt-0.5">Marcas reales que ya venden más.</p>
                    </div>
                    <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 group-hover:bg-accent group-hover:scale-110">
                      <ArrowRight size={11} className="text-white" />
                    </div>
                  </Link>

                  <Link
                    href="/blog"
                    className="group relative overflow-hidden rounded-2xl flex-1 block"
                  >
                    <Image
                      src="/megamenu/blog-recursos.webp"
                      alt="Blog y recursos"
                      fill
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.05]"
                      sizes="25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[13px] font-black text-white leading-tight">Blog y recursos</p>
                      <p className="text-[10px] text-white/65 mt-0.5">Guías prácticas para tu e-commerce.</p>
                    </div>
                    <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 group-hover:bg-accent group-hover:scale-110">
                      <ArrowRight size={11} className="text-white" />
                    </div>
                  </Link>

                  {/* Stats + CTA */}
                  <div className="flex items-center gap-5 px-1 pt-1">
                    {[
                      { value: '30s', label: 'genera prueba' },
                      { value: '40%', label: 'menos dev.' },
                      { value: '+1K', label: 'marcas' },
                    ].map(stat => (
                      <div key={stat.value} className="flex items-baseline gap-1.5">
                        <span className="text-[20px] font-black text-accent leading-none">
                          {stat.value}
                        </span>
                        <span className="text-[9px] text-text-secondary">{stat.label}</span>
                      </div>
                    ))}
                    <Link
                      href="/trial-checkout"
                      className="ml-auto flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[10px] font-black text-white transition-all duration-200 hover:bg-accent-bright shrink-0"
                    >
                      Empezar gratis <ArrowRight size={9} />
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
