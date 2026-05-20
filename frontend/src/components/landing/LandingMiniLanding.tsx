'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';

const listContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const imageVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export default function LandingMiniLanding() {
  const copy = LANDING_COPY.virtual_shop;

  return (
    <section
      id="mini-landing"
      className="bg-black dark:bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 overflow-hidden"
      aria-label={copy.title}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">

          {/* Imagen: primera en mobile (prueba visual antes del texto), derecha en desktop */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 dark:border-black/10 shadow-2xl">
              <Image
                src="/hero/promo_landing.png"
                alt="Vista de una tienda Lookitry mostrando el catálogo con probador virtual integrado en el celular de un cliente"
                width={720}
                height={480}
                className="w-full h-auto"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </motion.div>

          {/* Contenido */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 sm:mb-6 font-semibold text-[10px] sm:text-xs uppercase tracking-[0.18em] bg-accent/10 border border-accent/30 text-accent"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              {copy.badge}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white dark:text-black mb-4 sm:mb-5 leading-[1.1]"
            >
              {copy.title}{' '}
              <span className="text-accent">{copy.titleAccent}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-white/75 dark:text-text-muted text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-[58ch]"
            >
              {copy.description}
            </motion.p>

            <motion.ul
              variants={listContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="flex flex-col gap-5 sm:gap-6 mb-10 sm:mb-12 max-w-[60ch]"
            >
              {copy.features.map((feat, idx) => (
                <motion.li key={idx} variants={listItem} className="flex gap-3 sm:gap-4">
                  <span
                    className="flex-shrink-0 mt-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent"
                    aria-hidden="true"
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <div>
                    <h3 className="font-jakarta font-semibold text-base sm:text-lg text-white dark:text-black leading-tight mb-1">
                      {feat.title}
                    </h3>
                    <p className="text-white/65 dark:text-text-muted text-sm sm:text-[15px] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
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
