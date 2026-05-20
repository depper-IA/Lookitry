'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, MessageCircle } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
  </svg>
);

const LandingSocialProof = () => {
  const { label, title, titleAccent, instagram, tiktok, whatsapp } = LANDING_COPY.social_proof;

  return (
    <section className="py-20 sm:py-24 bg-black dark:bg-white" aria-label={title}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-12 sm:mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-accent font-bold tracking-widest uppercase text-xs mb-4 block"
          >
            {label}
          </motion.span>
          <motion.h2
            custom={0.05}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold text-white dark:text-black tracking-tight leading-[1.1] max-w-2xl"
          >
            {title}{' '}
            <span className="text-accent">{titleAccent}</span>
          </motion.h2>
        </div>

        {/* Asymmetric grid: Instagram + TikTok (left) | WhatsApp featured (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-4 sm:gap-5">

          {/* Left col: Instagram + TikTok stacked */}
          <div className="flex flex-col gap-4 sm:gap-5">

            {/* Instagram */}
            <motion.div
              custom={0.1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="flex-1 bg-white/[0.07] dark:bg-gray-50 border border-white/10 dark:border-gray-200 rounded-2xl p-6 sm:p-8 transition-colors hover:bg-white/[0.10] dark:hover:bg-gray-100"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <Instagram className="text-white w-4 h-4" />
                </span>
                <span className="text-white/45 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-widest">Instagram</span>
              </div>
              <h3 className="font-jakarta font-bold text-xl sm:text-2xl text-white dark:text-black mb-3 leading-tight">
                {instagram.title}
              </h3>
              <p className="text-white/60 dark:text-gray-500 text-sm sm:text-base leading-relaxed">
                {instagram.description}
              </p>
            </motion.div>

            {/* TikTok */}
            <motion.div
              custom={0.15}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="flex-1 bg-white/[0.07] dark:bg-gray-50 border border-white/10 dark:border-gray-200 rounded-2xl p-6 sm:p-8 transition-colors hover:bg-white/[0.10] dark:hover:bg-gray-100"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-8 h-8 rounded-lg bg-black dark:bg-gray-900 border border-white/15 dark:border-gray-300 flex items-center justify-center flex-shrink-0 text-white" aria-hidden="true">
                  <TikTokIcon />
                </span>
                <span className="text-white/45 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-widest">TikTok</span>
              </div>
              <h3 className="font-jakarta font-bold text-xl sm:text-2xl text-white dark:text-black mb-3 leading-tight">
                {tiktok.title}
              </h3>
              <p className="text-white/60 dark:text-gray-500 text-sm sm:text-base leading-relaxed">
                {tiktok.description}
              </p>
            </motion.div>
          </div>

          {/* Right col: WhatsApp featured */}
          <motion.div
            custom={0.1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="bg-[#25D366]/[0.06] dark:bg-[#25D366]/[0.04] border border-[#25D366]/20 dark:border-[#25D366]/20 rounded-2xl p-6 sm:p-10 flex flex-col justify-between min-h-[300px] lg:min-h-0 transition-colors hover:bg-[#25D366]/[0.09] dark:hover:bg-[#25D366]/[0.07]"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-7 sm:mb-9">
                <span className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <MessageCircle className="text-white w-4 h-4" />
                </span>
                <span className="text-[#25D366]/75 text-[10px] font-semibold uppercase tracking-widest">WhatsApp</span>
              </div>
              <h3 className="font-jakarta font-bold text-2xl sm:text-3xl text-white dark:text-black mb-4 leading-tight">
                {whatsapp.title}
              </h3>
              <p className="text-white/65 dark:text-gray-500 text-base sm:text-lg leading-relaxed max-w-[50ch]">
                {whatsapp.description}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#25D366]/20">
              <p className="text-2xl sm:text-3xl font-bold font-jakarta text-white dark:text-black tracking-tight">
                {whatsapp.stat}
              </p>
              <p className="text-white/45 dark:text-gray-400 text-[10px] uppercase tracking-widest mt-1 font-semibold">
                en clientes que usaron el probador
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default LandingSocialProof;
