'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';
import { LandingShopAccordion } from './LandingShopAccordion';

const FALLBACK_PRICE = 650000;
const FALLBACK_ORIGINAL = 850000;

const imageVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n);
}

export default function LandingMiniLanding() {
  const copy = LANDING_COPY.virtual_shop;
  const [price, setPrice] = useState(FALLBACK_PRICE);
  const [originalPrice, setOriginalPrice] = useState(FALLBACK_ORIGINAL);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiUrl}/api/pricing-config`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const row = data?.data?.find((d: { id: string }) => d.id === 'mini_landing');
        if (row?.data?.precio_unico_cop) setPrice(row.data.precio_unico_cop);
        if (row?.data?.precio_original_cop) setOriginalPrice(row.data.precio_original_cop);
      })
      .catch(() => {});
  }, []);

  const priceBase = formatCOP(price);
  const originalBase = formatCOP(originalPrice);

  return (
    <section
      id="mini-landing"
      className="bg-black dark:bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 overflow-hidden"
      aria-label={copy.title}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">

          {/* Accordion / imagen: primero en mobile, derecha en desktop */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="order-1 lg:order-2"
          >
            {/* Mobile: imagen estática */}
            <div className="lg:hidden relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/hero/promo_landing.png"
                alt="Vista de una tienda Lookitry mostrando el catálogo con probador virtual integrado"
                width={720}
                height={480}
                className="w-full h-auto"
                sizes="100vw"
              />
            </div>

            {/* Desktop: accordion interactivo */}
            <div className="hidden lg:block">
              <LandingShopAccordion />
            </div>
          </motion.div>

          {/* Contenido */}
          <div className="order-2 lg:order-1 flex flex-col">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 sm:mb-6 font-semibold text-[10px] sm:text-xs uppercase tracking-[0.18em] bg-accent/10 border border-accent/30 text-accent w-fit"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              {copy.badge}
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white dark:text-black mb-4 sm:mb-5 leading-[1.1] text-wrap-balance"
            >
              {copy.title}{' '}
              <span className="text-accent">{copy.titleAccent}</span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-white/75 dark:text-text-muted text-base sm:text-lg leading-relaxed max-w-[58ch]"
            >
              {copy.description}
            </motion.p>

            {/* Price block */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.45, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-8 sm:mt-10 mb-8 sm:mb-10 px-5 py-4 sm:px-6 sm:py-5 rounded-2xl bg-accent/[0.08]"
            >
              <p className="text-white/50 dark:text-black/40 text-[11px] font-medium mb-1.5 tracking-wide">
                desde
              </p>
              <div className="flex items-baseline gap-2.5 mb-1.5 flex-wrap">
                <span className="font-jakarta text-[2.5rem] sm:text-5xl font-bold text-accent leading-none tracking-tight">
                  ${priceBase}
                </span>
                <span className="text-white/55 dark:text-black/45 text-sm sm:text-base font-semibold">
                  COP
                </span>
                <span className="text-white/35 dark:text-black/30 text-sm line-through font-normal">
                  ${originalBase}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Zap size={12} className="text-accent opacity-70 flex-shrink-0" aria-hidden="true" />
                <p className="text-white/50 dark:text-black/40 text-[12px] sm:text-[13px]">
                  Pago único · Sin mensualidad · Activa en minutos
                </p>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
            >
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 bg-accent text-white px-7 py-4 rounded-xl font-bold text-sm sm:text-base transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black dark:focus-visible:ring-offset-white"
              >
                {copy.cta_primary}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/planes"
                className="inline-flex items-center gap-1.5 text-white/80 dark:text-text-muted hover:text-accent dark:hover:text-accent text-sm sm:text-base font-medium underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                {copy.cta_secondary}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
