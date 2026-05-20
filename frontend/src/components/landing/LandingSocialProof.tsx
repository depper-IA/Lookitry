'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, MessageCircle, Sparkles } from 'lucide-react';
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

// ── PhoneMockup ───────────────────────────────────────────────────────────────

function PhoneMockup() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center py-4">
      {/* Floating decorations */}
      <motion.div
        className="absolute -top-6 -left-2 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-transparent"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-2 -right-6 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-transparent"
        animate={{ y: [0, 8, 0], rotate: [0, -5, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.div
        className="absolute -bottom-4 -right-2 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/15 to-transparent"
        animate={{ y: [0, -12, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5 rounded-[3rem] blur-3xl" />

      {/* Phone frame */}
      <motion.div
        className="relative z-10 w-full max-w-[260px] transform perspective-[1000px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          y: isHovered ? -8 : 0,
          rotateY: isHovered ? 3 : 0,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Phone body */}
        <div className="relative rounded-[2.5rem] bg-gradient-to-b from-gray-800 to-gray-900 p-[6px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
          {/* Dynamic island */}
          <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-20 h-[6px] rounded-full bg-black z-20" />

          {/* Screen */}
          <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-[9/19]">
            {/* Video */}
            <video
              src="/videos/demo-lookitry.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Top UI */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/50 to-transparent" />

            {/* Bottom UI */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                  <Sparkles size={12} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-[11px] font-bold">Lookitry</p>
                  <p className="text-white/60 text-[9px]">Probador Virtual</p>
                </div>
              </div>
            </div>

            {/* Touch indicator */}
            <motion.div
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/30"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          {/* Side buttons */}
          <div className="absolute right-[-3px] top-24 w-[3px] h-10 rounded-r bg-gray-700" />
          <div className="absolute right-[-3px] top-40 w-[3px] h-6 rounded-r bg-gray-700" />
          <div className="absolute left-[-3px] top-28 w-[3px] h-14 rounded-l bg-gray-700" />
        </div>

        {/* Phone glow shadow */}
        <motion.div
          className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-accent/20 via-purple-500/10 to-transparent blur-2xl -z-10"
          animate={{ opacity: isHovered ? 0.6 : 0.3 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Floating badges */}
      <motion.div
        className="absolute -bottom-2 left-0 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 shadow-lg"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-[9px] font-bold text-gray-800">IA Activa</span>
      </motion.div>

      <motion.div
        className="absolute -top-2 right-0 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 shadow-lg"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-green-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-[8px] font-bold text-gray-800">Demo en vivo</span>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent/30"
            animate={{ y: [0, -4, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <div className="absolute -right-4 top-1/3 flex flex-col gap-3">
        <motion.div
          className="w-2.5 h-2.5 rounded-full border-2 border-accent/40"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-purple-500/40"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </div>
    </div>
  );
}

// ── LandingSocialProof ───────────────────────────────────────────────────────

const LandingSocialProof = () => {
  const { label, title, titleAccent, instagram, tiktok } = LANDING_COPY.social_proof;

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

        {/* Grid: Instagram + TikTok (left) | Phone Mockup con Video (right) */}
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

          {/* Right col: Phone Mockup con Video Interactivo */}
          <motion.div
            custom={0.1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="bg-white/[0.07] dark:bg-gray-50 border border-white/10 dark:border-gray-200 rounded-2xl p-4 sm:p-6 flex items-center justify-center min-h-[420px] lg:min-h-0"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LandingSocialProof;