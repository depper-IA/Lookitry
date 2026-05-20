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
    <div className="relative flex items-center justify-center py-8">
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-purple-500/8 rounded-full blur-3xl scale-75"
        animate={{ opacity: isHovered ? 0.8 : 0.4, scale: isHovered ? 0.8 : 0.7 }}
        transition={{ duration: 0.4 }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-0 left-4 w-20 h-20 rounded-full bg-gradient-to-br from-accent/15 to-transparent"
        animate={{ y: [0, -14, 0], rotate: [0, 8, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-8 right-0 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/15 to-transparent"
        animate={{ y: [0, 12, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
      <motion.div
        className="absolute top-1/3 -left-6 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent"
        animate={{ y: [0, -8, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />

      {/* Phone */}
      <motion.div
        className="relative z-10 w-full max-w-[220px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ rotate: isHovered ? 12 : 10, y: isHovered ? -12 : 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        {/* Body */}
        <div className="relative rounded-[2.2rem] bg-gradient-to-b from-gray-800 to-gray-900 p-[5px] shadow-[0_40px_80px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]">
          {/* Dynamic island */}
          <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-16 h-[5px] rounded-full bg-black z-20" />

          {/* Screen */}
          <div className="relative rounded-[1.8rem] overflow-hidden bg-black aspect-[9/19]">
            <video
              src="/videos/demo-lookitry.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <Sparkles size={10} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-[10px] font-bold leading-none">Lookitry</p>
                  <p className="text-white/50 text-[8px]">Probador Virtual</p>
                </div>
              </div>
            </div>
            <motion.div
              className="absolute bottom-16 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/25"
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          {/* Side buttons */}
          <div className="absolute right-[-2px] top-20 w-[2px] h-9 rounded-r bg-gray-700" />
          <div className="absolute right-[-2px] top-34 w-[2px] h-5 rounded-r bg-gray-700" />
          <div className="absolute left-[-2px] top-24 w-[2px] h-12 rounded-l bg-gray-700" />
        </div>

        {/* Glow */}
        <motion.div
          className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-accent/25 via-purple-500/10 to-transparent blur-xl -z-10"
          animate={{ opacity: isHovered ? 0.7 : 0.35 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Badges */}
      <motion.div
        className="absolute -bottom-1 left-2 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 shadow-md"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-[8px] font-bold text-gray-700">IA Activa</span>
      </motion.div>

      <motion.div
        className="absolute -top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 shadow-md"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-green-500"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-[7px] font-bold text-gray-700">Demo en vivo</span>
      </motion.div>

      {/* Dots decoration */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent/25"
            animate={{ y: [0, -3, 0], opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}
      </div>

      <div className="absolute -right-3 top-1/4 flex flex-col gap-2">
        <motion.div
          className="w-2 h-2 rounded-full border border-accent/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-purple-500/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </div>
    </div>
  );
}

// ── ChannelCard ──────────────────────────────────────────────────────────────

function ChannelCard({
  icon,
  iconBg,
  tag,
  title,
  description,
  delay,
  accent,
}: {
  icon: React.ReactNode;
  iconBg: string;
  tag: string;
  title: string;
  description: string;
  delay: number;
  accent?: string;
}) {
  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="group relative flex flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.05] p-6 transition-all duration-300 hover:bg-white/[0.09] hover:border-white/15 dark:hover:bg-gray-100"
      style={accent ? { borderColor: `${accent}30`, background: `${accent}08` } : {}}
    >
      <div>
        <div className="mb-4 flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={iconBg ? { background: iconBg } : {}}
            aria-hidden="true"
          >
            {icon}
          </span>
          <span className="text-white/40 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-widest">{tag}</span>
        </div>
        <h3 className="font-jakarta text-xl font-bold text-white dark:text-black mb-2 leading-tight">
          {title}
        </h3>
        <p className="text-white/55 dark:text-gray-500 text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {/* Subtle hover accent bar */}
      <div
        className="mt-4 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={accent ? { background: accent } : { background: 'var(--accent)' }}
      />
    </motion.div>
  );
}

// ── LandingSocialProof ───────────────────────────────────────────────────────

const LandingSocialProof = () => {
  const { label, title, titleAccent, instagram, tiktok, whatsapp } = LANDING_COPY.social_proof;

  return (
    <section className="py-24 sm:py-28 bg-black dark:bg-white overflow-hidden" aria-label={title}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-14 sm:mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-accent font-bold tracking-[0.2em] uppercase text-[11px] mb-4 block"
          >
            {label}
          </motion.span>
          <motion.h2
            custom={0.05}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-jakarta text-4xl sm:text-5xl md:text-6xl font-bold text-white dark:text-black tracking-tight leading-[1.05]"
          >
            {title}{' '}
            <span className="text-accent">{titleAccent}</span>
          </motion.h2>
        </div>

        {/* Main grid: 3 channel cards + phone mockup below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {/* Instagram */}
          <ChannelCard
            icon={<Instagram className="w-4 h-4" />}
            iconBg="linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"
            tag="Instagram"
            title={instagram.title}
            description={instagram.description}
            delay={0.1}
          />

          {/* TikTok */}
          <ChannelCard
            icon={<TikTokIcon />}
            iconBg="#000"
            tag="TikTok"
            title={tiktok.title}
            description={tiktok.description}
            delay={0.15}
          />

          {/* WhatsApp */}
          <ChannelCard
            icon={<MessageCircle className="w-4 h-4 text-white" />}
            iconBg="#25D366"
            tag="WhatsApp"
            title={whatsapp.title}
            description={whatsapp.description}
            delay={0.2}
            accent="#25D366"
          />
        </div>

        {/* Phone mockup — centered, full width, premium showcase */}
        <motion.div
          custom={0.25}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative flex justify-center"
        >
          {/* Subtle backdrop card */}
          <div className="w-full max-w-lg mx-auto rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-8">
            {/* Stat badge */}
            <div className="flex justify-center mb-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/25 bg-[#25D366]/10 px-4 py-1.5">
                <TrendingIcon />
                <span className="text-[#25D366] text-[10px] font-bold uppercase tracking-widest">
                  {whatsapp.stat}
                </span>
              </div>
            </div>

            <PhoneMockup />
          </div>
        </motion.div>

      </div>
    </section>
  );
};

// ── TrendingIcon ─────────────────────────────────────────────────────────────

function TrendingIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

export default LandingSocialProof;